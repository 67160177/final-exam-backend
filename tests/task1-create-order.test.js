// เทสต์ตรวจโจทย์ที่ 1: POST /api/v1/orders (ห้ามแก้ไฟล์นี้)
const request = require("supertest");
const app = require("../app");
const { pool } = require("../db");
const { resetDatabase, tokenFor } = require("./helpers/setup");

async function countRows(table) {
  const [[{ total }]] = await pool.query(`SELECT COUNT(*) AS total FROM ${table}`);
  return total;
}

describe("โจทย์ที่ 1: POST /api/v1/orders", () => {
  const customerToken = tokenFor("customer");

  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await pool.end();
  });

  test("ไม่มี token ต้องได้ 401", async () => {
    const res = await request(app)
      .post("/api/v1/orders")
      .send({ items: [{ menuItemId: 1, quantity: 1 }] });

    expect(res.status).toBe(401);
  });

  test.each([
    ["ไม่มี items", {}],
    ["items เป็น array ว่าง", { items: [] }],
    ["quantity เป็น 0", { items: [{ menuItemId: 1, quantity: 0 }] }],
    ["quantity ไม่ใช่จำนวนเต็ม", { items: [{ menuItemId: 1, quantity: 1.5 }] }],
    ["quantity เกิน 20", { items: [{ menuItemId: 1, quantity: 21 }] }],
    ["ไม่มี menuItemId", { items: [{ quantity: 1 }] }],
  ])("ข้อมูลไม่ถูกต้อง (%s) ต้องได้ 400 VALIDATION_ERROR", async (_label, body) => {
    const res = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send(body);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("สั่งสำเร็จต้องได้ 201 พร้อมยอดรวมที่คำนวณจากราคาในฐานข้อมูล", async () => {
    const res = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      // ส่ง price มาด้วยเพื่อตรวจว่าเซิร์ฟเวอร์ไม่เชื่อราคาจาก client
      .send({
        items: [
          { menuItemId: 1, quantity: 2, price: 1 },
          { menuItemId: 5, quantity: 1, price: 1 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      customerName: "สมชาย",
      status: "pending",
      total: 160, // ข้าวผัดกุ้ง 60 x 2 + ส้มตำไทย 40 x 1
    });
    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.data.items[0]).toMatchObject({ menuItemId: 1, quantity: 2, subtotal: 120 });
  });

  test("คำสั่งซื้อที่สร้างแล้วต้องบันทึกลงฐานข้อมูลจริง", async () => {
    const res = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ items: [{ menuItemId: 2, quantity: 3 }] });

    const orderId = res.body.data.id;
    const [orders] = await pool.query("SELECT * FROM orders WHERE id = ?", [orderId]);
    const [items] = await pool.query("SELECT * FROM order_items WHERE order_id = ?", [orderId]);

    expect(orders).toHaveLength(1);
    expect(orders[0].customer_name).toBe("สมชาย");
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ menu_item_id: 2, quantity: 3 });
  });

  test("เมนูที่ไม่มีอยู่จริงต้องได้ 404 MENU_NOT_FOUND และไม่มีข้อมูลถูกบันทึก", async () => {
    const ordersBefore = await countRows("orders");
    const itemsBefore = await countRows("order_items");

    const res = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ items: [{ menuItemId: 1, quantity: 1 }, { menuItemId: 9999, quantity: 1 }] });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("MENU_NOT_FOUND");
    expect(await countRows("orders")).toBe(ordersBefore);
    expect(await countRows("order_items")).toBe(itemsBefore);
  });

  test("เมนูที่ไม่พร้อมขายต้องได้ 409 MENU_UNAVAILABLE และไม่มีข้อมูลถูกบันทึก", async () => {
    const ordersBefore = await countRows("orders");
    const itemsBefore = await countRows("order_items");

    // id 9 = ข้าวขาหมู (available = FALSE)
    const res = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ items: [{ menuItemId: 1, quantity: 1 }, { menuItemId: 9, quantity: 1 }] });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("MENU_UNAVAILABLE");
    expect(await countRows("orders")).toBe(ordersBefore);
    expect(await countRows("order_items")).toBe(itemsBefore);
  });
});

// เทสต์ลับของผู้ตรวจสำหรับโจทย์ที่ 3 (grader/grade.js เป็นผู้รัน)
const request = require("supertest");
const app = require("../app");
const { pool } = require("../db");
const { resetDatabase, tokens } = require("../tests/helpers/setup");

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await pool.end();
});

const post = (body, token = tokens.admin) => {
  const req = request(app).post("/api/v1/menu");
  if (token) req.set("Authorization", `Bearer ${token}`);
  return req.send(body);
};

const fieldsOf = (res) => (res.body.error?.details || []).map((d) => d.field).sort();

describe("hidden: POST /api/v1/menu", () => {
  test("ไม่มี token -> 401", async () => {
    const res = await post({ name: "ชาไทย", price: 30 }, null);
    expect(res.status).toBe(401);
  });

  test("customer -> 403", async () => {
    const res = await post({ name: "ชาไทย", price: 30 }, tokens.customer);
    expect(res.status).toBe(403);
  });

  test("ไม่มี name -> 400 พร้อม details ระบุ name", async () => {
    const res = await post({ price: 30 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(fieldsOf(res)).toEqual(["name"]);
  });

  test("name เป็นช่องว่างล้วน -> 400", async () => {
    const res = await post({ name: "   ", price: 30 });
    expect(res.status).toBe(400);
    expect(fieldsOf(res)).toEqual(["name"]);
  });

  test.each([["abc"], [0], [-5], [10001], ["30"]])("price = %p -> 400 ระบุ price", async (price) => {
    const res = await post({ name: "ชาไทย", price });
    expect(res.status).toBe(400);
    expect(fieldsOf(res)).toEqual(["price"]);
  });

  test("ผิดหลาย field -> details ครบทุก field", async () => {
    const res = await post({ name: "", price: -1, available: "yes" });
    expect(res.status).toBe(400);
    expect(fieldsOf(res)).toEqual(["available", "name", "price"]);
  });

  test("สำเร็จ -> 201 ตัดช่องว่าง name, available เริ่มต้นเป็น true และบันทึกจริง", async () => {
    const res = await post({ name: "  ชาไทยปั่น  ", price: 45 });
    expect(res.status).toBe(201);
    expect(res.body.data).toEqual({ id: expect.any(Number), name: "ชาไทยปั่น", price: 45, available: true });

    const [rows] = await pool.query("SELECT name, price, available FROM menu_items WHERE id = ?", [res.body.data.id]);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("ชาไทยปั่น");
    expect(Number(rows[0].price)).toBe(45);
    expect(rows[0].available).toBe(1);
  });

  test("available: false ถูกบันทึกตามที่ส่ง", async () => {
    const res = await post({ name: "เมนูทดลอง", price: 99, available: false });
    expect(res.status).toBe(201);
    expect(res.body.data.available).toBe(false);
  });
});

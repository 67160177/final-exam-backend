// เฉลยตัวอย่าง tests/menu.test.js
const request = require("supertest");
const app = require("../app");
const { pool } = require("../db");
const { resetDatabase, tokens } = require("./helpers/setup");

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await pool.end();
});

describe("GET /api/v1/menu/:id", () => {
  test("เมนูที่มีอยู่ -> 200 พร้อมข้อมูลครบและชนิดถูกต้อง", async () => {
    const res = await request(app).get("/api/v1/menu/1");

    expect(res.status).toBe(200);
    // toEqual ตรวจทั้ง object: price ต้องเป็น number และ available เป็น boolean
    expect(res.body.data).toEqual({ id: 1, name: "ข้าวผัดกุ้ง", price: 60, available: true });
  });

  test("เมนูที่ไม่มีอยู่ -> 404 MENU_NOT_FOUND", async () => {
    const res = await request(app).get("/api/v1/menu/9999");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("MENU_NOT_FOUND");
  });
});

describe("PATCH /api/v1/menu/:id/price", () => {
  const patch = (id, body, token) => {
    const req = request(app).patch(`/api/v1/menu/${id}/price`);
    if (token) req.set("Authorization", `Bearer ${token}`);
    return req.send(body);
  };

  test("ไม่มี token -> 401 และราคาไม่เปลี่ยน", async () => {
    const res = await patch(1, { price: 99 });

    expect(res.status).toBe(401);
    const [rows] = await pool.query("SELECT price FROM menu_items WHERE id = 1");
    expect(Number(rows[0].price)).toBe(60);
  });

  test("customer -> 403 และราคาไม่เปลี่ยน", async () => {
    const res = await patch(1, { price: 99 }, tokens.customer);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
    const [rows] = await pool.query("SELECT price FROM menu_items WHERE id = 1");
    expect(Number(rows[0].price)).toBe(60);
  });

  test.each([[0], [-10], ["abc"]])("price = %p -> 400 VALIDATION_ERROR", async (price) => {
    const res = await patch(1, { price }, tokens.admin);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("admin -> 200 คืนราคาใหม่ และบันทึกลงฐานข้อมูลจริง", async () => {
    const res = await patch(1, { price: 75 }, tokens.admin);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ id: 1, name: "ข้าวผัดกุ้ง", price: 75, available: true });
    const [rows] = await pool.query("SELECT price FROM menu_items WHERE id = 1");
    expect(Number(rows[0].price)).toBe(75);
  });
});

describe("POST /api/v1/menu", () => {
  test("ไม่มี name -> 400 และ details ระบุ name", async () => {
    const res = await request(app)
      .post("/api/v1/menu")
      .set("Authorization", `Bearer ${tokens.admin}`)
      .send({ price: 30 });

    expect(res.status).toBe(400);
    expect(res.body.error.details.map((d) => d.field)).toEqual(["name"]);
  });

  test("customer -> 403", async () => {
    const res = await request(app)
      .post("/api/v1/menu")
      .set("Authorization", `Bearer ${tokens.customer}`)
      .send({ name: "ชาไทย", price: 30 });

    expect(res.status).toBe(403);
  });

  test("admin -> 201 และบันทึกลงฐานข้อมูล", async () => {
    const res = await request(app)
      .post("/api/v1/menu")
      .set("Authorization", `Bearer ${tokens.admin}`)
      .send({ name: "ชาไทย", price: 30 });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ name: "ชาไทย", price: 30, available: true });
    const [rows] = await pool.query("SELECT name FROM menu_items WHERE id = ?", [res.body.data.id]);
    expect(rows[0].name).toBe("ชาไทย");
  });
});

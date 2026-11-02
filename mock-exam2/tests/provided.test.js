// เทสต์ที่ผู้สอนให้มา (ห้ามแก้ไข ไม่ต้องส่ง) — ตอนเริ่มต้นจะ fail อยู่ 3 ข้อ
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

describe("GET /api/v1/menu?search=", () => {
  test("search ค้นหาตามชื่อเมนู", async () => {
    const res = await request(app).get("/api/v1/menu").query({ search: "ข้าว" });

    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThan(0);
    expect(res.body.data.every((m) => m.name.includes("ข้าว"))).toBe(true);
  });

  test("search ที่มีเครื่องหมาย ' ต้องไม่ทำให้ระบบ error", async () => {
    const res = await request(app).get("/api/v1/menu").query({ search: "O'Brien" });

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
  });

  test("search ต้องไม่ถูกใช้แทรกเงื่อนไข SQL ได้", async () => {
    const res = await request(app).get("/api/v1/menu").query({ search: "' OR '1'='1" });

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
  });
});

describe("PATCH /api/v1/menu/:id/price", () => {
  test("admin แก้ราคาได้", async () => {
    const res = await request(app)
      .patch("/api/v1/menu/1/price")
      .set("Authorization", `Bearer ${tokens.admin}`)
      .send({ price: 65 });

    expect(res.status).toBe(200);
    expect(res.body.data.price).toBe(65);
  });

  test("เมนูที่ไม่มีอยู่จริงต้องได้ 404 MENU_NOT_FOUND", async () => {
    const res = await request(app)
      .patch("/api/v1/menu/9999/price")
      .set("Authorization", `Bearer ${tokens.admin}`)
      .send({ price: 65 });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("MENU_NOT_FOUND");
  });
});

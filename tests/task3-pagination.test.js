// เทสต์ตรวจโจทย์ที่ 3.1: pagination ของ GET /api/v1/menu (ห้ามแก้ไฟล์นี้)
const request = require("supertest");
const app = require("../app");
const { pool } = require("../db");
const { resetDatabase } = require("./helpers/setup");

describe("โจทย์ที่ 3.1: GET /api/v1/menu pagination", () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await pool.end();
  });

  test("หน้า 1 (limit 5) ต้องได้เมนู id 1-5", async () => {
    const res = await request(app).get("/api/v1/menu?page=1&limit=5");

    expect(res.status).toBe(200);
    expect(res.body.data.map((m) => m.id)).toEqual([1, 2, 3, 4, 5]);
    expect(res.body.meta).toEqual({ page: 1, limit: 5, total: 22 });
  });

  test("หน้าสุดท้าย (page 5, limit 5) ต้องได้เมนูที่เหลือ 2 รายการ", async () => {
    const res = await request(app).get("/api/v1/menu?page=5&limit=5");

    expect(res.status).toBe(200);
    expect(res.body.data.map((m) => m.id)).toEqual([21, 22]);
  });
});

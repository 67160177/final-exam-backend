// โจทย์ที่ 3.2: เทสต์ GET /api/v1/menu ที่เขียนเอง (ตัวอย่างเฉลย)
const request = require("supertest");
const app = require("../app");
const { pool } = require("../db");
const { resetDatabase } = require("./helpers/setup");

describe("โจทย์ที่ 3.2: เทสต์ GET /api/v1/menu ที่เขียนเอง", () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await pool.end();
  });

  test("available=true ต้องคืนเฉพาะเมนูที่พร้อมขาย", async () => {
    const res = await request(app).get("/api/v1/menu?available=true&limit=50");

    expect(res.status).toBe(200);
    // seed มี 22 เมนู ไม่พร้อมขาย 2 รายการ (id 9 และ 18)
    expect(res.body.meta.total).toBe(20);
    expect(res.body.data).toHaveLength(20);
    expect(res.body.data.every((m) => m.available === true)).toBe(true);
    expect(res.body.data.map((m) => m.id)).not.toContain(9);
  });

  test("limit เกิน 50 ต้องได้ 400 VALIDATION_ERROR", async () => {
    const res = await request(app).get("/api/v1/menu?limit=51");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.data).toBeUndefined();
  });

  test("GET /api/v1/menu/:id ที่ไม่มีอยู่จริงต้องได้ 404 NOT_FOUND", async () => {
    const res = await request(app).get("/api/v1/menu/9999");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});

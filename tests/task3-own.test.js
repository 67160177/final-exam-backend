// โจทย์ที่ 3.2: เขียนเทสต์ของตัวเองในไฟล์นี้ (แทน test.todo ด้วย test จริง)
//
// ⭐⭐ [ออกสอบ wk09 + แนวข้อสอบข้อ 5 "เขียนการยืนยันผลในเทสต์ให้ชัดเจน"]
// เทสต์ที่ดีต้องตรวจมากกว่า status code เช่น error.code หรือเนื้อหาใน data
// เทสต์ที่ไม่มี expect เลยก็ผ่านได้และยังเพิ่ม coverage แต่ไม่ได้พิสูจน์อะไร (wk09 5.3)
//
// รูปแบบที่ใช้ได้ (ดูตัวอย่างใน task1-create-order.test.js):
//   const res = await request(app).get("/api/v1/menu?available=true&limit=50");
//   expect(res.status).toBe(200);
//   expect(res.body.error.code).toBe("...");
//   expect(array.every((x) => เงื่อนไข)).toBe(true);   // ตรวจว่า "ทุก" รายการเป็นจริง
//   expect(array).toHaveLength(n);
//   expect(array).not.toContain(ค่า);
const request = require("supertest");
const app = require("../app");
const { pool } = require("../db");
const { resetDatabase } = require("./helpers/setup");

describe("โจทย์ที่ 3.2: เทสต์ GET /api/v1/menu ที่เขียนเอง", () => {
  // ไฟล์นี้แค่อ่านข้อมูล ไม่ได้แก้ จึงรีเซ็ตครั้งเดียวด้วย beforeAll ก็พอ (เร็วกว่า beforeEach)
  beforeAll(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await pool.end();
  });

  // คำใบ้: seed.sql มี 22 เมนู ไม่พร้อมขาย 2 รายการ และอย่าลืมว่า limit เริ่มต้นคือ 10
  test.todo("available=true ต้องคืนเฉพาะเมนูที่พร้อมขาย");

  test.todo("limit เกิน 50 ต้องได้ 400 VALIDATION_ERROR");

  test.todo("GET /api/v1/menu/:id ที่ไม่มีอยู่จริงต้องได้ 404 NOT_FOUND");
});

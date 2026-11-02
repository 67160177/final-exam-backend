// โจทย์ที่ 3.2: เขียนเทสต์ของตัวเองในไฟล์นี้ (แทน test.todo ด้วย test จริง)
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

  test.todo("available=true ต้องคืนเฉพาะเมนูที่พร้อมขาย");

  test.todo("limit เกิน 50 ต้องได้ 400 VALIDATION_ERROR");

  test.todo("GET /api/v1/menu/:id ที่ไม่มีอยู่จริงต้องได้ 404 NOT_FOUND");
});

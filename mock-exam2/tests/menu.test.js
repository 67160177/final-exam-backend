// โจทย์ที่ 1 และ 3: เขียนเทสต์ของคุณในไฟล์นี้ (ไฟล์นี้ต้องส่ง)
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
  // TODO โจทย์ที่ 1
});

describe("PATCH /api/v1/menu/:id/price", () => {
  // TODO โจทย์ที่ 1
});

describe("POST /api/v1/menu", () => {
  // TODO โจทย์ที่ 3
});

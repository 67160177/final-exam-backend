// เทสต์ตรวจโจทย์ที่ 2: PATCH /api/v1/orders/:id/status (ห้ามแก้ไฟล์นี้)
const request = require("supertest");
const app = require("../app");
const { pool } = require("../db");
const { resetDatabase, tokenFor } = require("./helpers/setup");

async function statusOf(orderId) {
  const [rows] = await pool.query("SELECT status FROM orders WHERE id = ?", [orderId]);
  return rows[0].status;
}

describe("โจทย์ที่ 2: PATCH /api/v1/orders/:id/status", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await pool.end();
  });

  test("ไม่มี token ต้องได้ 401 และสถานะไม่เปลี่ยน", async () => {
    const res = await request(app)
      .patch("/api/v1/orders/3/status")
      .send({ status: "cancelled" });

    expect(res.status).toBe(401);
    expect(await statusOf(3)).toBe("pending");
  });

  test("token ปลอมต้องได้ 401", async () => {
    const res = await request(app)
      .patch("/api/v1/orders/3/status")
      .set("Authorization", "Bearer not-a-real-token")
      .send({ status: "cancelled" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_TOKEN");
  });

  test("customer ต้องได้ 403 FORBIDDEN และสถานะไม่เปลี่ยน", async () => {
    const res = await request(app)
      .patch("/api/v1/orders/3/status")
      .set("Authorization", `Bearer ${tokenFor("customer")}`)
      .send({ status: "delivered" });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
    expect(await statusOf(3)).toBe("pending");
  });

  test.each([["cooking"], [""], [undefined]])(
    "สถานะไม่ถูกต้อง (%s) ต้องได้ 400 VALIDATION_ERROR",
    async (status) => {
      const res = await request(app)
        .patch("/api/v1/orders/3/status")
        .set("Authorization", `Bearer ${tokenFor("staff")}`)
        .send({ status });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(await statusOf(3)).toBe("pending");
    },
  );

  test("คำสั่งซื้อที่ไม่มีอยู่จริงต้องได้ 404 ORDER_NOT_FOUND", async () => {
    const res = await request(app)
      .patch("/api/v1/orders/9999/status")
      .set("Authorization", `Bearer ${tokenFor("staff")}`)
      .send({ status: "preparing" });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("ORDER_NOT_FOUND");
  });

  test.each([["staff"], ["admin"]])("%s เปลี่ยนสถานะได้ (200)", async (role) => {
    const res = await request(app)
      .patch("/api/v1/orders/3/status")
      .set("Authorization", `Bearer ${tokenFor(role)}`)
      .send({ status: "preparing" });

    expect(res.status).toBe(200);
    expect(await statusOf(3)).toBe("preparing");
  });
});

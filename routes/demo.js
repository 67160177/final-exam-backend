// ส่วนเสริมสำหรับหน้าเว็บ frontend/ เท่านั้น ไม่เกี่ยวกับโจทย์และไม่มีเทสต์ตรวจ
//   POST /api/v1/auth/demo-login  เลือกผู้ใช้จำลองแล้วรับ token (ระบบนี้ไม่มีตาราง users)
//   GET  /api/v1/health           ตรวจว่าเชื่อมต่อฐานข้อมูลได้
//   GET  /api/v1/orders           รายการคำสั่งซื้อ (customer เห็นของตัวเอง, staff/admin เห็นทั้งหมด)
const express = require("express");
const jwt = require("jsonwebtoken");
const { pool } = require("../db");
const { jwtSecret } = require("../config");
const { authenticateToken } = require("../middlewares/auth");

const router = express.Router();

// ผู้ใช้จำลอง ชื่อตรงกับ customer_name ใน seed.sql เพื่อให้เห็นคำสั่งซื้อเดิม
const DEMO_USERS = {
  somchai: { id: 1, name: "สมชาย", role: "customer" },
  somying: { id: 4, name: "สมหญิง", role: "customer" },
  staff: { id: 2, name: "พนักงานครัว", role: "staff" },
  admin: { id: 3, name: "ผู้ดูแลระบบ", role: "admin" },
};

router.post("/auth/demo-login", (req, res) => {
  const user = DEMO_USERS[req.body.user];
  if (!user) {
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "ไม่พบผู้ใช้จำลองที่เลือก" },
    });
  }
  const token = jwt.sign(user, jwtSecret, { expiresIn: "8h" });
  res.status(200).json({ token, user });
});

router.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ok" });
  } catch (err) {
    res.status(503).json({ status: "error", message: "เชื่อมต่อฐานข้อมูลไม่ได้" });
  }
});

router.get("/orders", authenticateToken, async (req, res, next) => {
  const isCustomer = req.user.role === "customer";
  try {
    const [rows] = await pool.query(
      `SELECT o.id, o.customer_name, o.status, o.created_at,
              COUNT(oi.id) AS item_count,
              COALESCE(SUM(m.price * oi.quantity), 0) AS total
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       LEFT JOIN menu_items m ON m.id = oi.menu_item_id
       ${isCustomer ? "WHERE o.customer_name = ?" : ""}
       GROUP BY o.id
       ORDER BY o.id DESC`,
      isCustomer ? [req.user.name] : [],
    );
    res.status(200).json({
      data: rows.map((row) => ({
        id: row.id,
        customerName: row.customer_name,
        status: row.status,
        createdAt: row.created_at,
        itemCount: Number(row.item_count),
        total: Number(row.total),
      })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

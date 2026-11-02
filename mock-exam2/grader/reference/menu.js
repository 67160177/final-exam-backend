// เฉลย routes/menu.js (grader ใช้ไฟล์นี้เป็นต้นแบบสำหรับตรวจเทสต์ของนิสิต)
const express = require("express");
const { pool } = require("../db");
const { authMiddleware, requireRole } = require("../middlewares/auth");

const router = express.Router();

// แปลงแถวจาก MySQL เป็น JSON ของ API (DECIMAL มาเป็น string, BOOLEAN มาเป็น 0/1)
function toMenu(row) {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    available: Boolean(row.available),
  };
}

function validationError(res, details) {
  return res.status(400).json({
    error: { code: "VALIDATION_ERROR", message: "ข้อมูลไม่ถูกต้อง", details },
  });
}

function isValidPrice(price) {
  return typeof price === "number" && Number.isFinite(price) && price > 0 && price <= 10000;
}

// GET /api/v1/menu?search=คำค้น
router.get("/", async (req, res, next) => {
  const { search } = req.query;
  try {
    // แก้บั๊กที่ 1: ส่งคำค้นผ่าน ? แทนการต่อ string (ป้องกัน SQL Injection)
    // เครื่องหมาย % ใส่ในค่าที่ส่ง ไม่ใช่ใน SQL
    const [rows] = search
      ? await pool.query(
          "SELECT id, name, price, available FROM menu_items WHERE name LIKE ? ORDER BY id",
          [`%${search}%`],
        )
      : await pool.query("SELECT id, name, price, available FROM menu_items ORDER BY id");
    res.status(200).json({ data: rows.map(toMenu), count: rows.length });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/menu/:id
router.get("/:id", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, price, available FROM menu_items WHERE id = ?",
      [req.params.id],
    );
    if (rows.length === 0) {
      return res.status(404).json({
        error: { code: "MENU_NOT_FOUND", message: "ไม่พบเมนูที่ระบุ" },
      });
    }
    res.status(200).json({ data: toMenu(rows[0]) });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/menu  body: { name, price, available? }
router.post("/", authMiddleware, requireRole("admin"), async (req, res, next) => {
  const { name, price, available = true } = req.body;

  // รวบรวม error ทุก field ก่อนตอบ จะได้บอก client ครบในครั้งเดียว
  const details = [];
  if (typeof name !== "string" || name.trim() === "" || name.trim().length > 200) {
    details.push({ field: "name", message: "name ต้องเป็นข้อความ 1-200 ตัวอักษร" });
  }
  if (!isValidPrice(price)) {
    details.push({ field: "price", message: "price ต้องเป็นตัวเลขมากกว่า 0 และไม่เกิน 10000" });
  }
  if (typeof available !== "boolean") {
    details.push({ field: "available", message: "available ต้องเป็น true หรือ false" });
  }
  if (details.length > 0) return validationError(res, details);

  try {
    const [result] = await pool.query(
      "INSERT INTO menu_items (name, price, available) VALUES (?, ?, ?)",
      [name.trim(), price, available],
    );
    res.status(201).json({
      data: { id: result.insertId, name: name.trim(), price, available },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/menu/:id/price  body: { price }
router.patch("/:id/price", authMiddleware, requireRole("admin"), async (req, res, next) => {
  const { price } = req.body;
  if (!isValidPrice(price)) {
    return validationError(res, [
      { field: "price", message: "price ต้องเป็นตัวเลขมากกว่า 0 และไม่เกิน 10000" },
    ]);
  }
  try {
    const [result] = await pool.query("UPDATE menu_items SET price = ? WHERE id = ?", [price, req.params.id]);
    // แก้บั๊กที่ 2: UPDATE ไม่ error เมื่อไม่พบแถว ต้องดู affectedRows แล้วตอบ 404 เอง
    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: { code: "MENU_NOT_FOUND", message: "ไม่พบเมนูที่ระบุ" },
      });
    }
    const [rows] = await pool.query(
      "SELECT id, name, price, available FROM menu_items WHERE id = ?",
      [req.params.id],
    );
    res.status(200).json({ data: toMenu(rows[0]) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

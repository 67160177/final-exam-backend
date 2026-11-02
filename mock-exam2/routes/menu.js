// เส้นทางเมนูอาหาร /api/v1/menu
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
    let sql = "SELECT id, name, price, available FROM menu_items";
    if (search) {
      sql += ` WHERE name LIKE '%${search}%'`;
    }
    sql += " ORDER BY id";
    const [rows] = await pool.query(sql);
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

// TODO โจทย์ที่ 3: POST /api/v1/menu
router.post("/", (req, res) => {
  res.status(501).json({
    error: { code: "NOT_IMPLEMENTED", message: "ยังไม่ได้ทำ" },
  });
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
    await pool.query("UPDATE menu_items SET price = ? WHERE id = ?", [price, req.params.id]);
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

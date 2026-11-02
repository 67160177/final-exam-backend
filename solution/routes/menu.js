// เส้นทางเมนูอาหาร: GET /api/v1/menu และ GET /api/v1/menu/:id
const express = require("express");
const { pool } = require("../db");

const router = express.Router();

// แปลงแถวจาก MySQL ให้อยู่ในรูปแบบ JSON ของ API
// (DECIMAL ถูกส่งมาเป็น string และ BOOLEAN ถูกส่งมาเป็น 0/1)
function toMenu(row) {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    available: Boolean(row.available),
  };
}

// GET /api/v1/menu?page=1&limit=10&available=true
router.get("/", async (req, res, next) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 10);

  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 50) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "page ต้องเป็นจำนวนเต็มตั้งแต่ 1 และ limit ต้องอยู่ระหว่าง 1-50",
      },
    });
  }

  const where = [];
  const params = [];
  if (req.query.available !== undefined) {
    where.push("available = ?");
    params.push(req.query.available === "true");
  }
  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  // page เริ่มที่ 1 จึงต้องลบ 1 ก่อนคูณ (หน้า 1 ต้องข้าม 0 แถว)
  const offset = (page - 1) * limit;

  try {
    const [rows] = await pool.query(
      `SELECT id, name, price, available FROM menu_items ${whereSql} ORDER BY id LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM menu_items ${whereSql}`,
      params,
    );
    res.status(200).json({
      data: rows.map(toMenu),
      meta: { page, limit, total },
    });
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
        error: { code: "NOT_FOUND", message: "ไม่พบเมนูที่ระบุ" },
      });
    }
    res.status(200).json({ data: toMenu(rows[0]) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

// เส้นทางเมนูอาหาร: GET /api/v1/menu และ GET /api/v1/menu/:id
const express = require("express");
const { pool } = require("../db");

const router = express.Router();

// แปลงแถวจาก MySQL ให้อยู่ในรูปแบบ JSON ของ API
// (DECIMAL ถูกส่งมาเป็น string และ BOOLEAN ถูกส่งมาเป็น 0/1)
// ถ้าไม่แปลง เทสต์ที่ตรวจ available === true จะ fail เพราะได้ 1 แทน
function toMenu(row) {
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price),
    available: Boolean(row.available),
  };
}

// GET /api/v1/menu?page=1&limit=10&available=true
// ⭐⭐ [ออกสอบ wk07 4] Pagination + Filtering
router.get("/", async (req, res, next) => {
  // ค่าจาก query string เป็น string เสมอ ("1") จึงต้องแปลงเป็น Number ก่อน
  // ?? ใช้ค่า default เมื่อไม่ได้ส่งมา (undefined)
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 10);

  // ⭐ [ออกสอบ wk07 4.2 / wk12 2.4] จำกัด limit สูงสุดไว้ (50)
  // กันคนขอ ?limit=1000000 แล้วดึงข้อมูลทั้งตารางจนเซิร์ฟเวอร์หนัก
  // Number("abc") = NaN ซึ่ง Number.isInteger(NaN) = false จึงตกกรณี 400 ด้วย
  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 50
  ) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message:
          "page ต้องเป็นจำนวนเต็มตั้งแต่ 1 และ limit ต้องอยู่ระหว่าง 1-50",
      },
    });
  }

  // ⭐ [ออกสอบ wk07 4.3 / wk05 3.6] สร้าง WHERE แบบมีเงื่อนไข แต่ยังใช้ ? กับค่าทุกตัว
  // ส่วนที่ต่อ string เข้า SQL มีแค่ชื่อคอลัมน์ที่เราเขียนเอง ส่วนค่าจากผู้ใช้อยู่ใน params เสมอ
  const where = [];
  const params = [];
  if (req.query.available !== undefined) {
    where.push("available = ?");
    // "true" -> true, ค่าอื่นทั้งหมด -> false
    params.push(req.query.available === "true");
  }
  const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  // ⭐⭐ [ออกสอบ โจทย์ 3.1] สูตร OFFSET (จำนวนแถวที่ต้องข้าม)
  // page เริ่มที่ 1 จึงต้องลบ 1 ก่อนคูณ: หน้า 1 ข้าม 0, หน้า 2 ข้าม limit, หน้า 3 ข้าม 2*limit
  // บั๊กเดิมคือ page * limit ทำให้หน้า 1 ข้ามไป limit แถว (ได้ข้อมูลของหน้า 2)
  const offset = (page - 1) * limit;

  try {
    // ORDER BY ต้องมีเสมอเมื่อแบ่งหน้า ไม่อย่างนั้นลำดับแถวไม่แน่นอน อาจได้ข้อมูลซ้ำหรือหายระหว่างหน้า
    const [rows] = await pool.query(
      `SELECT id, name, price, available FROM menu_items ${whereSql} ORDER BY id LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );
    // นับทั้งหมดด้วย WHERE เดียวกัน (ไม่มี LIMIT) ให้ client คำนวณจำนวนหน้าได้
    // [[{ total }]] = rows แถวแรก แล้วดึงคอลัมน์ total
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
    // req.params.id เป็น string แต่ส่งผ่าน ? ได้เลย MySQL แปลงให้
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

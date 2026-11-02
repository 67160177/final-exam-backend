// เส้นทางคำสั่งซื้อ: GET/POST /api/v1/orders และ PATCH /api/v1/orders/:id/status
//
// ⭐ ค้นหาคำว่า "ออกสอบ" เพื่อดูจุดที่ควรเข้าใจเหตุผล (อ้างอิงสัปดาห์ในเอกสาร wk05-wk12)
const express = require("express");
const { pool } = require("../db");
const { authenticateToken, authorizeRole } = require("../middlewares/auth");

// Router แยก route ของ /api/v1/orders ไว้ในไฟล์นี้ แล้วไป mount ใน app.js
// path ในไฟล์นี้จึงเป็น path ย่อย เช่น "/:id" หมายถึง /api/v1/orders/:id
const router = express.Router();

// ค่าที่ยอมรับได้ของ status (ต้องตรงกับที่ระบบใช้จริง) ใช้ตรวจใน PATCH ด้านล่าง
const ORDER_STATUSES = ["pending", "preparing", "delivered", "cancelled"];

// ดึงคำสั่งซื้อพร้อมรายการอาหารและยอดรวม คืนค่า null ถ้าไม่พบ
// รับได้ทั้ง pool และ connection ที่อยู่ใน transaction
// (ใน POST ต้องส่ง connection เข้ามา เพราะแถวที่เพิ่ง INSERT ยังไม่ commit
//  connection อื่นจาก pool จะยังมองไม่เห็นข้อมูลนั้น)
async function getOrderWithItems(conn, orderId) {
  // ⭐ [ออกสอบ wk05 3.6] Parameterized Query: ใส่ ? แล้วส่งค่าใน array แยก
  // mysql2 จะ escape ค่าให้ ป้องกัน SQL Injection ห้ามต่อ string เอง เช่น `... WHERE id = ${id}`
  const [orders] = await conn.query(
    "SELECT id, customer_name, status, created_at FROM orders WHERE id = ?",
    [orderId],
  );
  // query คืน [rows, fields] จึง destructure เอาแค่ตัวแรก ถ้าไม่พบจะได้ array ว่าง (ไม่ใช่ null)
  if (orders.length === 0) return null;

  // ⭐ [ออกสอบ wk05 3.5] JOIN ดึงชื่อและราคาเมนูจาก menu_items มาพร้อมรายการใน order_items
  const [items] = await conn.query(
    `SELECT oi.menu_item_id, m.name, m.price, oi.quantity
     FROM order_items oi
     JOIN menu_items m ON m.id = oi.menu_item_id
     WHERE oi.order_id = ?
     ORDER BY oi.id`,
    [orderId],
  );

  // แปลงชื่อคอลัมน์แบบ snake_case ของ DB เป็น camelCase ของ API
  // price เป็น DECIMAL ซึ่ง mysql2 ส่งมาเป็น string ("60.00") ต้องแปลงด้วย Number ก่อนคำนวณ
  const mapped = items.map((item) => ({
    menuItemId: item.menu_item_id,
    name: item.name,
    price: Number(item.price),
    quantity: item.quantity,
    subtotal: Number(item.price) * item.quantity,
  }));

  return {
    id: orders[0].id,
    customerName: orders[0].customer_name,
    status: orders[0].status,
    createdAt: orders[0].created_at,
    items: mapped,
    total: mapped.reduce((sum, item) => sum + item.subtotal, 0),
  };
}

// GET /api/v1/orders/:id
// ⭐ [ออกสอบ wk06 2.6] ใส่ authenticateToken ไว้ก่อน handler = ต้องมี token ถึงจะเข้าถึงได้
router.get("/:id", authenticateToken, async (req, res, next) => {
  try {
    const order = await getOrderWithItems(pool, req.params.id);
    if (!order) {
      // 404 = ไม่พบทรัพยากร และ return เพื่อหยุดทำงาน ไม่ให้ไหลไปส่ง response ซ้ำ
      return res.status(404).json({
        error: { code: "ORDER_NOT_FOUND", message: "ไม่พบคำสั่งซื้อที่ระบุ" },
      });
    }
    res.status(200).json({ data: order });
  } catch (err) {
    // ⭐ [ออกสอบ] ส่ง error ต่อให้ error handler กลางใน app.js (ตอบ 500) แทนการปล่อยให้ request ค้าง
    next(err);
  }
});

// ตรวจรายการอาหารแต่ละชิ้น: ต้องเป็น object ที่มี menuItemId และ quantity เป็นจำนวนเต็ม 1-20
// Number.isInteger(1.5) = false และ Number.isInteger("1") = false จึงกันทั้งทศนิยมและ string
function isValidItem(item) {
  return (
    item !== null &&
    typeof item === "object" &&
    Number.isInteger(item.menuItemId) &&
    Number.isInteger(item.quantity) &&
    item.quantity >= 1 &&
    item.quantity <= 20
  );
}

// POST /api/v1/orders  body: { items: [{ menuItemId, quantity }] }
// ⭐⭐ [ออกสอบ wk05 4.3-4.4] โจทย์ที่ 1 = Transaction เป็นหัวข้อที่ควรเข้าใจที่สุดในไฟล์นี้
router.post("/", authenticateToken, async (req, res, next) => {
  const { items } = req.body;

  // ⭐ [ออกสอบ wk12] Validation ทำก่อนแตะฐานข้อมูลเสมอ ตอบ 400 เมื่อข้อมูลผิดรูปแบบ
  // ตรวจก่อนเปิด transaction จะได้ไม่ต้องจอง connection โดยเปล่าประโยชน์
  if (
    !Array.isArray(items) ||
    items.length === 0 ||
    !items.every(isValidItem)
  ) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message:
          "items ต้องเป็น array ที่ไม่ว่าง และ quantity ต้องเป็นจำนวนเต็ม 1-20",
      },
    });
  }

  // ⭐⭐ [ออกสอบ wk05 4.4 ข้อ 4] ต้องยืม connection ตัวเดียวจาก pool มาใช้ตลอด transaction
  // ถ้าใช้ pool.query() ตรง ๆ แต่ละคำสั่งอาจได้ connection คนละตัว
  // beginTransaction/commit/rollback จะไม่ครอบคลุมคำสั่งเหล่านั้น
  const connection = await pool.getConnection();
  try {
    // เริ่ม transaction: ทุกคำสั่งหลังจากนี้จะสำเร็จทั้งหมด หรือถูกยกเลิกทั้งหมด (Atomicity ใน ACID)
    await connection.beginTransaction();

    // ⭐ [ออกสอบ wk05 4.4 ข้อ 5] ตรวจเงื่อนไขทุกเมนู "ก่อน" INSERT ใด ๆ
    // ลดสิ่งที่ต้อง rollback และไม่ไปชน constraint ของฐานข้อมูลโดยไม่จำเป็น
    for (const item of items) {
      const [menuRows] = await connection.query(
        "SELECT id, available FROM menu_items WHERE id = ?",
        [item.menuItemId],
      );
      if (menuRows.length === 0) {
        // ⭐ [ออกสอบ wk05 4.4 ข้อ 2] พบเงื่อนไขที่ไม่ควรไปต่อ ให้ rollback ก่อน return
        await connection.rollback();
        return res.status(404).json({
          error: {
            code: "MENU_NOT_FOUND",
            message: `ไม่พบเมนู id ${item.menuItemId}`,
          },
        });
      }
      // available เก็บเป็น BOOLEAN (TINYINT) ได้ 0/1 จึงใช้ ! ตรวจได้เลย
      if (!menuRows[0].available) {
        await connection.rollback();
        // 409 Conflict = request ถูกรูปแบบ แต่ขัดกับสถานะปัจจุบันของข้อมูล (เมนูไม่พร้อมขาย)
        return res.status(409).json({
          error: {
            code: "MENU_UNAVAILABLE",
            message: `เมนู id ${item.menuItemId} ไม่พร้อมขาย`,
          },
        });
      }
    }

    // customer_name มาจาก token (req.user ที่ authenticateToken ใส่ไว้) ไม่เชื่อชื่อที่ client ส่งมา
    // status ไม่ต้องใส่ เพราะ schema มี DEFAULT 'pending'
    const [orderResult] = await connection.query(
      "INSERT INTO orders (customer_name) VALUES (?)",
      [req.user.name],
    );
    // INSERT คืน ResultSetHeader ซึ่งมี insertId = id ของแถวที่เพิ่งสร้าง (AUTO_INCREMENT)
    const orderId = orderResult.insertId;

    for (const item of items) {
      await connection.query(
        "INSERT INTO order_items (order_id, menu_item_id, quantity) VALUES (?, ?, ?)",
        [orderId, item.menuItemId, item.quantity],
      );
    }

    // ยอดรวมคำนวณจากราคาในฐานข้อมูล ไม่ใช้ราคาที่ client ส่งมา (client แก้ราคาเองได้)
    const order = await getOrderWithItems(connection, orderId);
    // ⭐ [ออกสอบ wk05 4.4 ข้อ 3] commit เมื่อทุกขั้นตอนสำเร็จแล้วเท่านั้น
    await connection.commit();
    // 201 Created = สร้างทรัพยากรใหม่สำเร็จ (ต่างจาก 200 ที่ใช้กับการอ่านหรือแก้ไข)
    res.status(201).json({ data: order });
  } catch (err) {
    // error ที่ไม่คาดคิด (เช่น DB ล่มกลางทาง) ให้ยกเลิกทั้งหมด แล้วส่งต่อให้ error handler
    await connection.rollback();
    next(err);
  } finally {
    // ⭐⭐ [ออกสอบ wk05 4.4 ข้อ 1] คืน connection ใน finally เสมอ ไม่ว่าจะสำเร็จ, return กลางทาง หรือ error
    // ถ้าลืม จะเกิด connection leak: pool (connectionLimit 10) เต็ม แล้ว request ถัดไปค้างรอไม่สิ้นสุด
    // หมายเหตุ: finally ทำงานแม้จะ return อยู่ใน try แล้วก็ตาม
    connection.release();
  }
});

// PATCH /api/v1/orders/:id/status
// ⭐⭐ [ออกสอบ wk06 4.3] โจทย์ที่ 2 = Middleware Chaining: Express รัน middleware ตามลำดับซ้ายไปขวา
//   1. authenticateToken -> ไม่มี token หรือ token ปลอม ตอบ 401 แล้วหยุด
//   2. authorizeRole(...) -> มี token แต่ role ไม่มีสิทธิ์ ตอบ 403 แล้วหยุด
//   3. handler            -> มาถึงตรงนี้ได้ แปลว่าผ่านทั้งสองชั้นแล้ว
// สลับลำดับไม่ได้ เพราะ authorizeRole ต้องอ่าน req.user ที่ authenticateToken สร้างไว้
router.patch(
  "/:id/status",
  authenticateToken,
  authorizeRole("staff", "admin"),
  async (req, res, next) => {
    const { status } = req.body;
    // ⭐ [ออกสอบ wk12] Allowlist validation: ยอมรับเฉพาะค่าที่อยู่ในรายการ
    // ครอบคลุมทั้ง "cooking", "" และ undefined ในคราวเดียว
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: `status ต้องเป็นหนึ่งใน ${ORDER_STATUSES.join(", ")}`,
        },
      });
    }

    try {
      const [result] = await pool.query(
        "UPDATE orders SET status = ? WHERE id = ?",
        [status, req.params.id],
      );
      // ⭐ [ออกสอบ wk06 4.3] UPDATE/DELETE ไม่ error เมื่อไม่พบแถว แต่ affectedRows จะเป็น 0
      // จึงใช้ค่านี้ตัดสินว่าต้องตอบ 404 โดยไม่ต้อง SELECT ก่อน
      if (result.affectedRows === 0) {
        return res.status(404).json({
          error: { code: "ORDER_NOT_FOUND", message: "ไม่พบคำสั่งซื้อที่ระบุ" },
        });
      }
      res.status(200).json({ message: "อัปเดตสถานะสำเร็จ" });
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;

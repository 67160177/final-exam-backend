// เส้นทางคำสั่งซื้อ: GET/POST /api/v1/orders และ PATCH /api/v1/orders/:id/status
const express = require("express");
const { pool } = require("../db");
const { authenticateToken, authorizeRole } = require("../middlewares/auth");

const router = express.Router();

const ORDER_STATUSES = ["pending", "preparing", "delivered", "cancelled"];

// ดึงคำสั่งซื้อพร้อมรายการอาหารและยอดรวม คืนค่า null ถ้าไม่พบ
// รับได้ทั้ง pool และ connection ที่อยู่ใน transaction
async function getOrderWithItems(conn, orderId) {
  const [orders] = await conn.query(
    "SELECT id, customer_name, status, created_at FROM orders WHERE id = ?",
    [orderId],
  );
  if (orders.length === 0) return null;

  const [items] = await conn.query(
    `SELECT oi.menu_item_id, m.name, m.price, oi.quantity
     FROM order_items oi
     JOIN menu_items m ON m.id = oi.menu_item_id
     WHERE oi.order_id = ?
     ORDER BY oi.id`,
    [orderId],
  );

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
router.get("/:id", authenticateToken, async (req, res, next) => {
  try {
    const order = await getOrderWithItems(pool, req.params.id);
    if (!order) {
      return res.status(404).json({
        error: { code: "ORDER_NOT_FOUND", message: "ไม่พบคำสั่งซื้อที่ระบุ" },
      });
    }
    res.status(200).json({ data: order });
  } catch (err) {
    next(err);
  }
});

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
router.post("/", authenticateToken, async (req, res, next) => {
  const { items } = req.body;

  // ตรวจรูปแบบข้อมูลก่อนเปิด transaction ไม่ต้องจอง connection โดยเปล่าประโยชน์
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

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // ตรวจเงื่อนไขของทุกเมนูก่อนเขียนข้อมูลใด ๆ
    for (const item of items) {
      const [menuRows] = await connection.query(
        "SELECT id, available FROM menu_items WHERE id = ?",
        [item.menuItemId],
      );
      if (menuRows.length === 0) {
        await connection.rollback();
        return res.status(404).json({
          error: {
            code: "MENU_NOT_FOUND",
            message: `ไม่พบเมนู id ${item.menuItemId}`,
          },
        });
      }
      if (!menuRows[0].available) {
        await connection.rollback();
        return res.status(409).json({
          error: {
            code: "MENU_UNAVAILABLE",
            message: `เมนู id ${item.menuItemId} ไม่พร้อมขาย`,
          },
        });
      }
    }

    const [orderResult] = await connection.query(
      "INSERT INTO orders (customer_name) VALUES (?)",
      [req.user.name],
    );
    const orderId = orderResult.insertId;

    for (const item of items) {
      await connection.query(
        "INSERT INTO order_items (order_id, menu_item_id, quantity) VALUES (?, ?, ?)",
        [orderId, item.menuItemId, item.quantity],
      );
    }

    // ยอดรวมคำนวณจากราคาในฐานข้อมูล ไม่ใช้ราคาที่ client ส่งมา
    const order = await getOrderWithItems(connection, orderId);
    await connection.commit();
    res.status(201).json({ data: order });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
});

// PATCH /api/v1/orders/:id/status
router.patch(
  "/:id/status",
  authenticateToken,
  authorizeRole("staff", "admin"),
  async (req, res, next) => {
    const { status } = req.body;
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

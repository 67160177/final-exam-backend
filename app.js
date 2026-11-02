// ประกาศ app และ route ทั้งหมด
// ⭐⭐ [ออกสอบ wk09 3.2] ไฟล์นี้ไม่เรียก app.listen() เพราะ Supertest ต้อง require("./app") ไปทดสอบตรง ๆ
// ถ้า listen อยู่ในไฟล์นี้ ทุกครั้งที่รันเทสต์จะเปิดพอร์ตจริง (ชนพอร์ตหรือค้าง) จึงแยกไปไว้ที่ server.js
const path = require("path");
const express = require("express");
const menuRoutes = require("./routes/menu");
const orderRoutes = require("./routes/orders");
const demoRoutes = require("./routes/demo");

const app = express();

// แปลง body ที่เป็น JSON ให้อ่านได้ที่ req.body (ถ้าไม่มีบรรทัดนี้ req.body จะเป็น undefined)
// ⭐ [ออกสอบ wk12 2.4] limit จำกัดขนาด body กัน oversized payload
app.use(express.json({ limit: "10kb" }));

// mount router: path ในไฟล์ route จะต่อท้าย prefix นี้
app.use("/api/v1/menu", menuRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1", demoRoutes); // ส่วนเสริมของหน้าเว็บ ไม่เกี่ยวกับโจทย์

// หน้าเว็บ (npm start แล้วเปิด http://localhost:3000/app)
app.use("/app", express.static(path.join(__dirname, "frontend")));
app.get("/", (req, res) => res.redirect("/app/"));

// ⭐ [ออกสอบ] ลำดับของ app.use มีผล: Express ไล่จากบนลงล่าง
// middleware นี้อยู่หลัง route ทั้งหมด จะมาถึงได้ก็ต่อเมื่อไม่มี route ไหนตอบ = ไม่พบ endpoint
app.use((req, res) => {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: "ไม่พบ endpoint ที่ร้องขอ" },
  });
});

// ⭐⭐ [ออกสอบ wk04/wk09] Error handling middleware ต้องมี 4 พารามิเตอร์ (err, req, res, next)
// Express ดูจากจำนวนพารามิเตอร์ว่าเป็นตัวจัดการ error ถ้าตัด next ทิ้งจะไม่ทำงาน
// ทุก route ที่เรียก next(err) จะมาจบที่นี่ ตอบ 500 โดยไม่ส่งรายละเอียด error (stack, SQL) ให้ client
app.use((err, req, res, next) => {
  console.error(err); // log ไว้ฝั่งเซิร์ฟเวอร์ให้นักพัฒนาดู
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "เกิดข้อผิดพลาดภายในระบบ" },
  });
});

module.exports = app;

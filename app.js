// ประกาศ app และ route ทั้งหมด (ไม่เรียก listen ที่นี่ เพื่อให้ Supertest import ไปทดสอบได้)
const path = require("path");
const express = require("express");
const menuRoutes = require("./routes/menu");
const orderRoutes = require("./routes/orders");
const demoRoutes = require("./routes/demo");

const app = express();

app.use(express.json({ limit: "10kb" }));

app.use("/api/v1/menu", menuRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1", demoRoutes);

// หน้าเว็บ (npm start แล้วเปิด http://localhost:3000/app)
app.use("/app", express.static(path.join(__dirname, "frontend")));
app.get("/", (req, res) => res.redirect("/app/"));

app.use((req, res) => {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: "ไม่พบ endpoint ที่ร้องขอ" },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "เกิดข้อผิดพลาดภายในระบบ" },
  });
});

module.exports = app;

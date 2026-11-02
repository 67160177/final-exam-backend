// ประกาศ app (ไม่ต้องแก้ไข) — server.js เป็นผู้เรียก listen
const express = require("express");

// grader/grade.js สลับไฟล์ route ผ่าน MENU_ROUTES_FILE เพื่อลองรันเทสต์ของนิสิตกับโค้ดที่ใส่บั๊กไว้
const menuRoutes = require(process.env.MENU_ROUTES_FILE || "./routes/menu");

const app = express();

app.use(express.json({ limit: "10kb" }));

app.use("/api/v1/menu", menuRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: "ไม่พบ endpoint ที่ร้องขอ" },
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "เกิดข้อผิดพลาดภายในระบบ" },
  });
});

module.exports = app;

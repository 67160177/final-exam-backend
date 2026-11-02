// Middleware สำหรับตรวจ JWT และสิทธิ์ตามบทบาท
// payload ของ token ในระบบนี้: { id, name, role } โดย role เป็น "customer", "staff" หรือ "admin"
const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config");

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // รูปแบบ "Bearer <token>"

  if (!token) {
    return res.status(401).json({
      error: { code: "NO_TOKEN", message: "กรุณาเข้าสู่ระบบก่อนใช้งาน" },
    });
  }

  try {
    req.user = jwt.verify(token, jwtSecret);
    next();
  } catch (err) {
    return res.status(401).json({
      error: { code: "INVALID_TOKEN", message: "Token ไม่ถูกต้องหรือหมดอายุ" },
    });
  }
}

// คืน middleware ที่อนุญาตเฉพาะ role ที่อยู่ใน allowedRoles
// ต้องใช้หลัง authenticateToken เสมอ เพราะอ่าน role จาก req.user
function authorizeRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: { code: "NO_TOKEN", message: "กรุณาเข้าสู่ระบบก่อนใช้งาน" },
      });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "คุณไม่มีสิทธิ์เข้าถึงทรัพยากรนี้",
        },
      });
    }
    next();
  };
}

module.exports = { authenticateToken, authorizeRole };

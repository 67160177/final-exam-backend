// ตรวจ JWT และ role (เขียนไว้ให้แล้ว ไม่ต้องแก้ไข)
// authMiddleware แนบ req.user = { sub, role }
const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config");

function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      error: { code: "NO_TOKEN", message: "กรุณาเข้าสู่ระบบก่อนใช้งาน" },
    });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = { sub: payload.sub, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({
      error: { code: "INVALID_TOKEN", message: "Token ไม่ถูกต้องหรือหมดอายุ" },
    });
  }
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "คุณไม่มีสิทธิ์เข้าถึงทรัพยากรนี้" },
      });
    }
    next();
  };
}

module.exports = { authMiddleware, requireRole };

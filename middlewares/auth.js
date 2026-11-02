// Middleware สำหรับตรวจ JWT และสิทธิ์ตามบทบาท
// payload ของ token ในระบบนี้: { id, name, role } โดย role เป็น "customer", "staff" หรือ "admin"
//
// ⭐ [ออกสอบ wk06 1.1] Authentication กับ Authorization ต่างกัน
//   Authentication = "คุณคือใคร"         -> authenticateToken -> ไม่ผ่านตอบ 401 Unauthorized
//   Authorization  = "คุณมีสิทธิ์ทำไหม"   -> authorizeRole     -> ไม่ผ่านตอบ 403 Forbidden
const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config");

// ⭐⭐ [ออกสอบ wk06 2.6] Middleware ตรวจ JWT
// middleware คือฟังก์ชัน (req, res, next): ผ่านให้เรียก next() / ไม่ผ่านให้ตอบ error แล้ว return
function authenticateToken(req, res, next) {
  // client ส่ง header มาในรูปแบบ "Authorization: Bearer <token>"
  // Express เก็บชื่อ header เป็นตัวพิมพ์เล็กเสมอ จึงอ่านด้วย "authorization"
  const authHeader = req.headers["authorization"];
  // split(" ") ได้ ["Bearer", "<token>"] เอาตัวที่ [1]
  // ใช้ && กันกรณีไม่มี header (undefined.split จะ error)
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      error: { code: "NO_TOKEN", message: "กรุณาเข้าสู่ระบบก่อนใช้งาน" },
    });
  }

  try {
    // ⭐ [ออกสอบ wk06 2.2] jwt.verify ตรวจทั้งลายเซ็น (signature) และวันหมดอายุ (exp)
    // ถ้าผ่านจะคืน payload ที่ถอดแล้ว ถ้าไม่ผ่านจะ throw (JsonWebTokenError / TokenExpiredError)
    // payload ของ JWT แค่เข้ารหัส base64 ใคร ๆ ก็อ่านได้ จึงห้ามใส่ข้อมูลลับอย่างรหัสผ่าน
    // แต่แก้ไขไม่ได้ เพราะลายเซ็นจะไม่ตรงถ้าไม่รู้ secret
    req.user = jwt.verify(token, jwtSecret);
    // แนบข้อมูลผู้ใช้ไว้ที่ req.user ให้ middleware และ handler ถัดไปใช้ต่อ
    next();
  } catch (err) {
    return res.status(401).json({
      error: { code: "INVALID_TOKEN", message: "Token ไม่ถูกต้องหรือหมดอายุ" },
    });
  }
}

// ⭐⭐ [ออกสอบ wk06 4.2] RBAC (Role-Based Access Control) แบบ higher-order function
// authorizeRole("staff", "admin") ไม่ได้เป็น middleware เอง แต่ "คืน" middleware ออกมา
// ...allowedRoles (rest parameter) รวมอาร์กิวเมนต์ทั้งหมดเป็น array: ["staff", "admin"]
// ข้อดี: ใช้ซ้ำกับหลาย route ได้ โดยเปลี่ยนแค่รายชื่อ role
// ต้องใช้หลัง authenticateToken เสมอ เพราะอ่าน role จาก req.user
function authorizeRole(...allowedRoles) {
  return (req, res, next) => {
    // กันกรณีลืมใส่ authenticateToken ไว้ก่อน (ไม่มี req.user = ยังไม่ได้ยืนยันตัวตน = 401)
    if (!req.user) {
      return res.status(401).json({
        error: { code: "NO_TOKEN", message: "กรุณาเข้าสู่ระบบก่อนใช้งาน" },
      });
    }
    // รู้แล้วว่าเป็นใคร แต่ role ไม่อยู่ในรายการที่อนุญาต = 403
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "คุณไม่มีสิทธิ์เข้าถึงทรัพยากรนี้",
        },
      });
    }
    // ⭐ ต้อง return ทุกครั้งที่ตอบ error ไม่อย่างนั้นจะไหลมาเรียก next() ต่อ
    // แล้วเกิด "Cannot set headers after they are sent"
    next();
  };
}

module.exports = { authenticateToken, authorizeRole };

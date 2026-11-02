// ตัวช่วยสำหรับเทสต์ (ไม่ต้องแก้ไข)
//   resetDatabase()  รีเซ็ต exam_db ด้วย seed.sql
//   tokens.admin / tokens.customer  token สำหรับแนบใน header Authorization
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const jwt = require("jsonwebtoken");
const { db, jwtSecret } = require("../../config");

const seedSql = fs.readFileSync(path.join(__dirname, "..", "..", "seed.sql"), "utf8");

async function resetDatabase() {
  const conn = await mysql.createConnection({ ...db, multipleStatements: true });
  await conn.query(seedSql);
  await conn.end();
}

const tokens = {
  admin: jwt.sign({ sub: "1", role: "admin" }, jwtSecret, { expiresIn: "1h" }),
  customer: jwt.sign({ sub: "2", role: "customer" }, jwtSecret, { expiresIn: "1h" }),
};

module.exports = { resetDatabase, tokens };

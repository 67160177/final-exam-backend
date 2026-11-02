// ตัวช่วยร่วมของเทสต์: รีเซ็ตฐานข้อมูลด้วย seed.sql และสร้าง token ตาม role
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

const users = {
  customer: { id: 1, name: "สมชาย", role: "customer" },
  staff: { id: 2, name: "พนักงานครัว", role: "staff" },
  admin: { id: 3, name: "ผู้ดูแลระบบ", role: "admin" },
};

function tokenFor(role) {
  return jwt.sign(users[role], jwtSecret, { expiresIn: "1h" });
}

module.exports = { resetDatabase, tokenFor, users };

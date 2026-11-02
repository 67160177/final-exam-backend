// connection pool ของ MySQL
// ⭐⭐ [ออกสอบ wk05 2] Connection Pool
// เปิดการเชื่อมต่อใหม่ทุก request ช้าและเปลืองทรัพยากร (ต้อง handshake และยืนยันตัวตนทุกครั้ง)
// pool จึงเปิดเตรียมไว้ชุดหนึ่ง แล้วให้แต่ละ request ยืมไปใช้และคืนกลับมา
const mysql = require("mysql2/promise"); // ใช้รุ่น promise เพื่อเขียน async/await ได้
const { db } = require("./config");

const pool = mysql.createPool({
  host: db.host,
  port: db.port,
  user: db.user,
  password: db.password,
  database: db.database,
  waitForConnections: true, // ถ้า connection ถูกยืมหมด ให้ request ใหม่รอคิว (ไม่ error ทันที)
  connectionLimit: 10, // ⭐ [ออกสอบ wk05 2.4 / wk14 3.4] เปิดพร้อมกันได้สูงสุด 10 เส้น กันฐานข้อมูลรับภาระเกิน
  // ถ้า scale เป็น N instance จะใช้ได้ถึง N x 10 connection ต้องไม่เกิน max_connections ของ MySQL
  queueLimit: 0, // 0 = คิวรอได้ไม่จำกัด
});

// pool.query()          ใช้กับคำสั่งเดี่ยว: ยืม connection แล้วคืนให้อัตโนมัติ
// pool.getConnection()  ใช้กับ transaction: ต้อง release() เองใน finally (ดู routes/orders.js)
module.exports = { pool };

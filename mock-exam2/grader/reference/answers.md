# เฉลยตัวอย่าง answers.md

## บั๊กที่ 1: GET /api/v1/menu?search=

### Error ที่ Jest แสดง
- เทสต์ `O'Brien`: `Expected: 200, Received: 500` และ console แสดง `ER_PARSE_ERROR` (SQL syntax ผิด)
- เทสต์ `' OR '1'='1`: `Expected: 0, Received: 22` คือได้เมนูทุกรายการกลับมา

### สาเหตุ
โค้ดต่อค่า `search` เข้าไปใน SQL ตรง ๆ (`LIKE '%${search}%'`) เครื่องหมาย `'` ในคำค้นจึงกลายเป็นส่วนหนึ่งของคำสั่ง SQL
- `O'Brien` ทำให้ string ปิดก่อนกำหนด SQL จึงผิดรูปแบบ (500)
- `' OR '1'='1` ทำให้ได้ `WHERE name LIKE '%' OR '1'='1%'` และเงื่อนไข `LIKE '%'` เป็นจริงทุกแถว

นี่คือช่องโหว่ SQL Injection

### วิธีแก้
ใช้ Parameterized Query: `WHERE name LIKE ?` แล้วส่ง `` `%${search}%` `` ใน array ของค่า
mysql2 จะ escape ค่าให้เอง คำค้นจึงถูกมองเป็นข้อมูลเสมอ ไม่ใช่คำสั่ง (wk05 3.6)

## บั๊กที่ 2: PATCH /api/v1/menu/:id/price

### Error ที่ Jest แสดง
`Expected: 404, Received: 500` และ console แสดง `TypeError: Cannot read properties of undefined (reading 'id')` ที่ `toMenu`

### สาเหตุ
`UPDATE` กับ id ที่ไม่มีอยู่ไม่ทำให้ MySQL error แค่ไม่มีแถวถูกแก้ (`affectedRows = 0`)
โค้ดจึงไปต่อที่ `SELECT` ซึ่งได้ array ว่าง แล้วส่ง `rows[0]` (undefined) ให้ `toMenu` อ่าน `.id` จึงเกิด TypeError และ error handler ตอบ 500

### วิธีแก้
เก็บผลของ `UPDATE` ไว้ (`const [result] = ...`) แล้วตรวจ `result.affectedRows === 0` ให้ตอบ `404 MENU_NOT_FOUND` แล้ว `return` ก่อนถึง `SELECT`

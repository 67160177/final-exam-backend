# ข้อสอบจำลอง ส่วนที่ 2: ปฏิบัติ (15 คะแนน)

> ชุดฝึกนี้ไม่ใช่ข้อสอบจริง ออกแบบให้มีรูปแบบใกล้เคียงกับแนวข้อสอบ (Express + MySQL + Jest, 3 โจทย์ 6/4/5 คะแนน)
> แนะนำให้จับเวลา 60 นาที และเปิดดูได้เฉพาะเอกสาร wk05-wk12 เหมือนวันสอบจริง

## การเตรียม

ใช้ฐานข้อมูลจากขั้นตอนใน `README-setup.md` (คอนเทนเนอร์ MySQL พอร์ต 3309 ต้องเปิดอยู่)

```bash
npm test                          # รันทุกโจทย์ (ตอนเริ่มจะ fail เกือบทั้งหมด)
npx jest tests/environment        # ตรวจสภาพแวดล้อมอย่างเดียว (3 เทสต์ตาม README-setup.md)
npx jest --runInBand tests/task1  # รันเฉพาะโจทย์ที่ 1
npm start                         # เปิดเซิร์ฟเวอร์ที่ http://localhost:3000 ถ้าต้องการลองด้วย Postman
```

เทสต์จะรีเซ็ตฐานข้อมูลด้วย `seed.sql` ทุกครั้ง ไม่ต้องรัน seed เอง

## โครงสร้างโปรเจกต์

| ไฟล์ | หน้าที่ |
| --- | --- |
| `app.js` | ประกาศ middleware และ route (ไม่มี `listen`) |
| `server.js` | เปิดเซิร์ฟเวอร์จริง |
| `db.js` | connection pool (`const { pool } = require("./db")`) |
| `middlewares/auth.js` | `authenticateToken` (เสร็จแล้ว) และ `authorizeRole` (ยังไม่เสร็จ) |
| `routes/menu.js` | `GET /api/v1/menu`, `GET /api/v1/menu/:id` |
| `routes/orders.js` | `GET /api/v1/orders/:id`, `POST /api/v1/orders`, `PATCH /api/v1/orders/:id/status` |
| `tests/` | เทสต์ตรวจคำตอบ **ห้ามแก้** ยกเว้น `task3-own.test.js` |

Token ในระบบนี้มี payload เป็น `{ id, name, role }` โดย `role` คือ `customer`, `staff` หรือ `admin`
รูปแบบ error ทุกจุด: `{ "error": { "code": "...", "message": "..." } }`

---

## โจทย์ที่ 1: สร้างคำสั่งซื้อด้วย Transaction (6 คะแนน)

ทำ `POST /api/v1/orders` ใน `routes/orders.js` ให้ทำงานตามข้อกำหนดนี้

**Request body**
```json
{ "items": [ { "menuItemId": 1, "quantity": 2 }, { "menuItemId": 5, "quantity": 1 } ] }
```

**ข้อกำหนด**
1. ต้องเข้าสู่ระบบ (มี token) ทุก role สั่งได้ ไม่มี token ให้ตอบ `401`
2. `items` ต้องเป็น array ที่ไม่ว่าง ทุกรายการต้องมี `menuItemId` เป็นจำนวนเต็ม และ `quantity` เป็นจำนวนเต็ม 1-20 ถ้าไม่ผ่านให้ตอบ `400 VALIDATION_ERROR`
3. ถ้ามีเมนูใดไม่มีอยู่จริงให้ตอบ `404 MENU_NOT_FOUND`
4. ถ้ามีเมนูใด `available = FALSE` ให้ตอบ `409 MENU_UNAVAILABLE`
5. ถ้าเกิดข้อ 3 หรือ 4 **ต้องไม่มีข้อมูลใดถูกบันทึกลง `orders` หรือ `order_items` เลย**
6. `customer_name` ของคำสั่งซื้อให้ใช้ `name` จาก token และสถานะเริ่มต้นเป็น `pending`
7. ยอดรวมต้องคำนวณจากราคาในฐานข้อมูล ห้ามใช้ราคาที่ client ส่งมา
8. สำเร็จให้ตอบ `201` พร้อม `{ data: <คำสั่งซื้อ> }` ในรูปแบบเดียวกับ `GET /api/v1/orders/:id` (มีฟังก์ชัน `getOrderWithItems` ให้ใช้แล้ว)

**เกณฑ์ให้คะแนน**: ผ่าน `tests/task1-create-order.test.js` ทั้งหมด (4 คะแนน) และใช้ transaction ถูกต้อง ได้แก่ query ทุกคำสั่งผ่าน connection เดียวกัน, มี rollback และคืน connection ใน `finally` (2 คะแนน)

---

## โจทย์ที่ 2: ป้องกันการเปลี่ยนสถานะคำสั่งซื้อ (4 คะแนน)

ตอนนี้ `PATCH /api/v1/orders/:id/status` ไม่มีการป้องกันใด ๆ ใครก็เปลี่ยนสถานะเป็นค่าอะไรก็ได้

1. เขียน `authorizeRole(...allowedRoles)` ใน `middlewares/auth.js` ให้เสร็จ (`401 NO_TOKEN` ถ้าไม่มี `req.user`, `403 FORBIDDEN` ถ้า role ไม่อยู่ในรายการ)
2. ให้ route นี้ใช้ได้เฉพาะ `staff` และ `admin`
3. `status` ต้องเป็นหนึ่งใน `pending`, `preparing`, `delivered`, `cancelled` ถ้าไม่ใช่ให้ตอบ `400 VALIDATION_ERROR`
4. ถ้าไม่พบคำสั่งซื้อให้ตอบ `404 ORDER_NOT_FOUND`

**เกณฑ์ให้คะแนน**: ผ่าน `tests/task2-order-status.test.js` ทั้งหมด

---

## โจทย์ที่ 3: หาบั๊กและเขียนเทสต์ (5 คะแนน)

**3.1 (2 คะแนน)** `tests/task3-pagination.test.js` fail อยู่
- อ่าน error ของ Jest แล้วหาสาเหตุใน `routes/menu.js` แก้ให้เทสต์ผ่าน
- เขียนอธิบายใน `ANSWER.md` ด้วยประโยคของตัวเองว่า error บอกอะไร สาเหตุคืออะไร และแก้อย่างไร

**3.2 (3 คะแนน)** ใน `tests/task3-own.test.js` เปลี่ยน `test.todo` ทั้ง 3 ข้อเป็นเทสต์จริงที่ผ่าน
- ทุกเทสต์ต้องตรวจมากกว่าแค่ status code (เช่น ตรวจ `error.code` หรือเนื้อหาของ `data`)
- เทสต์ `available=true` ต้องยืนยันว่า **ทุก** รายการที่ได้กลับมามี `available === true`

---

## การส่ง (ในชุดฝึก)

รัน `npm test` ให้ได้ `28 passed` (โจทย์ 25 + ตรวจสภาพแวดล้อม 3) แล้วเทียบโค้ดกับไฟล์ในโฟลเดอร์ `solution/` ซึ่งเก็บเฉพาะไฟล์ที่ต้องแก้ ในโครงสร้างเดียวกับโปรเจกต์

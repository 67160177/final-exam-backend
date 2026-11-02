# ข้อสอบจำลองปลายภาค ส่วนที่ 2: สอบปฏิบัติ (15 คะแนน)

> ชุดฝึกนี้ไม่ใช่ข้อสอบจริง จัดรูปแบบตามข้อสอบกลางภาค แต่เนื้อหาเน้นแนวปลายภาค (Jest + Supertest, อ่าน error แล้วแก้บั๊ก, validation)
> จับเวลา 60 นาที เปิดได้เฉพาะเอกสาร wk05-wk12 **ห้ามเปิดโฟลเดอร์ `grader/`** เพราะมีเฉลยอยู่

**เงื่อนไข:** อนุญาตให้เปิดเอกสารบรรยายและปฏิบัติการได้ (open-book) ห้ามคัดลอกโค้ดจากผู้อื่นหรือใช้เครื่องมือ AI ช่วยเขียนโค้ด

## สิ่งที่ผู้สอนเตรียมให้ (ไม่ต้องแก้ไข)

- server ที่รันได้ (`npm run dev`) และ `pool` จาก `db.js`
- `app.js` แยกจาก `server.js` แล้ว (Supertest import `app` ได้เลย)
- `middlewares/auth.js` ส่งออก `authMiddleware` (ตรวจ JWT แล้วแนบ `req.user = { sub, role }`) และ `requireRole(role)`
- ฐานข้อมูล `exam_db` ตาราง `menu_items (id, name, price, available)` 22 ระเบียน (ใช้คอนเทนเนอร์จาก `final-exam-setup`)
- `tests/helpers/setup.js` ส่งออก `resetDatabase()` และ `tokens.admin`, `tokens.customer`
- `tests/provided.test.js` เทสต์ของผู้สอน (ห้ามแก้)

token สำหรับลองด้วย Postman (header `Authorization: Bearer <token>`):

```
admin:    eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzkzNjQ1NzE0LCJleHAiOjE4MjUxODE3MTR9.hraW6-6yah5hDWa8kHXq2DxJKSzCxsrhADAiPctUYkk
customer: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyIiwicm9sZSI6ImN1c3RvbWVyIiwiaWF0IjoxNzkzNjQ1NzE0LCJleHAiOjE4MjUxODE3MTR9.c6-tpbJ6x3oVlTocue3Td-RM-yZTA9sSTPeWHJZ5m7Q
```

endpoint ที่มีอยู่ใน `routes/menu.js`:

| Method | Path | สิทธิ์ | ผลลัพธ์ |
| --- | --- | --- | --- |
| GET | `/api/v1/menu?search=` | ทุกคน | `200 { data: [...], count }` |
| GET | `/api/v1/menu/:id` | ทุกคน | `200 { data: { id, name, price, available } }` หรือ `404 MENU_NOT_FOUND` |
| PATCH | `/api/v1/menu/:id/price` | admin | body `{ price }` ได้ `200 { data }`, `400 VALIDATION_ERROR` (price ต้องเป็น number > 0 และ ≤ 10000), `401`, `403`, `404 MENU_NOT_FOUND` |
| POST | `/api/v1/menu` | admin | ยังไม่ได้ทำ (โจทย์ที่ 3) |

`price` ใน response เป็น number และ `available` เป็น boolean

```bash
npm test                 # รันเทสต์ทั้งหมด
npm run test:provided    # รันเฉพาะเทสต์ของผู้สอน
npm run grade            # ตรวจให้คะแนนอัตโนมัติ (ใช้หลังทำเสร็จ)
```

---

## โจทย์ที่ 1: เขียนเทสต์ (6 คะแนน)

ใน `tests/menu.test.js` เขียนเทสต์ด้วย Jest + Supertest ให้ครอบคลุมพฤติกรรมของ `GET /api/v1/menu/:id` และ `PATCH /api/v1/menu/:id/price` **ตามตาราง endpoint ด้านบน** อย่างน้อยกรณีต่อไปนี้

1. GET เมนูที่มีอยู่ (id 1 = ข้าวผัดกุ้ง ราคา 60 พร้อมขาย)
2. GET เมนูที่ไม่มีอยู่
3. PATCH โดยไม่มี token
4. PATCH ด้วย token ของ customer
5. PATCH ด้วย price ที่ไม่ถูกต้อง (อย่างน้อย `0` และค่าที่ไม่ใช่ number)
6. PATCH สำเร็จ

**วิธีตรวจ:** เทสต์ของคุณต้องผ่านทั้งหมดกับโค้ดที่ถูกต้อง แล้วผู้ตรวจจะเอาเทสต์ไปรันกับโค้ดที่ใส่บั๊กไว้ 6 แบบ เทสต์ที่ fail กับโค้ดที่มีบั๊ก = จับบั๊กได้ ได้แบบละ 1 คะแนน
ดังนั้นต้องเขียนการยืนยันผลให้ชัดเจน ตรวจแค่ status code อย่างเดียวจะจับบั๊กได้น้อย

## โจทย์ที่ 2: อ่าน error ของ Jest แล้วแก้บั๊ก (4 คะแนน)

`npm run test:provided` มีเทสต์ fail อยู่ 3 ข้อ ซึ่งเกิดจากบั๊ก 2 จุดใน `routes/menu.js`

1. แก้ `routes/menu.js` ให้เทสต์ของผู้สอนผ่านทั้งหมด (บั๊กละ 1 คะแนน)
2. ใน `answers.md` อธิบายแต่ละบั๊กด้วยประโยคของตัวเองว่า Jest แสดง error อะไร สาเหตุคืออะไร และแก้อย่างไร (บั๊กละ 1 คะแนน)

## โจทย์ที่ 3: เพิ่ม POST /api/v1/menu (5 คะแนน)

เพิ่ม `POST /api/v1/menu` ใน `routes/menu.js`

- ต้องมี token และเป็น admin เท่านั้น (ใช้ `authMiddleware` และ `requireRole` ที่มีอยู่) ไม่มี token ได้ 401, role อื่นได้ 403
- body: `{ name, price, available }`
  - `name`: string ไม่ว่าง (หลัง trim) ยาวไม่เกิน 200 ตัวอักษร บันทึกค่าที่ trim แล้ว
  - `price`: number มากกว่า 0 และไม่เกิน 10000 (string `"30"` ไม่ผ่าน)
  - `available`: boolean ไม่บังคับ ค่าเริ่มต้น `true`
- ข้อมูลผิดให้ตอบ `400` ในรูปแบบนี้ โดย `details` ต้องมี **ทุก field ที่ผิด** (field ละ 1 รายการ):
  ```json
  { "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [ { "field": "price", "message": "..." } ] } }
  ```
- สำเร็จให้ตอบ `201 { "data": { "id", "name", "price", "available" } }` และต้องบันทึกลงฐานข้อมูลจริง

คะแนน: ผู้ตรวจใช้เทสต์ของตัวเองเรียก endpoint (4 คะแนน) และเพิ่มเทสต์ของ POST ใน `tests/menu.test.js` อย่างน้อย 3 กรณี ซึ่งต้องจับได้ถ้า validation ปล่อยข้อมูลที่ผิดเพียง field เดียวผ่านไป (1 คะแนน)

---

## การส่งคำตอบ

ส่ง 3 ไฟล์เท่านั้น ถ้าส่งเกินจะไม่ตรวจ

| ไฟล์ | เนื้อหา |
| --- | --- |
| `routes/menu.js` | โค้ดที่แก้บั๊กแล้วและมี POST (โจทย์ที่ 2-3) |
| `tests/menu.test.js` | เทสต์ของคุณ (โจทย์ที่ 1 และ 3) |
| `answers.md` | คำอธิบายบั๊ก (โจทย์ที่ 2) |

```
<รหัสนิสิต>.zip
└── <รหัสนิสิต>/
    ├── routes/
    │   └── menu.js
    ├── tests/
    │   └── menu.test.js
    └── answers.md
```

ในชุดฝึกนี้ไม่ต้อง zip ให้รัน `npm run grade` แทน แล้วเทียบ answers.md กับ `grader/reference/answers.md`

# ปฏิบัติการสัปดาห์ที่ 6: Implement ระบบ Authentication และ RBAC

## วัตถุประสงค์ของปฏิบัติการ

เมื่อทำปฏิบัติการนี้เสร็จสิ้น นิสิตจะสามารถ

1. สร้างระบบ Register และ Login ที่เข้ารหัสรหัสผ่านด้วย `bcrypt` และออก JWT ได้จริง
2. สร้าง Middleware สำหรับตรวจสอบ Token และควบคุมสิทธิ์ตามบทบาท (RBAC) ได้
3. ปกป้อง route ที่มีอยู่เดิมด้วยระบบ Authentication และ Authorization ได้
4. ทดสอบ Protected Route และ RBAC ด้วย Postman ครบทุกกรณี ทั้งกรณีอนุญาตและปฏิเสธการเข้าถึง

ปฏิบัติการนี้ต่อยอดจากเนื้อหาบรรยายในเอกสาร `wk06.md` และปรับปรุงโปรเจกต์ `student-api` ที่สร้างต่อเนื่องมาจากปฏิบัติการสัปดาห์ที่ 1-5 (`wk01-lab.md` ถึง `wk05-lab.md`) เป็นส่วนหนึ่งของการประเมินผล CLO1 (ใบงานส่งสัปดาห์ที่ 6) ตามที่กำหนดไว้ใน `course_plan.md`

## เวลาที่ใช้

| ช่วงเวลา    | กิจกรรม                                       |
| ----------- | --------------------------------------------- |
| 0-15 นาที   | ทบทวนเนื้อหาสัปดาห์ที่ 5 (Review W5)          |
| 15-90 นาที  | Implement Register/Login และ Token Middleware |
| 90-120 นาที | ทดสอบ Protected Route และ RBAC                |

## เครื่องมือที่ต้องใช้

1. โปรเจกต์ `student-api` จากปฏิบัติการสัปดาห์ที่ 1-5 (ต้องมีฐานข้อมูล MySQL ที่เชื่อมต่อได้แล้ว)
2. Node.js, npm และ Postman
3. ไลบรารี `jsonwebtoken`, `bcrypt`

---

## ส่วนที่ 1: ทบทวนเนื้อหาสัปดาห์ที่ 5 (0-15 นาที)

### ขั้นตอนที่ 1.1 ตรวจสอบโปรเจกต์เดิม

เปิดโฟลเดอร์ `student-api` และรันเซิร์ฟเวอร์เพื่อยืนยันว่าการเชื่อมต่อ MySQL จากสัปดาห์ที่ 5 ยังทำงานถูกต้อง

```bash
cd student-api
npm run dev
```

### ขั้นตอนที่ 1.2 ทบทวนแนวคิดสำคัญ

ก่อนเริ่มปฏิบัติการ ให้ทบทวนหัวข้อต่อไปนี้จากเอกสารบรรยาย `wk06.md` ร่วมกัน

1. Authentication และ Authorization แตกต่างกันอย่างไร
2. JWT ประกอบด้วยส่วนใดบ้าง และเหตุใด payload จึงไม่ควรมีข้อมูลลับ
3. เหตุใดต้องเข้ารหัสรหัสผ่านด้วย `bcrypt` ก่อนบันทึกลงฐานข้อมูล

### จุดตรวจสอบที่ 1

- เซิร์ฟเวอร์และการเชื่อมต่อฐานข้อมูลจากสัปดาห์ที่ 5 ยังทำงานได้ปกติ
- สามารถอธิบายความแตกต่างระหว่าง Authentication และ Authorization ได้ก่อนเริ่มลงมือปฏิบัติ

---

## ส่วนที่ 2: Implement Register/Login และ Token Middleware (15-90 นาที)

### ขั้นตอนที่ 2.1 สร้างตาราง Users

รันคำสั่ง SQL ต่อไปนี้เพื่อเพิ่มตาราง `users` เข้าไปในฐานข้อมูล `student_api` ที่สร้างไว้ในสัปดาห์ที่ 5

```sql
USE student_api;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'admin') NOT NULL DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### ขั้นตอนที่ 2.2 ติดตั้งไลบรารีและตั้งค่า Environment Variable

```bash
npm install jsonwebtoken bcrypt
```

เพิ่มค่าต่อไปนี้ในไฟล์ `.env` (และ `.env.example`)

```
JWT_SECRET=change-this-to-a-long-random-string-in-production
JWT_EXPIRES_IN=1h
```

### ขั้นตอนที่ 2.3 สร้างไฟล์ Helper สำหรับ Password และ Token

สร้างไฟล์ `auth-helpers.js`

```javascript
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const SALT_ROUNDS = 10;

async function hashPassword(plainPassword) {
  return await bcrypt.hash(plainPassword, SALT_ROUNDS);
}

async function verifyPassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN },
  );
}

module.exports = { hashPassword, verifyPassword, generateToken };
```

### ขั้นตอนที่ 2.4 สร้าง Route Register และ Login

เพิ่มโค้ดต่อไปนี้ในไฟล์ `index.js`

```javascript
const {
  hashPassword,
  verifyPassword,
  generateToken,
} = require("./auth-helpers");

app.post("/api/v1/auth/register", async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "กรุณาระบุ email และ password",
      },
    });
  }

  try {
    const passwordHash = await hashPassword(password);
    const [result] = await pool.query(
      "INSERT INTO users (email, password_hash, role) VALUES (?, ?, 'student')",
      [email, passwordHash],
    );

    res.status(201).json({
      message: "สมัครสมาชิกสำเร็จ",
      data: { id: result.insertId, email, role: "student" },
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: { code: "DUPLICATE_EMAIL", message: "อีเมลนี้มีอยู่ในระบบแล้ว" },
      });
    }
    next(err);
  }
});

app.post("/api/v1/auth/login", async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "กรุณาระบุ email และ password",
      },
    });
  }

  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (rows.length === 0) {
      return res.status(401).json({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
        },
      });
    }

    const user = rows[0];
    const isPasswordValid = await verifyPassword(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: {
          code: "INVALID_CREDENTIALS",
          message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
        },
      });
    }

    const token = generateToken(user);
    res.status(200).json({ message: "เข้าสู่ระบบสำเร็จ", token });
  } catch (err) {
    next(err);
  }
});
```

### ขั้นตอนที่ 2.5 สร้าง Middleware ตรวจสอบ Token และ Role

สร้างไฟล์ `middlewares/auth.js`

```javascript
const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      error: { code: "NO_TOKEN", message: "กรุณาเข้าสู่ระบบก่อนใช้งาน" },
    });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({
      error: { code: "INVALID_TOKEN", message: "Token ไม่ถูกต้องหรือหมดอายุ" },
    });
  }
}

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
```

### ขั้นตอนที่ 2.6 นำ Middleware ไปปกป้อง Route ที่มีอยู่เดิม

แก้ไข route `DELETE /api/v1/students/:id` จากสัปดาห์ที่ 5 ให้ต้องผ่านการยืนยันตัวตนและมีบทบาทเป็น admin เท่านั้น

```javascript
const { authenticateToken, authorizeRole } = require("./middlewares/auth");

app.delete(
  "/api/v1/students/:id",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res, next) => {
    try {
      const [result] = await pool.query("DELETE FROM students WHERE id = ?", [
        req.params.id,
      ]);
      if (result.affectedRows === 0) {
        return res.status(404).json({
          error: { code: "NOT_FOUND", message: "ไม่พบข้อมูลนิสิต" },
        });
      }
      res.status(200).json({ message: "ลบข้อมูลสำเร็จ" });
    } catch (err) {
      next(err);
    }
  },
);

// เพิ่ม route ใหม่: เฉพาะผู้ที่ล็อกอินแล้วเท่านั้นที่ดูข้อมูลของตนเองได้
app.get("/api/v1/auth/me", authenticateToken, (req, res) => {
  res.status(200).json({ message: "สำเร็จ", data: req.user });
});
```

### จุดตรวจสอบที่ 2

- ตาราง `users` ถูกสร้างสำเร็จในฐานข้อมูล
- `POST /api/v1/auth/register` สร้างผู้ใช้ใหม่และรหัสผ่านถูกเข้ารหัสก่อนบันทึก (ตรวจสอบด้วย `SELECT * FROM users;` ว่า `password_hash` ไม่ใช่ข้อความธรรมดา)
- `POST /api/v1/auth/login` ด้วยข้อมูลที่ถูกต้อง ได้รับ JWT กลับมา
- route `DELETE /api/v1/students/:id` ถูกปกป้องด้วย `authenticateToken` และ `authorizeRole("admin")` เรียบร้อย

---

## ส่วนที่ 3: ทดสอบ Protected Route และ RBAC (90-120 นาที)

### ขั้นตอนที่ 3.1 สร้างผู้ใช้ 2 บทบาทสำหรับทดสอบ

`POST /api/v1/auth/register` (ขั้นตอนที่ 2.4) กำหนดให้ผู้สมัครใหม่ทุกคนได้ `role = 'student'` เสมอ และไม่รับค่า `role` จาก client โดยตรง เพื่อป้องกันช่องโหว่ Mass Assignment ตามที่อธิบายไว้ใน `wk06.md` หัวข้อ 3.2 ดังนั้นให้สร้างบัญชีทดสอบ 2 ขั้นตอนดังนี้

ใช้ Postman เรียก `POST /api/v1/auth/register` สร้างผู้ใช้ 2 คน (ทั้งคู่จะได้ `role = student` โดยอัตโนมัติ)

```json
{ "email": "student1@example.com", "password": "Passw0rd!" }
```

```json
{ "email": "admin1@example.com", "password": "Passw0rd!" }
```

จากนั้นเลื่อนบัญชี `admin1@example.com` ขึ้นเป็น admin โดยตรงผ่าน MySQL command line (จำลองขั้นตอนที่ admin คนแรกของระบบต้องถูกตั้งค่าโดยผู้ดูแลระบบ ไม่ใช่ผ่าน API สาธารณะ) เปิด terminal อีกหน้าต่างแล้วเข้า MySQL client

```bash
mysql -u root -p student_api
```

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin1@example.com';
exit
```

### ขั้นตอนที่ 3.2 ทดสอบ Login และเก็บ Token

เรียก `POST /api/v1/auth/login` ด้วยบัญชีทั้งสอง แล้วบันทึก token ที่ได้รับกลับมาแยกกัน (แนะนำให้ใช้ฟีเจอร์ Environment Variables ของ Postman เก็บเป็น `student_token` และ `admin_token`)

> **ข้อควรระวังเรื่องเวลา**: `JWT_EXPIRES_IN=1h` ตามขั้นตอนที่ 2.2 หมายความว่า token ที่ login ได้ตอนนี้จะหมดอายุใน 1 ชั่วโมง หากทำขั้นตอนที่ 3.3-3.7 ล่าช้ากว่า 1 ชั่วโมงหลัง login (เช่น หยุดพักระหว่างคาบ) จะได้ Status Code `401` พร้อม `INVALID_TOKEN` แทนผลลัพธ์ที่คาดหวังในตาราง แม้ระบบจะทำงานถูกต้องอยู่แล้ว หากเจอกรณีนี้ให้กลับไป login ใหม่ (ขั้นตอนที่ 3.2) เพื่อรับ token ใบใหม่ก่อนทดสอบต่อ

### ขั้นตอนที่ 3.3 ทดสอบ Protected Route โดยไม่มี Token

เรียก `GET /api/v1/auth/me` โดย**ไม่แนบ** Header `Authorization` ยืนยันว่าได้ Status Code `401` พร้อมข้อความ `NO_TOKEN`

### ขั้นตอนที่ 3.4 ทดสอบ Protected Route ด้วย Token ที่ถูกต้อง

เรียก `GET /api/v1/auth/me` พร้อมแนบ Header

```
Authorization: Bearer <student_token>
```

ยืนยันว่าได้ Status Code `200` พร้อมข้อมูล `id`, `email`, `role` ของผู้ใช้ที่ล็อกอิน

> **ข้อควรระวังก่อนเริ่ม 3.5-3.6**: การทดสอบสองขั้นตอนนี้ตรวจสอบว่ามีนิสิต `id = 1` อยู่ในตาราง `students` จริง (เพิ่มมาตั้งแต่สัปดาห์ที่ 5) ก่อน หากถูกลบไปแล้วระหว่างทำแล็บสัปดาห์ก่อน ๆ จะได้ Status Code `404` แทน `403`/`200` ตามที่คาดหวัง ทั้งที่ RBAC ทำงานถูกต้องอยู่แล้ว (เพราะ middleware ตรวจผ่านก่อนถึง route handler ที่หา record ไม่เจอ) ตรวจสอบก่อนด้วย `SELECT id FROM students LIMIT 1;` และแทนที่เลข `1` ในคำขอด้านล่างด้วย `id` ที่มีอยู่จริงหากจำเป็น

### ขั้นตอนที่ 3.5 ทดสอบ RBAC: บทบาทที่ไม่มีสิทธิ์

เรียก `DELETE /api/v1/students/1` พร้อมแนบ `Authorization: Bearer <student_token>` (บทบาท student) ยืนยันว่าได้ Status Code `403` พร้อมข้อความ `FORBIDDEN`

### ขั้นตอนที่ 3.6 ทดสอบ RBAC: บทบาทที่มีสิทธิ์

เรียก `DELETE /api/v1/students/1` พร้อมแนบ `Authorization: Bearer <admin_token>` (บทบาท admin) ยืนยันว่าได้ Status Code `200`

### ขั้นตอนที่ 3.7 ทดสอบ Token ที่ไม่ถูกต้อง

แก้ไขตัวอักษรบางตัวใน token ที่ได้รับ (เช่น เปลี่ยนตัวอักษรตัวสุดท้าย) แล้วเรียก `GET /api/v1/auth/me` ยืนยันว่าได้ Status Code `401` พร้อมข้อความ `INVALID_TOKEN` เนื่องจาก signature ไม่ตรงกันอีกต่อไป

### บันทึกผลการทดสอบทั้งหมด

| กรณีทดสอบ                     | Token ที่ใช้     | Status Code ที่คาดหวัง |
| ----------------------------- | ---------------- | ---------------------- |
| ไม่แนบ Token                  | ไม่มี            | 401                    |
| Token ถูกต้อง (ดูข้อมูลตนเอง) | student_token    | 200                    |
| ลบข้อมูลด้วยบทบาท student     | student_token    | 403                    |
| ลบข้อมูลด้วยบทบาท admin       | admin_token      | 200                    |
| Token ที่ถูกแก้ไข             | token ที่ดัดแปลง | 401                    |

### จุดตรวจสอบที่ 3

- ทดสอบครบทั้ง 5 กรณีในตารางข้างต้น และได้ Status Code ตรงตามที่คาดหวังทุกกรณี
- อธิบายได้ว่าเหตุใด token ที่ถูกแก้ไขแม้เพียงตัวอักษรเดียวจึงถูกปฏิเสธ (เชื่อมโยงกับหลักการ Signature ใน `wk06.md`)

---

## ส่วนต่อยอด: แบบฝึกหัดเพิ่มเติมด้วยตนเอง

### แบบฝึกหัดที่ 1: เพิ่ม Route เปลี่ยนรหัสผ่าน

เขียน route `PATCH /api/v1/auth/change-password` ที่ต้องผ่าน `authenticateToken` ก่อน โดยรับ `oldPassword` และ `newPassword` ตรวจสอบว่า `oldPassword` ถูกต้องก่อนอนุญาตให้เปลี่ยนเป็น `newPassword` ที่เข้ารหัสใหม่

### แบบฝึกหัดที่ 2: จำกัดให้ผู้ใช้แก้ไขได้เฉพาะข้อมูลของตนเอง

> **ข้อสังเกตก่อนเริ่ม**: ตาราง `users` (หัวข้อที่ 2.1) และตาราง `students` (สัปดาห์ที่ 5) เป็นคนละตารางที่ไม่มี Foreign Key เชื่อมโยงกัน (ดูหัวข้อ 4.4 ของ `wk06.md`) แบบฝึกหัดนี้จึงต้องเพิ่มคอลัมน์เชื่อมโยงก่อน ไม่สามารถเทียบ `req.user.id` กับ `req.params.id` ของ `students` โดยตรงได้ เพราะเป็นค่า `id` จากคนละตารางที่ auto-increment แยกกันคนละชุด

1. เพิ่มคอลัมน์เชื่อมโยงในตาราง `students` เพื่ออ้างอิงเจ้าของบัญชี

   ```sql
   ALTER TABLE students ADD COLUMN user_id INT NULL;
   ALTER TABLE students ADD FOREIGN KEY (user_id) REFERENCES users(id);
   ```

2. กำหนดค่า `user_id` ให้กับระเบียนนิสิตทดสอบด้วยตนเองผ่าน MySQL command line (จำลองขั้นตอนที่ admin ผูกบัญชี login เข้ากับระเบียนนิสิตที่มีอยู่แล้ว) เช่น

   ```sql
   UPDATE students SET user_id = 1 WHERE id = 1;
   ```

3. ปรับปรุง route `PUT /api/v1/students/:id` ให้ query ระเบียนนิสิตก่อน แล้วตรวจสอบว่า `req.user.id` ตรงกับค่า `user_id` ของระเบียนนั้นหรือไม่ หากไม่ตรงและ `req.user.role` ไม่ใช่ `admin` ให้ตอบกลับ `403` (เป็นตัวอย่างของ Object-level Authorization ที่ละเอียดกว่า RBAC แบบ role อย่างเดียว)

### แบบฝึกหัดที่ 3: ทดสอบผลกระทบของ Token หมดอายุ

ปรับค่า `JWT_EXPIRES_IN` เป็น `5s` ชั่วคราว แล้วทดลอง login และรอ 6 วินาทีก่อนเรียก `GET /api/v1/auth/me` ยืนยันว่าได้ Status Code `401` พร้อมข้อความบ่งชี้ว่า token หมดอายุ จากนั้นเปลี่ยนค่ากลับเป็น `1h` ตามเดิม

### แบบฝึกหัดที่ 4: พิสูจน์ข้อจำกัดของ Logout แบบ Stateless

อ้างอิงหลักการใน `wk06.md` หัวข้อ 2.7 ให้ทำตามขั้นตอนต่อไปนี้เพื่อพิสูจน์ด้วยตนเองว่าเหตุใดจึง "logout" JWT ทันทีไม่ได้

1. Login ด้วยบัญชี `student1@example.com` เก็บ token ที่ได้ไว้ในที่อื่นนอก Postman (เช่น คัดลอกไปวางใน text editor) เพื่อจำลองว่า token "หลุด" ไปอยู่ในมือผู้ไม่หวังดีก่อนกด logout
2. สมมติว่าฝั่ง client "logout" แล้ว (ในระบบนี้คือเพียงลบ token ออกจากที่เก็บฝั่ง Postman เพราะ backend ไม่มี route หรือกลไก logout ใด ๆ ให้เรียก)
3. นำ token ที่คัดลอกเก็บไว้ในขั้นตอนที่ 1 กลับมาเรียก `GET /api/v1/auth/me` อีกครั้ง
4. บันทึกผลลัพธ์ที่ได้ พร้อมอธิบายว่าเหตุใดจึงยังได้ Status Code `200` ทั้งที่ "logout" ไปแล้ว

### เกณฑ์การประเมินแบบฝึกหัดต่อยอด (สำหรับนิสิตใช้ตรวจสอบตนเอง)

| รายการ         | ผ่านเกณฑ์เมื่อ                                                                                                                                                    |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| แบบฝึกหัดที่ 1 | เปลี่ยนรหัสผ่านสำเร็จเมื่อ `oldPassword` ถูกต้อง และถูกปฏิเสธเมื่อ `oldPassword` ผิด                                                                              |
| แบบฝึกหัดที่ 2 | เพิ่มคอลัมน์ `user_id` สำเร็จ ผู้ใช้ทั่วไปแก้ไขข้อมูลนิสิตที่ `user_id` ไม่ตรงกับตนเองแล้วได้ `403` แต่แก้ไขข้อมูลนิสิตที่ `user_id` ตรงกับตนเองได้สำเร็จ         |
| แบบฝึกหัดที่ 3 | ยืนยันได้ว่า token หมดอายุใช้งานไม่ได้จริง และมีบันทึกผลการทดลอง                                                                                                  |
| แบบฝึกหัดที่ 4 | ยืนยันได้ว่า token ที่ "logout" ไปแล้วยังคงเรียก `GET /api/v1/auth/me` ได้สำเร็จ (`200`) และอธิบายเหตุผลได้ถูกต้องตามหลักการ Stateless ในหัวข้อ 2.7 ของ `wk06.md` |

หมายเหตุ: แบบฝึกหัดต่อยอดนี้เป็นการเตรียมความพร้อมสำหรับเนื้อหาสัปดาห์ที่ 7 (Caching, Performance & Client-Oriented API Design) ซึ่งจะนำ route ที่มีระบบ Authentication ครบถ้วนนี้ไปเพิ่มประสิทธิภาพด้วย caching และปรับปรุงให้รองรับความต้องการของ client ที่หลากหลายต่อไป

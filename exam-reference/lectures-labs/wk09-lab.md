# ปฏิบัติการสัปดาห์ที่ 9: เขียน Unit และ Integration Test ด้วย Jest และ Supertest

## วัตถุประสงค์ของปฏิบัติการ

เมื่อทำปฏิบัติการนี้เสร็จสิ้น นิสิตจะสามารถ

1. ปรับโครงสร้างโปรเจกต์ `student-api` ให้แยก `app` ออกจาก `server.js` เพื่อรองรับการทดสอบอัตโนมัติ
2. เขียน Unit Test สำหรับฟังก์ชัน helper ด้วย Jest ได้
3. เขียน Integration Test สำหรับ route Authentication และ CRUD ด้วย Supertest ได้
4. ใช้ Mocking เพื่อทดสอบ route โดยไม่ต้องพึ่งพาฐานข้อมูลจริงได้
5. รันรายงาน Test Coverage และวิเคราะห์จุดที่ยังขาดการทดสอบได้

ปฏิบัติการนี้ต่อยอดจากเนื้อหาบรรยายในเอกสาร `wk09.md` และปรับปรุงโปรเจกต์ `student-api` ที่สร้างต่อเนื่องมาจากปฏิบัติการสัปดาห์ที่ 1-7 (`wk01-lab.md` ถึง `wk07-lab.md`) เป็นส่วนหนึ่งของการประเมินผล CLO1 (ใบงานส่งสัปดาห์ที่ 9 ประเมินจากผล lab) และ CLO4 ตามที่กำหนดไว้ใน `course_plan.md`

## เวลาที่ใช้

| ช่วงเวลา    | กิจกรรม                                           |
| ----------- | ------------------------------------------------- |
| 0-15 นาที   | ทบทวนเนื้อหาสัปดาห์ที่ 8 (Review W8 — สอบกลางภาค) |
| 15-90 นาที  | เขียน Test สำหรับ Auth + CRUD routes              |
| 90-120 นาที | Run suite และดู Coverage report                   |

## เครื่องมือที่ต้องใช้

1. โปรเจกต์ `student-api` จากปฏิบัติการสัปดาห์ที่ 1-7 (ต้องมีระบบ Authentication และ RBAC จากสัปดาห์ที่ 6 ทำงานได้แล้ว)
2. Node.js และ npm
3. ไลบรารี `jest`, `supertest`

---

## ส่วนที่ 1: ทบทวนเนื้อหาสัปดาห์ที่ 8 (0-15 นาที)

### ขั้นตอนที่ 1.1 ตรวจสอบโปรเจกต์เดิม

เปิดโฟลเดอร์ `student-api` และรันเซิร์ฟเวอร์เพื่อยืนยันว่าระบบ Authentication, RBAC และ Caching จากสัปดาห์ที่ 6-7 ยังทำงานถูกต้อง

```bash
cd student-api
npm run dev
```

### ขั้นตอนที่ 1.2 ทบทวนแนวคิดสำคัญ

ก่อนเริ่มปฏิบัติการ ให้ทบทวนหัวข้อต่อไปนี้จากเอกสารบรรยาย `wk09.md` ร่วมกัน

1. Unit Testing และ Integration Testing แตกต่างกันอย่างไร
2. เพราะเหตุใดจึงต้องแยก `app` ออกจาก `app.listen()` ก่อนใช้ Supertest
3. Mocking มีประโยชน์อย่างไรเมื่อทดสอบ route ที่เชื่อมต่อฐานข้อมูล

### จุดตรวจสอบที่ 1

- เซิร์ฟเวอร์และระบบ Authentication จากสัปดาห์ที่ 6 ยังทำงานได้ปกติ
- สามารถอธิบายความแตกต่างระหว่าง Unit Test และ Integration Test ได้ก่อนเริ่มลงมือปฏิบัติ

---

## ส่วนที่ 2: เขียน Test สำหรับ Auth และ CRUD routes (15-90 นาที)

### ขั้นตอนที่ 2.1 ติดตั้งไลบรารี

```bash
npm install --save-dev jest supertest
```

เพิ่ม script ใน `package.json`

```json
{
  "scripts": {
    "test": "jest",
    "test:coverage": "jest --coverage"
  }
}
```

### ขั้นตอนที่ 2.2 แยก `app.js` ออกจาก `server.js`

ตรวจสอบไฟล์ `index.js` เดิมของโปรเจกต์ (ที่รวม route ทั้งหมดตั้งแต่สัปดาห์ที่ 1-7 และเรียก `app.listen()` อยู่ในไฟล์เดียวกัน) แล้วแยกออกเป็น 2 ไฟล์ตามนี้

> **หมายเหตุเรื่อง Redis**: `index.js` เดิมเรียก `connectRedis()` (จาก `cache.js`, สัปดาห์ที่ 7) ก่อน `app.listen()` เพื่อให้แน่ใจว่าเชื่อมต่อ Redis สำเร็จก่อนรับคำขอ ต้องย้ายการเรียก `connectRedis()` ไปไว้ที่ `server.js` เท่านั้น **ห้ามใส่ใน `app.js`** เพราะ Supertest จะ `require("./app")` โดยตรงโดยไม่ผ่าน `server.js` หากเรียก `connectRedis()` ใน `app.js` การรัน test จะพยายามเชื่อมต่อ Redis จริงทุกครั้งและอาจค้างหรือ fail

```javascript
// app.js
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
// ... import middleware, route ทั้งหมดที่มีอยู่เดิมใน index.js ...

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// ... นำ route ทั้งหมดจาก index.js เดิมมาไว้ที่นี่ (auth, students, cache) ...

// Error handling middleware (จากสัปดาห์ที่ 4)
app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(500)
    .json({
      error: { code: "INTERNAL_ERROR", message: "เกิดข้อผิดพลาดภายในระบบ" },
    });
});

module.exports = app;
```

```javascript
// server.js
require("dotenv").config();
const app = require("./app");
const { connectRedis } = require("./cache");
const PORT = process.env.PORT || 3000;

connectRedis()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`เซิร์ฟเวอร์ทำงานที่พอร์ต ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("เชื่อมต่อ Redis ไม่สำเร็จ เซิร์ฟเวอร์จะไม่เริ่มทำงาน:", err);
    process.exit(1);
  });
```

ปรับคำสั่งเริ่มเซิร์ฟเวอร์ใน `package.json` จาก `index.js` เป็น `server.js`

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

รัน `npm run dev` อีกครั้งเพื่อยืนยันว่าเซิร์ฟเวอร์ยังทำงานเหมือนเดิมทุกประการหลังการปรับโครงสร้าง (ไฟล์เปลี่ยน แต่พฤติกรรมของ API ต้องไม่เปลี่ยน)

### ขั้นตอนที่ 2.3 เขียน Unit Test สำหรับ `auth-helpers.js`

ในสัปดาห์ที่ 6 ฟังก์ชัน `hashPassword`, `verifyPassword` และ `generateToken` อาจกระจายอยู่คนละไฟล์หรือเขียนไว้ในตัวอย่างลอย ๆ หากโปรเจกต์ของนิสิตยังไม่มีไฟล์ที่รวมฟังก์ชันทั้งสามไว้ด้วยกัน ให้สร้างไฟล์ `auth-helpers.js` ขึ้นก่อน แล้วย้าย/รวมฟังก์ชันทั้งสามจากสัปดาห์ที่ 6 มาไว้ที่นี่ (เป็นการจัดกลุ่มไฟล์ใหม่ ไม่ใช่การเปลี่ยนพฤติกรรมของฟังก์ชัน) เพื่อให้ import มาทดสอบได้จากจุดเดียว

```javascript
// auth-helpers.js
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

จากนั้นแก้ไขไฟล์ route ที่เคย `require` ฟังก์ชันเหล่านี้จากที่อื่น ให้ชี้มาที่ `./auth-helpers` แทน แล้วยืนยันว่า `npm run dev` และ endpoint register/login ยังทำงานถูกต้องเหมือนเดิมก่อนไปขั้นตอนถัดไป

สร้างไฟล์ `auth-helpers.test.js`

```javascript
const {
  hashPassword,
  verifyPassword,
  generateToken,
} = require("./auth-helpers");
const jwt = require("jsonwebtoken");

describe("hashPassword และ verifyPassword", () => {
  test("hashPassword ควรคืนค่าที่ไม่ตรงกับรหัสผ่านต้นฉบับ", async () => {
    const hashed = await hashPassword("Passw0rd!");
    expect(hashed).not.toBe("Passw0rd!");
  });

  test("verifyPassword ควรคืนค่า true เมื่อรหัสผ่านถูกต้อง", async () => {
    const hashed = await hashPassword("Passw0rd!");
    const result = await verifyPassword("Passw0rd!", hashed);
    expect(result).toBe(true);
  });

  test("verifyPassword ควรคืนค่า false เมื่อรหัสผ่านไม่ถูกต้อง", async () => {
    const hashed = await hashPassword("Passw0rd!");
    const result = await verifyPassword("WrongPassword", hashed);
    expect(result).toBe(false);
  });
});

describe("generateToken", () => {
  test("ควรสร้าง token ที่มี payload ตรงกับข้อมูลผู้ใช้", () => {
    const user = { id: 1, email: "test@example.com", role: "student" };
    const token = generateToken(user);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    expect(decoded.id).toBe(user.id);
    expect(decoded.email).toBe(user.email);
    expect(decoded.role).toBe(user.role);
  });
});
```

> **หมายเหตุ**: การรัน test ที่เรียก `generateToken` ต้องมีค่า `process.env.JWT_SECRET` พร้อมใช้งาน หากไฟล์ `.env` ถูกโหลดผ่าน `dotenv` อยู่แล้วในไฟล์อื่นที่ import ก่อน test จะไม่มีปัญหา แต่ถ้า test ล้มเหลวเพราะ `JWT_SECRET` เป็น `undefined` ให้เพิ่มไฟล์ `jest.setup.js` ที่เรียก `require("dotenv").config()` แล้วอ้างอิงในไฟล์ตั้งค่า Jest (`jest.config.js` → `setupFiles: ["./jest.setup.js"]`)

รันเฉพาะไฟล์นี้เพื่อตรวจสอบก่อน

```bash
npx jest auth-helpers.test.js
```

### ขั้นตอนที่ 2.4 เขียน Integration Test สำหรับ Route Authentication ด้วย Supertest

สร้างไฟล์ `auth.test.js`

```javascript
const request = require("supertest");
const app = require("./app");

describe("POST /api/v1/auth/register", () => {
  test("ควรคืน 201 เมื่อข้อมูลถูกต้องและครบถ้วน", async () => {
    const uniqueEmail = `test${Date.now()}@example.com`;

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: uniqueEmail, password: "Passw0rd!" });

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty("id");
    expect(response.body.data.role).toBe("student");
  });

  test("ควรคืน 400 เมื่อไม่ระบุ password", async () => {
    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: "incomplete@example.com" });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("ควรคืน 409 เมื่อ email ซ้ำกับที่มีอยู่แล้ว", async () => {
    const duplicateEmail = `dup${Date.now()}@example.com`;

    await request(app)
      .post("/api/v1/auth/register")
      .send({ email: duplicateEmail, password: "Passw0rd!" });

    const response = await request(app)
      .post("/api/v1/auth/register")
      .send({ email: duplicateEmail, password: "Passw0rd!" });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("DUPLICATE_EMAIL");
  });
});

describe("POST /api/v1/auth/login", () => {
  test("ควรคืน 401 เมื่อ email ไม่มีอยู่ในระบบ", async () => {
    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "notfound@example.com", password: "Passw0rd!" });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
  });
});

describe("GET /api/v1/auth/me", () => {
  test("ควรคืน 401 เมื่อไม่แนบ Authorization header", async () => {
    const response = await request(app).get("/api/v1/auth/me");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("NO_TOKEN");
  });

  test("ควรคืน 200 พร้อมข้อมูลผู้ใช้เมื่อแนบ token ที่ถูกต้อง", async () => {
    const uniqueEmail = `me${Date.now()}@example.com`;

    await request(app)
      .post("/api/v1/auth/register")
      .send({ email: uniqueEmail, password: "Passw0rd!" });

    const loginResponse = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: uniqueEmail, password: "Passw0rd!" });

    const token = loginResponse.body.token;

    const response = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.email).toBe(uniqueEmail);
  });
});
```

**หมายเหตุสำคัญ**: test ชุดนี้ยังคงเรียกฐานข้อมูล MySQL จริงตามที่เชื่อมต่อไว้ตั้งแต่สัปดาห์ที่ 5 จึงใช้ `Date.now()` สร้าง email ที่ไม่ซ้ำกันทุกครั้งที่รัน เพื่อหลีกเลี่ยงปัญหา `UNIQUE constraint` วิธีนี้เป็นทางลัดที่ง่ายกว่าการเขียน `beforeAll`/`afterAll` ล้างข้อมูลตามตัวอย่างในหัวข้อ 3.4 ของ `wk09.md` และเพียงพอสำหรับแล็บนี้ที่เน้นให้เห็นภาพรวมของการเขียน Integration Test ก่อน ในโปรเจกต์จริงที่ต้องรัน test ซ้ำจำนวนมากหรือใน CI/CD ควรใช้แนวทาง `beforeAll`/`afterAll` ล้างข้อมูลอย่างเป็นระบบแทน เพื่อไม่ให้ตารางฐานข้อมูลสะสมข้อมูลทดสอบเพิ่มขึ้นอย่างต่อเนื่อง ส่วนการ mock ฐานข้อมูลอย่างสมบูรณ์ (ซึ่งตัดปัญหานี้ไปทั้งหมด) จะฝึกในขั้นตอนที่ 2.5

### ขั้นตอนที่ 2.5 เขียน Test ด้วย Mocking สำหรับ Route ที่เชื่อมต่อฐานข้อมูล

ตรวจสอบก่อนว่าไฟล์เชื่อมต่อฐานข้อมูลของโปรเจกต์ (สร้างในสัปดาห์ที่ 5) แยกออกมาเป็นไฟล์ต่างหาก เช่น `db.js` ที่ export `pool` ออกมา หากยังไม่ได้แยก ให้แยกออกมาก่อน เนื่องจาก Jest จำเป็นต้อง mock ทั้ง module

สร้างไฟล์ `login-mocked.test.js`

```javascript
jest.mock("./db");
const pool = require("./db");
const request = require("supertest");
const app = require("./app");
const { hashPassword } = require("./auth-helpers");

describe("POST /api/v1/auth/login (mocked database)", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("ควรคืน token เมื่อ email และ password ถูกต้อง", async () => {
    const hashedPassword = await hashPassword("Passw0rd!");

    pool.query.mockResolvedValueOnce([
      [
        {
          id: 1,
          email: "mocked@example.com",
          password_hash: hashedPassword,
          role: "student",
        },
      ],
    ]);

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "mocked@example.com", password: "Passw0rd!" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("token");
  });

  test("ควรคืน 401 เมื่อไม่พบผู้ใช้ในระบบ", async () => {
    pool.query.mockResolvedValueOnce([[]]);

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "notfound@example.com", password: "Passw0rd!" });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  test("ควรคืน 500 เมื่อฐานข้อมูลเกิดข้อผิดพลาด", async () => {
    pool.query.mockRejectedValueOnce(new Error("Connection lost"));

    const response = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "any@example.com", password: "Passw0rd!" });

    expect(response.status).toBe(500);
  });
});
```

สังเกตว่า test ชุดนี้รันได้โดย**ไม่ต้องเชื่อมต่อฐานข้อมูลจริง** เนื่องจาก `pool.query` ถูกแทนที่ด้วยฟังก์ชันจำลองที่ควบคุมผลลัพธ์ได้ตามต้องการ รวมถึงกรณีฐานข้อมูล error ที่จำลองได้ยากด้วยฐานข้อมูลจริง

### จุดตรวจสอบที่ 2

- โปรเจกต์แยก `app.js` และ `server.js` สำเร็จ และเซิร์ฟเวอร์ยังทำงานได้ปกติหลังแยกไฟล์
- ไฟล์ `auth-helpers.test.js` รันผ่านทุก test
- ไฟล์ `auth.test.js` รันผ่านทุก test โดยใช้ email ที่ไม่ซ้ำกันในแต่ละครั้ง
- ไฟล์ `login-mocked.test.js` รันผ่านทุก test โดยไม่ต้องเปิดการเชื่อมต่อฐานข้อมูลจริง

---

## ส่วนที่ 3: Run Suite และดู Coverage Report (90-120 นาที)

### ขั้นตอนที่ 3.1 รัน Test ทั้งหมด

```bash
npm test
```

ตรวจสอบว่าทุกไฟล์ `.test.js` รันผ่านโดยไม่มี test ใดล้มเหลว

```
PASS  ./auth-helpers.test.js
PASS  ./auth.test.js
PASS  ./login-mocked.test.js

Test Suites: 3 passed, 3 total
Tests:       11 passed, 11 total
```

### ขั้นตอนที่ 3.2 รันรายงาน Coverage

```bash
npm run test:coverage
```

บันทึกผลลัพธ์ตารางที่แสดงในเทอร์มินัล โดยเฉพาะคอลัมน์ `% Stmts`, `% Branch` และ `Uncovered Line #s`

### ขั้นตอนที่ 3.3 วิเคราะห์จุดที่ยังขาดการทดสอบ

จากรายงาน Coverage ในขั้นตอนที่ 3.2 ให้เลือกไฟล์ที่มี Coverage ต่ำที่สุด 1 ไฟล์ (เช่น `middlewares/auth.js` หากยังไม่มี test ครอบคลุมกรณี token ไม่ถูกต้องหรือ RBAC) แล้วเขียน test เพิ่มเติมอย่างน้อย 2 กรณีเพื่อเพิ่ม Coverage ของไฟล์นั้น เช่น

```javascript
// auth-middleware.test.js
const request = require("supertest");
const app = require("./app");

describe("RBAC middleware", () => {
  test("ควรคืน 403 เมื่อ role ไม่มีสิทธิ์เข้าถึง route", async () => {
    // ใช้ token ของ student ที่สร้างไว้จาก test ก่อนหน้า หรือ register + login ใหม่
    // เรียก DELETE /api/v1/students/:id ด้วย token role student
    // expect(response.status).toBe(403)
  });

  test("ควรคืน 401 เมื่อ token ผิดรูปแบบ (แก้ไขตัวอักษรบางส่วน)", async () => {
    const response = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer invalid.token.here");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("INVALID_TOKEN");
  });
});
```

รัน `npm run test:coverage` อีกครั้งเพื่อยืนยันว่าตัวเลข Coverage ของไฟล์ `middlewares/auth.js` เพิ่มขึ้น

### จุดตรวจสอบที่ 3

- `npm test` รันผ่านทุก test suite โดยไม่มี test ล้มเหลว
- มีรายงาน Coverage และระบุได้ว่าไฟล์ใดมี Coverage ต่ำที่สุดพร้อมเหตุผล
- เพิ่ม test อย่างน้อย 2 กรณีสำหรับไฟล์ที่ Coverage ต่ำที่สุด และยืนยันว่าตัวเลข Coverage เพิ่มขึ้นจริงหลังเพิ่ม test

---

## ส่วนต่อยอด: แบบฝึกหัดเพิ่มเติมด้วยตนเอง

### แบบฝึกหัดที่ 1: เขียน Test ครอบคลุม CRUD ของ Students

เขียนไฟล์ `students.test.js` ทดสอบ route `GET /api/v1/students`, `POST /api/v1/students`, `PUT /api/v1/students/:id` และ `DELETE /api/v1/students/:id` จากสัปดาห์ที่ 3-6 ให้ครบทั้งกรณีสำเร็จและกรณีข้อมูลผิดพลาด (เช่น ส่ง field ไม่ครบ, `id` ที่ไม่มีอยู่จริง)

### แบบฝึกหัดที่ 2: ทดสอบ Pagination และ Filtering

อ้างอิงเนื้อหา Pagination/Filtering/Sorting จาก `wk07.md` เขียน test ยืนยันว่า `GET /api/v1/students?page=2&limit=5` คืน `pagination.page === 2`, `pagination.limit === 5` และจำนวนรายการไม่เกิน 5 และ `pagination.totalPages` คำนวณถูกต้อง

> การเขียน test ให้ route ที่มี pagination เหล่านี้เป็นการเตรียมความพร้อมโดยตรงสำหรับสอบปฏิบัติ Testing/Validation (CLO4) ในสอบปลายภาค ซึ่งกำหนดให้เขียน test และดีบัก endpoint ที่มี pagination และ transaction (ดู `final-exam/final-exam.md` ส่วนที่ 2)

### แบบฝึกหัดที่ 3: Mock External Failure ด้วย `mockRejectedValueOnce`

เขียน test สำหรับ route ใดก็ได้ที่เชื่อมต่อฐานข้อมูล โดยจำลองสถานการณ์ที่ `pool.query` โยน error (เช่น connection timeout) แล้วยืนยันว่า API คืน Status Code `500` พร้อมรูปแบบ error message ที่สอดคล้องกับมาตรฐานที่กำหนดไว้ตั้งแต่สัปดาห์ที่ 4

### แบบฝึกหัดที่ 4: ตั้งเป้า Coverage และวิเคราะห์ผลลัพธ์

ตั้งเป้าหมาย Branch Coverage ให้ได้อย่างน้อย 70% สำหรับไฟล์ `app.js` ทั้งไฟล์ จากนั้นบันทึกว่าเพิ่ม test กี่กรณีจึงบรรลุเป้าหมาย และอธิบายว่าแต่ละ test ที่เพิ่มเข้าไปครอบคลุม branch ใดที่ขาดหายไป

### แบบฝึกหัดที่ 5: เปรียบเทียบเวลาการรันระหว่าง Test ที่ Mock กับ Test ที่ต่อฐานข้อมูลจริง

ใช้คำสั่ง `npx jest --verbose` เปรียบเทียบเวลาที่ใช้รันระหว่างไฟล์ `auth.test.js` (ต่อฐานข้อมูลจริง) กับ `login-mocked.test.js` (mock ฐานข้อมูล) บันทึกผลต่างของเวลาและอธิบายเหตุผลตามหลักการในหัวข้อ 4.4 ของ `wk09.md`

### เกณฑ์การประเมินแบบฝึกหัดต่อยอด (สำหรับนิสิตใช้ตรวจสอบตนเอง)

| รายการ         | ผ่านเกณฑ์เมื่อ                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------- |
| แบบฝึกหัดที่ 1 | มี test ครบทั้ง 4 route ของ CRUD students ทั้งกรณีสำเร็จและกรณีข้อมูลผิดพลาด และรันผ่านทั้งหมด     |
| แบบฝึกหัดที่ 2 | test ยืนยันจำนวนรายการต่อหน้าและ `totalPages` ถูกต้องตามข้อมูลจริงในฐานข้อมูลทดสอบ                 |
| แบบฝึกหัดที่ 3 | test จำลอง error จากฐานข้อมูลสำเร็จ และยืนยันได้ว่า API ตอบกลับ `500` พร้อมรูปแบบ error ที่ถูกต้อง |
| แบบฝึกหัดที่ 4 | Branch Coverage ของ `app.js` ถึง 70% ขึ้นไป พร้อมคำอธิบาย branch ที่แต่ละ test ครอบคลุม            |
| แบบฝึกหัดที่ 5 | มีบันทึกเวลาเปรียบเทียบและคำอธิบายเหตุผลของผลต่างที่สอดคล้องกับหลักการ Mocking                     |

หมายเหตุ: ชุดทดสอบอัตโนมัติที่สร้างในสัปดาห์นี้จะเป็นพื้นฐานสำคัญของสัปดาห์ที่ 10 (OpenAPI/Swagger & DX) ซึ่งจะใช้ Postman Collection ร่วมกับ Newman CLI รัน API test ในลักษณะที่ automated เช่นเดียวกัน และเป็นส่วนหนึ่งของโครงงานระยะ 2 (Docs/DX) ต่อไป

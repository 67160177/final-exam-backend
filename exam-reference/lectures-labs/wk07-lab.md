# ปฏิบัติการสัปดาห์ที่ 7: เพิ่ม Caching และออกแบบ API ให้ตอบสนองความต้องการของ Client

## วัตถุประสงค์ของปฏิบัติการ

เมื่อทำปฏิบัติการนี้เสร็จสิ้น นิสิตจะสามารถ

1. เพิ่มชั้น Caching ด้วย Redis พร้อมกำหนด TTL ให้กับ endpoint ที่มีการอ่านข้อมูลบ่อยได้
2. วัดผลเปรียบเทียบเวลาตอบสนอง (response time) ก่อนและหลังการทำแคชได้ด้วยตนเอง
3. Implement Middleware สำหรับ Pagination, Filtering และ Versioning ได้จริง
4. ทดสอบ endpoint ที่ปรับปรุงแล้วด้วย Postman ครบทุกฟีเจอร์

ปฏิบัติการนี้ต่อยอดจากเนื้อหาบรรยายในเอกสาร `wk07.md` และปรับปรุงโปรเจกต์ `student-api` ที่สร้างต่อเนื่องมาจากปฏิบัติการสัปดาห์ที่ 1-6 (`wk01-lab.md` ถึง `wk06-lab.md`)

ปฏิบัติการนี้ไม่มีคะแนน CLO5 โดยตรง โดย CLO5 วัดผลครั้งเดียวในสอบปฏิบัติ Caching/Performance ที่จัดรวมในคาบสอบกลางภาค สัปดาห์ที่ 8 (ดู `wk07-exam.md` และ `midterm-exam.md`) แต่ปฏิบัติการนี้เป็นการฝึกทักษะที่ข้อสอบส่วนนั้นจะวัด ส่วนใบงานส่งของสัปดาห์นี้ให้คะแนน CLO1 แบบผ่าน/ไม่ผ่าน (ดู `wk07-assignment.md`)

## เวลาที่ใช้

| ช่วงเวลา    | กิจกรรม                                                          |
| ----------- | ---------------------------------------------------------------- |
| 0-15 นาที   | ทบทวนเนื้อหาสัปดาห์ที่ 6 (Review W6)                             |
| 15-70 นาที  | เพิ่ม Cache Layer พร้อม TTL Management                           |
| 70-120 นาที | Implement Middleware สำหรับ Pagination, Filtering และ Versioning |

## เครื่องมือที่ต้องใช้

1. โปรเจกต์ `student-api` จากปฏิบัติการสัปดาห์ที่ 1-6
2. Redis Server (ติดตั้งในเครื่องหรือผ่าน Docker)
3. Node.js, npm และ Postman

---

## ส่วนที่ 1: ทบทวนเนื้อหาสัปดาห์ที่ 6 (0-15 นาที)

### ขั้นตอนที่ 1.1 ตรวจสอบโปรเจกต์เดิม

เปิดโฟลเดอร์ `student-api` และรันเซิร์ฟเวอร์เพื่อยืนยันว่าระบบ Authentication และ RBAC จากสัปดาห์ที่ 6 ยังทำงานถูกต้อง

```bash
cd student-api
npm run dev
```

### ขั้นตอนที่ 1.2 ทบทวนแนวคิดสำคัญ

ก่อนเริ่มปฏิบัติการ ให้ทบทวนหัวข้อต่อไปนี้จากเอกสารบรรยาย `wk07.md` ร่วมกัน

1. ข้อมูลลักษณะใดควรทำแคช และลักษณะใดไม่ควรทำแคช
2. In-memory Cache แตกต่างจาก Redis อย่างไร
3. เหตุใดชื่อคอลัมน์ที่ใช้ sort จึงต้องตรวจสอบด้วย allowlist

### จุดตรวจสอบที่ 1

- เซิร์ฟเวอร์และระบบ Authentication จากสัปดาห์ที่ 6 ยังทำงานได้ปกติ
- สามารถอธิบายความแตกต่างระหว่าง In-memory Cache กับ Redis ได้ก่อนเริ่มลงมือปฏิบัติ

---

## ส่วนที่ 2: เพิ่ม Cache Layer พร้อม TTL Management (15-70 นาที)

### ขั้นตอนที่ 2.1 ติดตั้งและเริ่ม Redis Server

หากยังไม่มี Redis Server ในเครื่อง สามารถใช้ Docker เพื่อรันได้อย่างรวดเร็ว

```bash
docker run -d --name redis-server -p 6379:6379 redis
```

### ขั้นตอนที่ 2.2 ติดตั้งไลบรารีและตั้งค่าการเชื่อมต่อ

```bash
npm install redis
```

เพิ่มค่าต่อไปนี้ในไฟล์ `.env`

```
REDIS_URL=redis://localhost:6379
```

สร้างไฟล์ `cache.js`

```javascript
const { createClient } = require("redis");

const redisClient = createClient({ url: process.env.REDIS_URL });

redisClient.on("error", (err) => console.error("Redis Client Error", err));

async function connectRedis() {
  await redisClient.connect();
  console.log("เชื่อมต่อ Redis สำเร็จ");
}

module.exports = { redisClient, connectRedis };
```

เรียกใช้ `connectRedis()` ในไฟล์ `index.js` ก่อน `app.listen`

```javascript
const { redisClient, connectRedis } = require("./cache");

connectRedis()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server กำลังทำงานที่พอร์ต ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("เชื่อมต่อ Redis ไม่สำเร็จ เซิร์ฟเวอร์จะไม่เริ่มทำงาน:", err);
    process.exit(1);
  });
```

### ขั้นตอนที่ 2.3 เพิ่ม Cache ให้กับ Endpoint ที่อ่านข้อมูลบ่อย

แก้ไข route `GET /api/v1/students` ให้ตรวจสอบแคชก่อน query ฐานข้อมูล

```javascript
app.get("/api/v1/students", async (req, res, next) => {
  const cacheKey = "students:all";

  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.status(200).json({
        message: "สำเร็จ (จาก cache)",
        data: JSON.parse(cached),
      });
    }

    const [rows] = await pool.query("SELECT * FROM students");
    await redisClient.set(cacheKey, JSON.stringify(rows), { EX: 60 });

    res.status(200).json({ message: "สำเร็จ (จากฐานข้อมูล)", data: rows });
  } catch (err) {
    next(err);
  }
});
```

### ขั้นตอนที่ 2.4 เพิ่มการล้าง Cache เมื่อข้อมูลเปลี่ยนแปลง

แก้ไข route `POST /api/v1/students` ให้ล้างแคชหลังเพิ่มข้อมูลสำเร็จ (โค้ดด้านล่างอาศัย `UNIQUE` constraint บนคอลัมน์ `email` ที่สร้างไว้ตั้งแต่ `wk05-lab.md`/`wk06-lab.md` จึงตรวจจับ `ER_DUP_ENTRY` เป็น 409 ได้ หาก schema ของนิสิตยังไม่มี ให้เพิ่ม `UNIQUE` ก่อน)

```javascript
app.post("/api/v1/students", async (req, res, next) => {
  // ... โค้ดเดิมสำหรับตรวจสอบและเพิ่มข้อมูล ...

  try {
    const [result] = await pool.query(
      "INSERT INTO students (name, major, email) VALUES (?, ?, ?)",
      [name, major, email],
    );

    await redisClient.del("students:all"); // ล้างแคชเนื่องจากข้อมูลเปลี่ยนแปลงแล้ว

    res.status(201).json({
      message: "เพิ่มข้อมูลสำเร็จ",
      data: { id: result.insertId, name, major, email },
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
```

### ขั้นตอนที่ 2.5 วัดผลเปรียบเทียบ Response Time ก่อนและหลังทำแคช

ใช้ Postman เรียก `GET /api/v1/students` 3 ครั้งติดต่อกัน และบันทึกเวลาที่แสดงในส่วน response time ของ Postman (มุมขวาล่างของหน้าต่างผลลัพธ์)

| ครั้งที่ | แหล่งข้อมูล            | เวลาตอบสนอง (ms) |
| -------- | ---------------------- | ---------------- |
| 1        | ฐานข้อมูล (cache miss) | (บันทึกค่าจริง)  |
| 2        | Cache (cache hit)      | (บันทึกค่าจริง)  |
| 3        | Cache (cache hit)      | (บันทึกค่าจริง)  |

สังเกตข้อความ `message` ใน response ว่าเป็น "จาก cache" หรือ "จากฐานข้อมูล" เพื่อยืนยันว่ากลไกทำงานถูกต้อง

### ขั้นตอนที่ 2.6 ตรวจสอบข้อมูลที่เก็บอยู่จริงใน Redis

นอกจากสังเกตจาก `message` ในผลลัพธ์แล้ว ควรเปิดดูข้อมูลใน Redis โดยตรงเพื่อยืนยันว่า key ถูกสร้างและมี TTL ถูกต้อง ใช้เครื่องมือ `redis-cli` ที่มากับ Redis Server

**กรณีรัน Redis ผ่าน Docker** ให้เข้าถึง `redis-cli` ภายใน container (แทน `redis-server` ด้วยชื่อ container จริงหากตั้งชื่ออื่นตอน `docker run`)

```bash
docker exec -it redis-server redis-cli
```

**กรณีติดตั้ง Redis ลงเครื่องโดยตรง** ใช้คำสั่ง

```bash
redis-cli
```

เมื่อเข้าสู่ prompt ของ `redis-cli` (`127.0.0.1:6379>`) ให้ทดลองคำสั่งต่อไปนี้

```
KEYS *                 # แสดง key ทั้งหมด (ใช้ในงานทดสอบเท่านั้น ไม่ควรใช้บน production)
GET students:all       # ดูค่า (เป็นสตริง JSON ที่ serialize ไว้)
TTL students:all       # ดูเวลาที่เหลือก่อน key หมดอายุ (วินาที) ควรได้ค่า <= 60
TYPE students:all      # ดูชนิดข้อมูลของ key (ในที่นี้เป็น string)
DEL students:all       # ลบ key ทิ้งด้วยตนเอง เพื่อบังคับให้คำขอถัดไปเป็น cache miss
DBSIZE                 # จำนวน key ทั้งหมดในฐานข้อมูลปัจจุบัน
FLUSHALL               # ล้างข้อมูลทั้งหมด (ระวัง ใช้เฉพาะตอนทดสอบ)
```

หรือรันคำสั่งเดียวจบโดยไม่เข้า prompt

```bash
docker exec -it redis-server redis-cli TTL students:all
```

ทดลองตามลำดับต่อไปนี้เพื่อสังเกตวงจรชีวิตของ cache

1. เรียก `GET /api/v1/students` หนึ่งครั้ง จากนั้น `KEYS *` ต้องเห็น key ปรากฏขึ้น
2. รัน `TTL students:all` ซ้ำหลาย ๆ ครั้ง ห่างกันไม่กี่วินาที สังเกตว่าค่าลดลงเรื่อย ๆ
3. รอจน TTL หมด (หรือใช้ `DEL students:all`) แล้วเรียก `GET /api/v1/students` อีกครั้ง สังเกตว่า `message` กลับเป็น "จากฐานข้อมูล" และ key ถูกสร้างใหม่พร้อม TTL เต็ม

> **หมายเหตุ**: หากทำแบบฝึกหัดต่อยอดข้อ 2 (cache key ที่รวมพารามิเตอร์) แล้ว key จะไม่ใช่ `students:all` แต่จะเป็นรูปแบบเช่น `students:list:page=1:limit=10:...` ให้ใช้ `KEYS students:*` หรือ `KEYS *` เพื่อดูรายชื่อ key ที่เกิดขึ้นจริงก่อน แล้วจึง `GET` / `TTL` ตามชื่อนั้น

#### ข้อสังเกต: `redis-cli` แสดงภาษาไทยเป็น `\xHH`

เมื่อรัน `GET` กับค่าที่มีภาษาไทย `redis-cli` จะแสดงผลออกมาเป็นลำดับไบต์แบบ escape เช่น

```
"[{\"id\":1,\"course_name\":\"\xe0\xb8\x81\xe0\xb8\xb2\xe0\xb8\xa3..."
```

นี่เป็นพฤติกรรมปกติ **ข้อมูลใน Redis ไม่ได้เสียหาย** — ค่า `\xe0\xb8\x81` คือลำดับไบต์ UTF-8 ของอักษร "ก" (ภาษาไทย 1 ตัวอักษรใช้ 3 ไบต์ใน UTF-8) `redis-cli` ในโหมด interactive จะ escape ไบต์ที่ไม่ใช่ ASCII เสมอเพื่อให้แสดงผลได้ปลอดภัยบนทุก terminal ต่างจากโปรแกรม GUI อย่าง phpMyAdmin ที่ decode UTF-8 ให้เห็นเป็นภาษาไทยโดยตรง

วิธีดูค่าให้อ่านออกเป็นภาษาไทย

```bash
# ส่งผลลัพธ์ผ่าน pipe (redis-cli จะไม่ escape เมื่อปลายทางไม่ใช่ terminal)
docker exec redis-server redis-cli --raw GET courses:all | cat
```

หรือดึงค่าผ่าน Node.js แล้ว parse JSON

```bash
node -e "require('dotenv').config(); const {createClient}=require('redis'); const c=createClient({url:process.env.REDIS_URL}); c.connect().then(()=>c.get('courses:all')).then(v=>{console.log(JSON.parse(v)); return c.quit()});"
```

สรุป: ข้อมูลที่เห็นใน phpMyAdmin กับใน Redis เป็นข้อมูลชุดเดียวกันและถูกต้องทั้งคู่ ต่างกันแค่วิธีที่เครื่องมือแต่ละตัวเลือกแสดงผล

### จุดตรวจสอบที่ 2

- เชื่อมต่อ Redis สำเร็จ เห็นข้อความ "เชื่อมต่อ Redis สำเร็จ" ใน Terminal
- เรียก `GET /api/v1/students` ครั้งแรกได้ข้อมูลจากฐานข้อมูล และครั้งถัดไปได้จาก cache
- เพิ่มข้อมูลใหม่ด้วย `POST /api/v1/students` แล้วเรียก `GET /api/v1/students` อีกครั้ง ยืนยันว่าเห็นข้อมูลใหม่ทันที (แคชถูกล้างสำเร็จ)
- ใช้ `redis-cli` ตรวจสอบได้ว่า key ของ cache ถูกสร้างขึ้นจริง มี TTL ที่ลดลงตามเวลา และถูกลบเมื่อเรียก `POST` (ขั้นตอนที่ 2.6)
- มีตารางบันทึกเวลาตอบสนองเปรียบเทียบระหว่าง cache hit และ cache miss

---

## ส่วนที่ 3: Implement Middleware สำหรับ Pagination, Filtering และ Versioning (70-120 นาที)

### ขั้นตอนที่ 3.1 สร้าง Middleware สำหรับ Pagination และ Filtering

สร้างไฟล์ `middlewares/query-parser.js`

```javascript
function parsePagination(req, res, next) {
  req.pagination = {
    page: Math.max(1, parseInt(req.query.page) || 1),
    limit: Math.min(100, parseInt(req.query.limit) || 10),
  };
  req.pagination.offset = (req.pagination.page - 1) * req.pagination.limit;
  next();
}

// "id" เป็นค่า default จึงต้องอยู่ใน allowlist ด้วย เพื่อให้ผู้ใช้ระบุ sort=id ได้โดยตรง
// และเพื่อไม่ให้การตรวจสอบ field ซ้ำในภายหลังปฏิเสธค่า default
const ALLOWED_SORT_FIELDS = ["id", "name", "major", "created_at"];

function parseSort(req, res, next) {
  req.sort = {
    field: ALLOWED_SORT_FIELDS.includes(req.query.sort) ? req.query.sort : "id",
    order: req.query.order === "desc" ? "DESC" : "ASC",
  };
  next();
}

module.exports = { parsePagination, parseSort };
```

### ขั้นตอนที่ 3.2 ปรับปรุง Route ให้ใช้ Middleware และรองรับ Filtering

> **ข้อควรระวัง**: route `GET /api/v1/students` ด้านล่างนี้**แทนที่ทั้งก้อน**ของ route เดิมจากขั้นตอนที่ 2.3 (ที่มีการตรวจสอบ cache) — cache ของ route นี้ถูกลบออกไปก่อนชั่วคราว เพราะ cache key แบบเดิม (`"students:all"`) ไม่รองรับพารามิเตอร์ pagination/filtering/sorting ที่เพิ่มเข้ามาใหม่ (ถ้าใช้ key เดิม คำค้นหาต่างเงื่อนไขกันจะได้ผลลัพธ์จากแคชเดียวกันปนกันมาซึ่งผิด) การออกแบบ cache key ให้รองรับพารามิเตอร์เหล่านี้เป็นแบบฝึกหัดต่อยอดข้อ 2 ท้ายเอกสารนี้ ส่วนบรรทัด `redisClient.del("students:all")` ใน `POST` (ขั้นตอนที่ 2.4) ให้คงไว้ก่อน — เมื่อทำแบบฝึกหัดต่อยอดข้อ 2 จะปรับให้สอดคล้องกับ key แบบใหม่

```javascript
const { parsePagination, parseSort } = require("./middlewares/query-parser");

app.get(
  "/api/v1/students",
  parsePagination,
  parseSort,
  async (req, res, next) => {
    const { major } = req.query;
    const { page, limit, offset } = req.pagination;
    const { field, order } = req.sort;

    let baseQuery = "SELECT * FROM students";
    let countQuery = "SELECT COUNT(*) AS total FROM students";
    const params = [];

    if (major) {
      baseQuery += " WHERE major = ?";
      countQuery += " WHERE major = ?";
      params.push(major);
    }

    // แทรก field/order ลง SQL ได้โดยตรงเฉพาะเพราะผ่าน allowlist ใน parseSort มาแล้ว
    // ห้ามนำรูปแบบนี้ไปใช้กับค่าจาก req อื่นที่ไม่ได้ผ่าน allowlist
    baseQuery += ` ORDER BY ${field} ${order} LIMIT ? OFFSET ?`;

    try {
      const [rows] = await pool.query(baseQuery, [...params, limit, offset]);
      const [[{ total }]] = await pool.query(countQuery, params);

      res.status(200).json({
        message: "สำเร็จ",
        data: rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      next(err);
    }
  },
);
```

ทดสอบเบื้องต้นก่อนดำเนินการต่อ

```bash
curl "http://localhost:3000/api/v1/students?page=1&limit=2&sort=name&order=desc"
```

**ให้สังเกต**: ต้องได้ status `200` พร้อม `data` 2 รายการและ `pagination.totalPages` หากได้ error ให้แก้ไขก่อนเข้าขั้นตอนที่ 3.3 (การย้ายโค้ดเข้า Router ในขั้นตอนถัดไปจะสับสนมากขึ้นหากโค้ดพื้นฐานยังไม่ทำงานถูกต้องก่อน)

### ขั้นตอนที่ 3.3 สร้าง Router เวอร์ชัน v1 และทดลองออกแบบ v2

จัดกลุ่ม route ทั้งหมดที่มีอยู่เข้าไปใน `v1Router` หากยังไม่เคยทำมาก่อน ย้าย route handler ทั้งก้อนจากขั้นตอนที่ 3.2 มาไว้ใน `v1Router` โดยตรง **ตัดคำนำหน้า `/api/v1` ออกจาก path** เพราะ `app.use("/api/v1", v1Router)` ท้ายไฟล์จะเติมคำนำหน้านี้ให้เองอัตโนมัติกับทุก route ที่ประกาศไว้ใน `v1Router` (path เดิม `/api/v1/students` จึงกลายเป็น `/students` เมื่ออยู่ใน router)

```javascript
const v1Router = express.Router();

v1Router.get(
  "/students",
  parsePagination,
  parseSort,
  async (req, res, next) => {
    const { major } = req.query;
    const { page, limit, offset } = req.pagination;
    const { field, order } = req.sort;

    let baseQuery = "SELECT * FROM students";
    let countQuery = "SELECT COUNT(*) AS total FROM students";
    const params = [];

    if (major) {
      baseQuery += " WHERE major = ?";
      countQuery += " WHERE major = ?";
      params.push(major);
    }

    // แทรก field/order ลง SQL ได้โดยตรงเฉพาะเพราะผ่าน allowlist ใน parseSort มาแล้ว
    // ห้ามนำรูปแบบนี้ไปใช้กับค่าจาก req อื่นที่ไม่ได้ผ่าน allowlist
    baseQuery += ` ORDER BY ${field} ${order} LIMIT ? OFFSET ?`;

    try {
      const [rows] = await pool.query(baseQuery, [...params, limit, offset]);
      const [[{ total }]] = await pool.query(countQuery, params);

      res.status(200).json({
        message: "สำเร็จ",
        data: rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// ... route อื่น ๆ ทั้งหมดของ v1 (register, login, courses ฯลฯ) ย้ายมาไว้ที่นี่ในลักษณะเดียวกัน ...

app.use("/api/v1", v1Router);
```

> **ข้อควรระวัง**: หลังย้ายเข้า `v1Router` แล้ว ต้อง**ลบ** route เดิมที่ยังประกาศตรงบน `app` (เช่น `app.get("/api/v1/students", ...)` จากขั้นตอนที่ 3.2) ออกด้วย มิฉะนั้นจะมี route ซ้ำสองชุดที่ path เดียวกัน ซึ่ง Express จะใช้ตัวที่ประกาศไว้ก่อนเสมอ ทำให้แก้ไข `v1Router` แล้วดูเหมือนไม่มีผลใด ๆ

ทดลองสร้าง `v2Router` ที่มี endpoint เดียวกันแต่ปรับรูปแบบผลลัพธ์ให้ต่างจากเดิม เพื่อฝึกฝนแนวคิด Versioning

> **ข้อควรระวัง**: `v2Router` ด้านล่างเป็น skeleton เพื่อสาธิตการแยกเวอร์ชันเท่านั้น จึงยังไม่มี pagination และ auth เหมือน v1 ในระบบจริงต้องใส่มาตรการเดียวกับ v1 ให้ครบ ห้ามปล่อย endpoint ที่คืนทั้งตาราง

```javascript
const v2Router = express.Router();

v2Router.get("/students", async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM students");
    // v2 ปรับโครงสร้างผลลัพธ์ใหม่ ไม่มี wrapper "message" เหมือน v1
    res.status(200).json({ items: rows, count: rows.length });
  } catch (err) {
    next(err);
  }
});

app.use("/api/v2", v2Router);
```

### ขั้นตอนที่ 3.4 ทดสอบทุกฟีเจอร์ด้วย Postman

ทดสอบตามรายการต่อไปนี้

| กรณีทดสอบ                        | คำขอ                                                                              | ผลลัพธ์ที่คาดหวัง                                           |
| -------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Pagination พื้นฐาน               | `GET /api/v1/students?page=1&limit=2`                                             | ได้ข้อมูล 2 รายการแรก พร้อม `pagination.totalPages`         |
| Filtering                        | `GET /api/v1/students?major=วิทยาการคอมพิวเตอร์`                                  | ได้เฉพาะนิสิตสาขาที่ระบุ                                    |
| Sorting                          | `GET /api/v1/students?sort=name&order=desc`                                       | ข้อมูลเรียงตามชื่อจาก ก-ฮ ย้อนกลับ                          |
| รวมทุกฟีเจอร์                    | `GET /api/v1/students?page=1&limit=5&major=เทคโนโลยีสารสนเทศ&sort=name&order=asc` | ผลลัพธ์ถูกกรอง เรียงลำดับ และแบ่งหน้าถูกต้องพร้อมกัน        |
| Sort ด้วยฟิลด์ที่ไม่ได้รับอนุญาต | `GET /api/v1/students?sort=id;DROP TABLE students--`                              | ระบบใช้ค่า default (`id`) แทน ไม่เกิดข้อผิดพลาดหรือช่องโหว่ |
| เปรียบเทียบเวอร์ชัน              | `GET /api/v1/students` เทียบกับ `GET /api/v2/students`                            | โครงสร้าง response แตกต่างกันตามที่ออกแบบไว้                |

### จุดตรวจสอบที่ 3

- ทดสอบครบทั้ง 6 กรณีในตารางข้างต้น และได้ผลลัพธ์ถูกต้องตามที่คาดหวัง
- ยืนยันว่าการส่ง `sort` ด้วยค่าที่ไม่ได้รับอนุญาต (รวมถึงสตริงที่พยายามแทรกคำสั่ง SQL) ไม่ทำให้เกิดข้อผิดพลาดหรือรัน SQL ที่ไม่ปลอดภัย
- `/api/v1/students` และ `/api/v2/students` ทำงานแยกจากกันได้อย่างถูกต้องตามที่ออกแบบ

---

## ส่วนต่อยอด: แบบฝึกหัดเพิ่มเติมด้วยตนเอง

### แบบฝึกหัดที่ 1: เพิ่ม Cache ให้กับ Endpoint รายวิชา

Implement caching สำหรับ `GET /api/v1/courses` ในลักษณะเดียวกับ `GET /api/v1/students` ในขั้นตอนที่ 2.3 (ตรวจสอบแคชก่อน หากไม่พบให้ query ฐานข้อมูลแล้วเก็บผลลัพธ์ลงแคช) พร้อมกำหนด TTL ที่เหมาะสม (พิจารณาว่ารายวิชาเปลี่ยนแปลงไม่บ่อยเท่านิสิต จึงอาจตั้ง TTL ยาวกว่าได้) ใช้ `message` แยกแหล่งข้อมูลแบบเดียวกับขั้นตอนที่ 2.3 คือ `"สำเร็จ (จาก cache)"` และ `"สำเร็จ (จากฐานข้อมูล)"` เพื่อให้ตรวจสอบผลลัพธ์ได้ตรงตามเกณฑ์ด้านล่าง

### แบบฝึกหัดที่ 2: ออกแบบ Cache Key ที่รวมพารามิเตอร์การค้นหา

ปรับปรุง cache key ของ `GET /api/v1/students` ให้รวมค่าพารามิเตอร์ pagination, filtering และ sorting ทั้งหมด เช่น `students:page=1:limit=10:major=CS:sort=name:order=asc` เพื่อให้แต่ละชุดเงื่อนไขมีแคชของตัวเองแยกกัน ทดสอบว่าการค้นหาด้วยเงื่อนไขต่างกันไม่ได้ผลลัพธ์จากแคชของเงื่อนไขอื่นมาปะปน

### แบบฝึกหัดที่ 3: เพิ่ม Middleware ตรวจสอบ Header Deprecation

เพิ่ม middleware ให้กับ `v1Router` ที่แนบ Header `Deprecation` (ค่าเป็น Unix timestamp นำหน้าด้วย `@` ตาม RFC 9745 เช่น `@1735689600` ไม่ใช่ `true`) และ `Link: </api/v2/students>; rel="successor-version"` ในทุก response เพื่อแจ้งเตือน client ว่าเวอร์ชันนี้กำลังจะถูกเลิกใช้ในอนาคตและควรย้ายไปใช้ v2 แทน

### เกณฑ์การประเมินแบบฝึกหัดต่อยอด (สำหรับนิสิตใช้ตรวจสอบตนเอง)

| รายการ         | ผ่านเกณฑ์เมื่อ                                                           |
| -------------- | ------------------------------------------------------------------------ |
| แบบฝึกหัดที่ 1 | เรียก `GET /api/v1/courses` ครั้งแรกได้ `message: "สำเร็จ (จากฐานข้อมูล)"` ครั้งที่ 2 เป็นต้นไปได้ `message: "สำเร็จ (จาก cache)"` |
| แบบฝึกหัดที่ 2 | ค้นหาด้วยเงื่อนไขต่างกัน 2 ชุด แล้วได้ผลลัพธ์ถูกต้องแยกจากกัน ไม่ปะปนกัน |
| แบบฝึกหัดที่ 3 | Response จาก `/api/v1/*` มี Header `Deprecation` (ค่าเป็น `@<timestamp>`) และ `Link` ปรากฏครบถ้วน ส่วน `/api/v2/*` ไม่มี |

หมายเหตุ: แบบฝึกหัดต่อยอดนี้เป็นการเตรียมความพร้อมสำหรับสัปดาห์ที่ 9 (Unit & Integration Testing) ซึ่งจะเขียนชุดทดสอบอัตโนมัติให้กับ route ที่มีการทำ caching และ pagination เหล่านี้ เพื่อยืนยันว่าโค้ดทำงานถูกต้องโดยไม่ต้องทดสอบผ่าน Postman ด้วยมือทุกครั้ง

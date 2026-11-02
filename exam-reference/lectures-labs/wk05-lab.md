# ปฏิบัติการสัปดาห์ที่ 5: เชื่อมต่อ MySQL และย้ายข้อมูลจาก In-Memory สู่ฐานข้อมูลจริง

## วัตถุประสงค์ของปฏิบัติการ

เมื่อทำปฏิบัติการนี้เสร็จสิ้น นิสิตจะสามารถ

1. ติดตั้งและตั้งค่า MySQL พร้อมสร้างฐานข้อมูลสำหรับโปรเจกต์ได้
2. เชื่อมต่อ Express เข้ากับ MySQL ผ่าน Connection Pool และแทนที่ข้อมูลจำลองในหน่วยความจำด้วยข้อมูลจริงในฐานข้อมูลได้
3. ทดสอบ Query พื้นฐานและตรวจสอบความถูกต้องของ constraint ต่าง ๆ ในฐานข้อมูลได้
4. ทดสอบกลไก Transaction และ Rollback เพื่อยืนยันว่าข้อมูลจะไม่เสียหายเมื่อเกิดข้อผิดพลาดระหว่างการดำเนินการ

ปฏิบัติการนี้ต่อยอดจากเนื้อหาบรรยายในเอกสาร `wk05.md` และปรับปรุงโปรเจกต์ `student-api` ที่สร้างต่อเนื่องมาจากปฏิบัติการสัปดาห์ที่ 1-4 (`wk01-lab.md` ถึง `wk04-lab.md`) เป็นส่วนหนึ่งของการประเมินผล CLO8 (โครงงานระยะ 1 DB/Requirement) ตามที่กำหนดไว้ใน `course_plan.md`

## เวลาที่ใช้

| ช่วงเวลา    | กิจกรรม                                               |
| ----------- | ----------------------------------------------------- |
| 0-15 นาที   | ทบทวนเนื้อหาสัปดาห์ที่ 4 (Review W4)                  |
| 15-90 นาที  | เชื่อมต่อ MySQL, สร้าง Table + Seed Data, ทดสอบ Query |
| 90-120 นาที | ตรวจสอบ Integrity และทดสอบ Rollback                   |

## เครื่องมือที่ต้องใช้

1. โปรเจกต์ `student-api` จากปฏิบัติการสัปดาห์ที่ 1-4
2. MySQL Server (ติดตั้งในเครื่องหรือผ่าน Docker)
3. โปรแกรมจัดการฐานข้อมูล เช่น MySQL Workbench หรือ DBeaver (ทางเลือก)
4. Node.js, npm และ Postman

---

## ส่วนที่ 1: ทบทวนเนื้อหาสัปดาห์ที่ 4 (0-15 นาที)

### ขั้นตอนที่ 1.1 ตรวจสอบโปรเจกต์เดิม

เปิดโฟลเดอร์ `student-api` และรันเซิร์ฟเวอร์เพื่อยืนยันว่า middleware ด้านความปลอดภัย (Helmet, CORS, Logger) จากสัปดาห์ที่ 4 ยังทำงานถูกต้อง

```bash
cd student-api
npm run dev
```

### ขั้นตอนที่ 1.2 ทบทวนแนวคิดสำคัญ

ก่อนเริ่มปฏิบัติการ ให้ทบทวนหัวข้อต่อไปนี้จากเอกสารบรรยาย `wk05.md` ร่วมกัน

1. Connection Pool คืออะไร และแตกต่างจากการเปิดการเชื่อมต่อใหม่ทุกครั้งอย่างไร
2. Parameterized Query ป้องกัน SQL Injection ได้อย่างไร
3. คุณสมบัติ ACID ของ Transaction มีอะไรบ้าง

### จุดตรวจสอบที่ 1

- เซิร์ฟเวอร์และ middleware จากสัปดาห์ที่ 4 ยังทำงานได้ปกติ
- สามารถอธิบายความแตกต่างระหว่าง Query ปกติกับ Parameterized Query ได้ก่อนเริ่มลงมือปฏิบัติ

---

## ส่วนที่ 2: เชื่อมต่อ MySQL, สร้าง Table + Seed Data, ทดสอบ Query (15-90 นาที)

### ขั้นตอนที่ 2.1 ติดตั้งและตรวจสอบ MySQL

เลือกวิธีติดตั้งวิธีใดวิธีหนึ่งต่อไปนี้ตามความสะดวกของเครื่องที่ใช้งาน

**ทางเลือกที่ 1: ติดตั้งแบบเต็มลงเครื่อง (Native Install)**

ดาวน์โหลดและติดตั้ง MySQL Community Server ตามระบบปฏิบัติการ

- Windows/Mac: ดาวน์โหลด MySQL Installer จาก https://dev.mysql.com/downloads/installer/ แล้วติดตั้งตามค่าเริ่มต้น (ตั้งรหัสผ่านของผู้ใช้ `root` ระหว่างการติดตั้ง จดไว้ให้ดี)
- Linux (Ubuntu/Debian):

```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

**ทางเลือกที่ 2: รันผ่าน Docker**

เหมาะสำหรับผู้ที่ไม่ต้องการติดตั้ง MySQL ลงเครื่องโดยตรง หรือต้องการล้างข้อมูลทดสอบได้ง่ายด้วยการลบ container ทิ้ง (สอดคล้องกับแนวทาง Docker ที่กล่าวถึงใน `backend-api-workflow.md`)

```bash
docker run --name mysql-student-api \
  -e MYSQL_ROOT_PASSWORD=your_password \
  -p 3306:3306 \
  -d mysql:8.0
```

ตรวจสอบว่า container ทำงานอยู่

```bash
docker ps
```

**หมายเหตุ**: หากหยุดเครื่องหรือรีสตาร์ต Docker ให้สั่ง `docker start mysql-student-api` เพื่อรัน container เดิมกลับมาอีกครั้ง (ข้อมูลใน container ยังอยู่ครบ ไม่ต้องสร้างใหม่) ไม่ว่าเลือกวิธีติดตั้งแบบใด เมื่อ MySQL Server ทำงานแล้ว ให้ตรวจสอบว่าสามารถเข้าสู่ระบบผ่าน command line ได้

```bash
mysql -u root -p
```

### ขั้นตอนที่ 2.2 สร้างฐานข้อมูลและตาราง

สร้างไฟล์ `schema.sql` ในโฟลเดอร์โปรเจกต์เพื่อเก็บคำสั่งสร้างโครงสร้างฐานข้อมูล

```sql
CREATE DATABASE IF NOT EXISTS student_api;
USE student_api;

CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  major VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_name VARCHAR(150) NOT NULL,
  credit INT NOT NULL,
  seat_available INT NOT NULL DEFAULT 30
);

CREATE TABLE enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE KEY unique_enrollment (student_id, course_id)
);
```

รันไฟล์นี้เพื่อสร้างฐานข้อมูลจริง

```bash
mysql -u root -p < schema.sql
```

### ขั้นตอนที่ 2.3 เพิ่มข้อมูลตั้งต้น (Seed Data)

สร้างไฟล์ `seed.sql` เพื่อเพิ่มข้อมูลตัวอย่างสำหรับทดสอบ

```sql
USE student_api;

INSERT INTO students (name, major, email) VALUES
  ('สมชาย ใจดี', 'วิทยาการคอมพิวเตอร์', 'somchai@example.com'),
  ('สมหญิง รักเรียน', 'เทคโนโลยีสารสนเทศ', 'somying@example.com');

INSERT INTO courses (course_name, credit, seat_available) VALUES
  ('การเขียนโปรแกรมเบื้องต้น', 3, 30),
  ('โครงสร้างข้อมูล', 3, 25);

INSERT INTO enrollments (student_id, course_id) VALUES
  (1, 1),
  (1, 2),
  (2, 2);
```

```bash
mysql -u root -p < seed.sql
```

### ขั้นตอนที่ 2.4 ติดตั้งไลบรารีและสร้างไฟล์เชื่อมต่อฐานข้อมูล

```bash
npm install mysql2
```

เพิ่มค่าการเชื่อมต่อในไฟล์ `.env`

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=student_api
```

> ⚠️ **ข้อควรระวัง**: หากใช้ `nodemon` รันเซิร์ฟเวอร์ (ต่อเนื่องมาจากสัปดาห์ที่ 1-4) ต้องทราบว่า nodemon เฝ้าดูการเปลี่ยนแปลงเฉพาะไฟล์โค้ด (`.js`) ตามค่าเริ่มต้น **ไม่เฝ้าดูไฟล์ `.env`** เมื่อแก้ค่าใน `.env` ภายหลัง (เช่น เปลี่ยนรหัสผ่านฐานข้อมูล) ต้อง `Ctrl+C` แล้วรัน `npm run dev` ใหม่เองเสมอ มิฉะนั้นแอปพลิเคชันจะยังใช้ค่าเดิมที่โหลดไว้ตอนเริ่มต้น

สร้างไฟล์ `db.js`

```javascript
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
```

### ขั้นตอนที่ 2.5 แทนที่ Route เดิมด้วยการ Query ฐานข้อมูลจริง

แก้ไขไฟล์ `index.js` ให้เชื่อมต่อ `db.js` และแทนที่ route ที่เคยใช้ตัวแปร `students` แบบ in-memory ด้วยการ query จริง

```javascript
const pool = require("./db");

app.get("/api/v1/students", async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM students");
    res.status(200).json({ message: "สำเร็จ", data: rows });
  } catch (err) {
    next(err);
  }
});

app.get("/api/v1/students/:id", async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM students WHERE id = ?", [
      req.params.id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "ไม่พบข้อมูลนิสิต" },
      });
    }

    res.status(200).json({ message: "สำเร็จ", data: rows[0] });
  } catch (err) {
    next(err);
  }
});

app.post("/api/v1/students", async (req, res, next) => {
  const { name, major, email } = req.body;

  if (!name || !major || !email) {
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "กรุณาระบุข้อมูลให้ครบถ้วน" },
    });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO students (name, major, email) VALUES (?, ?, ?)",
      [name, major, email],
    );
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

หมายเหตุ: ลบตัวแปร `let students = [...]` และ `let nextId = ...` แบบ in-memory ออกจากไฟล์ `index.js` เนื่องจากไม่จำเป็นอีกต่อไป

### ขั้นตอนที่ 2.6 ทดสอบ Query ด้วย Postman

ทดสอบตามลำดับต่อไปนี้เพื่อยืนยันว่าเชื่อมต่อฐานข้อมูลจริงสำเร็จ

1. `GET /api/v1/students` ควรได้รายชื่อนิสิต 2 คนตามข้อมูลใน `seed.sql`
2. `GET /api/v1/students/1` ควรได้ข้อมูลของ "สมชาย ใจดี"
3. `POST /api/v1/students` ด้วยข้อมูลใหม่ ควรได้ Status Code `201` และตรวจสอบด้วย MySQL Workbench หรือคำสั่ง `SELECT * FROM students;` ว่าข้อมูลถูกบันทึกจริง
4. `POST /api/v1/students` ซ้ำด้วยอีเมลเดิม ควรได้ Status Code `409`

### จุดตรวจสอบที่ 2

- สร้างฐานข้อมูลและตารางทั้ง 3 ตารางสำเร็จ ตรวจสอบด้วยคำสั่ง `SHOW TABLES;`
- ข้อมูลตั้งต้นจาก `seed.sql` ถูกเพิ่มเข้าไปครบถ้วน
- API ทั้ง 4 กรณีในขั้นตอนที่ 2.6 ทำงานถูกต้องและข้อมูลถูกบันทึกลงฐานข้อมูลจริง ไม่ใช่ในหน่วยความจำอีกต่อไป

---

## ส่วนที่ 3: ตรวจสอบ Integrity และทดสอบ Rollback (90-120 นาที)

### ขั้นตอนที่ 3.1 ทดสอบ Foreign Key Constraint

ทดลองรันคำสั่งต่อไปนี้ผ่าน MySQL command line เพื่อยืนยันว่า Foreign Key ทำงานถูกต้อง

```sql
-- ควรเกิดข้อผิดพลาด เนื่องจาก course_id 999 ไม่มีอยู่จริง
INSERT INTO enrollments (student_id, course_id) VALUES (1, 999);
```

บันทึกข้อความ error ที่ได้รับ และอธิบายว่าเหตุใดฐานข้อมูลจึงปฏิเสธคำสั่งนี้

### ขั้นตอนที่ 3.2 ทดสอบ Cascade Delete

```sql
-- ตรวจสอบจำนวนระเบียนใน enrollments ของนิสิตรหัส 2 ก่อนลบ
SELECT * FROM enrollments WHERE student_id = 2;

-- ลบนิสิตรหัส 2
DELETE FROM students WHERE id = 2;

-- ตรวจสอบอีกครั้งว่าระเบียนใน enrollments ที่เกี่ยวข้องถูกลบไปด้วยหรือไม่
SELECT * FROM enrollments WHERE student_id = 2;
```

สังเกตผลลัพธ์ว่าระเบียนใน `enrollments` ที่เกี่ยวข้องกับนิสิตรหัส 2 หายไปโดยอัตโนมัติ เนื่องจากกำหนด `ON DELETE CASCADE` ไว้ตอนสร้างตาราง

> 💡 **Tip**: ขั้นตอนนี้ตั้งใจลบนิสิตรหัส 2 (สมหญิง) แบบถาวร **ไม่ต้องเพิ่มกลับ** เพราะขั้นตอนที่เหลือในปฏิบัติการนี้ทดสอบด้วย `student_id = 1` เท่านั้น หากต้องการเพิ่มนิสิตคนนี้กลับในภายหลัง ให้ระวังว่าคอลัมน์ `id` เป็น `AUTO_INCREMENT` — การ `INSERT` แบบปกติจะได้ `id` ใหม่ (ไม่ใช่ `2` เหมือนเดิม) ต้องระบุ `id` โดยตรงในคำสั่ง `INSERT INTO students (id, name, major, email) VALUES (...)` หากต้องการให้ `id` ตรงกับเดิม

### ขั้นตอนที่ 3.3 Implement Route ลงทะเบียนเรียนด้วย Transaction

เพิ่ม route ใหม่ในไฟล์ `index.js` เพื่อจำลองการลงทะเบียนเรียนที่ต้องตรวจสอบที่นั่งว่างก่อนอนุญาตให้ลงทะเบียน

```javascript
app.post("/api/v1/students/:id/enrollments", async (req, res, next) => {
  const studentId = req.params.id;
  const { courseId } = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [courseRows] = await connection.query(
      "SELECT * FROM courses WHERE id = ? FOR UPDATE",
      [courseId],
    );

    if (courseRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        error: { code: "COURSE_NOT_FOUND", message: "ไม่พบรายวิชาที่ระบุ" },
      });
    }

    if (courseRows[0].seat_available <= 0) {
      await connection.rollback();
      return res.status(409).json({
        error: { code: "SEAT_FULL", message: "ที่นั่งเต็มแล้ว" },
      });
    }

    await connection.query(
      "INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)",
      [studentId, courseId],
    );

    await connection.query(
      "UPDATE courses SET seat_available = seat_available - 1 WHERE id = ?",
      [courseId],
    );

    await connection.commit();
    res.status(201).json({ message: "ลงทะเบียนสำเร็จ" });
  } catch (err) {
    await connection.rollback();
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: {
          code: "ALREADY_ENROLLED",
          message: "นิสิตลงทะเบียนรายวิชานี้ไปแล้ว",
        },
      });
    }
    next(err);
  } finally {
    connection.release();
  }
});
```

### ขั้นตอนที่ 3.4 ทดสอบ Rollback ด้วยการจำลองสถานการณ์ผิดพลาด

ทดสอบกรณีต่อไปนี้ด้วย Postman และตรวจสอบผลลัพธ์ในฐานข้อมูลหลังการทดสอบทุกครั้งด้วยคำสั่ง `SELECT * FROM enrollments;` และ `SELECT * FROM courses;`

| กรณีทดสอบ            | คำขอ                                                                                                                                                                                                                                                                    | ผลลัพธ์ที่คาดหวัง                                                    |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| ลงทะเบียนสำเร็จ      | `POST /api/v1/students/1/enrollments` (`courseId: 2`, สมมติมีที่นั่งว่าง — ก่อนทำแบบทดสอบนี้ ให้ลบระเบียน `(student_id=1, course_id=2)` ที่มาจาก seed data ออกก่อนด้วย `DELETE FROM enrollments WHERE student_id = 1 AND course_id = 2;` เพื่อไม่ให้ชนกับ `UNIQUE KEY`) | Status `201`, มีระเบียนใหม่ใน `enrollments`, `seat_available` ลดลง 1 |
| รายวิชาไม่มีอยู่จริง | `POST /api/v1/students/1/enrollments` (`courseId: 999`)                                                                                                                                                                                                                 | Status `404`, ไม่มีการเปลี่ยนแปลงใด ๆ ในฐานข้อมูล (rollback สำเร็จ)  |
| ลงทะเบียนซ้ำ         | `POST /api/v1/students/1/enrollments` (`courseId: 1`, ตรงกับ seed data ที่มีอยู่แล้ว)                                                                                                                                                                                   | Status `409`, `seat_available` ไม่ถูกลดซ้ำ (rollback สำเร็จ)         |

**ประเด็นสำคัญที่ต้องสังเกต:** กรณีที่ 2 (รายวิชาไม่มีอยู่จริง) ไม่มีคำสั่งเปลี่ยนแปลงข้อมูลใดถูกรันเลย เพราะ SELECT ตรวจสอบพบปัญหาก่อน INSERT จะถูกเรียก ส่วนกรณีที่ 3 (ลงทะเบียนซ้ำ) คำสั่ง `INSERT` ถูกรันจริงแต่ถูก MySQL ปฏิเสธด้วย `UNIQUE KEY unique_enrollment` (error code `ER_DUP_ENTRY`) ทำให้ตกไปที่ `catch` และเรียก `rollback()` ทั้งสองกรณีจึงจบลงด้วยฐานข้อมูลที่ไม่มีการเปลี่ยนแปลงใด ๆ หลงเหลืออยู่ ซึ่งเป็นการยืนยันคุณสมบัติ Atomicity ของ Transaction ตามที่กล่าวถึงใน `wk05.md` — ไม่ว่าจะยังไม่ได้เขียนอะไรเลย (กรณีที่ 2) หรือเขียนไปแล้วแต่ถูกปฏิเสธ (กรณีที่ 3) ผลลัพธ์สุดท้ายในฐานข้อมูลจะเหมือนกันคือ "ไม่มีอะไรเปลี่ยน"

### จุดตรวจสอบที่ 3

- ทดสอบ Foreign Key Constraint และ Cascade Delete สำเร็จ พร้อมบันทึกผลลัพธ์ที่สังเกตได้
- Implement route ลงทะเบียนเรียนด้วย Transaction สำเร็จ
- ทดสอบ Rollback ครบทั้ง 3 กรณีในตารางขั้นตอนที่ 3.4 และยืนยันว่าข้อมูลในฐานข้อมูลไม่เสียหายในกรณีที่เกิดข้อผิดพลาด

---

## ส่วนต่อยอด: แบบฝึกหัดเพิ่มเติมด้วยตนเอง

### แบบฝึกหัดที่ 1: เพิ่ม Endpoint ดึงข้อมูลแบบ JOIN

เขียน route `GET /api/v1/students/:id/courses` ที่ใช้คำสั่ง SQL แบบ `JOIN` เพื่อดึงรายชื่อรายวิชาทั้งหมดที่นิสิตคนนั้นลงทะเบียน โดยไม่ต้อง query แยกหลายครั้งเหมือนที่เคยทำในสัปดาห์ที่ 2 ด้วยข้อมูลจำลอง

```sql
SELECT courses.* FROM courses
JOIN enrollments ON courses.id = enrollments.course_id
WHERE enrollments.student_id = ?;
```

### แบบฝึกหัดที่ 2: ทดสอบผลกระทบเมื่อไม่ใช้ Transaction

สร้าง route ทดลอง `POST /api/v1/students/:id/enrollments-unsafe` ที่ทำงานเหมือนขั้นตอนที่ 3.3 แต่ไม่ใช้ transaction (ไม่มี `beginTransaction`, `commit`, `rollback`) แล้วจงอธิบาย (โดยไม่จำเป็นต้องทำให้เกิดข้อผิดพลาดจริง) ว่าหากเกิดข้อผิดพลาดขึ้นระหว่างคำสั่ง INSERT และคำสั่ง UPDATE จะเกิดผลกระทบใดต่อความถูกต้องของข้อมูล

### แบบฝึกหัดที่ 3: เพิ่ม Endpoint สำหรับยกเลิกการลงทะเบียน

เขียน route `DELETE /api/v1/students/:id/enrollments/:courseId` ที่ใช้ Transaction เพื่อลบระเบียนใน `enrollments` และเพิ่มค่า `seat_available` ของรายวิชานั้นกลับคืน 1 ที่นั่ง โดยทั้งสองการดำเนินการต้องสำเร็จหรือย้อนกลับพร้อมกันเสมอ

### แบบฝึกหัดที่ 4: เขียนสคริปต์ตรวจสอบ Connection Pool

เขียนสคริปต์ทดสอบขนาดเล็ก (ไฟล์แยกต่างหาก เช่น `test-pool.js`) ที่เรียก query พร้อมกัน 20 คำขอด้วย `Promise.all()` ไปยัง endpoint ที่ใช้ pool ที่มี `connectionLimit: 10` แล้วสังเกตว่าระบบยังคงทำงานถูกต้องได้หรือไม่ และใช้เวลานานขึ้นหรือไม่เมื่อเทียบกับการเรียกทีละคำขอ (ดูตัวอย่างสคริปต์ที่คล้ายกันได้ในหัวข้อ 4.6 ของ `wk05.md` — `test-concurrent.js` ซึ่งส่ง query ตรงผ่าน pool โดยไม่ผ่าน HTTP endpoint แทน)

### เกณฑ์การประเมินแบบฝึกหัดต่อยอด (สำหรับนิสิตใช้ตรวจสอบตนเอง)

| รายการ         | ผ่านเกณฑ์เมื่อ                                                                                  |
| -------------- | ----------------------------------------------------------------------------------------------- |
| แบบฝึกหัดที่ 1 | เรียก endpoint แล้วได้รายชื่อรายวิชาถูกต้องตรงกับข้อมูลใน `enrollments` โดยใช้ query เดียว      |
| แบบฝึกหัดที่ 2 | มีคำอธิบายที่ถูกต้องเรื่องความเสี่ยงของ data inconsistency เมื่อไม่ใช้ transaction              |
| แบบฝึกหัดที่ 3 | ทดสอบยกเลิกการลงทะเบียนแล้ว `seat_available` เพิ่มขึ้นถูกต้อง และระเบียนใน `enrollments` ถูกลบ  |
| แบบฝึกหัดที่ 4 | สคริปต์ทำงานสำเร็จโดยไม่มี query ใดล้มเหลวจากการรอคิวนานเกินไป และมีบันทึกเวลาที่ใช้เปรียบเทียบ |

หมายเหตุ: แบบฝึกหัดต่อยอดนี้เป็นการเตรียมความพร้อมสำหรับเนื้อหาสัปดาห์ที่ 6 (JWT Authentication & RBAC) ซึ่งจะเพิ่มตาราง `users` และระบบยืนยันตัวตนเข้าไปในฐานข้อมูลเดียวกันนี้ โดยใช้หลักการ Connection Pool และ Parameterized Query แบบเดียวกับที่ฝึกฝนในสัปดาห์นี้

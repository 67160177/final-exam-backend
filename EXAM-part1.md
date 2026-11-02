# ข้อสอบจำลอง ส่วนที่ 1: ปรนัย 30 ข้อ (15 คะแนน)

> ข้อสอบชุดนี้ออกจากเอกสาร wk09-wk14 กลุ่มละ 5 ข้อ ไม่ใช่ข้อสอบจริง
> แนะนำให้จับเวลา 50 นาที ปิดเอกสาร แล้วค่อยตรวจกับ `solution/EXAM-part1-answers.md`
> เลือกคำตอบที่ถูกต้องที่สุดเพียงข้อเดียว

---

## กลุ่มที่ 1: Automated Testing (wk09)

**1.** เหตุผลหลักที่ต้องแยก `app.js` ออกจาก `server.js` ก่อนใช้ Supertest คืออะไร

- ก. Supertest ทำงานได้เฉพาะกับไฟล์ที่ชื่อ `app.js` เท่านั้น
- ข. เพื่อให้เทสต์ import `app` ไปใช้ได้โดยไม่เปิดพอร์ตจริงและไม่เกิดผลข้างเคียงอย่างการเชื่อมต่อ Redis ตอนเริ่มเซิร์ฟเวอร์
- ค. เพื่อให้ Jest วัด Coverage ของไฟล์ `server.js` ได้ครบ 100%
- ง. เพราะ Express ไม่อนุญาตให้ประกาศ route กับเรียก `listen()` ในไฟล์เดียวกัน

**2.** ต้องการตรวจว่า `res.body` เท่ากับ `{ id: 1, role: "admin" }` ควรใช้ matcher ใด

- ก. `expect(res.body).toBe({ id: 1, role: "admin" })`
- ข. `expect(res.body).toContain({ id: 1, role: "admin" })`
- ค. `expect(res.body).toEqual({ id: 1, role: "admin" })`
- ง. `expect(res.body).toBeTruthy()`

**3.** ชุดทดสอบหนึ่งได้ Coverage 100% ทุกมิติ แต่ระบบยังมีบั๊กหลุดไป production ข้อใดอธิบายได้ดีที่สุด

- ก. Jest คำนวณ Coverage ผิดเมื่อโค้ดมี `async/await`
- ข. Branch Coverage 100% รับประกันความถูกต้อง แต่ Statement Coverage ไม่ได้รับประกัน
- ค. ต้องใช้ E2E Test แทน Unit Test ทั้งหมดจึงจะจับบั๊กได้
- ง. Coverage บอกเพียงว่าโค้ดถูกเรียกทำงาน แต่ไม่ได้บอกว่าเทสต์ได้ `expect` ตรวจผลลัพธ์อย่างถูกต้อง

**4.** ชุดทดสอบที่ต่อฐานข้อมูลจริงผ่านในครั้งแรก แต่ครั้งที่สองเทสต์ "สร้างผู้ใช้ email ซ้ำไม่ได้" กลับ fail ด้วย 409 ตั้งแต่ขั้น Arrange สาเหตุและวิธีแก้ที่เหมาะสมที่สุดคือข้อใด

- ก. ข้อมูลจากการรันครั้งก่อนค้างอยู่ ควรล้างหรือรีเซ็ตข้อมูลทดสอบใน hook อย่าง `beforeEach`/`afterAll` เพื่อให้เทสต์เป็นอิสระต่อกัน
- ข. Jest cache ผลลัพธ์ไว้ ต้องลบโฟลเดอร์ `node_modules` ทุกครั้ง
- ค. ควรเปลี่ยนไป mock ทุกอย่าง เพราะเทสต์ที่ต่อฐานข้อมูลจริงไม่มีประโยชน์
- ง. ควรเพิ่ม `connectionLimit` ของ pool

**5.** สถานการณ์ใด **ไม่ควร** ใช้ mock

- ก. ทดสอบ route ที่เรียก Payment Gateway ภายนอกระหว่างพัฒนา
- ข. ทดสอบว่า route ตอบ 500 เมื่อฐานข้อมูลล่ม โดยใช้ `mockRejectedValueOnce`
- ค. ทดสอบว่า query ของระบบทำงานถูกต้องกับ schema และ constraint จริงของฐานข้อมูล
- ง. ทดสอบ route ที่เรียกฐานข้อมูลโดยต้องการให้รันได้เร็วใน CI ที่ไม่มีฐานข้อมูล

---

## กลุ่มที่ 2: API Documentation และ DX (wk10)

**6.** ประโยชน์หลักของการอ้างอิง schema ด้วย `$ref` ไปยัง `components.schemas` ใน OpenAPI คือข้อใด

- ก. ทำให้ Swagger UI แสดงผลเร็วขึ้น
- ข. นิยาม schema ไว้ที่เดียวแล้วใช้ซ้ำได้ แก้ครั้งเดียวมีผลทุก endpoint ลดความไม่สอดคล้องกัน
- ค. ทำให้ API ตรวจ validation ของ request ได้อัตโนมัติโดยไม่ต้องเขียนโค้ด
- ง. เป็นข้อบังคับของ OpenAPI 3.0 ทุก endpoint ต้องใช้ `$ref`

**7.** เหตุใดการเสิร์ฟ Swagger UI จาก endpoint ของแอปเอง (เช่น `/api-docs`) จึงช่วยลดปัญหาเอกสารล้าสมัย

- ก. Swagger UI สร้างเอกสารจากการอ่าน route ใน Express ให้อัตโนมัติทุกครั้ง
- ข. เอกสารกับโค้ดอยู่ใน repository เดียวกันและ deploy ไปพร้อมกัน ผู้ใช้เห็นเอกสารของเวอร์ชันที่รันอยู่จริง และทดลองเรียกได้ทันที
- ค. Swagger UI ห้ามไม่ให้ deploy ถ้าเอกสารไม่ตรงกับโค้ด
- ง. Swagger UI ส่งอีเมลแจ้งทีม frontend เมื่อเอกสารเปลี่ยน

**8.** ใน Postman Collection การใช้ `{{baseUrl}}/api/v1/students` แทน `http://localhost:3000/api/v1/students` มีประโยชน์อย่างไร

- ก. ทำให้ request เร็วขึ้นเพราะ Postman cache ค่า baseUrl ไว้
- ข. ป้องกันไม่ให้ผู้อื่น import Collection ได้
- ค. เปลี่ยนสภาพแวดล้อม (local, staging, production) ได้โดยสลับ Environment ไม่ต้องแก้ทุก request
- ง. ทำให้ Newman รันได้เฉพาะบนเครื่องผู้สร้าง

**9.** ข้อใดเปรียบเทียบ Newman กับ Jest + Supertest ได้ถูกต้อง

- ก. ทั้งคู่ทดสอบระดับ code-level โดย import ฟังก์ชันมาเรียกตรง
- ข. Newman รัน Postman Collection ผ่าน command line ทดสอบระดับ HTTP กับเซิร์ฟเวอร์ที่รันอยู่ ส่วน Supertest ทดสอบในระดับโค้ดโดย import `app` เข้ามาในเทสต์
- ค. Newman ใช้แทน Jest ได้ทุกกรณีรวมถึงการ mock ฐานข้อมูล
- ง. Supertest ต้องเปิดเซิร์ฟเวอร์จริงก่อน ส่วน Newman ไม่ต้อง

**10.** หัวใจของแนวคิด API-First Design คือข้อใด

- ก. เขียนโค้ด Backend ให้เสร็จก่อนแล้วค่อยสร้างเอกสารจากโค้ด
- ข. ให้ทีม Frontend เป็นผู้ออกแบบฐานข้อมูล
- ค. ตกลง OpenAPI Specification เป็นสัญญา (contract) ก่อน ทำให้ Backend และ Frontend พัฒนาคู่ขนานกันได้และลด contract mismatch
- ง. เปิดเผย API ทุกตัวสู่สาธารณะตั้งแต่วันแรก

---

## กลุ่มที่ 3: External API และ Resilience (wk11)

**11.** response ใดจากบริการภายนอกที่ **ไม่ควร** retry

- ก. `503 Service Unavailable`
- ข. `429 Too Many Requests`
- ค. network error (ไม่ได้รับ response)
- ง. `400 Bad Request`

**12.** เมื่อเรียก Axios แล้วได้ error ที่ `error.response` เป็น `undefined` หมายความว่าอะไร

- ก. บริการตอบกลับด้วย status 2xx แต่ body ว่าง
- ข. ไม่ได้รับ response จากปลายทางเลย เช่น network error หรือ timeout ซึ่งเป็น transient failure ที่ retry ได้
- ค. บริการตอบ 404 เพราะ URL ผิด
- ง. Axios แปลง JSON ไม่สำเร็จ

**13.** ตั้ง Axios timeout 2 วินาที, retry สูงสุด 2 ครั้ง (เรียกได้รวม 3 ครั้ง) ด้วย Exponential Backoff 1 วินาทีและ 2 วินาที (ไม่คิด jitter) ถ้าทุกครั้ง timeout ผู้ใช้ต้องรอนานที่สุดประมาณเท่าใด

- ก. 6 วินาที
- ข. 7 วินาที
- ค. 9 วินาที
- ง. 4 วินาที

**14.** ปัญหาที่ Jitter ช่วยแก้คือข้อใด

- ก. client จำนวนมากที่ล้มเหลวพร้อมกัน retry ที่เวลาเดียวกันพอดีเป็นคลื่น (thundering herd) ซ้ำเติมบริการที่กำลังฟื้นตัว
- ข. request ค้างรอไม่มีกำหนดเมื่อบริการภายนอกไม่ตอบ
- ค. ผู้โจมตีปลอม signature ของ Webhook
- ง. retry กับ error 4xx ที่ไม่มีวันสำเร็จ

**15.** ในการตรวจ signature ของ Webhook เหตุใดจึงใช้ `crypto.timingSafeEqual` แทน `===`

- ก. `===` เทียบ string ภาษาไทยไม่ได้
- ข. `timingSafeEqual` คำนวณ HMAC ให้อัตโนมัติ
- ค. `===` หยุดเทียบทันทีที่เจออักขระแรกที่ต่าง ผู้โจมตีจึงวัดเวลาตอบสนองเพื่อเดา signature ทีละตัวได้ (timing attack)
- ง. `timingSafeEqual` ทำงานเร็วกว่า `===`

---

## กลุ่มที่ 4: Validation และ Rate Limiting (wk12)

**16.** ต้องการกฎ "ถ้า `studentType` เป็น `international` ต้องมี `passportNumber` ถ้าเป็น `local` ต้องมี `nationalId`" และแจ้ง error แยกตาม field ควรใช้อะไรใน Zod

- ก. `.superRefine()` ที่ใช้ `ctx.addIssue` ระบุ `path` ของแต่ละ field
- ข. `.refine()` เพียงครั้งเดียว
- ค. `.max()` บน string
- ง. `z.enum()` อย่างเดียว

**17.** ข้อใดอธิบายความต่างระหว่าง Rate Limiting กับ Throttling ได้ถูกต้อง

- ก. Rate Limiting หน่วงเวลาตอบ ส่วน Throttling ปฏิเสธทันทีด้วย 429
- ข. ทั้งสองแบบปฏิเสธด้วย 403 เหมือนกัน
- ค. Rate Limiting ปฏิเสธ request ที่เกินโควตาทันทีด้วย 429 ส่วน Throttling หน่วงเวลาตอบแทนการปฏิเสธ
- ง. Throttling ใช้ป้องกัน brute-force ได้ดีกว่าเพราะบอทรู้ตัวทันที

**18.** ระบบ deploy อยู่หลัง Nginx และใช้ `express-rate-limit` แบบค่าเริ่มต้นโดยไม่ตั้ง `trust proxy` จะเกิดอะไรขึ้น

- ก. ผู้ใช้แต่ละคนได้โควตาเพิ่มเป็นสองเท่า
- ข. `req.ip` กลายเป็น IP ของ Nginx ผู้ใช้ทุกคนถูกนับรวมเป็น key เดียว ผู้ใช้คนหนึ่งใช้โควตาจนคนอื่นโดนบล็อกไปด้วย
- ค. Rate limit ไม่ทำงานเลย ทุก request ผ่านหมด
- ง. Express ปฏิเสธทุก request ที่มี header `X-Forwarded-For`

**19.** ตั้ง `max: 5` ต่อ 15 นาทีให้ `/auth/login` แล้วรันแอปด้วย PM2 cluster mode 4 process โดยใช้ store เริ่มต้น ผลจริงคืออะไรและแก้อย่างไร

- ก. ได้ 5 ครั้งตามที่ตั้ง เพราะ PM2 แชร์ memory ให้ทุก process
- ข. ได้ 1 ครั้ง เพราะโควตาถูกหารด้วยจำนวน process
- ค. แอป crash เพราะ express-rate-limit ไม่รองรับ cluster
- ง. อาจผ่านได้ถึง 20 ครั้ง เพราะแต่ละ process นับแยกกันใน memory ของตัวเอง ควรใช้ store ที่ใช้ร่วมกันอย่าง Redis

**20.** เมื่อจำกัด rate ตาม `userId` ด้วย `keyGenerator: (req) => req.user?.id?.toString() || ipKeyGenerator(req.ip)` ข้อใดถูกต้อง

- ก. ต้องวาง limiter ไว้ก่อน `authenticateToken` เพื่อบล็อก request ให้เร็วที่สุด
- ข. แม่นยำกว่าการจำกัดตาม IP กับผู้ใช้ที่ login แล้วที่อยู่หลัง NAT เดียวกัน และต้องให้ `authenticateToken` ทำงานก่อน limiter เพื่อให้มี `req.user`
- ค. ทำให้ผู้ใช้ที่ยังไม่ login ถูกจำกัดแยกรายคนได้แม่นยำแม้อยู่หลัง NAT เดียวกัน
- ง. ใช้ `req.ip` ตรง ๆ แทน `ipKeyGenerator` ได้โดยไม่มีผลต่างใด ๆ

---

## กลุ่มที่ 5: Microservices (wk13)

**21.** ทีมแบ่งระบบเป็น "Database Service", "Validation Service" และ "API Service" ผลที่มักเกิดขึ้นคือข้อใด

- ก. ได้ independent deployability อย่างสมบูรณ์
- ข. ทุก request ต้องเรียกข้ามบริการไปมาตลอด เกิด coupling แน่นจนเป็น Distributed Monolith
- ค. ลดความซับซ้อนด้านเครือข่ายลงเมื่อเทียบกับ Monolithic
- ง. ได้ Bounded Context ที่ชัดเจนตามหลัก DDD

**22.** ข้อใด **ไม่ใช่** หน้าที่ของ API Gateway

- ก. Routing request ไปยังบริการที่ถูกต้องตาม path
- ข. ตรวจ Authentication และทำ Rate Limiting ส่วนกลาง
- ค. รวมผลลัพธ์จากหลายบริการเป็น response เดียว
- ง. เป็นฐานข้อมูลกลางที่ทุกบริการใช้เก็บข้อมูลร่วมกัน

**23.** หลังลูกค้าชำระเงินสำเร็จ ระบบต้องส่งอีเมลใบเสร็จ ซึ่งไม่จำเป็นต้องเสร็จก่อนตอบลูกค้า ควรใช้รูปแบบการสื่อสารใด

- ก. Asynchronous ผ่าน Message Queue เพราะไม่ต้องรอผลทันที และบริการอีเมลล่มก็ไม่ทำให้การชำระเงินล้ม
- ข. Synchronous HTTP แล้วรอจนอีเมลส่งสำเร็จจึงตอบลูกค้า
- ค. ให้ Client เรียก Notification Service เองโดยตรง
- ง. รวม Payment กับ Notification เป็นบริการเดียวเสมอ

**24.** เมื่อ Circuit Breaker อยู่ในสถานะ Open จะเกิดอะไรกับ request ที่เข้ามา

- ก. ส่งต่อไปยังบริการปลายทางตามปกติ
- ข. retry ด้วย Exponential Backoff จนกว่าจะสำเร็จ
- ค. ถูกปฏิเสธทันที (fail fast) โดยไม่ส่งไปยังบริการปลายทาง จนกว่าจะครบเวลาแล้วเข้า Half-Open เพื่อทดลองใหม่
- ง. ถูกเก็บในคิวและส่งทั้งหมดพร้อมกันเมื่อบริการกลับมา

**25.** ทีม 3 คนเริ่มโปรเจกต์ใหม่ที่ requirement ยังเปลี่ยนบ่อย แนวทางที่เอกสารแนะนำคือข้อใด

- ก. เริ่มด้วย Microservices ทันทีเพื่อรองรับการเติบโตในอนาคต
- ข. เริ่มจาก Modular Monolith ที่แบ่งขอบเขตภายในให้ชัด แล้วแยกเป็น Microservices เมื่อมีเหตุผลรองรับชัดเจน
- ค. แยกบริการตามชั้นทางเทคนิคเพื่อให้แต่ละคนดูแลคนละชั้น
- ง. แยกฐานข้อมูลให้ทุก endpoint คนละตัว

---

## กลุ่มที่ 6: Migration, Scaling และ Load Balancing (wk14)

**26.** เพิ่ม column ใหม่ให้ตาราง `students` ที่มีข้อมูลอยู่แล้ว 500 แถว ข้อใดปลอดภัยที่สุด

- ก. `NOT NULL` โดยไม่มีค่า default เพื่อบังคับให้ทุกแถวมีค่า
- ข. รัน `ALTER TABLE` ตรงบน production โดยไม่ต้องมี migration file
- ค. กำหนดให้เป็น `nullable` หรือมีค่า `default` และเขียน migration ที่มีทั้ง `up` และ `down`
- ง. ลบตารางแล้วสร้างใหม่พร้อม column ใหม่

**27.** คำสั่ง `npx knex migrate:rollback` ทำอะไร

- ก. เรียกฟังก์ชัน `down` ของ migration ใน batch ล่าสุดที่รันไป
- ข. ลบไฟล์ migration ทั้งหมดออกจากโปรเจกต์
- ค. รันฟังก์ชัน `up` ของทุก migration ใหม่อีกครั้ง
- ง. restore ฐานข้อมูลจาก backup ล่าสุดของ `mysqldump`

**28.** ต้องการเปลี่ยนชื่อ column `email` เป็น `email_address` โดยไม่มี downtime ระหว่าง rolling deployment ลำดับที่ถูกต้องตาม Expand-Contract Pattern คือข้อใด

- ก. ลบ `email` → เพิ่ม `email_address` → แก้โค้ด
- ข. `RENAME COLUMN` ทันทีแล้ว deploy โค้ดใหม่พร้อมกัน
- ค. แก้โค้ดให้อ่าน `email_address` ก่อน → เพิ่ม column → ลบ `email`
- ง. เพิ่ม `email_address` → ให้โค้ดเขียนทั้งสอง column และ backfill ข้อมูลเดิม แล้วย้ายการอ่าน → ลบ `email` เมื่อไม่มีโค้ดอ้างอิงแล้ว

**29.** แอปเก็บ session การ login ไว้ใน memory ของ process แล้วขยายเป็น 3 instance หลัง Load Balancer แบบ Round Robin จะเกิดปัญหาใด และข้อใดอธิบายถูกต้อง

- ก. ไม่มีปัญหา เพราะ Round Robin ส่งผู้ใช้คนเดิมไปเครื่องเดิมเสมอ
- ข. ผู้ใช้อาจหลุด login เมื่อ request ไปตกที่ instance อื่นที่ไม่มี session นั้น จึงต้องออกแบบแอปให้ stateless (เช่น ใช้ JWT หรือเก็บ state ไว้ภายนอก)
- ค. Load Balancer จะ copy memory ระหว่าง instance ให้อัตโนมัติ
- ง. ต้องเปลี่ยนเป็น Vertical Scaling เท่านั้นจึงจะแก้ได้

**30.** แต่ละ instance ใช้ connection pool `connectionLimit: 10` ขยายเป็น 5 instance แต่ MySQL ตั้ง `max_connections` ไว้ 40 ข้อใดถูกต้อง

- ก. ไม่มีปัญหา เพราะ pool ของทุก instance แชร์ connection กัน
- ข. Least Connections จะแก้ปัญหานี้ได้ทันที
- ค. อาจต้องการ connection พร้อมกันถึง 50 เกินเพดาน 40 instance ที่ขอเกินจะได้ error `ER_CON_COUNT_ERROR` แก้ได้ เช่น ลด `connectionLimit` ต่อ instance หรือเพิ่ม `max_connections`
- ง. MySQL จะเพิ่ม `max_connections` ให้อัตโนมัติ

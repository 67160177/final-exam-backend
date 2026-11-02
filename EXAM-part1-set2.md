# ข้อสอบจำลอง ส่วนที่ 1 ชุดที่ 2: ปรนัย 30 ข้อ

> ออกจาก wk09-wk14 กลุ่มละ 5 ข้อ ไม่ซ้ำกับชุดที่ 1
> แนะนำให้จับเวลา 50 นาที ปิดเอกสาร แล้วค่อยตรวจกับ `solution/EXAM-part1-set2-answers.md`

---

## กลุ่มที่ 1: Automated Testing (wk09)

**1.** ข้อใดอธิบาย Testing Pyramid ได้ถูกต้อง

- ก. Unit Test ควรมีจำนวนมากที่สุดเพราะรันเร็วและหาจุดผิดได้ง่าย ส่วน E2E Test มีจำนวนน้อยที่สุดเพราะช้าและเปราะบาง
- ข. E2E Test ควรมีมากที่สุดเพราะทดสอบเหมือนผู้ใช้จริงที่สุด
- ค. ควรมีทั้งสามระดับในจำนวนเท่ากันเสมอ
- ง. Integration Test ไม่จำเป็นถ้ามี Unit Test ครบทุกฟังก์ชัน

**2.** ฟังก์ชันหนึ่งมี `if (role === "admin") {...} else {...}` แต่ชุดทดสอบส่ง role เป็น `"admin"` เพียงกรณีเดียว ผลของ Branch Coverage ของฟังก์ชันนี้คือข้อใด

- ก. 100% เพราะฟังก์ชันถูกเรียกแล้ว
- ข. 0% เพราะไม่ได้ทดสอบ else
- ค. 50% เพราะทดสอบเงื่อนไขได้เพียงหนึ่งในสองทาง
- ง. วัดไม่ได้ เพราะ Branch Coverage ใช้กับ switch เท่านั้น

**3.** ต้องการให้ `pool.query` ที่ถูก mock จำลองว่าฐานข้อมูลล่มในการเรียกครั้งถัดไป เพื่อทดสอบว่า route ตอบ 500 ควรเขียนแบบใด

- ก. `pool.query.mockResolvedValueOnce([[]])`
- ข. `pool.query.mockReturnValue(500)`
- ค. `pool.query = null`
- ง. `pool.query.mockRejectedValueOnce(new Error("Connection lost"))`

**4.** ต้องการทดสอบว่า async function `login()` โยน error เมื่อรหัสผ่านผิด ควรเขียน assertion แบบใด

- ก. `expect(login()).toThrow()`
- ข. `await expect(login()).rejects.toThrow()`
- ค. `expect(await login()).toBeNull()`
- ง. `expect(login).toBe(Error)`

**5.** เหตุใดชุดทดสอบที่ใช้ `jest.mock()` จึงมักเรียก `jest.clearAllMocks()` ใน `afterEach`

- ก. ล้างประวัติการเรียกและค่าที่ตั้งไว้ของ mock ระหว่าง test เพื่อไม่ให้ test หนึ่งได้รับผลจาก test ก่อนหน้า
- ข. เพื่อให้ Jest ปิดการเชื่อมต่อฐานข้อมูลจริง
- ค. เพื่อเพิ่มค่า Coverage
- ง. เพราะ Jest บังคับว่าต้องมีทุกไฟล์ที่ใช้ mock มิฉะนั้นจะรันไม่ได้

---

## กลุ่มที่ 2: API Documentation และ DX (wk10)

**6.** ข้อใด **ไม่ใช่** ส่วนหลักของไฟล์ OpenAPI Specification 3.0

- ก. `info`
- ข. `paths`
- ค. `components`
- ง. `middlewares`

**7.** เหตุใดเอกสาร OpenAPI ของแต่ละ endpoint ควรระบุ response กรณี error (เช่น 400, 404) ด้วย ไม่ใช่แค่ 200

- ก. เพราะ Swagger UI จะไม่แสดง endpoint ที่มีแค่ 200
- ข. เพื่อให้ผู้เรียกใช้ API รู้ล่วงหน้าว่าจะได้รับ error รูปแบบใด และเขียนโค้ดรับมือได้ถูกต้อง
- ค. เพราะ Express จะคืน error ตามที่เขียนในเอกสารให้อัตโนมัติ
- ง. เพื่อให้ไฟล์ YAML ผ่านการตรวจ syntax

**8.** ใน Postman เขียน script หลัง request login ให้เก็บ token ไว้ใน Environment Variable จุดประสงค์คืออะไร

- ก. เพื่อเข้ารหัส token ให้ปลอดภัยขึ้น
- ข. เพื่อให้ token ไม่มีวันหมดอายุ
- ค. เพื่อให้ request อื่นในชุดอ้างอิง `{{token}}` ได้ ไม่ต้องคัดลอกไปวางเองทุกครั้ง
- ง. เพื่อให้ Newman รันได้โดยไม่ต้องมีเซิร์ฟเวอร์

**9.** ทีม Backend เปลี่ยนชื่อ field ใน response จาก `student_name` เป็น `name` โดยไม่แก้เอกสาร หน้าเว็บของทีม Frontend จึงแสดงชื่อไม่ขึ้น ปัญหานี้เรียกว่าอะไร

- ก. Contract mismatch ระหว่างเอกสาร (สัญญา) กับการทำงานจริงของ API
- ข. Thundering herd
- ค. Cache stampede
- ง. Distributed monolith

**10.** ข้อใด **ไม่** ช่วยให้ Developer Experience (DX) ของ API ดีขึ้น

- ก. มีเอกสาร OpenAPI ที่ทดลองเรียกได้ผ่าน Swagger UI
- ข. มี Postman Collection พร้อม Environment ให้ import ไปใช้ได้ทันที
- ค. ข้อความ error บอกชัดเจนว่าผิดที่ field ใด
- ง. แต่ละ endpoint ใช้รูปแบบ error ต่างกันไปตามความสะดวกของผู้เขียน

---

## กลุ่มที่ 3: External API และ Resilience (wk11)

**11.** ข้อใด **ไม่ใช่** เหตุผลที่เอกสารเลือกใช้ Axios ในการเรียก API ภายนอก

- ก. ตั้ง timeout ได้ง่าย
- ข. retry ให้อัตโนมัติเมื่อเกิด 5xx โดยไม่ต้องเขียนโค้ดเพิ่ม
- ค. แปลง JSON ให้อัตโนมัติ
- ง. โยน error เมื่อ status ไม่ใช่ 2xx

**12.** เหตุใดเอกสารจึงเลือกใช้ Equal Jitter แทน Full Jitter

- ก. Equal Jitter ไม่ต้องสุ่มค่าใด ๆ
- ข. Full Jitter ทำให้เกิด thundering herd มากกว่าการไม่ใช้ jitter
- ค. Equal Jitter ยังกระจายเวลา retry ได้ดี และรับประกันว่ามีเวลารอขั้นต่ำเสมอ
- ง. Equal Jitter ทำให้ retry เร็วที่สุดเท่าที่เป็นไปได้

**13.** ผู้ให้บริการ Payment ส่ง Webhook event เดิม (event id เดียวกัน) มาซ้ำ 2 ครั้ง ระบบควรยึดหลักการใด

- ก. Idempotency: ตรวจ event id ที่เคยประมวลผลแล้วและไม่ประมวลผลซ้ำ
- ข. ประมวลผลทุกครั้งที่ได้รับ เพราะผู้ให้บริการไม่ส่งซ้ำโดยไม่มีเหตุผล
- ค. ตอบ 500 กลับไปเพื่อให้ผู้ให้บริการหยุดส่ง
- ง. ปิด endpoint Webhook ชั่วคราว

**14.** ผู้โจมตีรู้ว่าระบบใช้ HMAC-SHA256 ตรวจ signature ของ Webhook เหตุใดจึงยังปลอม signature ที่ถูกต้องไม่ได้

- ก. เพราะ SHA-256 ถอดรหัสกลับไม่ได้
- ข. เพราะ Webhook ใช้ HTTPS เสมอ
- ค. เพราะ signature เปลี่ยนทุกวินาที
- ง. เพราะการสร้าง signature ที่ถูกต้องต้องใช้ค่า secret ที่ใช้ร่วมกันระหว่างผู้ส่งกับระบบเท่านั้น การรู้แค่ชื่อ algorithm ไม่พอ

**15.** เรียก API ภายนอกแล้วได้ `401 Unauthorized` เพราะ API key ที่ตั้งไว้ผิด ข้อใดเหมาะสมที่สุด

- ก. Retry ด้วย Exponential Backoff จนกว่าจะสำเร็จ
- ข. ไม่ retry เพราะเป็น permanent failure ให้ log ไว้ตรวจสอบ แล้วใช้ fallback ตอบผู้ใช้อย่างเหมาะสม
- ค. เพิ่ม timeout ให้นานขึ้น
- ง. Retry ทันทีโดยไม่หน่วงเวลา 10 ครั้ง

---

## กลุ่มที่ 4: Validation และ Rate Limiting (wk12)

**16.** ต้องการตรวจว่า `endDate` ต้องมาหลัง `startDate` และให้ error ผูกกับ field `endDate` ควรเขียนแบบใดใน Zod

- ก. `z.string().max(10)`
- ข. `z.enum(["startDate", "endDate"])`
- ค. `.refine((d) => new Date(d.endDate) > new Date(d.startDate), { path: ["endDate"] })`
- ง. `z.array().min(1)`

**17.** เหตุใด Rate Limiting เพียงอย่างเดียวจึงใช้แทน Input Validation ไม่ได้

- ก. Rate Limiting นับแค่จำนวน request ไม่ได้ตรวจเนื้อหา request ที่เป็นอันตรายเพียงครั้งเดียวที่อยู่ในโควตายังผ่านเข้าไปได้
- ข. Rate Limiting ทำให้ระบบช้าลงจนต้องปิด validation
- ค. Rate Limiting ทำงานได้เฉพาะ GET
- ง. Input Validation ป้องกัน brute-force ได้ดีกว่าอยู่แล้ว

**18.** เหตุใดเอกสารจึงตั้ง `authLimiter` (5 ครั้ง / 15 นาที) แยกจาก `generalLimiter` (100 ครั้ง / นาที)

- ก. เพราะ express-rate-limit ใช้ได้เพียง limiter เดียวต่อแอป
- ข. เพื่อให้ผู้ใช้ทั่วไปใช้งานได้น้อยลง
- ค. เพราะ `/auth/login` ไม่ต้องการ rate limit
- ง. Endpoint ที่มีความเสี่ยงต่างกันควรมีโควตาต่างกัน login เสี่ยง brute-force จึงต้องเข้มกว่า

**19.** เมื่อ request เกินโควตาของ `express-rate-limit` ระบบตอบ status code ใด

- ก. 403 Forbidden
- ข. 429 Too Many Requests
- ค. 503 Service Unavailable
- ง. 401 Unauthorized

**20.** ข้อใดเป็นข้อจำกัดของ OWASP ZAP ที่ทีมพัฒนายังต้องตรวจเอง

- ก. ZAP ตรวจ header ความปลอดภัยไม่ได้
- ข. ZAP ใช้ได้เฉพาะเว็บที่เขียนด้วย PHP
- ค. ZAP ตรวจช่องโหว่ทาง business logic ไม่ได้ดี เช่น ผู้ใช้แก้ข้อมูลของคนอื่นได้ ต้องอาศัยการออกแบบและการทบทวนโค้ด
- ง. ZAP ต้องเข้าถึง source code ก่อนจึงจะสแกนได้

---

## กลุ่มที่ 5: Microservices (wk13)

**21.** Independent deployability ใน Microservices หมายถึงอะไร

- ก. ทุกบริการต้อง deploy พร้อมกันเสมอเพื่อความสอดคล้อง
- ข. ทุกบริการต้องใช้ภาษาโปรแกรมต่างกัน
- ค. ไม่ต้องมีการทดสอบก่อน deploy
- ง. แต่ละบริการ deploy แยกกันได้โดยไม่ต้อง deploy ทั้งระบบใหม่

**22.** เหตุใดความสอดคล้องของข้อมูล (consistency) จึงทำได้ยากขึ้นใน Microservices เมื่อเทียบกับ Monolithic

- ก. ข้อมูลกระจายอยู่หลายฐานข้อมูล ใช้ transaction เดียวครอบทั้งหมดไม่ได้ จึงมักต้องยอมรับ eventual consistency
- ข. Microservices ไม่สามารถใช้ฐานข้อมูลได้
- ค. Monolithic ไม่มี transaction
- ง. API Gateway ลบข้อมูลที่ไม่สอดคล้องทิ้งอัตโนมัติ

**23.** ปัญหาใดเกิดขึ้นเมื่อไม่มี API Gateway และ Client เรียกแต่ละบริการโดยตรง

- ก. บริการแต่ละตัวทำงานช้าลงเสมอ
- ข. ฐานข้อมูลไม่สามารถแยกกันได้
- ค. Client ต้องรู้ที่อยู่ของทุกบริการ และเรื่องอย่าง authentication หรือ rate limiting ต้องเขียนซ้ำในทุกบริการ
- ง. ใช้ JWT ไม่ได้

**24.** Order Service เรียก Inventory Service แบบ synchronous ทุกครั้งที่มีการสั่งซื้อ ถ้า Inventory Service ตอบช้ามาก ควรใช้หลักการใดเพื่อไม่ให้ Order Service ค้างตาม

- ก. ลบ Inventory Service ออก
- ข. ใช้หลัก Resilience เดียวกับ wk11 เช่น timeout, retry ที่เหมาะสม, fallback และอาจใช้ Circuit Breaker
- ค. รวมสองบริการเป็นฐานข้อมูลเดียวทันที
- ง. เพิ่ม connectionLimit ของ Order Service

**25.** บริการ A และบริการ B ต่างเขียนข้อมูลลงตาราง `students` เดียวกันโดยตรง การแบ่งบริการแบบนี้ขัดกับเกณฑ์ใด

- ก. อัตราการเปลี่ยนแปลง (Rate of change)
- ข. ความต้องการด้าน Scale
- ค. ทีมงาน
- ง. ความเป็นเจ้าของข้อมูล (Data ownership)

---

## กลุ่มที่ 6: Migration, Scaling และ Load Balancing (wk14)

**26.** ต้อง deploy โค้ดใหม่ที่อ่าน column ใหม่ `phone_number` ลำดับที่ถูกต้องตามแนวปฏิบัติคือข้อใด

- ก. รัน migration ให้ schema พร้อมก่อน แล้วจึง deploy โค้ดใหม่ที่ใช้ column นั้น
- ข. deploy โค้ดใหม่ก่อน แล้วค่อยรัน migration
- ค. deploy และรัน migration พร้อมกันในคำสั่งเดียว
- ง. ไม่ต้องใช้ migration เพราะ MySQL เพิ่ม column ให้อัตโนมัติ

**27.** migration ที่ backfill ข้อมูลลง column ใหม่มีฟังก์ชัน `down` ที่ไม่ทำอะไรเลย ถ้าต้องย้อนกลับข้อมูลจริง แผนสำรองคืออะไร

- ก. `npx knex migrate:rollback` จะคืนค่าเดิมให้เอง
- ข. รัน `up` ซ้ำอีกครั้ง
- ค. restore จาก backup ที่ทำด้วย `mysqldump` ไว้ก่อนรัน migration
- ง. ลบ column ทิ้งแล้วข้อมูลเดิมจะกลับมา

**28.** ข้อใดเป็นข้อจำกัดของ Vertical Scaling

- ก. ต้องออกแบบแอปให้ stateless ก่อน
- ข. มีเพดานตามฮาร์ดแวร์ที่เพิ่มได้ และยังเป็นเครื่องเดียว (single point of failure)
- ค. ต้องมี Load Balancer
- ง. ทำให้ rate limit นับผิด

**29.** Load Balancer ไม่ส่ง header `X-Forwarded-For` ต่อไปยังแอป จะกระทบ Rate Limiting อย่างไร

- ก. ไม่กระทบ เพราะ rate limit นับจาก token เสมอ
- ข. แต่ละผู้ใช้ได้โควตาเพิ่มขึ้นเป็นสองเท่า
- ค. แอปจะปฏิเสธทุก request
- ง. แอปเห็นทุก request มาจาก IP ของ Load Balancer ผู้ใช้ทุกคนจึงถูกนับรวมเป็นคนเดียวกัน

**30.** ระบบที่แต่ละ request ใช้เวลาประมวลผลต่างกันมาก (บางอันเป็นรายงานหนัก บางอันเป็นการอ่านธรรมดา) ควรใช้อัลกอริทึม Load Balancing แบบใด

- ก. Round Robin
- ข. IP Hash
- ค. Least Connections
- ง. ส่งทุก request ไปเครื่องแรกเสมอ

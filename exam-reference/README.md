# สารบัญเอกสารอ้างอิง (88736065)

ไฟล์ทั้งหมดในโฟลเดอร์นี้คัดลอกมาจากต้นฉบับโดยไม่แก้ไข
- `lectures-labs/` คือเอกสารบรรยายและปฏิบัติการ wk05-wk12 ของรายวิชา (ไม่มี wk08)
- `boardgames/` คือไฟล์บางส่วนจากโปรเจกต์ `Fainal-Project-Boardgames`

ตัวเลขหลังชื่อไฟล์คือเลขบรรทัด (กด Ctrl+G ใน VS Code แล้วพิมพ์เลขบรรทัด)

| หัวข้อ | เอกสารบรรยาย | ปฏิบัติการ | โปรเจกต์ boardgames |
| --- | --- | --- | --- |
| Connection Pool | wk05.md:73, 96, 125 | wk05-lab.md:164 | db.js |
| CRUD / Parameterized Query | wk05.md:179, 212, 246, 317 | wk05-lab.md:199 | src/index.js:262, 421, 467, 595 |
| JOIN | wk05.md:293 | wk05-lab.md:394 | src/index.js:759 |
| Transaction / rollback / release | wk05.md:373, 417 | wk05-lab.md:311, 372 | (ไม่มีในโปรเจกต์) |
| SELECT ... FOR UPDATE | wk05.md:425 | - | - |
| Foreign Key / Cascade | wk05.md:140 | wk05-lab.md:283, 294 | schema.sql |
| JWT sign | wk06.md:366 | wk06-lab.md:87, 116 | services/auth-service/index.js:139, 160 |
| JWT verify middleware | wk06.md:397 | wk06-lab.md:206 | gateway/index.js:149 |
| ตรวจ role (RBAC) | wk06.md:561, 588 | wk06-lab.md:206, 256 | gateway/index.js:187, 320 |
| Hash รหัสผ่าน | wk06.md:348 | wk06-lab.md:87 | services/auth-service/password.js |
| Pagination / Filtering / Sorting | wk07.md:424, 489, 531, 573 | wk07-lab.md:263, 292 | src/index.js:230, 342 |
| Jest Arrange-Act-Assert / Matcher | wk09.md:119, 177 | wk09-lab.md:142 | tests/boardgames.test.js |
| beforeEach / beforeAll | wk09.md:189 | - | tests/auth-service.test.js:28, 31 |
| แยก app.js / server.js | wk09.md:231 | wk09-lab.md:76 | src/index.js:923, 935 |
| Supertest | wk09.md:258 | wk09-lab.md:224 | tests/boardgames.test.js |
| ทดสอบกับฐานข้อมูลจริง | wk09.md:298 | - | - |
| jest.fn / jest.mock | wk09.md:330, 362 | wk09-lab.md:314 | tests/boardgames.test.js:1 |
| Coverage | wk09.md:437 | wk09-lab.md:407 | - |
| Error handler / 404 | - | wk09-lab.md:76 | src/index.js:887, 900 |
| Retry / Timeout / Fallback | wk11.md | wk11-lab.md | src/services/external-api.js:42 |
| Zod validation | wk12.md:61, 77, 97, 149 | wk12-lab.md:69, 101 | - |
| Payload limit | wk12.md:133 | - | src/index.js:46 |
| Rate limit | wk12.md:204, 249, 287 | wk12-lab.md:159, 188 | gateway/index.js:101, tests/rate-limit.test.js |
| OpenAPI / Swagger | wk10.md | wk10-lab.md | src/index.js:189 |

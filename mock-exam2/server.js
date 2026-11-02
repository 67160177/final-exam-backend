// เปิดเซิร์ฟเวอร์จริง (npm run dev) — ไม่ต้องแก้ไข
const app = require("./app");
const { port } = require("./config");

app.listen(port, () => {
  console.log(`เซิร์ฟเวอร์ทำงานที่พอร์ต ${port}`);
});

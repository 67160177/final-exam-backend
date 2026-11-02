// เปิดเซิร์ฟเวอร์จริง (npm start)
const app = require("./app");
const { port } = require("./config");

app.listen(port, () => {
  console.log(`เซิร์ฟเวอร์ทำงานที่พอร์ต ${port}`);
});

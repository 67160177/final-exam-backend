// เครื่องตรวจอัตโนมัติ (npm run grade)
//
// โจทย์ที่ 1 (6): รัน tests/menu.test.js ของนิสิตกับโค้ดเฉลย ต้องผ่านทั้งหมดก่อน
//                 แล้วรันกับโค้ดเฉลยที่ใส่บั๊กไว้ (mutant) ทีละตัว เทสต์ fail = จับบั๊กได้ = ได้ 1 คะแนน
// โจทย์ที่ 2 (4): รัน tests/provided.test.js กับโค้ดของนิสิต (บั๊กละ 1 คะแนน) + คำอธิบายใน answers.md (ตรวจเอง บั๊กละ 1)
// โจทย์ที่ 3 (5): รันเทสต์ลับของ POST กับโค้ดของนิสิต (4 คะแนน)
//                 + เทสต์ POST ของนิสิตต้องจับบั๊กใน validation ของ POST ได้ (1 คะแนน)
const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const JEST = require.resolve("jest/bin/jest", { paths: [ROOT] });
const REFERENCE = fs.readFileSync(path.join(__dirname, "reference", "menu.js"), "utf8");
const MUTANT_FILE = path.join(ROOT, "routes", ".mutant-menu.js");

const MUTANTS = [
  {
    task: 1,
    desc: "GET /:id ไม่ตอบ 404 เมื่อไม่พบเมนู",
    from: "if (rows.length === 0) {",
    to: "if (false) {",
  },
  {
    task: 1,
    desc: "PATCH ไม่ตรวจ role (customer ก็แก้ราคาได้)",
    from: 'router.patch("/:id/price", authMiddleware, requireRole("admin"),',
    to: 'router.patch("/:id/price", authMiddleware,',
  },
  {
    task: 1,
    desc: "PATCH ไม่ตรวจ token เลย",
    from: 'router.patch("/:id/price", authMiddleware, requireRole("admin"),',
    to: 'router.patch("/:id/price",',
  },
  {
    task: 1,
    desc: "validation ยอมรับ price = 0",
    from: "price > 0 && price <= 10000",
    to: "price >= 0 && price <= 10000",
  },
  {
    task: 1,
    desc: "price ใน response เป็น string แทน number",
    from: "price: Number(row.price),",
    to: "price: row.price,",
  },
  {
    task: 1,
    desc: "PATCH ตอบ 200 แต่ไม่ได้บันทึกราคาใหม่",
    from: '"UPDATE menu_items SET price = ? WHERE id = ?"',
    to: '"UPDATE menu_items SET price = price + 0 * ? WHERE id = ?"',
  },
  {
    task: 3,
    desc: "POST ยอมรับข้อมูลที่ผิดเพียง field เดียว",
    from: "if (details.length > 0) return validationError(res, details);",
    to: "if (details.length > 1) return validationError(res, details);",
  },
];

function runJest(testFile, routesFile) {
  const out = path.join(os.tmpdir(), `grade-${process.pid}-${Date.now()}.json`);
  const env = { ...process.env };
  if (routesFile) env.MENU_ROUTES_FILE = routesFile;
  else delete env.MENU_ROUTES_FILE;

  spawnSync(
    process.execPath,
    // ใช้รูปแบบ --option=value เพราะ testPathIgnorePatterns เป็น array จะกินชื่อไฟล์ที่ตามมาไปด้วย
    [JEST, testFile, "--runInBand", "--silent", "--json", `--outputFile=${out}`,
      `--rootDir=${ROOT}`, "--testPathIgnorePatterns=/node_modules/"],
    { cwd: ROOT, env, encoding: "utf8" },
  );
  if (!fs.existsSync(out)) return { total: 0, passed: 0, failed: 0, tests: [], crashed: true };

  const json = JSON.parse(fs.readFileSync(out, "utf8"));
  fs.unlinkSync(out);
  const tests = json.testResults.flatMap((r) =>
    r.assertionResults.map((a) => ({ name: a.fullName, status: a.status })),
  );
  const crashed = json.testResults.some((r) => r.status === "failed" && r.assertionResults.length === 0);
  return {
    total: json.numTotalTests - json.numTodoTests - json.numPendingTests,
    passed: json.numPassedTests,
    failed: json.numFailedTests,
    tests,
    crashed,
  };
}

function writeMutant(source) {
  fs.writeFileSync(MUTANT_FILE, source);
  return MUTANT_FILE;
}

function mutate(mutant) {
  if (!REFERENCE.includes(mutant.from)) throw new Error(`grader: หา "${mutant.from}" ในไฟล์เฉลยไม่พบ`);
  return REFERENCE.replace(mutant.from, mutant.to);
}

const line = (text = "") => console.log(text);
const mark = (ok) => (ok ? "✔" : "✘");

function main() {
  line("กำลังตรวจ... (ใช้เวลาประมาณ 30-60 วินาที)\n");
  let score1 = 0;
  let score2 = 0;
  let score3 = 0;

  // ===== โจทย์ที่ 1 =====
  line("โจทย์ที่ 1: เทสต์ของคุณ (tests/menu.test.js) [6 คะแนน]");
  const baseline = runJest("tests/menu.test.js", writeMutant(REFERENCE));
  const killed = new Map();

  if (baseline.crashed || baseline.total === 0) {
    line("  ✘ ไม่มีเทสต์ที่รันได้ในไฟล์ (ไฟล์ error หรือยังไม่ได้เขียนเทสต์)");
  } else if (baseline.failed > 0) {
    line(`  ✘ เทสต์ของคุณ fail ${baseline.failed} ข้อกับโค้ดที่ถูกต้อง ต้องผ่านทั้งหมดก่อนจึงจะนับคะแนน:`);
    for (const t of baseline.tests.filter((t) => t.status === "failed")) line(`      - ${t.name}`);
  } else {
    line(`  ✔ เทสต์ ${baseline.passed} ข้อผ่านกับโค้ดที่ถูกต้อง`);
    for (const mutant of MUTANTS) {
      const result = runJest("tests/menu.test.js", writeMutant(mutate(mutant)));
      killed.set(mutant, result.failed > 0 || result.crashed);
    }
    for (const mutant of MUTANTS.filter((m) => m.task === 1)) {
      line(`  ${mark(killed.get(mutant))} จับบั๊ก: ${mutant.desc}`);
      if (killed.get(mutant)) score1 += 1;
    }
  }
  line(`  คะแนน ${score1}/6\n`);

  // ===== โจทย์ที่ 2 =====
  if (fs.existsSync(MUTANT_FILE)) fs.unlinkSync(MUTANT_FILE);
  line("โจทย์ที่ 2: แก้บั๊ก (tests/provided.test.js กับ routes/menu.js ของคุณ) [4 คะแนน]");
  const provided = runJest("tests/provided.test.js");
  const passedNames = provided.tests.filter((t) => t.status === "passed").map((t) => t.name);
  const bug1 = ["ไม่ทำให้ระบบ error", "แทรกเงื่อนไข SQL"].every((k) => passedNames.some((n) => n.includes(k)))
    && passedNames.some((n) => n.includes("ค้นหาตามชื่อเมนู"));
  const bug2 = passedNames.some((n) => n.includes("404 MENU_NOT_FOUND"))
    && passedNames.some((n) => n.includes("admin แก้ราคาได้"));
  line(`  ${mark(bug1)} บั๊กที่ 1 (search) แก้แล้ว`);
  line(`  ${mark(bug2)} บั๊กที่ 2 (PATCH ไม่พบเมนู) แก้แล้ว`);
  score2 = (bug1 ? 1 : 0) + (bug2 ? 1 : 0);
  const answers = path.join(ROOT, "answers.md");
  const answerText = fs.existsSync(answers) ? fs.readFileSync(answers, "utf8") : "";
  const answered = answerText.replace(/<!--[\s\S]*?-->/g, "").replace(/^#.*$/gm, "").trim().length > 80;
  line(`  ${answered ? "•" : "✘"} answers.md ${answered ? "มีคำตอบแล้ว ตรวจเองกับ grader/reference/answers.md (บั๊กละ 1 คะแนน)" : "ยังไม่ได้เขียน"}`);
  line(`  คะแนนอัตโนมัติ ${score2}/2 (+ คำอธิบายอีก 2 คะแนนตรวจเอง)\n`);

  // ===== โจทย์ที่ 3 =====
  line("โจทย์ที่ 3: POST /api/v1/menu [5 คะแนน]");
  const hidden = runJest("grader/hidden-post.test.js");
  if (hidden.crashed) line("  ✘ รันเทสต์ไม่ได้ (โค้ดอาจ error ตอน require)");
  for (const t of hidden.tests) line(`  ${mark(t.status === "passed")} ${t.name.replace("hidden: POST /api/v1/menu ", "")}`);
  const hiddenScore = hidden.total > 0 ? (4 * hidden.passed) / hidden.total : 0;
  const postMutant = MUTANTS.find((m) => m.task === 3);
  const ownPost = killed.get(postMutant) === true;
  line(`  ${mark(ownPost)} เทสต์ POST ของคุณจับบั๊ก: ${postMutant.desc}`);
  score3 = Math.round((hiddenScore + (ownPost ? 1 : 0)) * 10) / 10;
  line(`  คะแนน ${score3}/5\n`);

  if (fs.existsSync(MUTANT_FILE)) fs.unlinkSync(MUTANT_FILE);
  const total = Math.round((score1 + score2 + score3) * 10) / 10;
  line(`รวมคะแนนอัตโนมัติ ${total}/13 (+ answers.md อีก 2 คะแนนตรวจเอง)`);
}

try {
  main();
} finally {
  if (fs.existsSync(MUTANT_FILE)) fs.unlinkSync(MUTANT_FILE);
}

// ==========================================
// Food Order - Frontend (HTML/CSS/JavaScript ล้วน)
// เปิดผ่าน npm start แล้วไปที่ http://localhost:3000/app
// ดูเมนูได้ทุกคน / สั่งอาหารและดูคำสั่งซื้อต้องเข้าสู่ระบบ (แนบ JWT ใน header Authorization)
//
// ปุ่ม/ส่วนบนหน้าเว็บ              -> ฟังก์ชัน           -> endpoint ที่เรียก
// -------------------------------------------------------------------------------------
// หน้าต่าง "เข้าสู่ระบบ"            -> login()            -> POST  /api/v1/auth/demo-login
// ป้ายสถานะมุมขวาบน                -> loadHealth()       -> GET   /api/v1/health
// เมนูอาหาร (กรอง/หน้า)  [โจทย์ 3]   -> loadMenu()         -> GET   /api/v1/menu?page=&limit=&available=
// ปุ่ม "สั่งอาหาร"        [โจทย์ 1]   -> placeOrder()       -> POST  /api/v1/orders
// รายการคำสั่งซื้อ                  -> loadOrders()       -> GET   /api/v1/orders
// กดคำสั่งซื้อ                      -> openOrder()        -> GET   /api/v1/orders/:id
// ปุ่ม "เปลี่ยนสถานะ"     [โจทย์ 2]   -> updateStatus()     -> PATCH /api/v1/orders/:id/status
// ==========================================

// เปิดผ่านเซิร์ฟเวอร์ (/app) ใช้ origin เดียวกัน ถ้าเปิดไฟล์จากที่อื่นให้ชี้ไปที่พอร์ต 3000 ตรงๆ
const API_BASE = window.location.pathname.startsWith("/app")
  ? ""
  : "http://localhost:3000";

// ==========================================
// ฟังก์ชันกลางสำหรับเรียก API
// ==========================================

// เรียก API แล้วคืน JSON ถ้า API ตอบ error (4xx/5xx) จะ throw Error พร้อมข้อความจาก API
// ทุกครั้งที่เรียกจะบันทึกลง "บันทึกการเรียก API" ให้เห็น status ที่ได้จริง
async function callApi(method, path, body) {
  const options = { method, headers: {} };
  if (body) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }
  if (session) options.headers.Authorization = `Bearer ${session.token}`;

  let response;
  try {
    response = await fetch(API_BASE + path, options);
  } catch {
    logApi(method, path, null, "เชื่อมต่อไม่ได้");
    throw new Error("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบว่ารัน npm start แล้ว");
  }

  const data = await response.json().catch(() => null);
  logApi(method, path, response.status, data?.error?.code);

  // token หมดอายุหรือไม่ถูกต้อง: ออกจากระบบให้อัตโนมัติ
  if (response.status === 401 && session) {
    clearSession();
    toast("การเข้าสู่ระบบหมดอายุ กรุณาเข้าสู่ระบบใหม่", "warn");
  }

  if (!response.ok) {
    // API ตอบ error รูปแบบ { error: { code, message } }
    const error = new Error(
      data?.error?.message || `เกิดข้อผิดพลาด (HTTP ${response.status})`,
    );
    error.status = response.status;
    throw error;
  }
  return data;
}

// ==========================================
// ตัวช่วยเล็กๆ
// ==========================================

const $ = (id) => document.getElementById(id);

// แปลงอักขระพิเศษก่อนใส่ใน innerHTML กันข้อความจากฐานข้อมูลถูกรันเป็นโค้ด (XSS)
function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

const baht = (value) =>
  `${Number(value).toLocaleString("th-TH", { minimumFractionDigits: 0 })} ฿`;

// ข้อความแจ้งผลมุมขวาล่าง หายไปเองใน 4 วินาที
function toast(message, type = "ok") {
  const box = document.createElement("div");
  box.className = type === "ok" ? "toast" : `toast is-${type}`;
  box.textContent = message;
  $("toasts").append(box);
  setTimeout(() => box.remove(), 4000);
}

// ระหว่างรอ API: ปิดปุ่มและเปลี่ยนข้อความ กันกดซ้ำ แล้วคืนค่าเดิมเมื่อเสร็จ
async function withBusyButton(button, busyText, task) {
  const original = button.textContent;
  button.disabled = true;
  button.textContent = busyText;
  try {
    return await task();
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
}

function showLoading(statusId, text = "กำลังโหลด...") {
  const box = $(statusId);
  box.className = "status";
  box.innerHTML = `<span class="spinner"></span>${escapeHtml(text)}`;
}

function showError(statusId, message, retry) {
  const box = $(statusId);
  box.className = "status is-error";
  box.innerHTML = `<span>${escapeHtml(message)}</span>`;
  if (retry) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-ghost btn-small";
    button.textContent = "ลองใหม่";
    button.addEventListener("click", retry);
    box.append(button);
  }
}

function clearStatus(statusId) {
  $(statusId).innerHTML = "";
}

const STATUS_LABELS = {
  pending: "รอรับออเดอร์",
  preparing: "กำลังทำ",
  delivered: "ส่งแล้ว",
  cancelled: "ยกเลิก",
};

function statusChip(status) {
  const label = STATUS_LABELS[status] || status;
  return `<span class="chip status-${escapeHtml(status)}">${escapeHtml(label)}</span>`;
}

// ==========================================
// บันทึกการเรียก API (เก็บ 12 รายการล่าสุด)
// ==========================================

const LOG_LIMIT = 12;

function logApi(method, path, status, code) {
  const item = document.createElement("li");
  const group = status === null ? "err" : `${String(status)[0]}xx`;
  item.className = `log-${group}`;
  item.innerHTML = `
    <span class="log-status">${status ?? "ERR"}</span>
    <span class="log-path">${escapeHtml(method)} ${escapeHtml(path)}</span>
    ${code ? `<span class="log-message">${escapeHtml(code)}</span>` : ""}`;
  const list = $("api-log");
  list.prepend(item);
  while (list.children.length > LOG_LIMIT) list.lastElementChild.remove();
}

// ==========================================
// ข้อมูลที่หน้าเว็บจำไว้
// ==========================================

let menuPage = 1;
let menuTotalPages = 1;
let menuItems = []; // เมนูในหน้าปัจจุบัน
let orders = [];
let openOrderId = null; // คำสั่งซื้อที่เปิดหน้าต่างรายละเอียดอยู่
const cart = new Map(); // menuItemId -> { id, name, price, available, quantity }

// ==========================================
// การเข้าสู่ระบบ: เก็บ { token, user } ไว้ใน localStorage ให้รีเฟรชหน้าแล้วยังอยู่
// ==========================================

const SESSION_KEY = "food-order-session";

function loadStoredSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

let session = loadStoredSession(); // null = ยังไม่ได้เข้าสู่ระบบ

function saveSession(value) {
  session = value;
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(value));
  } catch {
    // เบราว์เซอร์ไม่ให้เก็บ (เช่นโหมดส่วนตัว) ก็ยังใช้ได้จนกว่าจะรีเฟรชหน้า
  }
  renderAuth();
}

function clearSession() {
  session = null;
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}
  cart.clear();
  orders = [];
  renderAuth();
}

const isStaff = () => ["staff", "admin"].includes(session?.user.role);

// สลับหน้าจอตามสถานะ: <body class="is-guest"> ซ่อนทุกอย่างที่มี class requires-auth (ดู style.css)
function renderAuth() {
  document.body.classList.toggle("is-guest", !session);
  $("user-name").innerHTML = session
    ? `👤 ${escapeHtml(session.user.name)} <span class="role-badge">${escapeHtml(session.user.role)}</span>`
    : "";
  $("orders-hint").textContent = isStaff()
    ? "เห็นคำสั่งซื้อของทุกคน กดเพื่อดูรายละเอียดและเปลี่ยนสถานะ"
    : "เห็นเฉพาะคำสั่งซื้อของตัวเอง กดเพื่อดูรายละเอียด";
  renderMenu();
  renderCart();
  if (session) loadOrders();
}

async function login(userKey) {
  $("auth-error").textContent = "";
  try {
    const result = await callApi("POST", "/api/v1/auth/demo-login", { user: userKey });
    saveSession(result);
    $("auth-dialog").close();
    toast(`เข้าสู่ระบบเป็น ${result.user.name} (${result.user.role})`);
  } catch (err) {
    $("auth-error").textContent = err.message;
  }
}

function openAuthDialog() {
  $("auth-error").textContent = "";
  $("auth-dialog").showModal();
}

// ==========================================
// GET /api/v1/health - สถานะระบบ
// ==========================================

async function loadHealth() {
  const pill = $("health-pill");
  try {
    await callApi("GET", "/api/v1/health");
    pill.className = "pill pill-ok";
    pill.textContent = "● ระบบพร้อมใช้งาน";
  } catch (err) {
    pill.className = "pill pill-error";
    pill.textContent = err.status ? "● ฐานข้อมูลไม่พร้อม" : "● เซิร์ฟเวอร์ไม่ตอบ";
  }
}

// ==========================================
// GET /api/v1/menu - เมนูอาหาร (โจทย์ 3: ถ้า pagination ยังผิด หน้า 1 จะไม่เริ่มที่ #1)
// ==========================================

async function loadMenu() {
  const limit = Number($("page-size").value);
  const params = new URLSearchParams({ page: menuPage, limit });
  if ($("menu-filter").value) params.set("available", $("menu-filter").value);

  showLoading("menu-status");
  try {
    const result = await callApi("GET", `/api/v1/menu?${params}`);
    menuItems = result.data;
    menuTotalPages = Math.max(1, Math.ceil(result.meta.total / result.meta.limit));
    clearStatus("menu-status");
    renderMenu();
    renderPager(result.meta);
  } catch (err) {
    menuItems = [];
    renderMenu();
    $("menu-pager").hidden = true;
    showError("menu-status", err.message, loadMenu);
  }
}

function renderMenu() {
  const list = $("menu-list");
  list.innerHTML = "";
  if (menuItems.length === 0 && !$("menu-status").textContent) {
    $("menu-status").className = "status";
    $("menu-status").textContent = "ไม่มีเมนูในหน้านี้";
    return;
  }
  for (const item of menuItems) {
    const li = document.createElement("li");
    li.className = item.available ? "game" : "game is-unavailable";
    li.innerHTML = `
      <div>
        <p class="game-name">${escapeHtml(item.name)} <span class="menu-id">#${item.id}</span></p>
        <p class="game-meta">
          <span class="menu-price">${baht(item.price)}</span>
          ${item.available ? "" : ' · <span class="chip chip-error">ไม่พร้อมขาย</span>'}
        </p>
      </div>`;
    if (session) {
      const actions = document.createElement("div");
      actions.className = "game-actions";
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn-ghost btn-small";
      // เมนูที่ไม่พร้อมขายยังใส่ตะกร้าได้ เพื่อทดลองว่า API ตอบ 409 MENU_UNAVAILABLE จริง
      button.textContent = item.available ? "ใส่ตะกร้า" : "ลองใส่ตะกร้า";
      button.title = item.available ? "" : "ใช้ทดสอบว่า API ปฏิเสธเมนูที่ไม่พร้อมขาย";
      button.addEventListener("click", () => addToCart(item));
      actions.append(button);
      li.append(actions);
    }
    list.append(li);
  }
}

function renderPager(meta) {
  $("menu-pager").hidden = false;
  $("page-info").textContent = `หน้า ${meta.page} / ${menuTotalPages} (ทั้งหมด ${meta.total} รายการ)`;
  $("page-prev").disabled = menuPage <= 1;
  $("page-next").disabled = menuPage >= menuTotalPages;
}

// ==========================================
// ตะกร้า และ POST /api/v1/orders (โจทย์ 1)
// ==========================================

const QUANTITY_MAX = 20; // ตรงกับข้อกำหนดของ API

function addToCart(item) {
  const existing = cart.get(item.id);
  if (existing) existing.quantity = Math.min(QUANTITY_MAX, existing.quantity + 1);
  else cart.set(item.id, { ...item, quantity: 1 });
  renderCart();
  toast(`เพิ่ม ${item.name} ลงตะกร้า`);
}

function changeQuantity(id, delta) {
  const entry = cart.get(id);
  entry.quantity += delta;
  if (entry.quantity <= 0) cart.delete(id);
  else entry.quantity = Math.min(QUANTITY_MAX, entry.quantity);
  renderCart();
}

function renderCart() {
  const list = $("cart-list");
  list.innerHTML = "";
  $("cart-error").textContent = "";
  $("cart-empty").hidden = cart.size > 0;
  $("cart-summary").hidden = cart.size === 0;

  let total = 0;
  for (const entry of cart.values()) {
    total += entry.price * entry.quantity;
    const li = document.createElement("li");
    li.className = "cart-item";
    li.innerHTML = `
      <span class="cart-name">${escapeHtml(entry.name)}</span>
      <span class="cart-sub">${baht(entry.price)} × ${entry.quantity} = ${baht(entry.price * entry.quantity)}</span>
      <span class="qty">
        <button type="button" class="btn btn-ghost btn-small" aria-label="ลดจำนวน">−</button>
        <output>${entry.quantity}</output>
        <button type="button" class="btn btn-ghost btn-small" aria-label="เพิ่มจำนวน">+</button>
      </span>`;
    const [minus, plus] = li.querySelectorAll("button");
    minus.addEventListener("click", () => changeQuantity(entry.id, -1));
    plus.addEventListener("click", () => changeQuantity(entry.id, 1));
    list.append(li);
  }
  $("cart-total").textContent = baht(total);
}

async function placeOrder() {
  // ส่งแค่ menuItemId กับ quantity ราคาให้เซิร์ฟเวอร์คำนวณเอง
  const items = [...cart.values()].map(({ id, quantity }) => ({ menuItemId: id, quantity }));
  $("cart-error").textContent = "";
  try {
    const result = await withBusyButton($("cart-submit"), "กำลังสั่ง...", () =>
      callApi("POST", "/api/v1/orders", { items }),
    );
    cart.clear();
    renderCart();
    toast(`สั่งสำเร็จ คำสั่งซื้อ #${result.data.id} ยอดรวม ${baht(result.data.total)}`);
    loadOrders();
  } catch (err) {
    $("cart-error").textContent =
      err.status === 501 ? "ยังไม่ได้ทำโจทย์ที่ 1 (API ตอบ 501)" : err.message;
  }
}

// ==========================================
// GET /api/v1/orders - รายการคำสั่งซื้อ
// ==========================================

async function loadOrders() {
  showLoading("orders-status");
  try {
    const result = await callApi("GET", "/api/v1/orders");
    orders = result.data;
    clearStatus("orders-status");
    renderOrders();
  } catch (err) {
    orders = [];
    renderOrders();
    showError("orders-status", err.message, loadOrders);
  }
}

function renderOrders() {
  const list = $("order-list");
  list.innerHTML = "";
  if (orders.length === 0) {
    if (!$("orders-status").textContent) {
      $("orders-status").className = "status";
      $("orders-status").textContent = "ยังไม่มีคำสั่งซื้อ";
    }
    return;
  }
  for (const order of orders) {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "order-row";
    button.innerHTML = `
      <span>
        <strong>#${order.id}</strong> ${escapeHtml(order.customerName)}
        <span class="order-meta">${order.itemCount} รายการ · ${baht(order.total)}</span>
      </span>
      ${statusChip(order.status)}`;
    button.addEventListener("click", () => openOrder(order.id));
    li.append(button);
    list.append(li);
  }
}

// ==========================================
// GET /api/v1/orders/:id และ PATCH /api/v1/orders/:id/status (โจทย์ 2)
// ==========================================

async function openOrder(id) {
  openOrderId = id;
  $("order-dialog-title").textContent = `คำสั่งซื้อ #${id}`;
  $("order-detail").innerHTML = "";
  $("status-form").hidden = true;
  $("status-error").textContent = "";
  $("status-hint").textContent = "";
  $("order-dialog").showModal();
  await loadOrderDetail();
}

async function loadOrderDetail() {
  showLoading("order-dialog-status");
  try {
    const { data } = await callApi("GET", `/api/v1/orders/${openOrderId}`);
    clearStatus("order-dialog-status");
    renderOrderDetail(data);
  } catch (err) {
    showError("order-dialog-status", err.message, loadOrderDetail);
  }
}

function renderOrderDetail(order) {
  const rows = order.items
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.name)}</td>
          <td class="num">${item.quantity}</td>
          <td class="num">${baht(item.subtotal)}</td>
        </tr>`,
    )
    .join("");
  $("order-detail").innerHTML = `
    <p class="hint">${escapeHtml(order.customerName)} · ${new Date(order.createdAt).toLocaleString("th-TH")} · ${statusChip(order.status)}</p>
    <table class="detail-table">
      <thead><tr><th>เมนู</th><th class="num">จำนวน</th><th class="num">ราคา</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td colspan="2">ยอดรวม</td><td class="num">${baht(order.total)}</td></tr></tfoot>
    </table>`;

  // แสดงฟอร์มให้ทุก role เพื่อทดลองโจทย์ 2: customer ควรได้ 403 ถ้า authorizeRole ทำงานถูก
  $("status-form").hidden = false;
  $("status-select").value = order.status;
  $("status-hint").textContent = isStaff()
    ? ""
    : "บัญชี customer ไม่ควรเปลี่ยนสถานะได้ ลองกดดูว่า API ตอบ 403 หรือไม่";
}

async function updateStatus(event) {
  event.preventDefault();
  $("status-error").textContent = "";
  const status = $("status-select").value;
  try {
    await withBusyButton($("status-submit"), "กำลังบันทึก...", () =>
      callApi("PATCH", `/api/v1/orders/${openOrderId}/status`, { status }),
    );
    toast(`เปลี่ยนสถานะ #${openOrderId} เป็น "${STATUS_LABELS[status]}"`);
    await loadOrderDetail();
    loadOrders();
  } catch (err) {
    $("status-error").textContent = `${err.status ?? ""} ${err.message}`.trim();
  }
}

// ==========================================
// ผูก event กับปุ่มต่างๆ แล้วโหลดข้อมูลครั้งแรก
// ==========================================

$("health-pill").addEventListener("click", loadHealth);
$("login-open").addEventListener("click", openAuthDialog);
$("guest-login").addEventListener("click", openAuthDialog);
$("auth-close").addEventListener("click", () => $("auth-dialog").close());
$("logout").addEventListener("click", () => {
  clearSession();
  toast("ออกจากระบบแล้ว");
});
for (const button of document.querySelectorAll(".user-choice")) {
  button.addEventListener("click", () => login(button.dataset.user));
}

$("menu-filter").addEventListener("change", () => {
  menuPage = 1;
  loadMenu();
});
$("page-size").addEventListener("change", () => {
  menuPage = 1;
  loadMenu();
});
$("page-prev").addEventListener("click", () => {
  menuPage -= 1;
  loadMenu();
});
$("page-next").addEventListener("click", () => {
  menuPage += 1;
  loadMenu();
});

$("cart-submit").addEventListener("click", placeOrder);
$("cart-clear").addEventListener("click", () => {
  cart.clear();
  renderCart();
});

$("orders-refresh").addEventListener("click", loadOrders);
$("order-dialog-close").addEventListener("click", () => $("order-dialog").close());
$("status-form").addEventListener("submit", updateStatus);
$("log-clear").addEventListener("click", () => {
  $("api-log").innerHTML = "";
});

renderAuth();
loadHealth();
loadMenu();

/* =========================
   CONFIG
========================= */
const CART_KEY = "bookingCart";

/* =========================
   CART CORE
========================= */
function getCart() {
  return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(service) {
  const cart = getCart();
  cart.push(service);
  saveCart(cart);
}

function removeFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
  renderBooking();
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
}

function updateCartBadge() {
  const badge = document.getElementById("bookingCount");
  if (badge) badge.textContent = getCart().length;
}

/* =========================
   CART RENDER
========================= */
function renderBooking() {
  const cart = getCart();
  const cartEl = document.getElementById("cartItems");
  const totalEl = document.getElementById("total");

  if (!cartEl || !totalEl) return;

  cartEl.innerHTML = "";
  let total = 0;

  cart.forEach((item, index) => {
    total += Number(item.price);
    cartEl.insertAdjacentHTML(
      "beforeend",
      `
      <div class="cart-item">
        <strong>${item.name}</strong>
        ₦${Number(item.price).toLocaleString()}
        <button onclick="removeFromCart(${index})">✕</button>
      </div>
      `
    );
  });

  totalEl.textContent = total.toLocaleString();
}

/* =========================
   CONFIRM BOOKING
========================= */
function confirmBooking() {
  const cart = getCart();
  if (!cart.length) return alert("Add at least one service");

  const profile = JSON.parse(localStorage.getItem("userProfile") || "{}");

  const booking = {
    name: profile.name,
    email: profile.email,
    phone: profile.phone,
    date: getValue("date"),
    time: getValue("time"),
    services: cart.map(s => s.name).join(", "),
    total: cart.reduce((s, i) => s + Number(i.price), 0),
    status: "pending",
    paymentMethod: "Bank Transfer"
  };

  const bookings = JSON.parse(localStorage.getItem("bookings") || "[]");
  bookings.push(booking);
  localStorage.setItem("bookings", JSON.stringify(bookings));

  notifyAdmin(booking);
  clearCart();

  alert("Booking submitted successfully");
  location.href = "index.html";
}

/* =========================
   WHATSAPP NOTIFY ADMIN
========================= */
function notifyAdmin(b) {
  const adminProfile = JSON.parse(localStorage.getItem("adminProfile") || {});
  const adminPhone = adminProfile.phone || SPA_DATA.whatsappAdmin;
  if (!adminPhone) return;

  const message = `
New Booking 📅
Name: ${b.name}
Services: ${b.services}
Total: ₦${b.total}
Date: ${b.date}
Time: ${b.time}
Phone: ${b.phone}
`;

  window.open(
    `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`,
    "_blank"
  );
}

/* =========================
   HELPERS
========================= */
function getValue(id) {
  return document.getElementById(id)?.value || "";
}

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  renderBooking();
});

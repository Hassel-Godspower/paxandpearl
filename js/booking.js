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
        <div>
          <strong>${item.name}</strong>
          <p>₦${Number(item.price).toLocaleString()}</p>
        </div>
        <button onclick="removeFromCart(${index})">✕</button>
      </div>
      `
    );
  });

  totalEl.textContent = total.toLocaleString();
}

/* =========================
   PAGE LOAD
========================= */

document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  renderBooking();
});

/* =========================
   CONFIRM CART BOOKING
========================= */

function confirmBooking() {
  const cart = getCart();

  if (!cart.length) {
    alert("Please add at least one service.");
    return;
  }

  const bookingData = {
    name: getValue("name"),
    email: getValue("email"),
    phone: getValue("phone"),
    date: getValue("date"),
    time: getValue("time"),
    services: cart.map(s => s.name).join(", "),
    total: cart.reduce((sum, s) => sum + Number(s.price), 0),
    paymentMethod: "Bank Transfer"
  };

  sendWhatsAppBooking(bookingData);
  clearCart();

  alert("Booking sent. We’ll contact you shortly.");
  location.href = "index.html";
}

/* =========================
   SERVICE LIST RENDERING
========================= */

const serviceList = document.getElementById("serviceList");

if (serviceList) {
  SPA_DATA.services.forEach(service => {
    serviceList.insertAdjacentHTML("beforeend", renderServiceCard(service));
  });
}

function renderServiceCard(service) {
  return `
    <div class="card">
      <h3>${service.name}</h3>
      <p><strong>₦${service.price.toLocaleString()}</strong></p>

      <input placeholder="Your Name" id="name-${service.id}">
      <input placeholder="Email" id="email-${service.id}">
      <input placeholder="WhatsApp Number" id="phone-${service.id}">
      <input type="date" id="date-${service.id}">
      <input type="time" id="time-${service.id}">

      <button class="btn" onclick="bookSingleService(${service.id})">
        Book via WhatsApp
      </button>
    </div>
  `;
}

/* =========================
   SINGLE SERVICE BOOKING
========================= */

function bookSingleService(serviceId) {
  const service = SPA_DATA.services.find(s => s.id === serviceId);
  if (!service) return;

  const bookingData = {
    name: getValue(`name-${serviceId}`),
    email: getValue(`email-${serviceId}`),
    phone: getValue(`phone-${serviceId}`),
    date: getValue(`date-${serviceId}`),
    time: getValue(`time-${serviceId}`),
    service: service.name,
    price: service.price
  };

  sendWhatsAppBooking(bookingData);
}

/* =========================
   HELPERS
========================= */

function getValue(id) {
  return document.getElementById(id)?.value || "";
}

function sendWhatsAppBooking(data) {
  const message = `
New Spa Booking
Name: ${data.name}
Service(s): ${data.service || data.services}
${data.price ? `Price: ₦${data.price}` : `Total: ₦${data.total}`}
Date: ${data.date}
Time: ${data.time}
Phone: ${data.phone}
Email: ${data.email}
${data.paymentMethod ? `Payment: ${data.paymentMethod}` : ""}
`;

  window.open(
    `https://wa.me/${SPA_DATA.whatsappAdmin}?text=${encodeURIComponent(message)}`,
    "_blank"
  );
}

/* ============================
   SERVICE LIST RENDERING
============================ */

const serviceList = document.getElementById("serviceList");

SPA_DATA.services.forEach(service => {
  serviceList.insertAdjacentHTML("beforeend", renderServiceCard(service));
});

function renderServiceCard(service) {
  return `
    <div class="card">
      <h3>${service.name}</h3>
      <p><strong>$${service.price}</strong></p>

      <input placeholder="Your Name" id="name-${service.id}">
      <input placeholder="Email" id="email-${service.id}">
      <input placeholder="WhatsApp Number" id="phone-${service.id}">
      <input type="date" id="date-${service.id}">
      <input type="time" id="time-${service.id}">

      <button class="btn" onclick="bookService(${service.id})">
        Book via WhatsApp
      </button>
    </div>
  `;
}


/* ============================
   SINGLE SERVICE BOOKING
============================ */

function bookService(serviceId) {
  const service = SPA_DATA.services.find(s => s.id === serviceId);

  const bookingData = {
    name: getValue(`name-${serviceId}`),
    email: getValue(`email-${serviceId}`),
    phone: getValue(`phone-${serviceId}`),
    date: getValue(`date-${serviceId}`),
    time: getValue(`time-${serviceId}`),
    service: service.name,
    price: service.price
  };

  saveToLocalStorage("bookings", bookingData);
  sendWhatsAppBooking(bookingData);
}


/* ============================
   CART SUMMARY
============================ */

const cartItemsEl = document.getElementById("cartItems");
const totalEl = document.getElementById("total");

const cart = JSON.parse(localStorage.getItem("cart") || "[]");
let totalAmount = 0;

cart.forEach(item => {
  totalAmount += Number(item.price);
  cartItemsEl.insertAdjacentHTML(
    "beforeend",
    `<p>${item.name} - $${item.price}</p>`
  );
});

totalEl.innerText = totalAmount;


/* ============================
   MULTI-SERVICE BOOKING
============================ */

function confirmBooking() {
  const bookingData = {
    name: nameInput.value,
    email: emailInput.value,
    phone: phoneInput.value,
    date: dateInput.value,
    time: timeInput.value,
    services: cart.map(item => item.name).join(", "),
    total: totalAmount,
    paymentMethod: "Bank Transfer"
  };

  saveBooking(bookingData);
  createCalendarEvent(
    bookingData.name,
    bookingData.services,
    bookingData.date,
    bookingData.time
  );

  sendWhatsAppBooking(bookingData);

  alert("Booking sent. Complete payment to confirm.");
}


/* ============================
   HELPERS
============================ */

function getValue(id) {
  return document.getElementById(id)?.value || "";
}

function saveToLocalStorage(key, data) {
  const existing = JSON.parse(localStorage.getItem(key) || "[]");
  existing.push(data);
  localStorage.setItem(key, JSON.stringify(existing));
}

function sendWhatsAppBooking(data) {
  const message = `
New Spa Booking:
Name: ${data.name}
Service(s): ${data.service || data.services}
${data.price ? `Price: $${data.price}` : `Total: $${data.total}`}
Date: ${data.date}
Time: ${data.time}
Phone: ${data.phone}
Email: ${data.email}
${data.paymentMethod ? `\nPayment Method: ${data.paymentMethod}` : ""}
`;

  window.open(
    `https://wa.me/${SPA_DATA.whatsappAdmin}?text=${encodeURIComponent(message)}`
  );
}

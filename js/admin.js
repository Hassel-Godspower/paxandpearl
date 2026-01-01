/* ============================
   AUTH GUARD
============================ */

if (!localStorage.getItem("admin")) {
  window.location.href = "admin.html";
}


/* ============================
   DOM REFERENCES
============================ */

const bookingsContainer = document.getElementById("bookings");
const servicesContainer = document.getElementById("services");


/* ============================
   LOAD DATA
============================ */

const bookings = JSON.parse(localStorage.getItem("bookings") || "[]");
const services = SPA_DATA.services;


/* ============================
   RENDER BOOKINGS
============================ */

function renderBookings() {
  bookingsContainer.innerHTML = "";

  if (!bookings.length) {
    bookingsContainer.innerHTML = "<p>No bookings yet.</p>";
    return;
  }

  bookings.forEach(booking => {
    bookingsContainer.insertAdjacentHTML(
      "beforeend",
      bookingCardTemplate(booking)
    );
  });
}

function bookingCardTemplate(b) {
  return `
    <div class="card">
      <strong>${b.name}</strong><br>
      ${b.service || b.services}<br>
      ${b.total ? `Total: $${b.total}<br>` : ""}
      ${b.date ? `${b.date} @ ${b.time}<br>` : ""}
      📞 ${b.phone}<br>
      ✉️ ${b.email}
    </div>
  `;
}


/* ============================
   RENDER SERVICES & PRICES
============================ */

function renderServices() {
  servicesContainer.innerHTML = "";

  services.forEach(service => {
    servicesContainer.insertAdjacentHTML(
      "beforeend",
      servicePriceTemplate(service)
    );
  });
}

function servicePriceTemplate(service) {
  return `
    <div class="card">
      <strong>${service.name}</strong><br>
      <input 
        type="number"
        value="${service.price}"
        onchange="updatePrice(${service.id}, this.value)"
      >
    </div>
  `;
}


/* ============================
   UPDATE SERVICE PRICE
============================ */

function updatePrice(serviceId, newPrice) {
  const service = services.find(s => s.id === serviceId);
  if (!service) return;

  service.price = Number(newPrice);

  // TODO: Persist to backend or localStorage
  alert("Price updated. Persist to backend when ready.");
}


/* ============================
   INITIALIZE
============================ */

renderBookings();
renderServices();

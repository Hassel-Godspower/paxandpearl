/* ============================
   AUTH GUARD (TOKEN BASED)
============================ */
const token = localStorage.getItem("adminToken");

if (!token) {
  window.location.href = "/admin-1993/login.html";
}

/* ============================
   DOM REFERENCES
============================ */
const bookingsContainer = document.getElementById("bookings");
const servicesContainer = document.getElementById("services");
const adminPhoneInput = document.getElementById("adminPhone");
const logoutBtn = document.getElementById("logoutBtn");

/* ============================
   LOAD DATA
============================ */
const bookings = JSON.parse(localStorage.getItem("bookings") || "[]");
const services =
  JSON.parse(localStorage.getItem("services")) || SPA_DATA.services;

const adminProfile = JSON.parse(localStorage.getItem("adminProfile") || {});

/* ============================
   ADMIN PROFILE
============================ */
if (adminPhoneInput && adminProfile.phone) {
  adminPhoneInput.value = adminProfile.phone;
}

function saveAdminProfile() {
  localStorage.setItem(
    "adminProfile",
    JSON.stringify({
      phone: adminPhoneInput.value.trim()
    })
  );
  alert("Admin WhatsApp number saved");
}

/* ============================
   LOGOUT
============================ */
function logoutAdmin() {
  localStorage.removeItem("adminToken");
  window.location.href = "/admin-1993/login.html";
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", logoutAdmin);
}

/* ============================
   RENDER BOOKINGS
============================ */
function renderBookings() {
  bookingsContainer.innerHTML = "";

  if (!bookings.length) {
    bookingsContainer.innerHTML = "<p>No bookings yet.</p>";
    return;
  }

  bookings.forEach(b => {
    bookingsContainer.insertAdjacentHTML(
      "beforeend",
      `
      <div class="card">
        <strong>${b.name}</strong><br>
        ${b.services}<br>
        <strong>Total:</strong> ₦${Number(b.total).toLocaleString()}<br>
        ${b.date} @ ${b.time}<br>
        📞 ${b.phone}<br>
        ✉️ ${b.email}<br>
        <strong>Status:</strong> ${b.status?.toUpperCase() || "PENDING"}
      </div>
      `
    );
  });
}

/* ============================
   SERVICES & PRICE UPDATE
============================ */
function renderServices() {
  servicesContainer.innerHTML = "";

  services.forEach(service => {
    servicesContainer.insertAdjacentHTML(
      "beforeend",
      `
      <div class="card">
        <strong>${service.name}</strong><br>
        <input
          type="number"
          value="${service.price}"
          onchange="updatePrice(${service.id}, this.value)"
        >
      </div>
      `
    );
  });
}

function updatePrice(id, price) {
  const service = services.find(s => s.id === id);
  if (!service) return;

  service.price = Number(price);
  localStorage.setItem("services", JSON.stringify(services));
  alert("Price updated successfully");
}

/* ============================
   INIT
============================ */
renderBookings();
renderServices();

/* ============================
   AUTH GUARD
============================ */
if (!localStorage.getItem("adminSession")) {
  window.location.href = "admin.html";
}

/* ============================
   DOM REFERENCES
============================ */
const bookingsContainer = document.getElementById("bookings");
const servicesContainer = document.getElementById("services");
const adminPhoneInput = document.getElementById("adminPhone");

/* ============================
   LOAD DATA
============================ */
const bookings = JSON.parse(localStorage.getItem("bookings") || "[]");
const services = SPA_DATA.services;
const adminProfile = JSON.parse(localStorage.getItem("adminProfile") || "{}");

/* ============================
   ADMIN PROFILE
============================ */
if (adminPhoneInput && adminProfile.phone) {
  adminPhoneInput.value = adminProfile.phone;
}

function saveAdminProfile() {
  localStorage.setItem("adminProfile", JSON.stringify({
    phone: adminPhoneInput.value
  }));
  alert("Admin WhatsApp saved");
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
        Total: ₦${Number(b.total).toLocaleString()}<br>
        ${b.date} @ ${b.time}<br>
        📞 ${b.phone}<br>
        ✉️ ${b.email}
      </div>
      `
    );
  });
}

/* ============================
   SERVICES
============================ */
function renderServices() {
  servicesContainer.innerHTML = "";

  services.forEach(service => {
    servicesContainer.insertAdjacentHTML(
      "beforeend",
      `
      <div class="card">
        <strong>${service.name}</strong><br>
        <input type="number" value="${service.price}"
          onchange="updatePrice(${service.id}, this.value)">
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
  alert("Price updated");
}

renderBookings();
renderServices();

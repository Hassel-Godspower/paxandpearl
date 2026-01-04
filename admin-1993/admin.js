/* ============================
   AUTH GUARD (TOKEN BASED)
============================ */
if (!localStorage.getItem("adminToken")) {
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
let bookings = JSON.parse(localStorage.getItem("bookings") || "[]");
let services =
  JSON.parse(localStorage.getItem("services")) || SPA_DATA.services;

const adminProfile = JSON.parse(localStorage.getItem("adminProfile") || "{}");

/* ============================
   ADMIN PROFILE
============================ */
if (adminPhoneInput && adminProfile.phone) {
  adminPhoneInput.value = adminProfile.phone;
}

function saveAdminProfile() {
  localStorage.setItem(
    "adminProfile",
    JSON.stringify({ phone: adminPhoneInput.value.trim() })
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

logoutBtn?.addEventListener("click", logoutAdmin);

/* ============================
   BOOKINGS
============================ */
function renderBookings() {
  bookingsContainer.innerHTML = "";

  if (!bookings.length) {
    bookingsContainer.innerHTML = "<p>No bookings yet.</p>";
    updateStats();
    return;
  }

  bookings.forEach((b, index) => {
    const status = b.status || "pending";

    bookingsContainer.insertAdjacentHTML(
      "beforeend",
      `
      <div class="card" style="margin-bottom:16px;">
        <strong>${b.name}</strong><br>
        ${b.services}<br>
        <strong>Total:</strong> ₦${Number(b.total).toLocaleString()}<br>
        ${b.date} @ ${b.time}<br>
        📞 ${b.phone}<br>
        ✉️ ${b.email}<br>

        <strong>Status:</strong>
        <span style="font-weight:600;color:${
          status === "approved"
            ? "green"
            : status === "cancelled"
            ? "red"
            : "orange"
        }">
          ${status.toUpperCase()}
        </span>

        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
          <button onclick="updateBookingStatus(${index}, 'approved')">Approve</button>
          <button onclick="updateBookingStatus(${index}, 'cancelled')">Cancel</button>
          <a href="https://wa.me/${b.phone}" target="_blank">Message Customer</a>
        </div>
      </div>
      `
    );
  });

  updateStats();
}

function updateBookingStatus(index, status) {
  bookings[index].status = status;
  localStorage.setItem("bookings", JSON.stringify(bookings));
  renderBookings();
}

/* ============================
   DASHBOARD STATS
============================ */
function updateStats() {
  const totalBookings = document.getElementById("totalBookings");
  const totalRevenue = document.getElementById("totalRevenue");
  const pendingCount = document.getElementById("pendingCount");
  const approvedCount = document.getElementById("approvedCount");

  let revenue = 0,
    pending = 0,
    approved = 0;

  bookings.forEach(b => {
    if (b.status === "approved") {
      revenue += Number(b.total);
      approved++;
    } else {
      pending++;
    }
  });

  totalBookings.textContent = bookings.length;
  totalRevenue.textContent = revenue.toLocaleString();
  pendingCount.textContent = pending;
  approvedCount.textContent = approved;
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
        <input type="number"
          value="${service.price}"
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

/* ============================
   INIT
============================ */
renderBookings();
renderServices();

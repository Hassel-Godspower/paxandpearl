/* ============================
   AUTH GUARD (TOKEN BASED)
============================ */
const token = localStorage.getItem("adminToken");

if (!token) {
  window.location.href = "/admin-1993/login.html";
}
if (!localStorage.getItem("adminToken")) {
  window.location.href = "/admin-1993/admin.html";
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
        <span style="
          color:${status === "approved" ? "green" : status === "cancelled" ? "red" : "orange"};
          font-weight:600;
        ">
          ${status.toUpperCase()}
        </span>

        <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
          <button onclick="updateBookingStatus(${index}, 'approved')">Approve</button>
          <button onclick="updateBookingStatus(${index}, 'cancelled')">Cancel</button>
          <a 
            href="https://wa.me/${b.phone}?text=${encodeURIComponent(
              `Hello ${b.name}, your booking status is ${status.toUpperCase()}`
            )}"
            target="_blank"
          >
            Message Customer
          </a>
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

function updateStats() {
  document.getElementById("totalBookings").textContent = bookings.length;

  let revenue = 0;
  let pending = 0;
  let approved = 0;

  bookings.forEach(b => {
    if (b.status === "approved") {
      revenue += Number(b.total);
      approved++;
    }
    if (!b.status || b.status === "pending") {
      pending++;
    }
  });

  document.getElementById("totalRevenue").textContent =
    revenue.toLocaleString();

  document.getElementById("pendingCount").textContent = pending;
  document.getElementById("approvedCount").textContent = approved;
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

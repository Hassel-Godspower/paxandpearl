/* ============================
   AUTH GUARD (MATCH DASHBOARD)
============================ */
if (sessionStorage.getItem("adminSession") !== "true") {
  window.location.href = "/admin-1993/login.html";
}

/* ============================
   GLOBAL STATE
============================ */
let bookings = JSON.parse(localStorage.getItem("bookings") || "[]");
let services = JSON.parse(localStorage.getItem("services") || "[]");
let adminProfile = JSON.parse(localStorage.getItem("adminProfile") || "{}");

/* ============================
   DOM READY
============================ */
document.addEventListener("DOMContentLoaded", () => {
  cacheDOM();
  bindAdminWhatsApp();
  renderStats();
  renderBookings();
  renderServices();
  bindLogout();
});

/* ============================
   CACHE DOM
============================ */
let bookingsContainer,
    servicesContainer,
    adminPhoneInput,
    headerWhatsApp;

function cacheDOM() {
  bookingsContainer = document.getElementById("bookings");
  servicesContainer = document.getElementById("services");
  adminPhoneInput = document.getElementById("adminPhone");
  headerWhatsApp = document.getElementById("headerWhatsApp");
}

/* ============================
   ADMIN WHATSAPP
============================ */
function normalizePhone(phone) {
  phone = phone.replace(/[^\d]/g, "");
  if (phone.startsWith("0")) phone = "234" + phone.slice(1);
  return phone;
}

function bindAdminWhatsApp() {
  const saveBtn = document.getElementById("saveAdminPhone");

  if (adminProfile.phone) {
    adminPhoneInput.value = adminProfile.phone;
    headerWhatsApp.textContent = `WhatsApp: ${adminProfile.phone}`;
  }

  saveBtn.onclick = () => {
    const phone = normalizePhone(adminPhoneInput.value.trim());

    if (!phone.startsWith("234") || phone.length < 13) {
      return alert("Enter valid Nigerian WhatsApp number (234XXXXXXXXXX)");
    }

    adminProfile.phone = phone;
    localStorage.setItem("adminProfile", JSON.stringify(adminProfile));
    headerWhatsApp.textContent = `WhatsApp: ${phone}`;
    alert("Admin WhatsApp saved ✅");
  };
}

/* ============================
   DASHBOARD STATS
============================ */
function renderStats() {
  const totalBookings = document.getElementById("totalBookings");
  const totalRevenue = document.getElementById("totalRevenue");
  const pendingCount = document.getElementById("pendingCount");
  const approvedCount = document.getElementById("approvedCount");

  let revenue = 0,
      pending = 0,
      approved = 0;

  bookings.forEach(b => {
    if (b.status === "approved") {
      revenue += Number(b.total || 0);
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
   BOOKINGS MANAGEMENT
============================ */
function renderBookings() {
  if (!bookingsContainer) return;
  bookingsContainer.innerHTML = "";

  if (!bookings.length) {
    bookingsContainer.innerHTML = "<p>No bookings yet.</p>";
    return;
  }

  bookings.forEach((b, i) => {
    bookingsContainer.insertAdjacentHTML(
      "beforeend",
      `
      <div class="card">
        <strong>${b.name}</strong><br>
        ${b.services}<br>
        ₦${Number(b.total).toLocaleString()}<br>
        ${b.date} @ ${b.time}<br>
        📞 ${b.phone}<br>

        <label>Status</label>
        <select onchange="updateBookingStatus(${i}, this.value)">
          <option value="pending" ${b.status==="pending"?"selected":""}>Pending</option>
          <option value="approved" ${b.status==="approved"?"selected":""}>Approved</option>
          <option value="cancelled" ${b.status==="cancelled"?"selected":""}>Cancelled</option>
        </select>

        <label>Admin Note</label>
        <textarea
          placeholder="Internal note"
          onblur="saveBookingNote(${i}, this.value)"
        >${b.note || ""}</textarea>

        <a href="https://wa.me/${b.phone}" target="_blank">Message Customer</a>
      </div>
      `
    );
  });
}

window.updateBookingStatus = (index, status) => {
  bookings[index].status = status;
  persistBookings();
};

window.saveBookingNote = (index, note) => {
  bookings[index].note = note;
  persistBookings();
};

function persistBookings() {
  localStorage.setItem("bookings", JSON.stringify(bookings));
  renderStats();
}

/* ============================
   SERVICES MANAGEMENT
============================ */
function renderServices() {
  if (!servicesContainer) return;
  servicesContainer.innerHTML = "";

  services.forEach((s, i) => {
    servicesContainer.insertAdjacentHTML(
      "beforeend",
      `
      <div class="card">
        <strong>${s.name}</strong>

        <input type="number"
          value="${s.price}"
          onchange="updateServicePrice(${i}, this.value)">

        <label>
          <input type="checkbox"
            ${s.active !== false ? "checked" : ""}
            onchange="toggleService(${i}, this.checked)">
          Active
        </label>
      </div>
      `
    );
  });
}

window.updateServicePrice = (i, price) => {
  services[i].price = Number(price);
  localStorage.setItem("services", JSON.stringify(services));
};

window.toggleService = (i, active) => {
  services[i].active = active;
  localStorage.setItem("services", JSON.stringify(services));
};

/* ============================
   LOGOUT
============================ */
function bindLogout() {
  const logoutBtn = document.getElementById("logoutBtn");
  logoutBtn.onclick = () => {
    sessionStorage.removeItem("adminSession");
    window.location.href = "/admin-1993/login.html";
  };
}

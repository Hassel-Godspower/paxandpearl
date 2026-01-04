/* ============================
   AUTH GUARD
============================ */
if (!localStorage.getItem("adminToken")) {
  window.location.href = "/admin-1993/login.html";
}

/* ============================
   DOM READY
============================ */
document.addEventListener("DOMContentLoaded", () => {

  /* ============================
     DOM REFERENCES
  ============================ */
  const adminPhoneInput = document.getElementById("adminPhone");
  const saveBtn = document.getElementById("saveAdminPhone");
  const adminPhoneStatus = document.getElementById("adminPhoneStatus");
  const headerWhatsApp = document.getElementById("headerWhatsApp");
  const logoutBtn = document.getElementById("logoutBtn");
  const bookingsContainer = document.getElementById("bookings");
  const servicesContainer = document.getElementById("services");

  /* ============================
     LOAD DATA
  ============================ */
  let bookings = JSON.parse(localStorage.getItem("bookings") || "[]");
  let services = JSON.parse(localStorage.getItem("services")) || SPA_DATA.services;

  /* ============================
     LOAD SAVED ADMIN PROFILE
  ============================ */
  function getAdminProfile() {
    return JSON.parse(localStorage.getItem("adminProfile") || "{}");
  }

  function updateAdminPhoneStatus() {
    const profile = getAdminProfile();
    if (profile.phone) {
      adminPhoneStatus.textContent = "✅ Admin WhatsApp saved";
      adminPhoneStatus.style.color = "green";
      adminPhoneInput.value = profile.phone;
    } else {
      adminPhoneStatus.textContent = "❌ No WhatsApp set";
      adminPhoneStatus.style.color = "red";
      adminPhoneInput.value = "";
    }
  }

  function updateHeaderWhatsApp() {
    const profile = getAdminProfile();
    if (profile.phone && headerWhatsApp) {
      headerWhatsApp.textContent = `WhatsApp: ${profile.phone}`;
    } else if (headerWhatsApp) {
      headerWhatsApp.textContent = "";
    }
  }

  updateAdminPhoneStatus();
  updateHeaderWhatsApp();

  /* ============================
     PHONE NORMALIZER
  ============================ */
  function normalizePhone(phone) {
    phone = phone.replace(/[^\d]/g, ""); // remove all non-digits
    if (phone.startsWith("0")) phone = "234" + phone.slice(1);
    return phone;
  }

  /* ============================
     SAVE ADMIN WHATSAPP
  ============================ */
  saveBtn?.addEventListener("click", () => {
    if (!adminPhoneInput) return;

    const rawPhone = adminPhoneInput.value.trim();
    if (!rawPhone) {
      alert("Please enter a WhatsApp number");
      return;
    }

    const phone = normalizePhone(rawPhone);

    if (!phone.startsWith("234") || phone.length < 13) {
      alert("Enter a valid Nigerian WhatsApp number (234XXXXXXXXXX)");
      return;
    }

    // Save to localStorage
    localStorage.setItem("adminProfile", JSON.stringify({ phone }));

    alert("Admin WhatsApp saved successfully ✅");

    // Update status and header
    updateAdminPhoneStatus();
    updateHeaderWhatsApp();
  });

  /* ============================
     UNSAVED CHANGES INDICATOR
  ============================ */
  adminPhoneInput?.addEventListener("input", () => {
    if (adminPhoneStatus) {
      adminPhoneStatus.textContent = "⚠️ Unsaved changes";
      adminPhoneStatus.style.color = "orange";
    }
  });

  /* ============================
     LOGOUT
  ============================ */
  logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem("adminToken");
    window.location.href = "/admin-1993/login.html";
  });

  /* ============================
     BOOKINGS MANAGEMENT
  ============================ */
  function renderBookings() {
    if (!bookingsContainer) return;
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

    totalBookings && (totalBookings.textContent = bookings.length);
    totalRevenue && (totalRevenue.textContent = revenue.toLocaleString());
    pendingCount && (pendingCount.textContent = pending);
    approvedCount && (approvedCount.textContent = approved);
  }

  /* ============================
     SERVICES MANAGEMENT
  ============================ */
  function renderServices() {
    if (!servicesContainer) return;
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

  window.updatePrice = (id, price) => {
    const service = services.find(s => s.id === id);
    if (!service) return;

    service.price = Number(price);
    localStorage.setItem("services", JSON.stringify(services));
    alert("Price updated ✅");
  };

  /* ============================
     INIT
  ============================ */
  renderBookings();
  renderServices();
});

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
  const adminPhoneInput = document.getElementById("adminPhone");
  const saveBtn = document.getElementById("saveAdminPhone");
  const logoutBtn = document.getElementById("logoutBtn");

  if (!adminPhoneInput || !saveBtn) return;

  /* ============================
     LOAD SAVED ADMIN PROFILE
  ============================ */
  const storedProfile =
    JSON.parse(localStorage.getItem("adminProfile")) || {};

  if (storedProfile.phone) {
    adminPhoneInput.value = storedProfile.phone;
  }

  /* ============================
     NORMALIZE PHONE
  ============================ */
  function normalizePhone(phone) {
    phone = phone.replace(/[^\d]/g, "");

    if (phone.startsWith("0")) {
      phone = "234" + phone.slice(1);
    }

    return phone;
  }

  /* ============================
     SAVE ADMIN WHATSAPP
  ============================ */
  saveBtn.addEventListener("click", () => {
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

    localStorage.setItem(
      "adminProfile",
      JSON.stringify({ phone })
    );

    alert("Admin WhatsApp saved successfully ✅");
  });

   const adminPhoneStatus = document.getElementById("adminPhoneStatus");

   function updateAdminPhoneStatus() {
     const adminProfile = JSON.parse(
       localStorage.getItem("adminProfile") || "{}"
     );
   
     if (adminProfile.phone) {
       adminPhoneStatus.textContent = "✅ Admin WhatsApp saved";
       adminPhoneStatus.style.color = "green";
     } else {
       adminPhoneStatus.textContent = "❌ No WhatsApp set";
       adminPhoneStatus.style.color = "red";
     }
   }

   // On page load
   updateAdminPhoneStatus();
   
   // After saving
   function saveAdminProfile() {
     ...
     localStorage.setItem("adminProfile", JSON.stringify(adminProfile));
     updateAdminPhoneStatus();
   }

   function updateAdminPhoneStatus() {
     const adminProfile = JSON.parse(
       localStorage.getItem("adminProfile") || "{}"
     );
   
     if (adminProfile.phone) {
       adminPhoneStatus.textContent = "✅ Admin WhatsApp saved";
       adminPhoneStatus.style.color = "green";
       adminPhoneInput.value = adminProfile.phone;
     }
   }

      adminPhoneInput.addEventListener("input", () => {
      adminPhoneStatus.textContent = "Unsaved changes";
      adminPhoneStatus.style.color = "orange";
   });

   const headerWhatsApp = document.getElementById("headerWhatsApp");

   function updateHeaderWhatsApp() {
     const adminProfile = JSON.parse(
       localStorage.getItem("adminProfile") || "{}"
     );
   
     if (adminProfile.phone && headerWhatsApp) {
       headerWhatsApp.textContent = `WhatsApp: ${adminProfile.phone}`;
     }
   }
   
   updateHeaderWhatsApp();

   console.log(
     "Admin Profile:",
     JSON.parse(localStorage.getItem("adminProfile"))
   );

  /* ============================
     LOGOUT
  ============================ */
  logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem("adminToken");
    window.location.href = "/admin-1993/login.html";
  });
});


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

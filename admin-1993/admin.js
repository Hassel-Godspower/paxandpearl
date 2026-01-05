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
   SPA CATALOG (SINGLE SOURCE)
============================ */
let catalog = JSON.parse(localStorage.getItem("spaCatalog"));

if (!catalog) {
  catalog = {
    categories: [],
    services: []
  };
  localStorage.setItem("spaCatalog", JSON.stringify(catalog));
}

/* ============================
   DOM READY
============================ */
document.addEventListener("DOMContentLoaded", () => {
  cacheDOM();
  bindAdminWhatsApp();
  bindCatalogActions();
  renderServices();
  refreshCategorySelect();
  renderStats();
  renderBookings();
  bindLogout();
});

/* ============================
   CACHE DOM
============================ */
let categoryInput,
    addCategoryBtn,
    serviceNameInput,
    serviceDescriptionInput,
    servicePriceInput,
    serviceDurationInput,
    serviceCategorySelect,
    addServiceBtn;

function cacheDOM() {
  servicesContainer = document.getElementById("services");

  categoryInput = document.getElementById("categoryName");
  addCategoryBtn = document.getElementById("addCategory");

  serviceNameInput = document.getElementById("serviceName");
  serviceDescriptionInput = document.getElementById("serviceDescription");
  servicePriceInput = document.getElementById("servicePrice");
  serviceDurationInput = document.getElementById("serviceDuration");
  serviceCategorySelect = document.getElementById("serviceCategory");
  addServiceBtn = document.getElementById("addService");
}
function bindCatalogActions() {
  addCategoryBtn?.addEventListener("click", () => {
    const name = categoryInput.value.trim();
    if (!name) return alert("Enter category name");

    const id = name.toLowerCase().replace(/\s+/g, "-");

    if (catalog.categories.some(c => c.id === id)) {
      return alert("Category already exists");
    }

    catalog.categories.push({ id, name });
    persistCatalog();

    categoryInput.value = "";
    refreshCategorySelect();
    alert("Category added ✅");
  });

  addServiceBtn?.addEventListener("click", addService);
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

  catalog.services
    .sort((a, b) => a.order - b.order)
    .forEach(service => {
      servicesContainer.insertAdjacentHTML(
        "beforeend",
        `
        <div class="card" draggable="true" data-id="${service.id}">
          <strong>${service.name}</strong><br>
          <small>${service.description}</small><br>
          ₦${service.price.toLocaleString()} • ${service.duration} mins

          <div class="row">
            <button class="btn btn-primary" onclick="editService('${service.id}')">Edit</button>
            <button class="btn btn-primary" onclick="deleteService('${service.id}')">Delete</button>
          </div>
        </div>
        `
      );
    });
}

  enableDragSort();
}
window.editService = function (id) {
  const service = catalog.services.find(s => s.id === id);
  if (!service) return;

  const name = prompt("Service name", service.name);
  const price = prompt("Price", service.price);
  const duration = prompt("Duration (minutes)", service.duration);

  if (!name || !price || !duration) return;

  service.name = name;
  service.price = Number(price);
  service.duration = Number(duration);

  localStorage.setItem("spaCatalog", JSON.stringify(catalog));
  renderServices();
};

window.deleteService = function (id) {
  if (!confirm("Delete this service?")) return;

  catalog.services = catalog.services.filter(s => s.id !== id);
  localStorage.setItem("spaCatalog", JSON.stringify(catalog));
  renderServices();
};
function enableDragSort() {
  let dragged;

  document.querySelectorAll(".card[draggable]").forEach(card => {
    card.addEventListener("dragstart", e => {
      dragged = card;
      e.dataTransfer.effectAllowed = "move";
    });

    card.addEventListener("dragover", e => {
      e.preventDefault();
    });

    card.addEventListener("drop", e => {
      e.preventDefault();
      if (dragged !== card) {
        card.before(dragged);
        updateServiceOrder();
      }
    });
  });
}

function updateServiceOrder() {
  document.querySelectorAll(".card[draggable]").forEach((card, index) => {
    const service = catalog.services.find(s => s.id === card.dataset.id);
    if (service) service.order = index;
  });

  localStorage.setItem("spaCatalog", JSON.stringify(catalog));
}
function renderRevenueByCategory() {
  const container = document.getElementById("revenueByCategory");
  if (!container) return;

  const revenueMap = {};

  bookings.forEach(b => {
    if (b.status !== "approved") return;

    b.items?.forEach(item => {
      const service = catalog.services.find(s => s.name === item.name);
      if (!service) return;

      revenueMap[service.category] =
        (revenueMap[service.category] || 0) + item.price;
    });
  });

  container.innerHTML = "";

  Object.entries(revenueMap).forEach(([cat, amount]) => {
    const name =
      catalog.categories.find(c => c.id === cat)?.name || cat;

    container.insertAdjacentHTML(
      "beforeend",
      `<div class="card"><strong>${name}</strong>: ₦${amount.toLocaleString()}</div>`
    );
  });
}
renderRevenueByCategory();

/* ============================
   SPA CATALOG (ADMIN)
============================ */
const catalog =
  JSON.parse(localStorage.getItem("spaCatalog")) || {
    categories: [],
    services: []
  };

const categoryInput = document.getElementById("categoryName");
const addCategoryBtn = document.getElementById("addCategory");

const serviceNameInput = document.getElementById("serviceName");
const servicePriceInput = document.getElementById("servicePrice");
const serviceCategorySelect = document.getElementById("serviceCategory");
const addServiceBtn = document.getElementById("addService");

/* ---------- Populate category dropdown ---------- */
function refreshCategorySelect() {
  serviceCategorySelect.innerHTML = "";
  catalog.categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat.id;
    option.textContent = cat.name;
    serviceCategorySelect.appendChild(option);
  });
}

/* ---------- Add Category ---------- */
addCategoryBtn?.addEventListener("click", () => {
  const name = categoryInput.value.trim();
  if (!name) return alert("Enter category name");

  const id = name.toLowerCase().replace(/\s+/g, "-");

  if (catalog.categories.some(c => c.id === id)) {
    return alert("Category already exists");
  }

  catalog.categories.push({ id, name });
  localStorage.setItem("spaCatalog", JSON.stringify(catalog));

  categoryInput.value = "";
  refreshCategorySelect();
  alert("Category added ✅");
});

/* ---------- Add Service ---------- */
const serviceDurationInput = document.getElementById("serviceDuration");

function addService() {
  const name = serviceNameInput.value.trim();
  const description = serviceDescriptionInput.value.trim();
  const price = Number(servicePriceInput.value);
  const duration = Number(serviceDurationInput.value);
  const category = serviceCategorySelect.value;

  if (!name || !description || !price || !duration || !category) {
    return alert("Fill all service fields");
  }

  catalog.services.push({
    id: "svc_" + Date.now(),
    name,
    description,
    price,
    duration,
    category,
    order: catalog.services.length
  });

  persistCatalog();

  serviceNameInput.value = "";
  serviceDescriptionInput.value = "";
  servicePriceInput.value = "";
  serviceDurationInput.value = "";

  alert("Service added ✅");
  renderServices();
}

/* ---------- Init ---------- */
refreshCategorySelect();

function persistCatalog() {
  localStorage.setItem("spaCatalog", JSON.stringify(catalog));
}

function refreshCategorySelect() {
  serviceCategorySelect.innerHTML = "";
  catalog.categories.forEach(cat => {
    const opt = document.createElement("option");
    opt.value = cat.id;
    opt.textContent = cat.name;
    serviceCategorySelect.appendChild(opt);
  });
}

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

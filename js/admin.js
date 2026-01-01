const bookingsDiv = document.getElementById("bookings");
const servicesDiv = document.getElementById("services");

const bookings = JSON.parse(localStorage.getItem("bookings") || "[]");

bookings.forEach(b => {
  bookingsDiv.innerHTML += `
    <div class="card">
      <strong>${b.name}</strong><br>
      ${b.service}<br>
      ${b.date} @ ${b.time}<br>
      📞 ${b.phone}<br>
      ✉️ ${b.email}
    </div>
  `;
});

SPA_DATA.services.forEach(service => {
  servicesDiv.innerHTML += `
    <div>
      ${service.name}
      <input value="${service.price}" 
        onchange="updatePrice(${service.id}, this.value)">
    </div>
  `;
});

function updatePrice(id, value) {
  const service = SPA_DATA.services.find(s => s.id === id);
  service.price = value;
  alert("Price updated (persist with backend later)");
}



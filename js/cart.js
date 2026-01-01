const servicesDiv = document.getElementById("services");
let cart = JSON.parse(localStorage.getItem("cart") || "[]");

SPA_DATA.services.forEach(service => {
  servicesDiv.innerHTML += `
    <div class="card">
      <h3>${service.name}</h3>
      <p>$${service.price}</p>
      <button class="btn" onclick="addToCart(${service.id})">
        Add Service
      </button>
    </div>
  `;
});

function addToCart(id) {
  const service = SPA_DATA.services.find(s => s.id === id);
  cart.push(service);
  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Service added to booking");
}

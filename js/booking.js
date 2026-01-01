const list = document.getElementById("serviceList");

SPA_DATA.services.forEach(service => {
  list.innerHTML += `
    <div class="card">
      <h3>${service.name}</h3>
      <p><strong>$${service.price}</strong></p>

      <input placeholder="Your Name" id="name-${service.id}">
      <input placeholder="Email" id="email-${service.id}">
      <input placeholder="WhatsApp Number" id="phone-${service.id}">
      <input type="date" id="date-${service.id}">
      <input type="time" id="time-${service.id}">

      <button class="btn" onclick="book(${service.id})">
        Book via WhatsApp
      </button>
    </div>
  `;
});

function book(id) {
  const service = SPA_DATA.services.find(s => s.id === id);

  const name = document.getElementById(`name-${id}`).value;
  const email = document.getElementById(`email-${id}`).value;
  const phone = document.getElementById(`phone-${id}`).value;
  const date = document.getElementById(`date-${id}`).value;
  const time = document.getElementById(`time-${id}`).value;

  const booking = { name, email, phone, service: service.name, date, time };

  const bookings = JSON.parse(localStorage.getItem("bookings") || "[]");
  bookings.push(booking);
  localStorage.setItem("bookings", JSON.stringify(bookings));

  const message = `
New Spa Booking:
Name: ${name}
Service: ${service.name}
Price: $${service.price}
Date: ${date}
Time: ${time}
Phone: ${phone}
Email: ${email}
`;

  window.open(
    `https://wa.me/${SPA_DATA.whatsappAdmin}?text=${encodeURIComponent(message)}`
  );
}

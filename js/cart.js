/* Legacy compatibility bridge. The canonical cart is js/pax-cart.js. */
(function () {
  "use strict";
  if (!window.PaxCart) {
    console.error("Load /js/pax-cart.js before the legacy cart bridge.");
    return;
  }
  window.addToCart = function (serviceOrId) {
    const service = typeof serviceOrId === "object"
      ? serviceOrId
      : (window.SPA_DATA?.services || []).find(item => String(item.id) === String(serviceOrId));
    if (!service) {
      alert("This service is unavailable. Please refresh and try again.");
      return;
    }
    try {
      window.PaxCart.add(service);
      alert(`${service.name} added to booking.`);
    } catch (error) {
      alert(error.message || "Unable to save this service.");
    }
  };
})();

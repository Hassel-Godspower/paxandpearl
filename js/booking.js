/* Legacy compatibility bridge. booking.html owns checkout UI;
   all cart reads/writes must go through js/pax-cart.js. */
(function () {
  "use strict";
  if (!window.PaxCart) {
    console.error("Load /js/pax-cart.js before booking.js.");
    return;
  }
  window.getBookingCart = () => window.PaxCart.read();
  window.removeBookingCartLine = lineId => window.PaxCart.remove(lineId);
  window.clearBookingCart = () => window.PaxCart.clear();
})();

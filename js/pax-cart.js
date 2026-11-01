/* Pax & Pearl shared booking cart.
   One storage key is used by the services and booking pages.
   Cart entries are self-contained snapshots; a catalogue/API refresh
   must never silently delete a customer's selections. */
(function (window) {
  "use strict";
  const KEY = "spaBookingCart";
  const VERSION = 2;

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((item, index) => {
        if (!item || typeof item !== "object") return null;
        const price = Number(item.price);
        const name = String(item.name || "").trim();
        if (!name || !Number.isFinite(price) || price < 0) return null;
        return {
          lineId: String(item.lineId || `line_${Date.now()}_${index}`),
          id: String(item.id ?? item.serviceId ?? ""),
          name,
          description: String(item.description || ""),
          price,
          duration: Number(item.duration) || 0,
          category: String(item.category || "")
        };
      }).filter(Boolean);
    } catch (error) {
      console.error("Pax & Pearl: invalid saved cart; preserving recovery copy.", error);
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) localStorage.setItem(`${KEY}.recovery.${Date.now()}`, raw);
      } catch (_) {}
      return [];
    }
  }

  function write(items) {
    const safe = Array.isArray(items) ? items : [];
    try {
      localStorage.setItem(KEY, JSON.stringify(safe));
      localStorage.setItem(`${KEY}.version`, String(VERSION));
      window.dispatchEvent(new CustomEvent("paxpearl:cartchange", {
        detail: { count: safe.length, total: total(safe) }
      }));
      return true;
    } catch (error) {
      console.error("Pax & Pearl: unable to save booking cart.", error);
      window.dispatchEvent(new CustomEvent("paxpearl:carterror", { detail: error }));
      return false;
    }
  }

  function total(items) {
    return (items || read()).reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  }

  function add(service) {
    if (!service || !String(service.name || "").trim()) {
      throw new Error("This service could not be added. Please refresh and try again.");
    }
    const price = Number(service.price);
    if (!Number.isFinite(price) || price < 0) {
      throw new Error("This service has an invalid price and cannot be added.");
    }
    const items = read();
    items.push({
      lineId: `pp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      id: String(service.id ?? service.serviceId ?? ""),
      name: String(service.name).trim(),
      description: String(service.description || ""),
      price,
      duration: Number(service.duration) || 0,
      category: String(service.category || "")
    });
    if (!write(items)) throw new Error("Your browser could not save this booking. Check available storage and try again.");
    return items;
  }

  function remove(lineId) {
    const items = read().filter(item => item.lineId !== String(lineId));
    write(items);
    return items;
  }

  function clear() { return write([]); }

  window.PaxCart = Object.freeze({
    key: KEY, read, write, add, remove, clear, total,
    count: () => read().length
  });
})(window);

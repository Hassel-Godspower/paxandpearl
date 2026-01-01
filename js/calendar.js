function createCalendarEvent(name, services, date, time) {
  const start = new Date(`${date}T${time}`);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const ics =
`BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:Spa Booking - ${name}
DESCRIPTION:${services}
DTSTART:${formatICS(start)}
DTEND:${formatICS(end)}
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([ics], { type: 'text/calendar' });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "spa-booking.ics";
  link.click();
}

function formatICS(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0];
}


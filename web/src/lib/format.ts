const dateTime = new Intl.DateTimeFormat("en-MY", {
  timeZone: "Asia/Kuala_Lumpur",
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const timeOnly = new Intl.DateTimeFormat("en-MY", {
  timeZone: "Asia/Kuala_Lumpur",
  hour: "numeric",
  minute: "2-digit",
});

// True when the current moment is between the two ISO timestamps.
export function isNowBetween(startIso: string, endIso: string) {
  const now = Date.now();
  return now >= Date.parse(startIso) && now <= Date.parse(endIso);
}

export function formatDateTime(iso: string) {
  return dateTime.format(new Date(iso));
}

export function formatTime(iso: string) {
  return timeOnly.format(new Date(iso));
}

// ISO timestamp -> value for <input type="datetime-local"> in Malaysia time.
export function toMalaysiaInput(iso: string) {
  return new Date(Date.parse(iso) + 8 * 3600_000).toISOString().slice(0, 16);
}

const argentinaOptions: Intl.DateTimeFormatOptions = {
  timeZone: "America/Argentina/Buenos_Aires",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
};

export function argentinaDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", argentinaOptions).format(date);
}

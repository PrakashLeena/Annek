export function money(n, currency = "USD") {
  const v = Number(n) || 0;
  try { return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: v % 1 ? 2 : 0 }).format(v); }
  catch { return `${currency} ${v}`; }
}

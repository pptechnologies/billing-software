export type Money2 = number; // always rounded to 2 decimals

export function round2(n: number): Money2 {
  // EPSILON helps avoid cases like 1.005 -> 1.00
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export type InvoiceItemInput = {
  qty: number;
  unit_price: number;
};

export type InvoiceTotals = {
  subtotal: Money2;
  tax_rate: Money2;   // percent (e.g., 13.00)
  tax_total: Money2;
  total: Money2;
};

export function computeInvoiceTotals(
  items: InvoiceItemInput[],
  taxRatePercent: number
): InvoiceTotals {
  const tax_rate = round2(clamp(taxRatePercent, 0, 100));

  const subtotalRaw = items.reduce((sum, it) => {
    const qty = Number(it.qty);
    const unit = Number(it.unit_price);
    return sum + qty * unit;
  }, 0);

  const subtotal = round2(subtotalRaw);
  const tax_total = round2(subtotal * (tax_rate / 100));
  const total = round2(subtotal + tax_total);

  return { subtotal, tax_rate, tax_total, total };
}

export function computeLineTotal(qty: number, unitPrice: number): Money2 {
  return round2(Number(qty) * Number(unitPrice));
}

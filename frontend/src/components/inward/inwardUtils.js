export const UNIT_OPTIONS = [
  { value: 'pcs', label: 'Pieces' },
  { value: 'kg', label: 'Kilograms' },
  { value: 'g', label: 'Grams' },
  { value: 'l', label: 'Liters' },
  { value: 'ml', label: 'Milliliters' },
  { value: 'm', label: 'Meters' },
  { value: 'box', label: 'Box' },
  { value: 'pack', label: 'Pack' },
  { value: 'dozen', label: 'Dozen' },
];

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount || 0);

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Line amount before tax (same rounding as the backend). */
export const lineAmount = (quantity, rate) => round2((parseFloat(quantity) || 0) * (parseFloat(rate) || 0));

/** Invoice totals; GST is calculated per tax-rate group, matching the backend. */
export const calculateTotals = (rows, roundOff) => {
  const taxableByRate = {};
  rows.forEach((row) => {
    const rate = parseFloat(row.tax_rate) || 0;
    taxableByRate[rate] = (taxableByRate[rate] || 0) + lineAmount(row.quantity, row.unit_price);
  });
  const subtotal = round2(Object.values(taxableByRate).reduce((sum, v) => sum + v, 0));
  const tax = round2(
    Object.entries(taxableByRate).reduce((sum, [rate, amount]) => sum + round2((amount * parseFloat(rate)) / 100), 0)
  );
  const round = parseFloat(roundOff) || 0;
  return { subtotal, tax, roundOff: round, total: round2(subtotal + tax + round) };
};

const FIELD_LABELS = {
  supplier_id: 'Vendor',
  supplier_invoice_number: 'Invoice No',
  supplier_invoice_date: 'Invoice Date',
  po_number: 'PO No',
  round_off: 'Round Off',
  product_id: 'Product',
  new_product: 'New product',
  quantity: 'Quantity',
  unit_price: 'Rate',
  tax_rate: 'GST %',
  gst_rate: 'GST %',
  gst_number: 'GSTIN',
  name: 'Name',
};

const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

/** First human-readable message from a DRF error payload (handles nested item errors). */
export const firstErrorMessage = (data, prefix = '') => {
  const fallback = 'Something went wrong';
  if (!data) return fallback;
  // Never show raw HTML error pages to the user
  if (typeof data === 'string') return data.trimStart().startsWith('<') ? fallback : prefix + data;
  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i += 1) {
      const entry = data[i];
      if (typeof entry === 'string') return prefix + entry;
      if (isPlainObject(entry) && Object.keys(entry).length) return firstErrorMessage(entry, `${prefix}Item ${i + 1}: `);
    }
    return fallback;
  }
  if (data.detail) return prefix + data.detail;
  const [key] = Object.keys(data);
  if (!key) return fallback;
  const label = ['items', 'non_field_errors'].includes(key) ? '' : `${FIELD_LABELS[key] || key.replace(/_/g, ' ')}: `;
  return firstErrorMessage(data[key], prefix + label);
};

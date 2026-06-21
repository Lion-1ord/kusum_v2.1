export function calcDiscountPercent(salePrice, offerPrice) {
  const sale = parseFloat(salePrice);
  const offer = parseFloat(offerPrice);
  if (!offer || !sale || offer <= 0) return null;
  return Math.round(((offer - sale) / offer) * 100);
}

export function formatPrice(value) {
  const num = parseFloat(value);
  if (Number.isNaN(num)) return '—';
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function hasOfferPrice(offerPrice) {
  const offer = parseFloat(offerPrice);
  return !Number.isNaN(offer) && offer > 0;
}

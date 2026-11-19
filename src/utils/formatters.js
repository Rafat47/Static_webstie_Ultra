// Currency formatter for Bangladesh Taka (৳)
export function formatCurrency(amount, currency = '৳') {
  if (amount === undefined || amount === null || isNaN(amount)) return `${currency}0`;
  return `${currency}${Number(amount).toLocaleString('en-IN')}`;
}

// Calculate percentage discount
export function calculateDiscount(regularPrice, salePrice) {
  if (!regularPrice || !salePrice || regularPrice <= salePrice) return 0;
  return Math.round(((regularPrice - salePrice) / regularPrice) * 100);
}

// Bangladeshi phone number validator
// Accepts formats: 01XXXXXXXXX, +8801XXXXXXXXX, 8801XXXXXXXXX, or with spaces/dashes
export function validateBDPhone(phone) {
  if (!phone) return false;
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('01')) return true;
  if (cleaned.length === 13 && cleaned.startsWith('8801')) return true;
  return false;
}

// Format phone number cleanly
export function formatBDPhone(phone) {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('8801')) {
    cleaned = '0' + cleaned.substring(2);
  }
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  }
  return phone;
}

// Clean date formatting
export function formatDate(dateString) {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

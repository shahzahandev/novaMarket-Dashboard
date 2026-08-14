function toDateKey(value) {
  if (!value) return "";

  if (typeof value === "string") {
    const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isDiscountActive(startDate, endDate, currentDate = new Date()) {
  const start = toDateKey(startDate);
  const end = toDateKey(endDate);
  const today = toDateKey(currentDate);

  return Boolean(start && end && today && start <= today && today <= end);
}

export function calculateDiscountPrice({
  price,
  discountType,
  discountValue,
  discountStartDate,
  discountEndDate,
  fallbackDiscountPrice,
}) {
  const mainPrice = Number(price) || 0;

  if (!isDiscountActive(discountStartDate, discountEndDate)) {
    return mainPrice;
  }

  const discount = Number(discountValue) || 0;

  if (discountType === "flat") return Math.max(mainPrice - discount, 0);
  if (discountType === "percentage") return Math.max(mainPrice - (mainPrice * discount) / 100, 0);

  return Number(fallbackDiscountPrice ?? mainPrice) || mainPrice;
}

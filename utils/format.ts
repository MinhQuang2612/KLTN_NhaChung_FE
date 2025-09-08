// utils/format.ts

/** ----- Number helpers ----- */
export const formatNumberVN = (v?: number, maxFractionDigits = 0) => {
  if (v == null || isNaN(v)) return "";
  return v.toLocaleString("vi-VN", {
    maximumFractionDigits: maxFractionDigits,
  });
};

export const formatVND = (v?: number) => {
  if (v == null || isNaN(v)) return "";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(v);
};

const trimTrailingZeros = (s: string) =>
  s.replace(/(\.\d*?[1-9])0+$|\.0+$/, "$1");

/** Dùng cho label ngắn: 800k, 2.5tr, 1.2tỷ */
export const formatVNDCompact = (v?: number) => {
  if (v == null || isNaN(v)) return "";
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) {
    const n = v / 1_000_000_000;
    return `${trimTrailingZeros(n.toFixed(1))}tỷ`;
  }
  if (abs >= 1_000_000) {
    const n = v / 1_000_000;
    return `${trimTrailingZeros(n.toFixed(1))}tr`;
  }
  if (abs >= 1_000) {
    const n = v / 1_000;
    return `${trimTrailingZeros(n.toFixed(0))}k`;
  }
  return `${v}`;
};

/** ----- Price helpers ----- */

/**
 * Hiển thị giá thuê / tháng theo cách “người Việt”:
 *  - ≥ 1 tỷ  -> "x.x tỷ / tháng"
 *  - ≥ 1 triệu -> "x.x triệu / tháng"
 *  - ≥ 1 nghìn -> "x nghìn / tháng"
 *  - còn lại -> "x ₫ / tháng"
 */
export function formatPricePerMonth(v?: number) {
  if (v == null || isNaN(v)) return "";
  if (v >= 1_000_000_000) {
    const ty = v / 1_000_000_000;
    const text = ty % 1 === 0 ? String(ty) : trimTrailingZeros(ty.toFixed(1));
    return `${text} tỷ / tháng`;
  }
  if (v >= 1_000_000) {
    const tr = v / 1_000_000;
    const text = tr % 1 === 0 ? String(tr) : trimTrailingZeros(tr.toFixed(1));
    return `${text} triệu / tháng`;
  }
  if (v >= 1_000) {
    const nghin = Math.round(v / 1_000);
    return `${formatNumberVN(nghin)} nghìn / tháng`;
  }
  return `${formatNumberVN(v)} ₫ / tháng`;
}

/** Giá tổng (không thêm “/ tháng”) với nhiều chế độ hiển thị */
export function formatPrice(v?: number, mode: "full" | "compact" = "full") {
  if (mode === "compact") return formatVNDCompact(v);
  return formatVND(v);
}

/** Giá + hậu tố tùy chọn (mặc định “/ tháng”) */
export function formatPriceWithSuffix(
  v?: number,
  suffix = "/ tháng",
  mode: "auto" | "full" | "compact" = "auto"
) {
  if (v == null || isNaN(v)) return "";
  if (mode === "compact") return `${formatVNDCompact(v)} ${suffix}`.trim();
  if (mode === "full") return `${formatVND(v)} ${suffix}`.trim();
  // auto: giống formatPricePerMonth nhưng suffix tùy biến
  if (v >= 1_000_000_000) {
    const ty = v / 1_000_000_000;
    const text = ty % 1 === 0 ? String(ty) : trimTrailingZeros(ty.toFixed(1));
    return `${text} tỷ ${suffix}`.trim();
  }
  if (v >= 1_000_000) {
    const tr = v / 1_000_000;
    const text = tr % 1 === 0 ? String(tr) : trimTrailingZeros(tr.toFixed(1));
    return `${text} triệu ${suffix}`.trim();
  }
  if (v >= 1_000) {
    const nghin = Math.round(v / 1_000);
    return `${formatNumberVN(nghin)} nghìn ${suffix}`.trim();
  }
  return `${formatNumberVN(v)} ₫ ${suffix}`.trim();
}

/** ----- Property helpers ----- */

export const formatArea = (v?: number, unit = "m²") =>
  v != null && !isNaN(v) ? `${trimTrailingZeros(v.toFixed(0))} ${unit}` : "";

/** Diện tích • PN • WC (ẩn phần trống) */
export function formatSpecLine(
  area?: number,
  bedrooms?: number,
  bathrooms?: number
) {
  const parts: string[] = [];
  if (area != null && !isNaN(area))
    parts.push(`${trimTrailingZeros(area.toFixed(0))} m²`);
  if (bedrooms != null && bedrooms > 0) parts.push(`${bedrooms} PN`);
  if (bathrooms != null && bathrooms > 0) parts.push(`${bathrooms} WC`);
  return parts.join(" • ");
}

/** "Quận X, TP Y" hoặc phần nào có thì hiển thị phần đó */
export function formatAddressLine(district?: string, city?: string) {
  if (district && city) return `${district}, ${city}`;
  return district || city || "";
}

/** "12 ảnh", "1 ảnh", "0 ảnh" — nếu chỉ cần số thì dùng trực tiếp photoCount */
export function formatPhotoCount(count?: number) {
  if (count == null || isNaN(count)) return "";
  const n = Math.max(0, Math.floor(count));
  return `${n} ảnh`;
}

/** Khoảng giá (min-max) + hậu tố, ví dụ: "3–4 triệu / tháng" */
export function formatPriceRangePerMonth(min?: number, max?: number) {
  if (min == null && max == null) return "";
  if (min != null && max != null) {
    // cùng bậc -> ghép gọn
    const bothTriệu =
      min >= 1_000_000 &&
      max >= 1_000_000 &&
      min < 1_000_000_000 &&
      max < 1_000_000_000;
    const bothTỷ = min >= 1_000_000_000 && max >= 1_000_000_000;
    if (bothTriệu) {
      const a = trimTrailingZeros((min / 1_000_000).toFixed(1));
      const b = trimTrailingZeros((max / 1_000_000).toFixed(1));
      return `${a}–${b} triệu / tháng`;
    }
    if (bothTỷ) {
      const a = trimTrailingZeros((min / 1_000_000_000).toFixed(1));
      const b = trimTrailingZeros((max / 1_000_000_000).toFixed(1));
      return `${a}–${b} tỷ / tháng`;
    }
    // khác bậc -> hiển thị đầy đủ từng vế
    return `${formatPricePerMonth(min)} – ${formatPricePerMonth(max)}`;
  }
  // chỉ một đầu
  if (min != null) return `Từ ${formatPricePerMonth(min)}`;
  return `Đến ${formatPricePerMonth(max!)}`;
}

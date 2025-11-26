// utils/geoMatch.ts - Chuẩn hóa và so khớp địa danh tiếng Việt

const CITY_ABBR: Record<string, string> = {
  "tp": "thanh pho",
  "tphcm": "ho chi minh",
  "hcm": "ho chi minh",
  "sai gon": "ho chi minh",
  "hn": "ha noi",
};

export function normalizeVN(input?: string): string {
  if (!input) return "";
  let s = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // bỏ dấu
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  // gom nhãn TP
  s = s.replace(/\b(tp\.?|thanh pho)\b/g, "thanh pho");
  // map viết tắt/phổ biến
  Object.entries(CITY_ABBR).forEach(([k, v]) => {
    const re = new RegExp(`\\b${k}\\b`, "g");
    s = s.replace(re, v);
  });
  return s;
}

// Jaro-Winkler algorithm for fuzzy string matching
export function jaroWinkler(a: string, b: string): number {
  if (a === b) return 1;
  const m = Math.floor(Math.max(a.length, b.length) / 2) - 1;
  const aMatches = new Array(a.length).fill(false);
  const bMatches = new Array(b.length).fill(false);
  let matches = 0;
  let transpositions = 0;

  for (let i = 0; i < a.length; i++) {
    const start = Math.max(0, i - m);
    const end = Math.min(i + m + 1, b.length);
    for (let j = start; j < end; j++) {
      if (bMatches[j] || a[i] !== b[j]) continue;
      aMatches[i] = true;
      bMatches[j] = true;
      matches++;
      break;
    }
  }
  if (matches === 0) return 0;
  let k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }
  const jaro = (matches / a.length + matches / b.length + (matches - transpositions / 2) / matches) / 3;
  // prefix length
  let l = 0;
  const maxPrefix = 4;
  while (l < Math.min(maxPrefix, a.length, b.length) && a[l] === b[l]) l++;
  const p = 0.1;
  return jaro + l * p * (1 - jaro);
}

export function isSameNormalized(a?: string, b?: string, threshold = 0.9): boolean {
  const na = normalizeVN(a);
  const nb = normalizeVN(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  return jaroWinkler(na, nb) >= threshold;
}

// City matching with higher threshold to avoid false positives
export function isSameCity(a?: string, b?: string): boolean {
  const na = normalizeVN(a);
  const nb = normalizeVN(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  
  // Handle special case: "thanh pho X" vs "X"
  const removeThanhPho = (s: string) => s.replace(/^thanh pho\s+/, '');
  const naWithoutTP = removeThanhPho(na);
  const nbWithoutTP = removeThanhPho(nb);
  
  if (naWithoutTP === nb || nbWithoutTP === na || naWithoutTP === nbWithoutTP) {
    return true;
  }
  
  // Higher threshold for cities to avoid confusion
  return jaroWinkler(na, nb) >= 0.95;
}

export const isSameWard = isSameNormalized;

// City name to province code mapping
const CITY_CODE_MAP: Record<string, string> = {
  'ha noi': '01',
  'hanoi': '01',
  'thanh pho ha noi': '01',
  'ho chi minh': '79',
  'thanh pho ho chi minh': '79',
  'tp ho chi minh': '79',
  'tp hcm': '79',
  'tphcm': '79',
  'da nang': '48',
  'thanh pho da nang': '48',
  'can tho': '92',
  'thanh pho can tho': '92',
  'hai phong': '56',
  'thanh pho hai phong': '56',
};

export function cityToProvinceCode(city?: string): string | undefined {
  const n = normalizeVN(city);
  if (!n) return undefined;
  return CITY_CODE_MAP[n];
}



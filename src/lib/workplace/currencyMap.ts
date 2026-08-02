export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  rateToUSD: number;
}

export const TOP_CURRENCY_CODES = [
  "USD", "GBP", "EUR", "JPY", "CNY", "INR", "AED", "SAR", "CAD", "AUD"
];

export const CURRENCY_MAP: Record<string, CurrencyInfo> = {
  USD: { code: "USD", symbol: "$", name: "US Dollar", rateToUSD: 1.0 },
  GBP: { code: "GBP", symbol: "£", name: "British Pound", rateToUSD: 1.27 },
  EUR: { code: "EUR", symbol: "€", name: "Euro", rateToUSD: 1.08 },
  JPY: { code: "JPY", symbol: "¥", name: "Japanese Yen", rateToUSD: 0.0067 },
  CNY: { code: "CNY", symbol: "CN¥", name: "Chinese Yuan", rateToUSD: 0.14 },
  INR: { code: "INR", symbol: "₹", name: "Indian Rupee", rateToUSD: 0.012 },
  AED: { code: "AED", symbol: "AED", name: "UAE Dirham", rateToUSD: 0.27 },
  SAR: { code: "SAR", symbol: "SAR", name: "Saudi Riyal", rateToUSD: 0.27 },
  CAD: { code: "CAD", symbol: "CA$", name: "Canadian Dollar", rateToUSD: 0.74 },
  AUD: { code: "AUD", symbol: "A$", name: "Australian Dollar", rateToUSD: 0.65 },
  CHF: { code: "CHF", symbol: "CHF", name: "Swiss Franc", rateToUSD: 1.13 },
  SGD: { code: "SGD", symbol: "S$", name: "Singapore Dollar", rateToUSD: 0.75 },
  QAR: { code: "QAR", symbol: "QAR", name: "Qatari Riyal", rateToUSD: 0.27 },
  BHD: { code: "BHD", symbol: "BHD", name: "Bahraini Dinar", rateToUSD: 2.65 },
  KWD: { code: "KWD", symbol: "KWD", name: "Kuwaiti Dinar", rateToUSD: 3.25 },
  OMR: { code: "OMR", symbol: "OMR", name: "Omani Rial", rateToUSD: 2.60 },
  ZAR: { code: "ZAR", symbol: "R", name: "South African Rand", rateToUSD: 0.053 },
  BRL: { code: "BRL", symbol: "R$", name: "Brazilian Real", rateToUSD: 0.20 },
  MXN: { code: "MXN", symbol: "MX$", name: "Mexican Peso", rateToUSD: 0.058 },
  NZD: { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar", rateToUSD: 0.61 },
  SEK: { code: "SEK", symbol: "kr", name: "Swedish Krona", rateToUSD: 0.096 },
  NOK: { code: "NOK", symbol: "kr", name: "Norwegian Krone", rateToUSD: 0.094 },
  DKK: { code: "DKK", symbol: "kr", name: "Danish Krone", rateToUSD: 0.14 },
  HKD: { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar", rateToUSD: 0.13 },
  KRW: { code: "KRW", symbol: "₩", name: "South Korean Won", rateToUSD: 0.00075 },
  THB: { code: "THB", symbol: "฿", name: "Thai Baht", rateToUSD: 0.028 },
  MYR: { code: "MYR", symbol: "RM", name: "Malaysian Ringgit", rateToUSD: 0.21 },
  IDR: { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah", rateToUSD: 0.000063 },
  PHP: { code: "PHP", symbol: "₱", name: "Philippine Peso", rateToUSD: 0.018 },
  VND: { code: "VND", symbol: "₫", name: "Vietnamese Dong", rateToUSD: 0.000039 },
  TRY: { code: "TRY", symbol: "₺", name: "Turkish Lira", rateToUSD: 0.031 },
  EGP: { code: "EGP", symbol: "E£", name: "Egyptian Pound", rateToUSD: 0.021 },
};

export const LOCATION_TO_CURRENCY: Record<string, string> = {
  "united arab emirates": "AED", "uae": "AED", "dubai": "AED", "abu dhabi": "AED", "sharjah": "AED",
  "saudi arabia": "SAR", "riyadh": "SAR", "jeddah": "SAR",
  "qatar": "QAR", "doha": "QAR", "bahrain": "BHD", "kuwait": "KWD", "oman": "OMR", "egypt": "EGP",
  "india": "INR", "delhi": "INR", "mumbai": "INR", "bangalore": "INR", "bengaluru": "INR",
  "china": "CNY", "beijing": "CNY", "shanghai": "CNY",
  "japan": "JPY", "tokyo": "JPY", "osaka": "JPY",
  "singapore": "SGD", "hong kong": "HKD", "south korea": "KRW", "seoul": "KRW",
  "thailand": "THB", "malaysia": "MYR", "indonesia": "IDR", "philippines": "PHP", "vietnam": "VND",
  "united states": "USD", "usa": "USD", "us": "USD", "new york": "USD", "california": "USD",
  "canada": "CAD", "toronto": "CAD", "vancouver": "CAD",
  "mexico": "MXN", "brazil": "BRL",
  "united kingdom": "GBP", "uk": "GBP", "england": "GBP", "london": "GBP",
  "germany": "EUR", "berlin": "EUR", "france": "EUR", "paris": "EUR", "italy": "EUR", "rome": "EUR", "spain": "EUR", "madrid": "EUR", "netherlands": "EUR", "amsterdam": "EUR",
  "switzerland": "CHF", "sweden": "SEK", "norway": "NOK", "denmark": "DKK",
  "australia": "AUD", "sydney": "AUD", "melbourne": "AUD",
  "new zealand": "NZD", "south africa": "ZAR",
};

/**
 * Detects client browser locale / timezone currency fallback.
 */
export function getBrowserLocaleCurrency(): CurrencyInfo {
  if (typeof window === "undefined") return CURRENCY_MAP.USD;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const lang = navigator.language || "";
    if (tz.includes("Dubai") || tz.includes("Abu_Dhabi") || lang.includes("AE")) return CURRENCY_MAP.AED;
    if (tz.includes("Riyadh") || lang.includes("SA")) return CURRENCY_MAP.SAR;
    if (tz.includes("London") || lang.includes("GB")) return CURRENCY_MAP.GBP;
    if (tz.includes("Paris") || tz.includes("Berlin") || tz.includes("Rome") || tz.includes("Madrid") || lang.includes("FR") || lang.includes("DE") || lang.includes("IT") || lang.includes("ES")) return CURRENCY_MAP.EUR;
    if (tz.includes("Kolkata") || tz.includes("Calcutta") || lang.includes("IN")) return CURRENCY_MAP.INR;
    if (tz.includes("Tokyo") || lang.includes("JP")) return CURRENCY_MAP.JPY;
    if (tz.includes("Shanghai") || lang.includes("CN")) return CURRENCY_MAP.CNY;
    if (tz.includes("Sydney") || tz.includes("Melbourne") || lang.includes("AU")) return CURRENCY_MAP.AUD;
    if (tz.includes("Toronto") || tz.includes("Vancouver") || lang.includes("CA")) return CURRENCY_MAP.CAD;
  } catch (e) {
    // fallback
  }
  return CURRENCY_MAP.USD;
}

/**
 * Strict currency detector requiring word boundaries & explicit currency symbols.
 */
export function detectCurrency(text: string): CurrencyInfo | null {
  const lower = text.toLowerCase();

  // Strict word boundaries to avoid misidentifying single OCR characters
  if (/\b(aed|dirham|dirhams)\b/i.test(text)) return CURRENCY_MAP.AED;
  if (/\b(inr|rupee|rupees)\b/i.test(text) || lower.includes("₹")) return CURRENCY_MAP.INR;
  if (/\b(gbp|pound|pounds)\b/i.test(text) || lower.includes("£")) return CURRENCY_MAP.GBP;
  if (/\b(eur|euro|euros)\b/i.test(text) || lower.includes("€")) return CURRENCY_MAP.EUR;
  if (/\b(cad)\b/i.test(text) || lower.includes("c$")) return CURRENCY_MAP.CAD;
  if (/\b(aud)\b/i.test(text) || lower.includes("a$")) return CURRENCY_MAP.AUD;
  if (/\b(jpy|yen)\b/i.test(text)) return CURRENCY_MAP.JPY;
  if (/\b(chf)\b/i.test(text)) return CURRENCY_MAP.CHF;
  if (/\b(sar|riyal|riyals)\b/i.test(text)) return CURRENCY_MAP.SAR;
  if (/\b(cny|rmb|yuan)\b/i.test(text) || lower.includes("cn¥")) return CURRENCY_MAP.CNY;
  if (/\b(usd|dollar|dollars)\b/i.test(text)) return CURRENCY_MAP.USD;

  // Check location names in text
  for (const [location, code] of Object.entries(LOCATION_TO_CURRENCY)) {
    if (new RegExp(`\\b${location}\\b`, "i").test(text)) {
      return CURRENCY_MAP[code] || CURRENCY_MAP.USD;
    }
  }

  return null;
}

import { detectCurrency, getBrowserLocaleCurrency } from "./currencyMap";
import { canvasToBytes } from "@/lib/pdfWorker";
import type { Worker } from "tesseract.js";

export interface QAFlags {
  isDuplicate: boolean;
  isAlcohol: boolean;
  isZeroAmount: boolean;
  isOver60Days: boolean;
  isFutureDate: boolean;
  isOffensive: boolean;
  messages: string[];
}

export interface ReceiptItem {
  id: string;
  file: File;
  previewUrl: string;
  enhancedBytes: Uint8Array;
  itemNo: number;
  billName: string;
  date: string; // YYYY-MM-DD
  amount: number;
  tipAmount: number;
  currency: string;
  currencyDetected: boolean;
  location: string;
  status: "scanning" | "ready" | "error";
  qaFlags: QAFlags;
}

const GLOBAL_VENDORS = [
  "Starbucks", "McDonald's", "Uber", "Lyft", "Subway", "Dunkin'", "KFC", "Burger King",
  "Domino's", "Pizza Hut", "Taco Bell", "Wendy's", "Chipotle", "Panera Bread", "Costa Coffee",
  "Walmart", "Target", "Carrefour", "Tesco", "Aldi", "Lidl", "7-Eleven", "CVS", "Walgreens",
  "Delta Air Lines", "American Airlines", "United Airlines", "Emirates", "Lufthansa", "British Airways",
  "Air France", "KLM", "Ryanair", "EasyJet", "Qatar Airways", "Etihad", "Singapore Airlines",
  "Marriott", "Hilton", "Hyatt", "Sheraton", "InterContinental", "Holiday Inn", "Radisson", "Accor",
  "Shell", "BP", "ExxonMobil", "Chevron", "TotalEnergies", "ENI", "Repsol", "Amazon", "Apple Store",
  "Careem", "Talabat", "Deliveroo", "Spinneys", "Lulu", "Nando's", "Five Guys", "Shake Shack"
];

const VALID_BUSINESS_WORDS = new Set([
  "cafe", "coffee", "restaurant", "bistro", "bakery", "grill", "kitchen", "diner", "house", "bar",
  "pub", "lounge", "hotel", "resort", "inn", "suites", "stay", "spa", "market", "supermarket",
  "store", "shop", "express", "mart", "pharmacy", "chemist", "station", "auto", "petrol", "gas",
  "cleaners", "laundry", "travel", "airways", "airlines", "rent", "car", "taxi", "cab", "pizza",
  "burger", "food", "beverage", "catering", "services", "center", "centre", "depot", "mall",
  "hypermarket", "boutique", "outlet", "traders", "enterprises", "company", "co", "ltd", "inc",
  "corp", "group", "hospitality", "eatery", "canteen", "cafeteria", "amritsr", "amritsrua"
]);

const ALCOHOL_SMOKING_KEYWORDS = [
  "beer", "beers", "wine", "wines", "spirits", "cocktail", "cocktails", "vodka", "whiskey", "whisky", "rum", "tequila",
  "gin", "champagne", "prosecco", "liquor", "brewery", "tavern", "tobacco", "cigarettes", "cigarette", "cigar", "cigars", "vape", "vaping",
  "pub", "pubs", "club", "clubs", "bar", "bars", "nightclub", "lounge",
  "bière", "vin", "cigare", "bier", "wein", "cerveza", "vino", "birra"
];

const PROFANITY_WORDS = [
  "fuck", "shit", "bitch", "asshole", "cunt", "bastard", "damn", "dick", "pussy", "cock", "whore", "slut"
];

/**
 * Evaluates all Policy QA rules dynamically for both OCR scanning & live user edits.
 */
export function evaluateQAFlags(
  item: { date: string; amount: number; billName: string; rawMessages?: string[] },
  isDuplicate = false
): QAFlags {
  const messages: string[] = [];
  let isAlcohol = false;
  const isZeroAmount = item.amount === 0;
  let isOver60Days = false;
  let isFutureDate = false;
  let isOffensive = false;

  // 1. Check Profanity in Merchant Name (RED Flag)
  const profanityRegex = new RegExp(`\\b(${PROFANITY_WORDS.join("|")})\\b`, "i");
  if (profanityRegex.test(item.billName)) {
    isOffensive = true;
    messages.push("Offensive / Inappropriate Merchant Name Flagged");
  }

  // 2. Check Merchant Name & Raw OCR for Pub/Club/Bar/Alcohol (YELLOW Flag)
  const alcoholRegex = new RegExp(`\\b(${ALCOHOL_SMOKING_KEYWORDS.join("|")})\\b`, "i");
  const vendorMatch = item.billName.match(alcoholRegex);
  if (vendorMatch) {
    isAlcohol = true;
    messages.push(`Merchant Category Warning: "${vendorMatch[0]}" (Non-reimbursable venue)`);
  }

  // Include raw line messages if scanning
  if (item.rawMessages && item.rawMessages.length > 0) {
    item.rawMessages.forEach(m => {
      if (!messages.includes(m)) messages.push(m);
    });
    if (item.rawMessages.some(m => m.includes("Non-permitted"))) {
      isAlcohol = true;
    }
  }

  // 3. Amount Check
  if (isZeroAmount) {
    messages.push("$0 Bill Amount Detected");
  }

  // 4. Date Policy Checks (Live evaluation on user edit)
  if (item.date) {
    const billTime = new Date(item.date).getTime();
    const nowTime = new Date().getTime();
    const sixtyDaysMs = 60 * 24 * 60 * 60 * 1000;

    if (billTime > nowTime + 24 * 60 * 60 * 1000) {
      isFutureDate = true;
      messages.push("Invalid Future Date");
    } else if (nowTime - billTime > sixtyDaysMs) {
      isOver60Days = true;
      messages.push("Policy Warning: Bill > 60 Days Old");
    }
  }

  // 5. Duplicate Check
  if (isDuplicate) {
    messages.push("Duplicate Receipt Detected");
  }

  return {
    isDuplicate,
    isAlcohol,
    isZeroAmount,
    isOver60Days,
    isFutureDate,
    isOffensive,
    messages,
  };
}

/**
 * Strict Vendor Name Sanitizer and Dictionary Verifier.
 */
function sanitizeVendorName(rawText: string): string {
  const lines = rawText.split("\n").map(l => l.trim()).filter(l => l.length >= 3);
  
  for (const line of lines.slice(0, 5)) {
    const cleanLine = line.replace(/[^a-zA-Z0-9\s&'-]/g, "").trim();
    if (cleanLine.length < 3) continue;

    const lowerLine = cleanLine.toLowerCase();

    for (const vendor of GLOBAL_VENDORS) {
      if (lowerLine.includes(vendor.toLowerCase())) {
        return vendor;
      }
    }

    const words = cleanLine.split(/\s+/);
    const shortWordCount = words.filter(w => w.length <= 2).length;
    if (words.length >= 2 && shortWordCount / words.length > 0.4) {
      continue;
    }

    let isRealVendor = false;
    for (const word of words) {
      const wLower = word.toLowerCase();
      if (VALID_BUSINESS_WORDS.has(wLower)) {
        isRealVendor = true;
        break;
      }
      if (word.length >= 4 && /[aeiouy]/i.test(word) && !/^[0-9]+$/.test(word)) {
        isRealVendor = true;
      }
    }

    if (isRealVendor && cleanLine.length <= 40) {
      return cleanLine.replace(/\b\w/g, c => c.toUpperCase());
    }
  }

  return "Vendor Name";
}

/**
 * Locale-Aware & Batch-Consistent Date Parser.
 */
function parseLocaleDate(rawText: string, currencyCode: string): string {
  const dateRegex = /\b(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/i;
  const dateMatch = rawText.match(dateRegex);
  
  if (!dateMatch) {
    return new Date().toISOString().split("T")[0];
  }

  const clean = dateMatch[0].trim();

  const isoMatch = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  if (/[a-z]{3,9}/i.test(clean)) {
    const parsed = new Date(clean);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
  }

  const numMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (numMatch) {
    const [, first, second, yearStr] = numMatch;
    const num1 = parseInt(first, 10);
    const num2 = parseInt(second, 10);
    let year = parseInt(yearStr, 10);
    if (year < 100) year += 2000;

    let day = num1;
    let month = num2;

    if (num1 > 12) {
      day = num1;
      month = num2;
    } else if (num2 > 12) {
      day = num2;
      month = num1;
    } else {
      const isUsRegion = currencyCode === "USD";
      if (isUsRegion) {
        month = num1;
        day = num2;
      } else {
        day = num1;
        month = num2;
      }
    }

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const formattedM = String(month).padStart(2, "0");
      const formattedD = String(day).padStart(2, "0");
      return `${year}-${formattedM}-${formattedD}`;
    }
  }

  const fallback = new Date(clean);
  if (!isNaN(fallback.getTime())) {
    return fallback.toISOString().split("T")[0];
  }

  return new Date().toISOString().split("T")[0];
}

/**
 * Largest Amount Total Due Selector.
 * Selects the largest valid number matching Total Due / Grand Total with VAT.
 */
function parseLocaleAmount(text: string, currencyCode: string): { amount: number; isEuFormat: boolean } {
  const isEuCurrency = ["EUR", "SEK", "NOK", "DKK", "BRL"].includes(currencyCode);
  const isEuFormat = isEuCurrency || /\b\d+,\d{2}\b/.test(text);

  const amounts: number[] = [];

  // Match all numbers on lines containing total/due/grand/net/balance/amount
  const totalRegex = /(?:total|grand|due|net|sum|balance|amount)\D{0,15}(\d+[.,]\d{2})/gi;
  let totalMatch;
  while ((totalMatch = totalRegex.exec(text)) !== null) {
    let numStr = totalMatch[1];
    if (isEuFormat) {
      numStr = numStr.replace(".", "").replace(",", ".");
    } else {
      numStr = numStr.replace(",", "");
    }
    const num = parseFloat(numStr);
    if (!isNaN(num) && num > 0) amounts.push(num);
  }

  // Also collect all floating point numbers on receipt to find absolute max Total Due
  const anyNumber = isEuFormat ? /\b\d+,\d{2}\b/g : /\b\d+\.\d{2}\b/g;
  const allNums = text.match(anyNumber);
  if (allNums) {
    allNums.forEach(n => {
      const str = isEuFormat ? n.replace(",", ".") : n;
      const num = parseFloat(str);
      if (!isNaN(num) && num > 0 && num < 100000) {
        amounts.push(num);
      }
    });
  }

  const maxAmount = amounts.length > 0 ? Math.max(...amounts) : 0.0;
  return { amount: Math.round(maxAmount * 100) / 100, isEuFormat };
}

/**
 * Downscales oversized photos (<= 1600px max edge), enhances contrast, trims
 * empty margins, and encodes as JPEG bytes while releasing canvas memory.
 */
export async function enhanceReceiptImage(file: File): Promise<Uint8Array> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Failed to decode receipt image"));
      el.src = objectUrl;
    });

    const MAX_DIM = 1600;
    const scale = Math.min(1, MAX_DIM / Math.max(img.width || 1, img.height || 1));
    const targetW = Math.max(1, Math.round(img.width * scale));
    const targetH = Math.max(1, Math.round(img.height * scale));

    const srcCanvas = document.createElement("canvas");
    srcCanvas.width = targetW;
    srcCanvas.height = targetH;
    try {
      const ctx = srcCanvas.getContext("2d");
      if (!ctx) return new Uint8Array(await file.arrayBuffer());

      ctx.drawImage(img, 0, 0, targetW, targetH);
      const imageData = ctx.getImageData(0, 0, targetW, targetH);
      const data = imageData.data;

      let minBrightness = 255;
      let maxBrightness = 0;
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        if (avg < minBrightness) minBrightness = avg;
        if (avg > maxBrightness) maxBrightness = avg;
      }

      const contrastRange = maxBrightness - minBrightness || 1;
      const paperThreshold = minBrightness + contrastRange * 0.45;
      const rowPaperCounts = new Int32Array(targetH);
      const colPaperCounts = new Int32Array(targetW);

      for (let y = 0; y < targetH; y++) {
        for (let x = 0; x < targetW; x++) {
          const idx = (y * targetW + x) * 4;
          const avg = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
          if (avg >= paperThreshold) {
            rowPaperCounts[y]++;
            colPaperCounts[x]++;
          }
        }
      }

      const minRowDensity = targetW * 0.08;
      const minColDensity = targetH * 0.08;
      let minY = 0;
      while (minY < targetH && rowPaperCounts[minY] < minRowDensity) minY++;
      let maxY = targetH - 1;
      while (maxY > minY && rowPaperCounts[maxY] < minRowDensity) maxY--;
      let minX = 0;
      while (minX < targetW && colPaperCounts[minX] < minColDensity) minX++;
      let maxX = targetW - 1;
      while (maxX > minX && colPaperCounts[maxX] < minColDensity) maxX--;

      for (let i = 0; i < data.length; i += 4) {
        let avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        avg = ((avg - minBrightness) / contrastRange) * 255;
        if (avg > 185) avg = 255;
        else if (avg < 80) avg = Math.max(0, avg - 30);
        data[i] = avg;
        data[i + 1] = avg;
        data[i + 2] = avg;
      }
      ctx.putImageData(imageData, 0, 0);

      const padX = Math.round(targetW * 0.02);
      const padY = Math.round(targetH * 0.02);
      minX = Math.max(0, minX - padX);
      minY = Math.max(0, minY - padY);
      maxX = Math.min(targetW - 1, maxX + padX);
      maxY = Math.min(targetH - 1, maxY + padY);

      const cropW = maxX - minX + 1;
      const cropH = maxY - minY + 1;
      if (cropW < targetW * 0.98 || cropH < targetH * 0.98) {
        const cropCanvas = document.createElement("canvas");
        cropCanvas.width = cropW;
        cropCanvas.height = cropH;
        const cropCtx = cropCanvas.getContext("2d");
        if (cropCtx) {
          cropCtx.drawImage(srcCanvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
          return await canvasToBytes(cropCanvas, "image/jpeg", 0.92);
        }
      }

      return await canvasToBytes(srcCanvas, "image/jpeg", 0.92);
    } finally {
      srcCanvas.width = 0;
      srcCanvas.height = 0;
    }
  } catch {
    return new Uint8Array(await file.arrayBuffer());
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * OCR & Policy QA Scanner for Receipt Images. Reuses an optional shared Tesseract
 * worker across batches to avoid booting a WASM worker per receipt.
 */
export async function parseReceiptFile(
  file: File,
  itemNo: number,
  sharedWorker?: Worker
): Promise<ReceiptItem> {
  const id = `receipt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const enhancedBytes = await enhanceReceiptImage(file);

  let rawText = "";
  let ownsWorker = false;
  let worker = sharedWorker;
  try {
    if (!worker) {
      const { createWorker } = await import("tesseract.js");
      worker = await createWorker("eng");
      ownsWorker = true;
    }
    const imageBlob = new Blob([new Uint8Array(enhancedBytes)], { type: "image/jpeg" });
    const ret = await worker.recognize(imageBlob);
    rawText = ret.data.text || "";
  } catch (err: unknown) {
    console.warn("Tesseract OCR fallback triggered:", err);
  } finally {
    if (ownsWorker && worker) {
      await worker.terminate();
    }
  }

  const billName = sanitizeVendorName(rawText);

  const detectedCurrency = detectCurrency(rawText);
  const browserFallback = getBrowserLocaleCurrency();
  const currency = detectedCurrency ? detectedCurrency.code : browserFallback.code;
  const currencyDetected = detectedCurrency !== null;
  const location = detectedCurrency ? detectedCurrency.name : browserFallback.name;

  const date = parseLocaleDate(rawText, currency);
  const { amount: rawAmount, isEuFormat } = parseLocaleAmount(rawText, currency);
  let amount = rawAmount;

  let tipAmount = 0.0;
  const tipRegex = /(?:tip|gratuity)\D{0,10}(\d+[.,]\d{2})/gi;
  const tipMatch = tipRegex.exec(rawText);
  if (tipMatch) {
    const numStr = isEuFormat ? tipMatch[1].replace(",", ".") : tipMatch[1].replace(",", "");
    tipAmount = parseFloat(numStr) || 0;
  }

  if (tipAmount > 0 && amount >= tipAmount) {
    amount = Math.round((amount - tipAmount) * 100) / 100;
  }

  // Scan alcohol keywords with line number callout
  const rawMessages: string[] = [];
  const alcoholRegex = new RegExp(`\\b(${ALCOHOL_SMOKING_KEYWORDS.join("|")})\\b`, "i");

  const rawLines = rawText.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  for (let idx = 0; idx < rawLines.length; idx++) {
    const line = rawLines[idx];
    const lowerLine = line.toLowerCase();

    if (lowerLine.includes("www.") || lowerLine.includes("http") || lowerLine.includes(".com") || lowerLine.includes(".ae") || lowerLine.includes("visit")) {
      continue;
    }

    const match = line.match(alcoholRegex);
    if (match) {
      const linePriceMatch = line.match(/\b\d+[.,]\d{2}\b/);
      const priceCallout = linePriceMatch ? ` (${linePriceMatch[0]})` : "";
      rawMessages.push(`Line ${idx + 1}: "${line.substring(0, 24)}"${priceCallout} - Non-permitted item detected (${match[0]})`);
      break;
    }
  }

  const qaFlags = evaluateQAFlags({ date, amount, billName, rawMessages });

  return {
    id,
    file,
    previewUrl: "",
    enhancedBytes,
    itemNo,
    billName,
    date,
    amount,
    tipAmount,
    currency,
    currencyDetected,
    location,
    status: "ready",
    qaFlags,
  };
}

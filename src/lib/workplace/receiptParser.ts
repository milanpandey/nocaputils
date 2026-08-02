import { detectCurrency, getBrowserLocaleCurrency, CURRENCY_MAP } from "./currencyMap";
import * as XLSX from "xlsx";

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
  imageDataUrl: string;
  enhancedDataUrl: string;
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

export const GLOBAL_VENDORS = [
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
 * Evaluates all Policy QA rules dynamically for OCR scanning, PDF intake, Excel stitching & live user edits.
 */
export function evaluateQAFlags(
  item: { date: string; amount: number; billName: string; rawMessages?: string[] },
  isDuplicate = false
): QAFlags {
  const messages: string[] = [];
  let isAlcohol = false;
  let isZeroAmount = item.amount === 0;
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

  // 4. Date Policy Checks
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
function sanitizeVendorName(rawText: string, fileName: string): string {
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

  return fileName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9\s]/g, " ").trim() || "Vendor Name";
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
    let [, first, second, yearStr] = numMatch;
    let num1 = parseInt(first, 10);
    let num2 = parseInt(second, 10);
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
 */
function parseLocaleAmount(text: string, currencyCode: string): { amount: number; isEuFormat: boolean } {
  const isEuCurrency = ["EUR", "SEK", "NOK", "DKK", "BRL"].includes(currencyCode);
  const isEuFormat = isEuCurrency || /\b\d+,\d{2}\b/.test(text);

  const amounts: number[] = [];

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
 * Canvas Image enhancement with 2-Pass Receipt Auto-Cropping.
 */
export async function enhanceReceiptImage(file: File): Promise<{ originalUrl: string; enhancedUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const originalUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const srcCanvas = document.createElement("canvas");
        srcCanvas.width = img.width;
        srcCanvas.height = img.height;
        const ctx = srcCanvas.getContext("2d");
        if (!ctx) return resolve({ originalUrl, enhancedUrl: originalUrl });

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
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

        const rowPaperCounts = new Int32Array(srcCanvas.height);
        const colPaperCounts = new Int32Array(srcCanvas.width);

        for (let y = 0; y < srcCanvas.height; y++) {
          for (let x = 0; x < srcCanvas.width; x++) {
            const idx = (y * srcCanvas.width + x) * 4;
            const avg = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
            if (avg >= paperThreshold) {
              rowPaperCounts[y]++;
              colPaperCounts[x]++;
            }
          }
        }

        const minRowDensity = srcCanvas.width * 0.08;
        const minColDensity = srcCanvas.height * 0.08;

        let minY = 0;
        while (minY < srcCanvas.height && rowPaperCounts[minY] < minRowDensity) minY++;

        let maxY = srcCanvas.height - 1;
        while (maxY > minY && rowPaperCounts[maxY] < minRowDensity) maxY--;

        let minX = 0;
        while (minX < srcCanvas.width && colPaperCounts[minX] < minColDensity) minX++;

        let maxX = srcCanvas.width - 1;
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

        const padX = Math.round(srcCanvas.width * 0.02);
        const padY = Math.round(srcCanvas.height * 0.02);

        minX = Math.max(0, minX - padX);
        minY = Math.max(0, minY - padY);
        maxX = Math.min(srcCanvas.width - 1, maxX + padX);
        maxY = Math.min(srcCanvas.height - 1, maxY + padY);

        const cropW = maxX - minX + 1;
        const cropH = maxY - minY + 1;

        if (cropW < srcCanvas.width * 0.98 || cropH < srcCanvas.height * 0.98) {
          const cropCanvas = document.createElement("canvas");
          cropCanvas.width = cropW;
          cropCanvas.height = cropH;
          const cropCtx = cropCanvas.getContext("2d");
          if (cropCtx) {
            cropCtx.drawImage(srcCanvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);
            const enhancedUrl = cropCanvas.toDataURL("image/jpeg", 0.92);
            return resolve({ originalUrl, enhancedUrl });
          }
        }

        const enhancedUrl = srcCanvas.toDataURL("image/jpeg", 0.92);
        resolve({ originalUrl, enhancedUrl });
      };
      img.onerror = () => resolve({ originalUrl, enhancedUrl: originalUrl });
      img.src = originalUrl;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Creates a clean SVG placeholder Data URL for stitched Excel ledger items.
 */
function createStitchedCardGraphic(billName: string, amount: number, currency: string, date: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
    <rect width="600" height="800" fill="#111827"/>
    <rect x="20" y="20" width="560" height="760" fill="#F9FAFB" stroke="#000000" stroke-width="8"/>
    <rect x="40" y="40" width="520" height="120" fill="#2A9D8F"/>
    <text x="60" y="90" font-family="sans-serif" font-weight="900" font-size="28" fill="#FFFFFF">STITCHED EXPENSE RECORD</text>
    <text x="60" y="130" font-family="sans-serif" font-weight="700" font-size="16" fill="#E0F2FE">Imported via Expense Ledger Stitcher</text>
    
    <text x="60" y="240" font-family="sans-serif" font-weight="900" font-size="22" fill="#111827">MERCHANT / BILL:</text>
    <text x="60" y="280" font-family="sans-serif" font-weight="900" font-size="36" fill="#E63946">${billName.toUpperCase()}</text>

    <text x="60" y="380" font-family="sans-serif" font-weight="900" font-size="22" fill="#111827">DATE OF BILL:</text>
    <text x="60" y="420" font-family="sans-serif" font-weight="800" font-size="32" fill="#1F2937">${date}</text>

    <text x="60" y="520" font-family="sans-serif" font-weight="900" font-size="22" fill="#111827">AMOUNT CLAIMED:</text>
    <text x="60" y="570" font-family="sans-serif" font-weight="900" font-size="44" fill="#2A9D8F">${currency} ${amount.toFixed(2)}</text>

    <line x1="40" y1="650" x2="560" y2="650" stroke="#000000" stroke-width="4" stroke-dasharray="8 8"/>
    <text x="60" y="710" font-family="sans-serif" font-weight="700" font-size="16" fill="#6B7280">Verified &amp; Merged into Final Master Ledger</text>
  </svg>`;

  return `data:image/svg+xml;base64,${typeof window !== "undefined" ? btoa(svg) : ""}`;
}

/**
 * Parses PDF Receipt Documents page-by-page.
 */
export async function parsePdfReceiptFile(file: File, startItemNo: number): Promise<ReceiptItem[]> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const items: ReceiptItem[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // TypeScript compatibility for pdfjs-dist page.render
      await (page as unknown as { render: (params: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => { promise: Promise<void> } })
        .render({ canvasContext: ctx, viewport }).promise;
    }

    const pageImageDataUrl = canvas.toDataURL("image/jpeg", 0.92);

    // Extract text content from PDF page
    const textContent = await page.getTextContent();
    const textItems = textContent.items.map((item: unknown) => (item as { str: string }).str);
    let rawText = textItems.join(" ");

    // If PDF page text is sparse/scanned, fallback to Tesseract OCR on page canvas
    if (rawText.trim().length < 15) {
      try {
        const { createWorker } = await import("tesseract.js");
        const worker = await createWorker("eng");
        const ret = await worker.recognize(pageImageDataUrl);
        rawText = ret.data.text || "";
        await worker.terminate();
      } catch (err) {
        console.warn("PDF Page OCR Fallback warning:", err);
      }
    }

    const billName = sanitizeVendorName(rawText, `${file.name.replace(/\.pdf$/i, "")} Page ${p}`);
    const detectedCurrency = detectCurrency(rawText);
    const browserFallback = getBrowserLocaleCurrency();
    const currency = detectedCurrency ? detectedCurrency.code : browserFallback.code;
    const currencyDetected = detectedCurrency !== null;
    const location = detectedCurrency ? detectedCurrency.name : browserFallback.name;

    const date = parseLocaleDate(rawText, currency);
    const { amount } = parseLocaleAmount(rawText, currency);

    const rawMessages: string[] = [];
    const alcoholRegex = new RegExp(`\\b(${ALCOHOL_SMOKING_KEYWORDS.join("|")})\\b`, "i");
    if (alcoholRegex.test(rawText)) {
      rawMessages.push(`Non-permitted items detected in PDF Page ${p}`);
    }

    const qaFlags = evaluateQAFlags({ date, amount, billName, rawMessages });

    items.push({
      id: `pdf_receipt_${Date.now()}_${p}_${Math.random().toString(36).substr(2, 4)}`,
      file,
      imageDataUrl: pageImageDataUrl,
      enhancedDataUrl: pageImageDataUrl,
      itemNo: startItemNo + p - 1,
      billName,
      date,
      amount,
      tipAmount: 0,
      currency,
      currencyDetected,
      location,
      status: "ready",
      qaFlags,
    });
  }

  return items;
}

/**
 * Parses Existing Excel Expense Ledgers (.xlsx, .xls, .csv).
 */
export async function parseExcelLedgerFile(file: File, startItemNo: number): Promise<ReceiptItem[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
  const items: ReceiptItem[] = [];

  let itemIdx = 0;
  for (const row of rawRows) {
    const keys = Object.keys(row);
    const rowStr = JSON.stringify(row).toLowerCase();

    // Skip total/header rows
    if (rowStr.includes("total") || rowStr.includes("workplace expense")) continue;

    let billName = "";
    let date = new Date().toISOString().split("T")[0];
    let amount = 0.0;
    let currency = "AED";
    let location = "United Arab Emirates";

    for (const k of keys) {
      const kLower = k.toLowerCase();
      const val = String(row[k]).trim();
      if (!val) continue;

      if (kLower.includes("merchant") || kLower.includes("bill") || kLower.includes("name")) {
        billName = val;
      } else if (kLower.includes("date")) {
        billName = billName || "Stitched Expense";
        const parsedD = new Date(val);
        if (!isNaN(parsedD.getTime())) {
          date = parsedD.toISOString().split("T")[0];
        } else {
          date = val;
        }
      } else if (kLower.includes("amount") || kLower.includes("price") || kLower.includes("total")) {
        const parsedA = parseFloat(val.replace(/[^0-9.]/g, ""));
        if (!isNaN(parsedA) && parsedA > 0) amount = parsedA;
      } else if (kLower.includes("currency")) {
        if (CURRENCY_MAP[val.toUpperCase()]) currency = val.toUpperCase();
      } else if (kLower.includes("location") || kLower.includes("country")) {
        location = val;
      }
    }

    if (amount > 0 || billName) {
      itemIdx++;
      billName = billName || `Stitched Bill ${itemIdx}`;
      const graphicUrl = createStitchedCardGraphic(billName, amount, currency, date);
      const qaFlags = evaluateQAFlags({ date, amount, billName });

      items.push({
        id: `excel_receipt_${Date.now()}_${itemIdx}`,
        file,
        imageDataUrl: graphicUrl,
        enhancedDataUrl: graphicUrl,
        itemNo: startItemNo + itemIdx - 1,
        billName,
        date,
        amount,
        tipAmount: 0,
        currency,
        currencyDetected: true,
        location,
        status: "ready",
        qaFlags,
      });
    }
  }

  return items;
}

/**
 * OCR & Policy QA Scanner for Receipt Files (Image, PDF, Excel).
 */
export async function parseReceiptFile(file: File, itemNo: number): Promise<ReceiptItem[]> {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const isExcel = file.name.toLowerCase().endsWith(".xlsx") || file.name.toLowerCase().endsWith(".xls") || file.name.toLowerCase().endsWith(".csv");

  if (isPdf) {
    return parsePdfReceiptFile(file, itemNo);
  }

  if (isExcel) {
    return parseExcelLedgerFile(file, itemNo);
  }

  // Single Image Receipt Processing
  const id = `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const { originalUrl, enhancedUrl } = await enhanceReceiptImage(file);

  let rawText = "";
  try {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng");
    const ret = await worker.recognize(enhancedUrl);
    rawText = ret.data.text || "";
    await worker.terminate();
  } catch (err: unknown) {
    console.warn("Tesseract OCR fallback triggered:", err);
  }

  const billName = sanitizeVendorName(rawText, file.name);
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

  return [{
    id,
    file,
    imageDataUrl: originalUrl,
    enhancedDataUrl: enhancedUrl,
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
  }];
}

export const SHOW_TRIPTEA = false;
export const TRIPTEA_PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.triptea.app";

/**
 * Generates a Google Play Store link for TripTea with UTM parameters.
 * 
 * @param pageIdentifier - The identifier for the page where the link is placed.
 * @returns The full Play Store URL with UTM parameters.
 */
export const getTripTeaLink = (pageIdentifier: string) => {
  const params = new URLSearchParams({
    utm_source: "nocaputils",
    utm_medium: "referral",
    utm_campaign: "nocaputils_triptea",
    utm_content: pageIdentifier,
  });

  return `${TRIPTEA_PLAY_STORE_URL}&${params.toString()}`;
};

// ─── Feedback & Feature Request URLs ─────────────────────────────────────────

/** Generic tool feedback form (used on home, blog, and unknown routes) */
export const GENERIC_FEEDBACK_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLScUlkb4NiuqIDUckpMENYNKCXGOGUSXMuH9S4G9ItvWC-3pMQ/viewform?usp=dialog";

/** Feature request form (all pages) */
export const FEATURE_REQUEST_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSc1JI9urrpUmmohSgtm2M3aO2i292bUxcJnceyF2Z7XEdheUQ/viewform?usp=dialog";

/**
 * Per-tool prefilled feedback URLs.
 * Key = Next.js pathname (leading slash, no trailing slash).
 */
export const TOOL_FEEDBACK_URLS: Record<string, string> = {
  "/online-video-editor":
    "https://docs.google.com/forms/d/e/1FAIpQLScUlkb4NiuqIDUckpMENYNKCXGOGUSXMuH9S4G9ItvWC-3pMQ/viewform?usp=pp_url&entry.15159524=Video+Editor",
  "/video-frame-extractor":
    "https://docs.google.com/forms/d/e/1FAIpQLScUlkb4NiuqIDUckpMENYNKCXGOGUSXMuH9S4G9ItvWC-3pMQ/viewform?usp=pp_url&entry.15159524=Frame+Grab+%2F+Video+Frame+Extractor",
  "/video-to-gif":
    "https://docs.google.com/forms/d/e/1FAIpQLScUlkb4NiuqIDUckpMENYNKCXGOGUSXMuH9S4G9ItvWC-3pMQ/viewform?usp=pp_url&entry.15159524=Video+to+GIF",
  "/compress-video":
    "https://docs.google.com/forms/d/e/1FAIpQLScUlkb4NiuqIDUckpMENYNKCXGOGUSXMuH9S4G9ItvWC-3pMQ/viewform?usp=pp_url&entry.15159524=Video+Compressor",
  "/video-to-mp3":
    "https://docs.google.com/forms/d/e/1FAIpQLScUlkb4NiuqIDUckpMENYNKCXGOGUSXMuH9S4G9ItvWC-3pMQ/viewform?usp=pp_url&entry.15159524=Video+to+MP3",
  "/audio-to-mp4":
    "https://docs.google.com/forms/d/e/1FAIpQLScUlkb4NiuqIDUckpMENYNKCXGOGUSXMuH9S4G9ItvWC-3pMQ/viewform?usp=pp_url&entry.15159524=Audio+to+MP4",
  "/change-video-speed":
    "https://docs.google.com/forms/d/e/1FAIpQLScUlkb4NiuqIDUckpMENYNKCXGOGUSXMuH9S4G9ItvWC-3pMQ/viewform?usp=pp_url&entry.15159524=Video+Speed+Control",
  "/music-visualizer":
    "https://docs.google.com/forms/d/e/1FAIpQLScUlkb4NiuqIDUckpMENYNKCXGOGUSXMuH9S4G9ItvWC-3pMQ/viewform?usp=pp_url&entry.15159524=Music+Visualizer",
  "/audio-effects":
    "https://docs.google.com/forms/d/e/1FAIpQLScUlkb4NiuqIDUckpMENYNKCXGOGUSXMuH9S4G9ItvWC-3pMQ/viewform?usp=pp_url&entry.15159524=Audio+Effects",
  "/workplaceutilities/file-bills":
    "https://docs.google.com/forms/d/e/1FAIpQLScUlkb4NiuqIDUckpMENYNKCXGOGUSXMuH9S4G9ItvWC-3pMQ/viewform?usp=pp_url&entry.15159524=File+Bills+%26+Expense+Ledger",
  "/workplaceutilities/pdf-to-word":
    "https://docs.google.com/forms/d/e/1FAIpQLScUlkb4NiuqIDUckpMENYNKCXGOGUSXMuH9S4G9ItvWC-3pMQ/viewform?usp=pp_url&entry.15159524=PDF+to+Word+Converter",
  "/workplaceutilities/compress-pdf":
    "https://docs.google.com/forms/d/e/1FAIpQLScUlkb4NiuqIDUckpMENYNKCXGOGUSXMuH9S4G9ItvWC-3pMQ/viewform?usp=pp_url&entry.15159524=PDF+Compressor",
  "/workplaceutilities/pdf-merge":
    "https://docs.google.com/forms/d/e/1FAIpQLScUlkb4NiuqIDUckpMENYNKCXGOGUSXMuH9S4G9ItvWC-3pMQ/viewform?usp=pp_url&entry.15159524=PDF+Merger",
  "/workplaceutilities/merge-excel":
    "https://docs.google.com/forms/d/e/1FAIpQLScUlkb4NiuqIDUckpMENYNKCXGOGUSXMuH9S4G9ItvWC-3pMQ/viewform?usp=pp_url&entry.15159524=Merge+Excel+Files",
  "/workplaceutilities/archive-files":
    "https://docs.google.com/forms/d/e/1FAIpQLScUlkb4NiuqIDUckpMENYNKCXGOGUSXMuH9S4G9ItvWC-3pMQ/viewform?usp=pp_url&entry.15159524=Archive+Files+%28ZIP%2FTAR%29",
  "/workplaceutilities/markdown-editor":
    "https://docs.google.com/forms/d/e/1FAIpQLScUlkb4NiuqIDUckpMENYNKCXGOGUSXMuH9S4G9ItvWC-3pMQ/viewform?usp=pp_url&entry.15159524=Markdown+Editor",
  "/workplaceutilities/markdown-table":
    "https://docs.google.com/forms/d/e/1FAIpQLScUlkb4NiuqIDUckpMENYNKCXGOGUSXMuH9S4G9ItvWC-3pMQ/viewform?usp=pp_url&entry.15159524=Markdown+Table+Generator",
  "/workplaceutilities/markdown-to-pdf":
    "https://docs.google.com/forms/d/e/1FAIpQLScUlkb4NiuqIDUckpMENYNKCXGOGUSXMuH9S4G9ItvWC-3pMQ/viewform?usp=pp_url&entry.15159524=Markdown+to+PDF",
  "/workplaceutilities/pdf-to-markdown":
    "https://docs.google.com/forms/d/e/1FAIpQLScUlkb4NiuqIDUckpMENYNKCXGOGUSXMuH9S4G9ItvWC-3pMQ/viewform?usp=pp_url&entry.15159524=PDF+to+Markdown",
  "/personality/rorschach-test":
    "https://docs.google.com/forms/d/e/1FAIpQLScUlkb4NiuqIDUckpMENYNKCXGOGUSXMuH9S4G9ItvWC-3pMQ/viewform?usp=pp_url&entry.15159524=Rorschach+Inkblot+Explorer",
  "/personality/color-quest":
    "https://docs.google.com/forms/d/e/1FAIpQLScUlkb4NiuqIDUckpMENYNKCXGOGUSXMuH9S4G9ItvWC-3pMQ/viewform?usp=pp_url&entry.15159524=Color+Quest+Personality+Test",
  "/games/wheres-the-letter":
    "https://docs.google.com/forms/d/e/1FAIpQLScUlkb4NiuqIDUckpMENYNKCXGOGUSXMuH9S4G9ItvWC-3pMQ/viewform?usp=pp_url&entry.15159524=Where%27s+the+Letter%3F",
  "/games/memory-match":
    "https://docs.google.com/forms/d/e/1FAIpQLScUlkb4NiuqIDUckpMENYNKCXGOGUSXMuH9S4G9ItvWC-3pMQ/viewform?usp=pp_url&entry.15159524=Memory+Match",
  "/games/color-quest":
    "https://docs.google.com/forms/d/e/1FAIpQLScUlkb4NiuqIDUckpMENYNKCXGOGUSXMuH9S4G9ItvWC-3pMQ/viewform?usp=pp_url&entry.15159524=Color+Quest+%28Game%29",
  "/games/sound-safari":
    "https://docs.google.com/forms/d/e/1FAIpQLScUlkb4NiuqIDUckpMENYNKCXGOGUSXMuH9S4G9ItvWC-3pMQ/viewform?usp=pp_url&entry.15159524=Sound+Safari",
  "/games/shape-builder":
    "https://docs.google.com/forms/d/e/1FAIpQLScUlkb4NiuqIDUckpMENYNKCXGOGUSXMuH9S4G9ItvWC-3pMQ/viewform?usp=pp_url&entry.15159524=Shape+Builder",
  "/games/count-along":
    "https://docs.google.com/forms/d/e/1FAIpQLScUlkb4NiuqIDUckpMENYNKCXGOGUSXMuH9S4G9ItvWC-3pMQ/viewform?usp=pp_url&entry.15159524=Count+Along",
  "/pii-shield":
    "https://docs.google.com/forms/d/e/1FAIpQLScUlkb4NiuqIDUckpMENYNKCXGOGUSXMuH9S4G9ItvWC-3pMQ/viewform?usp=pp_url&entry.15159524=PII+Shield",
};

// ─── PII Shield Constants & Microsoft Store Campaign Tracking ────────────────

export const PII_SHIELD_STORE_ID = "9NM785C34320";
export const PII_SHIELD_CAMPAIGN_HOMEPAGE = "homepage";
export const PII_SHIELD_CAMPAIGN_PAGE = "piishield_page";
export const PII_SHIELD_DEFAULT_CAMPAIGN = "website";

export const PII_SHIELD_STORE_WEB_BASE = `https://apps.microsoft.com/detail/${PII_SHIELD_STORE_ID}`;
export const PII_SHIELD_STORE_PROTOCOL_BASE = `ms-windows-store://pdp/?productid=${PII_SHIELD_STORE_ID}`;

/** Documentation & Legal links hosted on Firebase */
export const PII_SHIELD_DOCS_URL = "https://okpi-5e20b.web.app/piishield/about.html";
export const PII_SHIELD_PRIVACY_URL = "https://okpi-5e20b.web.app/piishield/privacy-policy.html";
export const PII_SHIELD_TERMS_URL = "https://okpi-5e20b.web.app/piishield/terms-of-service.html";
export const PII_SHIELD_EULA_URL = "https://okpi-5e20b.web.app/piishield/license.html";
export const PII_SHIELD_THIRD_PARTY_LICENSES_URL = "https://okpi-5e20b.web.app/piishield/third-party-licenses.html";

/**
 * Generates a Microsoft Store link for PII Shield with campaign / referrer tracking.
 *
 * In Microsoft Partner Center (Analytics > Custom app promotion campaigns),
 * you can register custom Campaign IDs (e.g. "homepage", "piishield_page", "website")
 * to track downloads, impressions, and conversions.
 *
 * @param campaign - Custom campaign ID (default: "website")
 * @param isProtocol - If true, returns `ms-windows-store://` protocol link for Windows PCs
 */
export const getPiiShieldStoreLink = (
  campaign: string = PII_SHIELD_DEFAULT_CAMPAIGN,
  isProtocol: boolean = false
): string => {
  const cleanCampaign = campaign ? encodeURIComponent(campaign) : "";
  if (isProtocol) {
    return cleanCampaign
      ? `${PII_SHIELD_STORE_PROTOCOL_BASE}&cid=${cleanCampaign}`
      : PII_SHIELD_STORE_PROTOCOL_BASE;
  }
  return cleanCampaign
    ? `${PII_SHIELD_STORE_WEB_BASE}?cid=${cleanCampaign}`
    : PII_SHIELD_STORE_WEB_BASE;
};


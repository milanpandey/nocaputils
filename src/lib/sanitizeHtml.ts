import DOMPurify from "dompurify";

/**
 * Sanitizes rendered HTML (e.g. from `marked`) before injecting with dangerouslySetInnerHTML.
 * Allows standard GFM tags while stripping scripts, event handlers, and unsafe URIs.
 */
export function sanitizeHtml(dirtyHtml: string): string {
  if (typeof window === "undefined") {
    return "";
  }
  return DOMPurify.sanitize(dirtyHtml, {
    USE_PROFILES: { html: true },
  });
}

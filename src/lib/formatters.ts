/**
 * Format a byte count into a human-readable string (e.g. "1.24 MB").
 */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format seconds as M:SS (e.g. "3:05").
 */
export function formatClockTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Format seconds as MM:SS.d (e.g. "01:05.3").
 */
export function formatTimeTenths(seconds: number): string {
  if (!Number.isFinite(seconds)) return "00:00.0";
  const safe = Math.max(seconds, 0);
  const m = Math.floor(safe / 60);
  const s = Math.floor(safe % 60);
  const t = Math.floor((safe % 1) * 10);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${t}`;
}

/**
 * Format seconds as MM:SS.mmm (e.g. "01:05.042").
 */
export function formatTimeMillis(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00.000";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
}

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import type { MutableRefObject } from "react";

const FFMPEG_CORE_BASE_URL = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/umd";

interface CachedCoreUrls {
  coreURL: string;
  wasmURL: string;
}

let cachedCorePromise: Promise<CachedCoreUrls> | null = null;

/**
 * Fetches and caches FFmpeg core JS & WASM blob URLs once per browser session.
 * Note: ffmpeg-core.wasm (~31 MB) exceeds Cloudflare Pages' 25 MiB static asset limit,
 * so it is loaded via unpkg CDN and cached as Blob URLs.
 */
export async function getFFmpegCoreUrls(): Promise<CachedCoreUrls> {
  if (!cachedCorePromise) {
    cachedCorePromise = (async () => {
      try {
        const [coreURL, wasmURL] = await Promise.all([
          toBlobURL(`${FFMPEG_CORE_BASE_URL}/ffmpeg-core.js`, "text/javascript"),
          toBlobURL(`${FFMPEG_CORE_BASE_URL}/ffmpeg-core.wasm`, "application/wasm"),
        ]);
        return { coreURL, wasmURL };
      } catch (err) {
        cachedCorePromise = null;
        throw err;
      }
    })();
  }
  return cachedCorePromise;
}

export interface LoadFFmpegOptions {
  forceFresh?: boolean;
}

/**
 * Loads or reuses an FFmpeg instance stored in a ref, terminating any old instance
 * when `forceFresh` is true.
 */
export async function getOrCreateFFmpeg(
  ref: MutableRefObject<FFmpeg | null>,
  options: LoadFFmpegOptions = {}
): Promise<FFmpeg> {
  const { forceFresh = false } = options;

  if (forceFresh && ref.current) {
    try {
      ref.current.terminate();
    } catch {
      // Ignore termination errors on stale workers
    }
    ref.current = null;
  }

  let ffmpeg = ref.current;
  if (!ffmpeg) {
    ffmpeg = new FFmpeg();
    const { coreURL, wasmURL } = await getFFmpegCoreUrls();
    await ffmpeg.load({ coreURL, wasmURL });
    ref.current = ffmpeg;
  }

  return ffmpeg;
}

/**
 * Attaches a normalized [0, 1] progress handler to an FFmpeg instance and returns
 * a cleanup function to detach it in `finally`.
 */
export function attachFFmpegProgress(
  ffmpeg: FFmpeg,
  onProgress: (progress01: number) => void
): () => void {
  const handler = ({ progress }: { progress: number }) => {
    const clamped = Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
    onProgress(clamped);
  };
  ffmpeg.on("progress", handler);
  return () => {
    ffmpeg.off("progress", handler);
  };
}

/**
 * Creates a standalone FFmpeg instance (not shared via ref), useful for batch/offline
 * exports where the instance should be terminated immediately afterward.
 */
export async function createScopedFFmpeg(): Promise<FFmpeg> {
  const ffmpeg = new FFmpeg();
  const { coreURL, wasmURL } = await getFFmpegCoreUrls();
  await ffmpeg.load({ coreURL, wasmURL });
  return ffmpeg;
}

/**
 * Executes an FFmpeg command while collecting logs, throwing a descriptive Error
 * if FFmpeg exits with a non-zero status code. Detaches the log listener in `finally`.
 */
export async function execFFmpeg(
  ffmpeg: FFmpeg,
  args: string[],
  label = "FFmpeg execution"
): Promise<void> {
  const logLines: string[] = [];
  const onLog = ({ message }: { message: string }) => {
    logLines.push(message);
    if (logLines.length > 40) {
      logLines.shift();
    }
  };

  ffmpeg.on("log", onLog);
  try {
    const exitCode = await ffmpeg.exec(args);
    if (exitCode !== 0) {
      const tail = logLines.slice(-8).join(" | ");
      throw new Error(
        `${label} failed (exit code ${exitCode})${tail ? `: ${tail}` : ""}`
      );
    }
  } finally {
    ffmpeg.off("log", onLog);
  }
}

/**
 * Best-effort deletion of virtual MEMFS files after an FFmpeg job completes or fails.
 */
export async function cleanupFFmpegFiles(
  ffmpeg: FFmpeg | null | undefined,
  files: string[]
): Promise<void> {
  if (!ffmpeg) return;
  for (const file of files) {
    try {
      await ffmpeg.deleteFile(file);
    } catch {
      // File may not exist if step aborted early
    }
  }
}

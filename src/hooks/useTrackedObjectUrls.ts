"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Tracks Blob object URLs by logical key across renders, automatically revoking
 * any superseded URL on replacement and cleaning up all remaining URLs on unmount.
 */
export function useTrackedObjectUrls() {
  const urlsRef = useRef<Map<string, string>>(new Map());

  const createUrl = useCallback((key: string, blob: Blob | MediaSource): string => {
    const existing = urlsRef.current.get(key);
    if (existing) {
      URL.revokeObjectURL(existing);
    }
    const url = URL.createObjectURL(blob);
    urlsRef.current.set(key, url);
    return url;
  }, []);

  const revokeUrl = useCallback((keyOrUrl: string | null | undefined) => {
    if (!keyOrUrl) return;
    const stored = urlsRef.current.get(keyOrUrl);
    if (stored) {
      URL.revokeObjectURL(stored);
      urlsRef.current.delete(keyOrUrl);
      return;
    }
    if (keyOrUrl.startsWith("blob:")) {
      for (const [k, v] of urlsRef.current.entries()) {
        if (v === keyOrUrl) {
          urlsRef.current.delete(k);
          break;
        }
      }
      URL.revokeObjectURL(keyOrUrl);
    }
  }, []);

  const replaceUrl = useCallback(
    (key: string, nextUrl: string): string => {
      const existing = urlsRef.current.get(key);
      if (existing && existing !== nextUrl) {
        URL.revokeObjectURL(existing);
      }
      urlsRef.current.set(key, nextUrl);
      return nextUrl;
    },
    []
  );

  const revokePrefix = useCallback((prefix: string) => {
    for (const [key, url] of Array.from(urlsRef.current.entries())) {
      if (key.startsWith(prefix)) {
        URL.revokeObjectURL(url);
        urlsRef.current.delete(key);
      }
    }
  }, []);

  useEffect(() => {
    const urls = urlsRef.current;
    return () => {
      for (const url of urls.values()) {
        URL.revokeObjectURL(url);
      }
      urls.clear();
    };
  }, []);

  return { createUrl, revokeUrl, replaceUrl, revokePrefix };
}

// ─── useWebMCP Hook ─────────────────────────────────────────────────────────
// Registers WebMCP tools with the browser's document.modelContext API.
// Feature-detects the API and cleans up on unmount via AbortController.
// See: https://developer.chrome.com/docs/ai/webmcp

"use client";

import { useEffect, useRef, useState } from "react";

export interface WebMCPTool {
  name: string;
  description: string;
  inputSchema?: {
    type: string;
    properties?: Record<string, unknown>;
    required?: string[];
    [key: string]: unknown;
  };
  execute: (
    args: Record<string, unknown>,
    options?: { signal: AbortSignal }
  ) =>
    | Promise<string | { content: { type: string; text: string }[] }>
    | string
    | { content: { type: string; text: string }[] };
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
  };
}

/**
 * Register one or more tools with Chrome's WebMCP API.
 *
 * @param tools - Array of tool definitions. Should be stable (wrap in useMemo
 *   or define outside the component) to avoid re-registering every render.
 * @returns `{ isSupported }` — true if the browser supports WebMCP.
 *
 * @example
 * ```tsx
 * useWebMCP(useMemo(() => [{
 *   name: "create_zip",
 *   description: "Create a ZIP archive from loaded files",
 *   execute: async () => { await createZipArchive(); return "Archive created"; }
 * }], [createZipArchive]));
 * ```
 */
export function useWebMCP(tools: WebMCPTool[]) {
  const [isSupported, setIsSupported] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Feature-detect WebMCP
    if (typeof document === "undefined" || !("modelContext" in document)) {
      return;
    }

    setIsSupported(true);

    const controller = new AbortController();
    controllerRef.current = controller;

    // Register all tools
    const registerAll = async () => {
      for (const tool of tools) {
        if (controller.signal.aborted) return;
        try {
          await document.modelContext!.registerTool(tool, {
            signal: controller.signal,
          });
        } catch (err) {
          // Silently ignore — tool may already be registered, or API unavailable
          if (
            err instanceof DOMException &&
            err.name === "AbortError"
          ) {
            return; // Component unmounting, stop registering
          }
          console.warn(`[WebMCP] Failed to register tool "${tool.name}":`, err);
        }
      }
    };

    registerAll();

    return () => {
      // Unregister all tools on cleanup
      controller.abort();
      controllerRef.current = null;
    };
  }, [tools]);

  return { isSupported };
}

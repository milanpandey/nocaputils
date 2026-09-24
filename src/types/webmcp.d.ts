// ─── Chrome WebMCP Type Declarations ────────────────────────────────────────
// Ambient types for the document.modelContext API (Chrome 149+ origin trial).
// See: https://developer.chrome.com/docs/ai/webmcp/imperative-api
// Alternatively, install `webmcp-types` from npm for official typings.

interface WebMCPToolInputSchema {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
  [key: string]: unknown;
}

interface WebMCPToolDefinition {
  name: string;
  description: string;
  inputSchema?: WebMCPToolInputSchema;
  execute: (
    args: Record<string, unknown>,
    options?: { signal: AbortSignal }
  ) => Promise<string | { content: { type: string; text: string }[] }> | string | { content: { type: string; text: string }[] };
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
  };
}

interface WebMCPModelContext {
  registerTool(
    tool: WebMCPToolDefinition,
    options?: { signal?: AbortSignal; exposedTo?: string[] }
  ): Promise<void>;
  getTools(options?: { fromOrigins?: string[] }): Promise<unknown[]>;
}

// Extend the global Document interface
interface Document {
  modelContext?: WebMCPModelContext;
}

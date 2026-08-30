"use client";

import { useState, useMemo } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";

interface JwtParts {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
}

function decodeJwt(token: string): JwtParts | null {
  try {
    const parts = token.trim().split(".");
    if (parts.length !== 3) return null;

    const decodeBase64Url = (str: string): string => {
      let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
      while (base64.length % 4 !== 0) base64 += "=";
      return atob(base64);
    };

    const header = JSON.parse(decodeBase64Url(parts[0]));
    const payload = JSON.parse(decodeBase64Url(parts[1]));
    const signature = parts[2];

    return { header, payload, signature };
  } catch {
    return null;
  }
}

function formatTimestamp(ts: number): string {
  try {
    const date = new Date(ts * 1000);
    return date.toLocaleString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return "Invalid timestamp";
  }
}

function getCountdown(exp: number): { label: string; isExpired: boolean } {
  const now = Math.floor(Date.now() / 1000);
  const diff = exp - now;
  if (diff <= 0) return { label: "Expired", isExpired: true };

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return { label: parts.join(" "), isExpired: false };
}

const SAMPLE_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjIwMTYyMzkwMjIsInJvbGUiOiJhZG1pbiJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

const TIMESTAMP_FIELDS = ["iat", "exp", "nbf", "auth_time", "updated_at"];

export default function JwtDecoderClient() {
  const [token, setToken] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const decoded = useMemo(() => decodeJwt(token), [token]);
  const hasInput = token.trim().length > 0;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const renderValue = (key: string, value: unknown): React.ReactNode => {
    if (TIMESTAMP_FIELDS.includes(key) && typeof value === "number") {
      const countdown = key === "exp" ? getCountdown(value) : null;
      return (
        <span>
          <span style={{ color: "#3B82F6" }}>{value}</span>
          <span className="dev-tool-ts"> → {formatTimestamp(value)}</span>
          {countdown && (
            <span
              className="dev-tool-countdown"
              style={{ color: countdown.isExpired ? "#E63946" : "#3B82F6" }}
            >
              {" "}({countdown.label})
            </span>
          )}
        </span>
      );
    }
    if (typeof value === "string") return <span className="dev-tool-string">&quot;{value}&quot;</span>;
    if (typeof value === "number") return <span className="dev-tool-number">{value}</span>;
    if (typeof value === "boolean") return <span className="dev-tool-bool">{String(value)}</span>;
    if (value === null) return <span className="dev-tool-null">null</span>;
    return <span>{JSON.stringify(value)}</span>;
  };

  return (
    <div className="subtle-pattern min-h-screen">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-6 pb-10 pt-8 md:px-10 md:pt-12">
        <div className="mb-8 flex items-center justify-between">
          <a href="/developer-tools" className="neo-button neo-button-theme flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all">
            ← Dev Tools
          </a>
          <ThemeToggle />
        </div>

        <main className="flex flex-1 flex-col items-center">
          {/* Header */}
          <section className="mb-10 max-w-3xl text-center">
            <h1 className="text-4xl font-black uppercase leading-[0.92] tracking-[-0.06em] sm:text-5xl">
              🔐 JWT{" "}
              <span className="inline-block border-4 border-[var(--border-main)] bg-[#3B82F6] px-3 py-1 text-white shadow-[4px_4px_0_0_var(--border-main)]">
                Decoder
              </span>
            </h1>
            <p className="mt-4 text-sm font-bold uppercase tracking-[0.12em] text-[var(--text-soft)]">
              Paste a JWT token below to decode it instantly. 100% client-side — your tokens never leave your browser.
            </p>
          </section>

          {/* Token Input */}
          <section className="mb-8 w-full max-w-4xl">
            <div className="neo-panel p-6">
              <div className="mb-4 flex items-center justify-between">
                <label htmlFor="jwt-input" className="text-xs font-black uppercase tracking-[0.15em]">
                  Paste JWT Token
                </label>
                <div className="flex gap-2">
                  <button
                    className="neo-button px-3 py-1.5 text-[10px] font-black uppercase tracking-wider bg-[var(--bg-panel-muted)]"
                    onClick={() => setToken(SAMPLE_TOKEN)}
                    id="jwt-sample-btn"
                  >
                    Try Sample
                  </button>
                  {token && (
                    <button
                      className="neo-button px-3 py-1.5 text-[10px] font-black uppercase tracking-wider bg-[var(--bg-panel-muted)]"
                      onClick={() => setToken("")}
                      id="jwt-clear-btn"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <textarea
                id="jwt-input"
                className="dev-tool-textarea"
                rows={4}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                spellCheck={false}
              />
            </div>
          </section>

          {/* Decoded Output */}
          {hasInput && (
            <section className="mb-16 w-full max-w-4xl">
              {decoded ? (
                <div className="flex flex-col gap-6">
                  {/* Header Section */}
                  <div className="neo-panel overflow-hidden">
                    <div className="flex items-center justify-between border-b-4 border-[var(--border-main)] px-6 py-3" style={{ background: "#E63946" }}>
                      <span className="text-xs font-black uppercase tracking-[0.2em] text-white">Header</span>
                      <button
                        className="neo-button bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider text-black"
                        onClick={() => copyToClipboard(JSON.stringify(decoded.header, null, 2), "header")}
                        id="jwt-copy-header"
                      >
                        {copied === "header" ? "Copied ✓" : "Copy"}
                      </button>
                    </div>
                    <div className="p-6">
                      <div className="dev-tool-json">
                        {"{"}
                        {Object.entries(decoded.header).map(([key, val], i, arr) => (
                          <div key={key} className="dev-tool-json-row">
                            <span className="dev-tool-key">&quot;{key}&quot;</span>: {renderValue(key, val)}
                            {i < arr.length - 1 ? "," : ""}
                          </div>
                        ))}
                        {"}"}
                      </div>
                    </div>
                  </div>

                  {/* Payload Section */}
                  <div className="neo-panel overflow-hidden">
                    <div className="flex items-center justify-between border-b-4 border-[var(--border-main)] px-6 py-3" style={{ background: "#3B82F6" }}>
                      <span className="text-xs font-black uppercase tracking-[0.2em] text-white">Payload</span>
                      <button
                        className="neo-button bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider text-black"
                        onClick={() => copyToClipboard(JSON.stringify(decoded.payload, null, 2), "payload")}
                        id="jwt-copy-payload"
                      >
                        {copied === "payload" ? "Copied ✓" : "Copy"}
                      </button>
                    </div>
                    <div className="p-6">
                      <div className="dev-tool-json">
                        {"{"}
                        {Object.entries(decoded.payload).map(([key, val], i, arr) => (
                          <div key={key} className="dev-tool-json-row">
                            <span className="dev-tool-key">&quot;{key}&quot;</span>: {renderValue(key, val)}
                            {i < arr.length - 1 ? "," : ""}
                          </div>
                        ))}
                        {"}"}
                      </div>
                    </div>
                  </div>

                  {/* Signature Section */}
                  <div className="neo-panel overflow-hidden">
                    <div className="flex items-center justify-between border-b-4 border-[var(--border-main)] px-6 py-3" style={{ background: "#457B9D" }}>
                      <span className="text-xs font-black uppercase tracking-[0.2em] text-white">Signature</span>
                      <button
                        className="neo-button bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider text-black"
                        onClick={() => copyToClipboard(decoded.signature, "sig")}
                        id="jwt-copy-sig"
                      >
                        {copied === "sig" ? "Copied ✓" : "Copy"}
                      </button>
                    </div>
                    <div className="p-6">
                      <code className="dev-tool-signature break-all text-sm">{decoded.signature}</code>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="neo-panel p-8 text-center">
                  <div className="text-4xl mb-4">⚠️</div>
                  <p className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--text-soft)]">
                    Invalid JWT token. A valid JWT has three base64url-encoded parts separated by dots.
                  </p>
                </div>
              )}
            </section>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}

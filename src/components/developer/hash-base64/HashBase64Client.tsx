"use client";

import { useState, useCallback, useEffect } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import Footer from "@/components/Footer";

type ActiveTab = "hash" | "encode" | "uuid";

async function computeHash(algorithm: string, text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function base64Encode(text: string): string {
  try {
    return btoa(unescape(encodeURIComponent(text)));
  } catch {
    return "Error: Invalid input";
  }
}

function base64Decode(text: string): string {
  try {
    return decodeURIComponent(escape(atob(text)));
  } catch {
    return "Error: Invalid Base64";
  }
}

function toHex(text: string): string {
  return Array.from(new TextEncoder().encode(text))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");
}

function fromHex(hex: string): string {
  try {
    const bytes = hex
      .replace(/\s+/g, "")
      .match(/.{1,2}/g);
    if (!bytes) return "";
    return new TextDecoder().decode(new Uint8Array(bytes.map((b) => parseInt(b, 16))));
  } catch {
    return "Error: Invalid hex";
  }
}

export default function HashBase64Client() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("hash");

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
          <section className="mb-10 max-w-3xl text-center">
            <h1 className="text-4xl font-black uppercase leading-[0.92] tracking-[-0.06em] sm:text-5xl">
              🔒 Hash &amp;{" "}
              <span className="inline-block border-4 border-[var(--border-main)] bg-[#3B82F6] px-3 py-1 text-white shadow-[4px_4px_0_0_var(--border-main)]">
                Base64
              </span>
            </h1>
            <p className="mt-4 text-sm font-bold uppercase tracking-[0.12em] text-[var(--text-soft)]">
              Generate hashes, encode/decode Base64 & URLs, and create UUIDs — all via Web Crypto API.
            </p>
          </section>

          {/* Tab Switcher */}
          <section className="mb-6 w-full max-w-4xl">
            <div className="flex gap-2">
              {([
                { key: "hash" as const, label: "Hash Generator", emoji: "#️⃣" },
                { key: "encode" as const, label: "Encode / Decode", emoji: "🔄" },
                { key: "uuid" as const, label: "UUID Generator", emoji: "🆔" },
              ]).map(({ key, label, emoji }) => (
                <button
                  key={key}
                  className={`neo-button flex-1 px-4 py-3 text-[10px] font-black uppercase tracking-wider transition-all ${
                    activeTab === key ? "bg-[#3B82F6] text-white" : "bg-[var(--bg-panel-muted)]"
                  }`}
                  onClick={() => setActiveTab(key)}
                  id={`hash-tab-${key}`}
                >
                  {emoji} {label}
                </button>
              ))}
            </div>
          </section>

          {activeTab === "hash" && <HashTab />}
          {activeTab === "encode" && <EncodeTab />}
          {activeTab === "uuid" && <UuidTab />}
        </main>

        <Footer />
      </div>
    </div>
  );
}

function HashTab() {
  const [input, setInput] = useState("");
  const [hashes, setHashes] = useState<{ algo: string; label: string; hash: string }[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!input) {
      setHashes([]);
      return;
    }

    const algorithms = [
      { algo: "SHA-1", label: "SHA-1" },
      { algo: "SHA-256", label: "SHA-256" },
      { algo: "SHA-384", label: "SHA-384" },
      { algo: "SHA-512", label: "SHA-512" },
    ];

    Promise.all(
      algorithms.map(async ({ algo, label }) => ({
        algo,
        label,
        hash: await computeHash(algo, input),
      }))
    ).then(setHashes);
  }, [input]);

  const copyHash = (hash: string, label: string) => {
    navigator.clipboard.writeText(hash).then(() => {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <section className="mb-16 w-full max-w-4xl">
      <div className="neo-panel p-6">
        <label htmlFor="hash-input" className="mb-3 block text-xs font-black uppercase tracking-[0.15em]">
          Input Text
        </label>
        <textarea
          id="hash-input"
          className="dev-tool-textarea"
          rows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter text to hash..."
          spellCheck={false}
        />
      </div>

      {hashes.length > 0 && (
        <div className="mt-6 flex flex-col gap-4">
          {hashes.map(({ label, hash }) => (
            <div key={label} className="neo-panel overflow-hidden">
              <div className="flex items-center justify-between border-b-4 border-[var(--border-main)] px-6 py-3" style={{ background: "#3B82F6" }}>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-white">{label}</span>
                <button
                  className="neo-button bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider text-black"
                  onClick={() => copyHash(hash, label)}
                  id={`hash-copy-${label}`}
                >
                  {copied === label ? "Copied ✓" : "Copy"}
                </button>
              </div>
              <div className="p-4">
                <code className="break-all font-mono text-sm">{hash}</code>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function EncodeTab() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"base64" | "url" | "hex">("base64");
  const [direction, setDirection] = useState<"encode" | "decode">("encode");
  const [copied, setCopied] = useState(false);

  const result = (() => {
    if (!input) return "";
    if (mode === "base64") return direction === "encode" ? base64Encode(input) : base64Decode(input);
    if (mode === "url") return direction === "encode" ? encodeURIComponent(input) : decodeURIComponent(input);
    if (mode === "hex") return direction === "encode" ? toHex(input) : fromHex(input);
    return "";
  })();

  const copyResult = () => {
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <section className="mb-16 w-full max-w-4xl">
      <div className="neo-panel p-6">
        {/* Mode selectors */}
        <div className="mb-4 flex flex-wrap gap-2">
          {([
            { key: "base64" as const, label: "Base64" },
            { key: "url" as const, label: "URL Encode" },
            { key: "hex" as const, label: "Hex" },
          ]).map(({ key, label }) => (
            <button
              key={key}
              className={`neo-button px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
                mode === key ? "bg-[#3B82F6] text-white" : "bg-[var(--bg-panel-muted)]"
              }`}
              onClick={() => setMode(key)}
              id={`encode-mode-${key}`}
            >
              {label}
            </button>
          ))}
          <div className="mx-2 h-6 w-px bg-[var(--border-main)]" />
          <button
            className={`neo-button px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
              direction === "encode" ? "bg-[#457B9D] text-white" : "bg-[var(--bg-panel-muted)]"
            }`}
            onClick={() => setDirection("encode")}
            id="encode-dir-encode"
          >
            Encode
          </button>
          <button
            className={`neo-button px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
              direction === "decode" ? "bg-[#457B9D] text-white" : "bg-[var(--bg-panel-muted)]"
            }`}
            onClick={() => setDirection("decode")}
            id="encode-dir-decode"
          >
            Decode
          </button>
        </div>

        <label htmlFor="encode-input" className="mb-2 block text-xs font-black uppercase tracking-[0.15em]">
          Input
        </label>
        <textarea
          id="encode-input"
          className="dev-tool-textarea font-mono"
          rows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={direction === "encode" ? "Enter text to encode..." : "Enter encoded text to decode..."}
          spellCheck={false}
        />
      </div>

      {result && (
        <div className="mt-6 neo-panel overflow-hidden">
          <div className="flex items-center justify-between border-b-4 border-[var(--border-main)] px-6 py-3" style={{ background: "#3B82F6" }}>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-white">
              {direction === "encode" ? "Encoded" : "Decoded"} Result
            </span>
            <button
              className="neo-button bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider text-black"
              onClick={copyResult}
              id="encode-copy-result"
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
          <div className="p-4">
            <code className="break-all font-mono text-sm whitespace-pre-wrap">{result}</code>
          </div>
        </div>
      )}
    </section>
  );
}

function UuidTab() {
  const [uuids, setUuids] = useState<string[]>([]);
  const [count, setCount] = useState(1);
  const [copied, setCopied] = useState<number | null>(null);

  const generate = useCallback(() => {
    const newUuids: string[] = [];
    for (let i = 0; i < count; i++) {
      newUuids.push(crypto.randomUUID());
    }
    setUuids(newUuids);
  }, [count]);

  const copyOne = (uuid: string, idx: number) => {
    navigator.clipboard.writeText(uuid).then(() => {
      setCopied(idx);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const copyAll = () => {
    navigator.clipboard.writeText(uuids.join("\n")).then(() => {
      setCopied(-1);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <section className="mb-16 w-full max-w-4xl">
      <div className="neo-panel p-6">
        <div className="mb-4 flex items-center gap-4 flex-wrap">
          <label htmlFor="uuid-count" className="text-xs font-black uppercase tracking-[0.15em]">
            Generate
          </label>
          <input
            id="uuid-count"
            type="number"
            min={1}
            max={100}
            className="dev-tool-input w-20 text-center font-mono"
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
          />
          <span className="text-xs font-black uppercase tracking-[0.15em]">UUID v4</span>
          <button
            className="neo-button bg-[#3B82F6] px-6 py-2 text-xs font-black uppercase tracking-wider text-white"
            onClick={generate}
            id="uuid-generate-btn"
          >
            Generate
          </button>
          {uuids.length > 1 && (
            <button
              className="neo-button px-3 py-2 text-[10px] font-black uppercase tracking-wider bg-[var(--bg-panel-muted)]"
              onClick={copyAll}
              id="uuid-copy-all"
            >
              {copied === -1 ? "Copied All ✓" : "Copy All"}
            </button>
          )}
        </div>
      </div>

      {uuids.length > 0 && (
        <div className="mt-6 flex flex-col gap-2">
          {uuids.map((uuid, i) => (
            <div key={i} className="neo-panel flex items-center justify-between px-5 py-3">
              <code className="font-mono text-sm break-all">{uuid}</code>
              <button
                className="neo-button ml-3 shrink-0 px-3 py-1 text-[10px] font-black uppercase tracking-wider bg-[var(--bg-panel-muted)]"
                onClick={() => copyOne(uuid, i)}
                id={`uuid-copy-${i}`}
              >
                {copied === i ? "✓" : "Copy"}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

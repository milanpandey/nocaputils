import type { Metadata } from "next";
import HashBase64Client from "@/components/developer/hash-base64/HashBase64Client";

export const metadata: Metadata = {
  title: "Hash Generator & Base64 Encoder/Decoder — SHA-256, UUID, Hex | NoCapUtils",
  description:
    "Generate SHA-1/256/512 hashes, Base64 & URL encode/decode, hex conversion, and UUID v4 — all powered by Web Crypto API, 100% private, zero uploads.",
};

export default function HashBase64Page() {
  return <HashBase64Client />;
}

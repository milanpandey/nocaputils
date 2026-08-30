import type { Metadata } from "next";
import JwtDecoderClient from "@/components/developer/jwt-decoder/JwtDecoderClient";

export const metadata: Metadata = {
  title: "JWT Decoder & Token Inspector — Free, Private, In-Browser | NoCapUtils",
  description:
    "Decode and inspect JWT tokens entirely in your browser. View header, payload, signature, expiration countdown — zero server uploads, 100% private.",
};

export default function JwtDecoderPage() {
  return <JwtDecoderClient />;
}

import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "nocaputils | Free Privacy-First Utility Tools",
  description:
    "Free creator utility tools that run entirely in your browser. No uploads, zero servers, total control.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} min-h-screen bg-[var(--bg-page)] font-[family-name:var(--font-space-grotesk)] text-[var(--text-main)] antialiased selection:bg-[var(--accent)] selection:text-black`}
      >
        {children}
      </body>
    </html>
  );
}

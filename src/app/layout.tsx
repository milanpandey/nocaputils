import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import FeedbackButtons from "@/components/FeedbackButtons";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nocaputils.com"),
  title: {
    default: "nocaputils | Free Privacy-First Utility Tools",
    template: "%s | nocaputils",
  },
  description:
    "Privacy-first tools for everyone. 100% in-browser • no servers • no tracking.",
  keywords: [
    "privacy-first tools",
    "free online tools",
    "browser-based utilities",
    "client-side video editor",
    "pdf tools",
    "screen recorder",
    "developer tools",
    "no tracking",
    "nocaputils",
  ],
  openGraph: {
    title: "nocaputils | Free Privacy-First Utility Tools",
    description:
      "Privacy-first tools for everyone. 100% in-browser • no servers • no tracking.",
    url: "https://nocaputils.com",
    siteName: "nocaputils",
    images: [
      {
        url: "/og-image.jpg",
        width: 1024,
        height: 689,
        alt: "nocaputils - Privacy-first tools for everyone. 100% in-browser • no servers • no tracking",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "nocaputils | Free Privacy-First Utility Tools",
    description:
      "Privacy-first tools for everyone. 100% in-browser • no servers • no tracking.",
    images: ["/og-image.jpg"],
  },
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
        <FeedbackButtons />
      </body>
    </html>
  );
}

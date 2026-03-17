import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "nocaputils | Free In-Browser Video Editor & Developer Tools",
  description: "Free, zero-backend, ultra-fast utilitarian tools. Edit videos directly in your browser without uploading files.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-canvas text-content selection:bg-neo-yellow selection:text-black`}>
        {/* Navigation Bar */}
        <nav className="border-b-[3px] border-black bg-white px-6 py-4 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black tracking-tight uppercase">
              <a href="/">nocap<span className="text-neo-blue">utils</span></a>
            </h1>
            <span className="hidden sm:inline-block px-2 py-1 text-xs font-bold border-2 border-black bg-neo-yellow shadow-[2px_2px_0px_#000]">
              No Cap: 100% Private!
            </span>
          </div>
          <div>
            <a href="https://play.google.com/store/apps/details?id=com.triptea.app" target="_blank" rel="noreferrer" className="hidden md:inline-flex px-4 py-2 font-black uppercase text-sm border-2 border-black bg-neo-pink text-white shadow-[3px_3px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#000] transition-all">
              Download TripTea
            </a>
          </div>
        </nav>

        <main>{children}</main>

        <footer className="border-t-[3px] border-black mt-20 p-8 bg-white">
          <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
            <h2 className="text-2xl font-black uppercase mb-4">A project by TripTea</h2>
            <p className="max-w-2xl text-sm font-medium opacity-80 mb-6">
              nocaputils is a suite of utility tools designed to just work. Everything happens locally in your browser.
            </p>
            {/* Horizontal Adsense Placeholder */}
            <div className="w-full max-w-[728px] h-[90px] border-[3px] border-black bg-gray-100 flex items-center justify-center font-bold text-gray-500 mb-8 shadow-[4px_4px_0px_#000]">
              [AdSense Horizontal Banner 728x90]
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

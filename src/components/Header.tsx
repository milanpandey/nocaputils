"use client";

import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

interface HeaderProps {
  backLink?: {
    href: string;
    label: string;
  };
}

export default function Header({ backLink }: HeaderProps) {
  return (
    <div className="absolute left-0 right-0 top-0 z-50 pointer-events-none md:p-10 p-6">
      <div className="mx-auto max-w-7xl flex items-start justify-between">
        <div className="pointer-events-auto">
          <Link
            href={backLink?.href || "/"}
            className="neo-button flex items-center gap-2 bg-[#161c2b] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-black transition-colors"
          >
            {backLink?.label || "← Home"}
          </Link>
        </div>
        <div className="pointer-events-auto">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}


import ThemeToggle from "@/components/ThemeToggle";
import { getTripTeaLink } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="mt-24 pb-16 pt-12">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <hr className="mb-12 border-t-2 border-black opacity-10" />
        
        <div className="flex flex-col items-center justify-between gap-10 md:flex-row">
          {/* Left: Project Badge */}
          <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] whitespace-nowrap">
            <span className="opacity-60 text-[var(--text-main)]">A Project By</span>
            <a
              href={getTripTeaLink("footer")}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#FFE600] border-2 border-black px-3 py-1 text-[11px] font-black !text-black shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
            >
              TripTea
            </a>
          </div>

          {/* Right: Theme Toggle */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}




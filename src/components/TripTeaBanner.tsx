"use client";

import { getTripTeaLink, SHOW_TRIPTEA } from "@/lib/constants";

export default function TripTeaBanner({ source }: { source: string }) {
  if (!SHOW_TRIPTEA) return null;

  return (
    <div className="neo-panel !bg-black text-white p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden relative group">
      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} />
      
      <div className="relative z-10 flex-1 text-center md:text-left">
        <h3 className="text-4xl md:text-5xl font-black uppercase mb-4 italic" style={{ color: '#d4ff70', textShadow: '3px 3px 0px #000' }}>
          Meet TripTea
        </h3>
        <p className="text-lg md:text-xl font-bold mb-8 max-w-xl leading-relaxed opacity-90">
          Simply describe your dream vacation in plain language, and our AI creates a complete, day-by-day itinerary tailored to your preferences.
        </p>
        
        <a
          href={getTripTeaLink(source)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center bg-[#ea4c89] text-white border-4 border-black px-8 py-4 text-sm font-black uppercase tracking-widest shadow-[6px_6px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0_0_#000] transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
        >
          Download on Google Play
        </a>
      </div>

      <div className="relative shrink-0 perspective-1000 hidden sm:block">
        <div className="w-48 h-64 md:w-56 md:h-72 border-[6px] border-[#54d88d] bg-white rounded-2xl rotate-6 shadow-[15px_15px_0_0_rgba(0,0,0,0.3)] overflow-hidden transition-transform group-hover:rotate-3 group-hover:scale-105 duration-500">
           <img 
             src="/media/app_screen.jpg" 
             alt="TripTea App Preview" 
             className="w-full h-full object-cover" 
           />
           <div className="absolute inset-0 border-4 border-black/5 rounded-xl pointer-events-none" />
        </div>
        {/* Floating element */}
        <div className="absolute -bottom-4 -left-8 bg-[#f2ef13] text-black border-4 border-black px-4 py-2 font-black uppercase text-xs -rotate-12 shadow-[4px_4px_0_0_#000]">
          100% Free
        </div>
      </div>
    </div>
  );
}

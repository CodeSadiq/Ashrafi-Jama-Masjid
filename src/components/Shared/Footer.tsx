import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#031d0f] text-white border-t-2 border-amber-500 py-10 relative overflow-hidden transition-colors duration-300">
      {/* Decorative top gold border */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-600/50 via-amber-400/80 to-amber-600/50"></div>
      
      {/* Repeater mosque pattern */}
      <div className="absolute inset-0 bg-mosque-pattern opacity-5 pointer-events-none"></div>

      <div className="container mx-auto px-4 relative z-10 text-center flex flex-col items-center">
        {/* Arabic Verse */}
        <div className="text-xl md:text-2xl font-semibold text-amber-300/90 tracking-wide mb-2 max-w-2xl font-serif">
          وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَى
        </div>
        
        {/* Hindi Translation */}
        <div className="text-sm md:text-base font-medium max-w-xl text-emerald-100/80 italic mb-1 px-4">
          "नेकी और परहेज़गारी के कामों में एक-दूसरे की मदद करो"
        </div>
        
        {/* Surah Reference */}
        <div className="text-xs text-amber-400/70 font-semibold mb-6">
          (सूरह अल-माइदा 5:2)
        </div>

        {/* Divider */}
        <div className="w-24 h-px bg-amber-500/20 mb-6"></div>

        {/* Brand Copyright */}
        <div className="text-sm font-semibold tracking-wider text-white">
          © {new Date().getFullYear()} मस्जिद व मदरसा फंड रजिस्टर
        </div>
        
        {/* Core Values */}
        <div className="text-xs text-emerald-200/60 mt-1.5 flex items-center gap-2">
          <span>पारदर्शिता</span>
          <span className="text-amber-500/50">•</span>
          <span>अमानतदारी</span>
          <span className="text-amber-500/50">•</span>
          <span>खिदमत</span>
        </div>
      </div>
    </footer>
  );
};

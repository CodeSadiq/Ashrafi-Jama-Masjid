import React from 'react';

interface FooterProps {
  isLoggedIn?: boolean;
  isAdmin?: boolean;
  onAdminClick?: () => void;
  onToggleViewClick?: () => void;
  hasNotifications?: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  isLoggedIn = false,
  isAdmin = false,
  onAdminClick,
  onToggleViewClick,
  hasNotifications = false,
}) => {
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
        
        {/* Surah Reference */}
        <div className="text-xs text-amber-400/70 font-semibold mb-6">
          (सूरह अल-माइदा 5:2)
        </div>

        {/* Hindi Translation */}
        <div className="text-sm md:text-base font-medium max-w-xl text-emerald-100/80 italic mb-6 px-4">
          "नेकी और परहेज़गारी के कामों में एक-दूसरे की मदद करो"
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

        {/* Admin controls inside Footer */}
        <div className="mt-8 flex flex-wrap justify-center items-center gap-3 relative z-20">
          {isLoggedIn ? (
            <>
              {onToggleViewClick && (
                <button
                  onClick={onToggleViewClick}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all active:scale-95 cursor-pointer ${
                    isAdmin
                      ? 'bg-amber-600 text-white border-amber-500 hover:bg-amber-700'
                      : 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span>{isAdmin ? 'यूज़र व्यू' : 'एडमिन व्यू'}</span>
                </button>
              )}

              {onAdminClick && (
                <button
                  onClick={onAdminClick}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold border border-rose-500/30 bg-rose-600/10 text-rose-200 hover:bg-rose-600 hover:text-white transition-all active:scale-95 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>लॉगआउट</span>
                </button>
              )}
            </>
          ) : (
            onAdminClick && (
              <button
                onClick={onAdminClick}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium border bg-white/10 text-white/90 border-white/10 hover:bg-white/20 transition-all active:scale-95 cursor-pointer"
              >
                <div className="relative flex items-center">
                  <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6z" />
                  </svg>
                  {hasNotifications && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                  )}
                </div>
                <span>एडमिन लॉगिन</span>
              </button>
            )
          )}
        </div>
      </div>
    </footer>
  );
};

import React, { useState, useEffect } from 'react';

interface HeaderProps {
  isLoggedIn: boolean;
  isAdmin: boolean;
  onAdminClick: () => void;
  onToggleViewClick: () => void;
  onHomeClick: () => void;
  hasNotifications?: boolean;
  mode?: 'masjid' | 'madrasa';
  onCommitteeClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isLoggedIn,
  isAdmin,
  onAdminClick,
  onToggleViewClick,
  onHomeClick,
  hasNotifications = false,
  mode = 'masjid',
  onCommitteeClick,
}) => {
  const [currentBg, setCurrentBg] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBg((prev) => (prev === 0 ? 1 : 0));
    }, 6000); // Crossfade background every 6 seconds
    return () => clearInterval(timer);
  }, []);

  const bgImages = mode === 'masjid'
    ? ['/masjidimage.webp', '/masjidimage1.webp']
    : ['/madrasaimage.png', '/madrasaimage1.png'];

  return (
    <header className="relative overflow-hidden text-white shadow-xl transition-colors duration-300">
      {/* Background Hero Image Slideshow */}
      <div 
        className={`absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none z-0 transition-opacity duration-1000 ${
          currentBg === 0 ? 'opacity-100' : 'opacity-0'
        }`} 
        style={{ backgroundImage: `url('${bgImages[0]}')` }}
      ></div>
      <div 
        className={`absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none z-0 transition-opacity duration-1000 ${
          currentBg === 1 ? 'opacity-100' : 'opacity-0'
        }`} 
        style={{ backgroundImage: `url('${bgImages[1]}')` }}
      ></div>

      {/* Premium Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#042d17]/50 via-[#042d17]/60 to-[#032211]/70 z-0"></div>

      {/* Decorative top gold border */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 relative z-10"></div>

      {/* Repeating background pattern */}
      <div className="absolute inset-0 bg-mosque-pattern opacity-5 pointer-events-none z-0"></div>

      <div className="container mx-auto px-4 py-6 relative z-10 flex flex-col items-center justify-between min-h-[240px] md:min-h-[260px]">
        {/* Top bar with buttons */}
        <div className="w-full flex justify-end items-center">
          {/* Action controls */}
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <>
                {/* View toggle (Admin view vs User view) */}
                <button
                  onClick={onToggleViewClick}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold border transition-all active:scale-95 cursor-pointer ${
                    isAdmin
                      ? 'bg-amber-600 text-white border-amber-500 hover:bg-amber-700'
                      : 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700'
                  }`}
                >
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span>{isAdmin ? 'यूज़र व्यू' : 'एडमिन व्यू'}</span>
                </button>

                {/* Logout button */}
                <button
                  onClick={onAdminClick}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold border border-rose-500/30 bg-rose-600/10 text-rose-200 hover:bg-rose-600 hover:text-white transition-all active:scale-95 cursor-pointer"
                >
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>लॉगआउट</span>
                </button>
              </>
            ) : (
              /* Admin login button when logged out */
              <button
                onClick={onAdminClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border bg-white/10 text-white/90 border-white/10 hover:bg-white/20 transition-all active:scale-95 cursor-pointer"
              >
                <div className="relative">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2A1 1 0 0 1 20 6z" />
                  </svg>
                  {hasNotifications && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                  )}
                </div>
                <span>एडमिन लॉगिन</span>
              </button>
            )}
          </div>
        </div>


        {/* Title and Islamic motifs */}
        <div className="text-center mt-2 flex flex-col items-center">
          <h1 
            className="cursor-pointer flex flex-col items-center gap-1.5 text-center select-none" 
            onClick={onHomeClick}
          >
            <span className="text-2xl md:text-3xl font-extrabold tracking-wide drop-shadow-md">
              {mode === 'masjid' ? 'अशरफ़ी जामा मस्जिद' : 'मदरसा गौसिया रिजविया रेयायतुल ऊलूम'}
            </span>
            <span className="text-xs md:text-sm font-bold tracking-wider text-amber-300 drop-shadow-md">
              छोटी लकड़ी, लकड़ी नबीगंज, सीवान, बिहार - 841447
            </span>
          </h1>
          <p className="mt-2.5 max-w-lg text-sm md:text-base font-medium text-emerald-100 italic drop-shadow-sm px-4">
            {mode === 'masjid'
              ? '"अल्लाह के घर (मस्जिद) के लिए आपका तआवुन हमारे लिए क़ीमती है"'
              : '"दीन की तालीम (मदरसा) के लिए आपका तआवुन हमारे लिए क़ीमती है"'}
          </p>
          {onCommitteeClick && (
            <button
              onClick={onCommitteeClick}
              className="mt-4 flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-full text-xs md:text-sm font-extrabold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer border border-amber-400"
            >
              <svg className="w-4.5 h-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>कमेटी विवरण (Committee Info)</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};


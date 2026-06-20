import React from 'react';

interface HeaderProps {
  onHomeClick: () => void;
  mode?: 'masjid' | 'madrasa';
  onCommitteeClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onHomeClick,
  mode = 'masjid',
  onCommitteeClick,
}) => {
  return (
    <header className={`relative overflow-hidden text-white shadow-xl transition-all duration-500 bg-[#052e16] ${mode === 'madrasa' ? 'bg-[#064e3b]' : ''}`}>
      {/* Background Hero Image */}
      {mode === 'masjid' && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none z-0"
            style={{ backgroundImage: "url('/masjidimage1.webp')" }}
          ></div>
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/45 pointer-events-none z-0"></div>
        </>
      )}

      {/* Decorative top gold border */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 relative z-10"></div>

      {/* Repeating background pattern */}
      <div className="absolute inset-0 bg-mosque-pattern opacity-5 pointer-events-none z-0"></div>

      <div className="container mx-auto px-4 py-3 relative z-10 flex flex-col items-center justify-center gap-1.5 h-[270px] md:h-[290px]">
        {/* Title and Islamic motifs wrapped in a container with backdrop blur for perfect readability */}
        <div className="text-center flex flex-col items-center justify-center max-w-2xl mx-auto w-full bg-black/30 backdrop-blur-[2px] py-4 px-5 rounded-2xl border border-white/10 shadow-lg relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-12 -left-12 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <h1
            className="cursor-pointer flex flex-col items-center gap-1 text-center select-none"
            onClick={onHomeClick}
          >
            <span className="text-xl md:text-3xl font-extrabold tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] bg-gradient-to-b from-amber-200 via-amber-300 to-amber-500 bg-clip-text text-transparent">
              {mode === 'masjid' ? 'अशरफ़ी जामा मस्जिद' : 'मदरसा गौसिया रिजविया रेयायतुल ऊलूम'}
            </span>
            <span className="flex items-center gap-1 text-[9px] md:text-xs font-semibold text-white/95 mt-0.5 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/5 shadow-inner">
              <svg className="w-3 h-3 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>छोटी लकड़ी, लकड़ी नबीगंज, सीवान, बिहार - 841447</span>
            </span>
          </h1>

          <p className="max-w-lg text-[10px] md:text-sm font-semibold text-emerald-100 italic drop-shadow-sm px-4 mt-2">
            {mode === 'masjid'
              ? '“अल्लाह के घर (मस्जिद) के लिए आपका तआवुन हमारे लिए क़ीमती है”'
              : '“दीन की तालीम (मदरसा) के लिए आपका तआवुन हमारे लिए क़ीमती है”'}
          </p>

          {onCommitteeClick && (
            <button
              onClick={onCommitteeClick}
              className="mt-3.5 flex items-center gap-1.5 px-4.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-emerald-950 rounded-full text-xs font-bold shadow-lg hover:shadow-amber-500/25 hover:scale-[1.02] transition-all active:scale-95 cursor-pointer border border-amber-400/40"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
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

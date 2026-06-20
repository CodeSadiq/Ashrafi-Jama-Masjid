import React from 'react';
import { motion } from 'framer-motion';

interface ModeToggleProps {
  mode: 'masjid' | 'madrasa';
  onChange: (mode: 'masjid' | 'madrasa') => void;
}

export const ModeToggle: React.FC<ModeToggleProps> = ({ mode, onChange }) => {
  return (
    <div className="w-full max-w-md mx-auto px-4 mt-6">
      <div className="relative bg-emerald-950/5 dark:bg-emerald-950/30 p-1 rounded-2xl flex items-center border border-emerald-900/10 dark:border-white/5 shadow-inner">
        {/* Masjid Toggle Button */}
        <button
          onClick={() => onChange('masjid')}
          className={`relative w-1/2 py-2.5 rounded-xl flex items-center justify-center gap-2 text-base font-bold transition-colors duration-300 select-none ${
            mode === 'masjid'
              ? 'text-white dark:text-emerald-950'
              : 'text-islamic-green dark:text-emerald-400 hover:text-islamic-green-light dark:hover:text-emerald-300'
          }`}
        >
          {mode === 'masjid' && (
            <motion.div
              layoutId="active-mode-pill"
              className="absolute inset-0 bg-islamic-green dark:bg-emerald-400 rounded-xl active-highlight shadow-md"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <svg 
              className="w-5 h-5 shrink-0" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M2 22h20" />
              <path d="M12 2v3" />
              <path d="M12 5a4 4 0 0 0-4 4v4h8V9a4 4 0 0 0-4-4z" />
              <path d="M6 13v9" />
              <path d="M18 13v9" />
              <path d="M9 22v-3a3 3 0 0 1 6 0v3" />
              <path d="M4 22V10l2-2v12" />
              <path d="M20 22V10l-2-2v12" />
            </svg>
            <span>मस्जिद</span>
          </span>
        </button>
        
        {/* Madrasa Toggle Button */}
        <button
          onClick={() => onChange('madrasa')}
          className={`relative w-1/2 py-2.5 rounded-xl flex items-center justify-center gap-2 text-base font-bold transition-colors duration-300 select-none ${
            mode === 'madrasa'
              ? 'text-white dark:text-emerald-950'
              : 'text-islamic-green dark:text-emerald-400 hover:text-islamic-green-light dark:hover:text-emerald-300'
          }`}
        >
          {mode === 'madrasa' && (
            <motion.div
              layoutId="active-mode-pill"
              className="absolute inset-0 bg-islamic-green dark:bg-emerald-400 rounded-xl active-highlight shadow-md"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">
            <svg 
              className="w-5 h-5 shrink-0" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            <span>मदरसा</span>
          </span>
        </button>
      </div>
    </div>
  );
};

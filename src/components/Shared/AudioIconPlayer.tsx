import React, { useState, useRef, useEffect } from 'react';

interface AudioIconPlayerProps {
  src: string;
}

export const AudioIconPlayer: React.FC<AudioIconPlayerProps> = ({ src }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(src);
      audioRef.current.onended = () => {
        setIsPlaying(false);
      };
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => {
        console.error("Audio playback error:", err);
      });
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <div className="inline-flex items-center">
      <button
        type="button"
        onClick={togglePlay}
        className={`p-2 rounded-full transition-all active:scale-95 flex items-center justify-center shrink-0 cursor-pointer ${
          isPlaying 
            ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30' 
            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
        }`}
        title={isPlaying ? "रोकें (Pause)" : "सुनें (Play Audio)"}
      >
        {isPlaying ? (
          <div className="flex items-end gap-[2px] justify-center w-4 h-3.5 pb-[1px]">
            <div className="w-[2.5px] bg-white rounded-full h-full origin-bottom animate-audio-wave" style={{ animationDelay: '0.1s' }} />
            <div className="w-[2.5px] bg-white rounded-full h-full origin-bottom animate-audio-wave" style={{ animationDelay: '0.4s' }} />
            <div className="w-[2.5px] bg-white rounded-full h-full origin-bottom animate-audio-wave" style={{ animationDelay: '0.2s' }} />
            <div className="w-[2.5px] bg-white rounded-full h-full origin-bottom animate-audio-wave" style={{ animationDelay: '0.6s' }} />
          </div>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
          </svg>
        )}
      </button>
    </div>
  );
};

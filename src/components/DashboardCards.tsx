import React, { useEffect, useState } from 'react';
import type { FundStats } from '../db';

interface DashboardCardsProps {
  stats: FundStats;
  loading: boolean;
  timeFilter: 'month' | 'year' | 'all';
}

// Custom counter animation hook/component
const AnimatedCounter: React.FC<{ value: number }> = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = displayValue;
    const end = value;
    if (start === end) return;

    const duration = 750; // ms
    const startTime = performance.now();

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing out function
      const easeOutQuad = (t: number) => t * (2 - t);
      
      const current = Math.floor(start + (end - start) * easeOutQuad(progress));
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        setDisplayValue(end);
      }
    };

    requestAnimationFrame(updateCounter);
  }, [value]);

  // Format with Indian locale groupings
  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  return <span className="font-numbers">{formatCurrency(displayValue)}</span>;
};

export const DashboardCards: React.FC<DashboardCardsProps> = ({ stats, loading, timeFilter }) => {
  const filterLabel = timeFilter === 'month' ? 'इस महीने का' : timeFilter === 'year' ? 'इस साल का' : 'कुल';
  const filterSubtitle = timeFilter === 'month' ? 'वर्तमान माह की' : timeFilter === 'year' ? 'वर्तमान वर्ष की' : 'शुरू से अब तक की';

  const cardData = [
    {
      title: `${filterLabel} फंड`,
      value: stats.totalCollection,
      subtitle: `${filterSubtitle} कुल सहयोग व चंदा`,
      icon: (
        <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="2" y1="22" x2="22" y2="22" />
          <path d="m12 2-10 8h20Z" />
          <path d="M4 10v12" />
          <path d="M8 10v12" />
          <path d="M16 10v12" />
          <path d="M20 10v12" />
          <path d="M12 10v12" />
        </svg>
      ),
      colorClass: 'text-emerald-700 dark:text-emerald-300',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
      borderColor: 'border-emerald-500/10'
    },
    {
      title: timeFilter === 'all' ? 'कुल खर्च' : `${filterLabel} खर्च`,
      value: stats.thisMonthExpenses,
      subtitle: `${filterSubtitle} कुल खर्च`,
      icon: (
        <svg className="w-5 h-5 text-rose-600 dark:text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
          <polyline points="16 17 22 17 22 11" />
        </svg>
      ),
      colorClass: 'text-rose-700 dark:text-rose-300',
      bgColor: 'bg-rose-50 dark:bg-rose-950/30',
      borderColor: 'border-rose-500/10'
    },
    {
      title: 'कुल मौजूदा बैलेंस',
      value: (stats as any).overallBalance || 0,
      subtitle: 'कुल उपलब्ध शेष राशि',
      icon: (
        <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
          <path d="M16 13a2 2 0 0 0 0 4h4v-4Z" />
        </svg>
      ),
      colorClass: 'text-amber-700 dark:text-amber-300',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      borderColor: 'border-amber-500/10'
    }
  ];


  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-4 py-6 max-w-7xl mx-auto">
      {cardData.map((card, idx) => (
        <div
          key={idx}
          className={`glass-card rounded-2xl p-3 md:p-4 flex flex-col justify-center gap-1 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 border ${
            loading ? 'animate-pulse' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm font-bold text-gray-500 dark:text-gray-400">
              {card.title}
            </span>
            <div className={`p-1.5 rounded-lg ${card.bgColor}`}>
              {card.icon}
            </div>
          </div>

          <div>
            <span className={`text-xl md:text-2xl font-extrabold ${card.colorClass}`}>
              ₹{loading ? <span className="font-numbers">0</span> : <AnimatedCounter value={card.value} />}
            </span>
          </div>

          <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
            {card.subtitle}
          </div>
        </div>
      ))}
    </div>
  );
};

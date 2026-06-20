import React from 'react';
import type { Member } from '../db/mockData';

interface PendingMembersProps {
  members: Member[];
  mode: 'masjid' | 'madrasa';
  loading: boolean;
}

export const PendingMembers: React.FC<PendingMembersProps> = ({ members, mode, loading }) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentMonthKey = `${currentYear}-${currentMonth}`; // e.g. "2026-06"
  const currentMonthName = now.toLocaleDateString('hi-IN', { month: 'long', year: 'numeric' });

  // Filter members who have not paid for current month and mode
  const unpaidMembers = members.filter((member) => {
    const contributionKey = `${mode}_${currentMonthKey}`;
    return !member.contributions?.[contributionKey];
  });

  if (!loading && unpaidMembers.length === 0) {
    return (
      <div className="bg-emerald-50/45 dark:bg-emerald-950/10 border border-emerald-500/20 rounded-3xl p-5 md:p-6 shadow-sm relative overflow-hidden animate-fade-in">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-emerald-800 dark:text-emerald-300">
              मासिक सहयोग स्थिति (Monthly Contribution Status)
            </h3>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-400/70 mt-0.5 font-semibold">
              🎉 अल्हम्दुलिल्लाह! इस महीने सभी सदस्यों ने सहयोग कर दिया है।
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50/45 dark:bg-amber-950/10 border border-amber-500/20 rounded-3xl p-5 md:p-6 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center gap-3 pb-3.5 mb-4 border-b border-amber-500/10">
        <div className="p-2 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-bold text-amber-800 dark:text-amber-300">
            इस महीने अभी तक सहयोग नहीं किया ({currentMonthName})
          </h3>
          <p className="text-xs text-amber-700/60 dark:text-amber-400/50 mt-0.5 font-medium">
            महीने के अंत से पहले भुगतान करना सुनिश्चित करें
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2.5 py-2">
          <div className="h-8 bg-amber-500/10 animate-pulse rounded-lg"></div>
          <div className="h-8 bg-amber-500/10 animate-pulse rounded-lg"></div>
        </div>
      ) : (
        <div>
          {/* Summary badge */}
          <div className="text-xs text-amber-800 dark:text-amber-300 font-bold mb-3 flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-lg w-fit">
            <span>⚠️</span>
            <span>{unpaidMembers.length} सदस्यों का योगदान इस महीने अभी बाकी है</span>
          </div>

          {/* List of pending members */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-64 overflow-y-auto pr-1 no-scrollbar">
            {unpaidMembers.map((member) => (
              <div
                key={member.id}
                className="bg-white/80 dark:bg-dark-card/60 hover:bg-white dark:hover:bg-dark-card border border-amber-500/10 dark:border-amber-500/5 p-3 rounded-2xl flex justify-between items-center shadow-sm transition-all duration-200"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold text-gray-700 dark:text-emerald-100 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    {member.name}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold font-numbers flex items-center gap-1">
                    <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    {member.mobile}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-gray-400 dark:text-gray-500 block font-semibold leading-none mb-1">अपेक्षित</span>
                  <span className="font-numbers font-extrabold text-amber-700 dark:text-amber-400 text-xs">
                    ₹{member.monthlyFee.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


import React from 'react';
import type { Expense } from '../db/mockData';
import { AudioIconPlayer } from './Shared/AudioIconPlayer';

interface ExpenseRegisterProps {
  expenses: Expense[];
  loading: boolean;
}

export const ExpenseRegister: React.FC<ExpenseRegisterProps> = ({ expenses, loading }) => {
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('hi-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-3xl p-5 md:p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 dark:border-dark-border">
        <h3 className="text-lg font-bold text-gray-800 dark:text-emerald-100 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.25">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          फंड से किए गए खर्च (Expense Register)
        </h3>
        <span className="text-xs bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-bold px-2.5 py-1 rounded-full">
          कुल प्रविष्टियां: {expenses.length}
        </span>
      </div>

      {loading ? (
        <div className="space-y-3 py-4">
          <div className="h-10 bg-gray-100 dark:bg-dark-bg animate-pulse rounded-xl"></div>
          <div className="h-10 bg-gray-100 dark:bg-dark-bg animate-pulse rounded-xl"></div>
          <div className="h-10 bg-gray-100 dark:bg-dark-bg animate-pulse rounded-xl"></div>
        </div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm font-semibold">
          अभी तक कोई खर्च दर्ज नहीं किया गया है।
        </div>
      ) : (
        <div className="overflow-x-auto no-scrollbar">
          {/* Desktop Table View */}
          <table className="w-full text-left border-collapse hidden md:table">
            <thead>
              <tr className="border-b border-gray-100 dark:border-dark-border/50 text-xs font-bold text-gray-400 dark:text-gray-500">
                <th className="py-3 px-2">तारीख</th>
                <th className="py-3 px-2">खर्च का मकसद</th>
                <th className="py-3 px-2">विवरण</th>
                <th className="py-3 px-2 text-right">रकम</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-dark-border/30 text-sm">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-rose-50/10 dark:hover:bg-rose-950/5 transition-colors">
                  <td className="py-3.5 px-2 text-gray-400 dark:text-gray-500 font-semibold font-numbers whitespace-nowrap">
                    {formatDate(exp.date)}
                  </td>
                  <td className="py-3.5 px-2 font-bold text-gray-800 dark:text-emerald-100">
                    <div className="flex items-center gap-2">
                      {exp.audio ? (
                        <AudioIconPlayer src={exp.audio} />
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l7.29-7.29a1 1 0 0 0 0-1.41L12 2z" />
                            <line x1="7" y1="7" x2="7.01" y2="7" />
                          </svg>
                          <span>{exp.purpose}</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-2 text-gray-500 dark:text-gray-400 max-w-xs truncate" title={exp.description}>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-gray-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                        <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                        <path d="M10 9H8" />
                        <path d="M16 13H8" />
                        <path d="M16 17H8" />
                      </svg>
                      <span>{exp.description || '—'}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-2 text-right font-numbers font-extrabold text-rose-600 dark:text-rose-400">
                    -₹{exp.amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile List View */}
          <div className="md:hidden space-y-4">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className="p-4 bg-gray-50/50 dark:bg-dark-bg/40 border border-gray-100/50 dark:border-dark-border/30 rounded-2xl space-y-2.5"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="font-bold text-gray-800 dark:text-emerald-100 flex items-start gap-1.5 text-sm">
                    {exp.audio ? (
                      <AudioIconPlayer src={exp.audio} />
                    ) : (
                      <>
                        <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="7" y1="7" x2="17" y2="17" />
                          <polyline points="17 7 17 17 7 17" />
                        </svg>
                        <span>{exp.purpose}</span>
                      </>
                    )}
                  </div>
                  <span className="font-numbers font-extrabold text-rose-600 dark:text-rose-400 text-sm whitespace-nowrap">
                    -₹{exp.amount.toLocaleString('en-IN')}
                  </span>
                </div>

                {exp.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed bg-white/50 dark:bg-dark-card/45 p-2 rounded-lg border border-gray-200/20 dark:border-white/5">
                    {exp.description}
                  </p>
                )}

                <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 font-semibold pt-1 border-t border-gray-200/30 dark:border-white/5">
                  <span className="flex items-center gap-1 font-numbers">
                    <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {formatDate(exp.date)}
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


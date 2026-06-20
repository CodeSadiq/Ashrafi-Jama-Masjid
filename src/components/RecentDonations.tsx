import React from 'react';
import type { Donation } from '../db/mockData';

interface RecentDonationsProps {
  donations: Donation[];
  loading: boolean;
}

export const RecentDonations: React.FC<RecentDonationsProps> = ({ donations, loading }) => {
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
          <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          हाल ही में मिला सहयोग
        </h3>
        <span className="text-xs bg-emerald-50 dark:bg-emerald-950/40 text-islamic-green dark:text-emerald-400 font-bold px-2.5 py-1 rounded-full">
          कुल: {donations.length}
        </span>
      </div>

      {loading ? (
        <div className="space-y-3 py-4">
          <div className="h-10 bg-gray-100 dark:bg-dark-bg animate-pulse rounded-xl"></div>
          <div className="h-10 bg-gray-100 dark:bg-dark-bg animate-pulse rounded-xl"></div>
          <div className="h-10 bg-gray-100 dark:bg-dark-bg animate-pulse rounded-xl"></div>
        </div>
      ) : donations.length === 0 ? (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm font-semibold">
          अभी तक कोई सहयोग रिकॉर्ड नहीं है।
        </div>
      ) : (
        <div className="overflow-x-auto no-scrollbar">
          {/* Desktop Table View */}
          <table className="w-full text-left border-collapse hidden md:table">
            <thead>
              <tr className="border-b border-gray-100 dark:border-dark-border/50 text-xs font-bold text-gray-400 dark:text-gray-500">
                <th className="py-3 px-2">दाता का नाम</th>
                <th className="py-3 px-2">रकम</th>
                <th className="py-3 px-2">तारीख</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-dark-border/30 text-sm">
              {donations.map((don) => (
                <tr key={don.id} className="hover:bg-emerald-50/20 dark:hover:bg-emerald-950/10 transition-colors">
                  <td className="py-3.5 px-2 font-bold text-gray-700 dark:text-emerald-100 flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    {don.name}
                  </td>
                  <td className="py-3.5 px-2 font-numbers font-extrabold text-emerald-600 dark:text-emerald-400">
                    ₹{don.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-2 text-gray-400 dark:text-gray-500 font-semibold font-numbers">
                    {formatDate(don.date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile List View */}
          <div className="md:hidden space-y-3.5">
            {donations.map((don) => (
              <div
                key={don.id}
                className="p-3 bg-gray-50/50 dark:bg-dark-bg/40 border border-gray-100/50 dark:border-dark-border/30 rounded-xl flex justify-between items-center"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold text-gray-800 dark:text-emerald-100">
                    {don.name}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold flex items-center gap-1 font-numbers">
                    <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {formatDate(don.date)}
                  </span>
                </div>
                <div className="font-numbers font-extrabold text-emerald-600 dark:text-emerald-400 text-base">
                  ₹{don.amount.toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};


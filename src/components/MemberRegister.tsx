import React, { useState } from 'react';
import type { Member } from '../db/mockData';

interface MemberRegisterProps {
  members: Member[];
  mode: 'masjid' | 'madrasa';
  loading: boolean;
}

export const getRecentMonths = () => {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    
    // Format name in Hindi, e.g. "जून 2026"
    const monthName = d.toLocaleDateString('hi-IN', { month: 'long', year: 'numeric' });
    months.push({
      key: `${year}-${month}`,
      name: monthName
    });
  }
  return months; // [current, prev, prev-prev]
};

export const MemberRegister: React.FC<MemberRegisterProps> = ({ members, mode, loading }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const recentMonths = getRecentMonths();

  const filteredMembers = members.filter((m) => {
    const query = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(query) ||
      m.mobile.includes(query) ||
      (m.address && m.address.toLowerCase().includes(query))
    );
  });

  return (
    <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-3xl p-5 md:p-6 shadow-sm">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-6 border-b border-gray-100 dark:border-dark-border">
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-emerald-100 flex items-center gap-2">
            <span>📖</span> मोहल्ला रजिस्टर (Mohalla Register)
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-medium">
            सभी सदस्यों की मासिक सहयोग राशि और उनके भुगतान की स्थिति
          </p>
        </div>

        {/* Search Input */}
        <div className="relative max-w-md w-full">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="नाम या मोबाइल नंबर से खोजें..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-semibold glass-input"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 py-4">
          <div className="h-10 bg-gray-100 dark:bg-dark-bg animate-pulse rounded-xl"></div>
          <div className="h-10 bg-gray-100 dark:bg-dark-bg animate-pulse rounded-xl"></div>
          <div className="h-10 bg-gray-100 dark:bg-dark-bg animate-pulse rounded-xl"></div>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm font-semibold">
          {searchQuery ? 'खोज के अनुसार कोई सदस्य नहीं मिला।' : 'रजिस्टर में कोई सदस्य नहीं है।'}
        </div>
      ) : (
        <div className="overflow-x-auto no-scrollbar">
          {/* Desktop/Tablet Table View */}
          <table className="w-full text-left border-collapse hidden lg:table">
            <thead>
              <tr className="border-b border-gray-100 dark:border-dark-border/50 text-xs font-bold text-gray-400 dark:text-gray-500">
                <th className="py-3 px-2">सदस्य विवरण</th>
                <th className="py-3 px-2">मासिक शुल्क</th>
                {recentMonths.map((m) => (
                  <th key={m.key} className="py-3 px-2 text-center whitespace-nowrap">
                    {m.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-dark-border/30 text-sm">
              {filteredMembers.map((member) => (
                <tr key={member.id} className="hover:bg-emerald-50/10 dark:hover:bg-emerald-950/5 transition-colors">
                  <td className="py-3.5 px-2">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-700 dark:text-emerald-100 text-base">
                        {member.name}
                      </span>
                      <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mt-1 font-semibold">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                          <span className="font-numbers">{member.mobile}</span>
                        </span>
                        {member.address && (
                          <span className="flex items-center gap-1 max-w-[200px] truncate">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                              <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span>{member.address}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-2 font-numbers font-extrabold text-islamic-green dark:text-emerald-400">
                    ₹{member.monthlyFee.toLocaleString('en-IN')}
                  </td>
                  {recentMonths.map((month) => {
                    const contributionKey = `${mode}_${month.key}`;
                    const hasPaid = !!member.contributions?.[contributionKey];
                    return (
                      <td key={month.key} className="py-3.5 px-2 text-center">
                        <div className="flex justify-center">
                          {hasPaid ? (
                            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-500/10">
                              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              <span className="font-numbers">₹{member.contributions[contributionKey].amount}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-full text-xs font-bold border border-rose-500/10">
                              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <path d="m15 9-6 6" />
                                <path d="m9 9 6 6" />
                              </svg>
                              <span>अदेय</span>
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile/Card List View */}
          <div className="lg:hidden space-y-4">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="p-4 bg-gray-50/50 dark:bg-dark-bg/40 border border-gray-100/50 dark:border-dark-border/30 rounded-2xl space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-base font-bold text-gray-800 dark:text-emerald-100">
                      {member.name}
                    </h4>
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-semibold font-numbers flex items-center gap-1 mt-0.5">
                      <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      {member.mobile}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-semibold block">मासिक सहयोग</span>
                    <span className="font-numbers font-extrabold text-islamic-green dark:text-emerald-400 text-sm">
                      ₹{member.monthlyFee.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {member.address && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 font-medium">
                    <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{member.address}</span>
                  </p>
                )}

                {/* Grid of Months status for Mobile */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200/40 dark:border-white/5">
                  {recentMonths.map((month) => {
                    const contributionKey = `${mode}_${month.key}`;
                    const hasPaid = !!member.contributions?.[contributionKey];
                    // Short month name for mobile (e.g. "जून")
                    const shortMonthName = month.name.split(' ')[0];
                    return (
                      <div
                        key={month.key}
                        className={`flex flex-col items-center p-1.5 rounded-lg border text-center ${
                          hasPaid
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30'
                            : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30'
                        }`}
                      >
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold mb-1">
                          {shortMonthName}
                        </span>
                        {hasPaid ? (
                          <div className="text-[10px] font-numbers font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                            <svg className="w-3 h-3 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>₹{member.contributions[contributionKey].amount}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] font-bold text-rose-500 flex items-center gap-0.5">
                            <svg className="w-3.5 h-3.5 text-rose-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <path d="m15 9-6 6" />
                              <path d="m9 9 6 6" />
                            </svg>
                            <span>Unpaid</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import type { Member } from '../db';

interface PublicSourcesProps {
  members: Member[];
  mode: 'masjid' | 'madrasa';
  loading: boolean;
  isAdmin: boolean;
  onDeleteMember: (id: string, name: string) => Promise<void>;
  onRecordContribution: (id: string, amount: number, date?: string) => Promise<void>;
  onDeleteContribution?: (memberId: string, key: string) => Promise<void>;
  onEditContribution?: (memberId: string, key: string, newAmount: number, date: string, timestamp: number) => Promise<void>;
  timeFilter?: 'month' | 'year' | 'all';
  onAddMember: (name: string, mobile: string, memberType?: 'member' | 'source') => Promise<void>;
}

export const getMemberTotalContribution = (
  member: Member, 
  mode: 'masjid' | 'madrasa',
  timeFilter: 'month' | 'year' | 'all' = 'all'
): number => {
  let total = 0;
  if (member.contributions) {
    const now = new Date();
    const currentYear = now.getFullYear().toString();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentMonthKey = `${currentYear}-${currentMonth}`;

    Object.entries(member.contributions).forEach(([key, contribution]) => {
      let conMode = 'masjid';
      let conMonth = key;
      if (key.includes('_')) {
        const parts = key.split('_');
        conMode = parts[0];
        conMonth = parts[1];
      }
      if (conMode === mode) {
        if (timeFilter === 'all') {
          total += (contribution as any).amount || 0;
        } else if (timeFilter === 'month' && conMonth === currentMonthKey) {
          total += (contribution as any).amount || 0;
        } else if (timeFilter === 'year' && conMonth.startsWith(currentYear)) {
          total += (contribution as any).amount || 0;
        }
      }
    });
  }
  return total;
};



export const PublicSources: React.FC<PublicSourcesProps> = ({ 
  members, 
  mode, 
  loading,
  isAdmin,
  onAddMember,
  onDeleteMember,
  onRecordContribution,
  onDeleteContribution,
  onEditContribution,
  timeFilter = 'all'
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberMobile, setNewMemberMobile] = useState('');
  const [newMemberType, setNewMemberType] = useState<'member' | 'source'>('member');
  
  // Track selected member for Khatabook ledger modal view
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Prevent background scrolling when modals are open
  useEffect(() => {
    if (showAddModal || selectedMemberId !== null) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [showAddModal, selectedMemberId]);
  
  // States for inline editing of contribution entries
  const [editingContributionKey, setEditingContributionKey] = useState<string | null>(null);
  const [editingAmountInput, setEditingAmountInput] = useState<string>('');
  
  const [paymentInputs, setPaymentInputs] = useState<{ [memberId: string]: string }>({});

  const allSortedMembers = [...members].sort((a, b) => {
    const totalA = getMemberTotalContribution(a, mode, timeFilter);
    const totalB = getMemberTotalContribution(b, mode, timeFilter);
    return totalB - totalA;
  });

  const sourcesList = allSortedMembers.filter(m => m.memberType === 'source');
  const sortedMembers = allSortedMembers.filter(m => m.memberType !== 'source');

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName) return;
    await onAddMember(newMemberName, newMemberMobile, newMemberType);
    setNewMemberName('');
    setNewMemberMobile('');
    setNewMemberType('member');
    setShowAddModal(false);
  };

  const handlePaymentSubmit = async (memberId: string) => {
    const amountStr = paymentInputs[memberId] || '';
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) return;
    await onRecordContribution(memberId, amount);
    setPaymentInputs(prev => ({ ...prev, [memberId]: '' }));
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Find currently selected member details reactively
  const selectedMember = members.find(m => m.id === selectedMemberId);

  return (
    <div className="max-w-7xl mx-auto px-4 mt-6 font-sans">
      <div className="bg-[#059669] dark:bg-emerald-900 border border-emerald-500 rounded-3xl p-5 md:p-6 shadow-md text-white">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 mb-6 border-b border-emerald-500/30">
          <div className="flex-1 min-w-[200px]">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              सहयोगी सदस्य / स्रोत सूची
            </h3>
            <p className="text-xs text-emerald-100 mt-1.5 font-medium">
              {mode === 'masjid' ? 'मस्जिद' : 'मदरसा'} के विकास व सहयोग के लिए जुड़े सदस्यों की {timeFilter === 'month' ? 'इस महीने की' : timeFilter === 'year' ? 'इस साल की' : 'कुल'} सहयोग सूची
            </p>
          </div>
          
          {/* Khatabook-style dynamic "+" Add Button for Admin */}
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center w-10 h-10 bg-islamic-green hover:bg-islamic-green-hover text-white rounded-full shadow-md active:scale-95 transition-transform"
              title="नया सहयोगी जोड़ें"
            >
              <span className="text-2xl font-bold font-sans">+</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3 py-4">
            <div className="h-10 bg-gray-100 dark:bg-dark-bg animate-pulse rounded-xl"></div>
            <div className="h-10 bg-gray-100 dark:bg-dark-bg animate-pulse rounded-xl"></div>
            <div className="h-10 bg-gray-100 dark:bg-dark-bg animate-pulse rounded-xl"></div>
          </div>
        ) : sortedMembers.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm font-semibold">
            अभी तक कोई सदस्य पंजीकृत नहीं है।
          </div>
        ) : (
          <>
            <div className="hidden md:block max-h-[550px] overflow-y-auto overflow-x-auto no-scrollbar pr-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="sticky top-0 bg-white dark:bg-dark-card border-b border-gray-100 dark:border-dark-border/50 text-xs font-bold text-gray-400 dark:text-gray-500 z-10">
                    <th className="py-3 px-4 text-center w-16 bg-white dark:bg-dark-card">क्र.सं.</th>
                    <th className="py-3 px-4 bg-white dark:bg-dark-card">नाम</th>
                    <th className="py-3 px-4 text-right bg-white dark:bg-dark-card">कुल जमा</th>
                    <th className="py-3 px-4 text-center bg-white dark:bg-dark-card">विवरण</th>
                    {isAdmin && <th className="py-3 px-4 text-center bg-white dark:bg-dark-card">हटाएं</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-dark-border/30 text-sm">
                  {sourcesList.map((member) => {
                    const totalContribution = getMemberTotalContribution(member, mode, timeFilter);
                    return (
                      <tr key={member.id} className="bg-amber-50/50 hover:bg-amber-50 dark:bg-amber-900/10 dark:hover:bg-amber-900/20 transition-colors">
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 font-bold text-xs" title="स्रोत">★</span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-amber-800 dark:text-amber-200 text-base">
                              {member.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right font-numbers font-extrabold text-amber-600 dark:text-amber-400 text-base">
                          ₹{totalContribution.toLocaleString('en-IN')}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => setSelectedMemberId(member.id)}
                            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <span>खाता देखें</span>
                          </button>
                        </td>
                        {isAdmin && (
                          <td className="py-4 px-4 text-center">
                            <button
                              onClick={() => onDeleteMember(member.id, member.name)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                              title="हटाएं"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {sortedMembers.map((member, idx) => {
                    const totalContribution = getMemberTotalContribution(member, mode, timeFilter);
                    return (
                      <tr key={member.id} className="hover:bg-emerald-50/10 dark:hover:bg-emerald-950/5 transition-colors">
                        <td className="py-4 px-4 text-center font-numbers text-emerald-100 dark:text-emerald-300 font-bold">
                          {idx + 1}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-white dark:text-emerald-50 text-base">
                              {member.name}
                            </span>
                            <span className="text-xs text-emerald-100/80 dark:text-emerald-300/80 font-numbers mt-0.5">
                              {member.mobile}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-right font-numbers font-extrabold text-white dark:text-emerald-50 text-base">
                          ₹{totalContribution.toLocaleString('en-IN')}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => setSelectedMemberId(member.id)}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <span>खाता देखें</span>
                          </button>
                        </td>
                        {isAdmin && (
                          <td className="py-4 px-4 text-center">
                            <button
                              onClick={() => onDeleteMember(member.id, member.name)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                              title="हटाएं"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View - Overflow Free */}
            <div className="md:hidden space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
              {sourcesList.map((member) => {
                const totalContribution = getMemberTotalContribution(member, mode, timeFilter);
                return (
                  <div 
                    key={member.id} 
                    onClick={() => !isAdmin && setSelectedMemberId(member.id)}
                    className={`p-3 bg-white dark:bg-dark-card border border-gray-200/50 dark:border-dark-border rounded-2xl shadow-sm ${
                      !isAdmin 
                        ? 'cursor-pointer hover:bg-gray-50/50 dark:hover:bg-dark-bg/30 transition-colors' 
                        : 'space-y-3'
                    }`}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 font-bold text-sm" title="स्रोत">★</span>
                        <div>
                          <h4 className="font-bold text-amber-800 dark:text-amber-200 text-base">
                            {member.name}
                          </h4>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] text-amber-600/70 dark:text-amber-400/70 font-semibold block uppercase">
                            कुल जमा
                          </span>
                          <span className="font-numbers font-extrabold text-amber-600 dark:text-amber-400 text-base">
                            ₹{totalContribution.toLocaleString('en-IN')}
                          </span>
                        </div>
                        {!isAdmin && (
                          <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center justify-between gap-3 pt-3 border-t border-amber-100 dark:border-amber-500/10">
                        <button
                          onClick={() => setSelectedMemberId(member.id)}
                          className="flex-grow py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer text-center inline-flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          <span>खाता देखें</span>
                        </button>
                        <button
                          onClick={() => onDeleteMember(member.id, member.name)}
                          className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer shrink-0 border border-rose-500/10"
                          title="हटाएं"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {sortedMembers.map((member) => {
                const totalContribution = getMemberTotalContribution(member, mode, timeFilter);
                return (
                  <div 
                    key={member.id} 
                    onClick={() => !isAdmin && setSelectedMemberId(member.id)}
                    className={`p-3 bg-white dark:bg-dark-card border border-gray-200/50 dark:border-dark-border rounded-2xl shadow-sm ${
                      !isAdmin 
                        ? 'cursor-pointer hover:bg-gray-50/50 dark:hover:bg-dark-bg/30 transition-colors' 
                        : 'space-y-3'
                    }`}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-islamic-green dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                          👤
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800 dark:text-emerald-100 text-base">
                            {member.name}
                          </h4>
                          <p className="text-xs text-gray-400 dark:text-gray-500 font-numbers mt-0.5">
                            {member.mobile}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold block uppercase">
                            कुल जमा
                          </span>
                          <span className="font-numbers font-extrabold text-islamic-green dark:text-emerald-400 text-base">
                            ₹{totalContribution.toLocaleString('en-IN')}
                          </span>
                        </div>
                        {!isAdmin && (
                          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-white/5">
                        <button
                          onClick={() => setSelectedMemberId(member.id)}
                          className="flex-grow py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer text-center inline-flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          <span>खाता देखें</span>
                        </button>
                        <button
                          onClick={() => onDeleteMember(member.id, member.name)}
                          className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer shrink-0 border border-rose-500/10"
                          title="हटाएं"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Member Ledger Modal (Khatabook Style Detailed List of Contributions) */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative">
            
            {/* Close Button */}
            <button 
              type="button"
              onClick={() => setSelectedMemberId(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 dark:border-dark-border/50">
              <h3 className="text-xl font-bold text-gray-800 dark:text-emerald-100 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>{selectedMember.name} की खाता बही</span>
              </h3>
              {selectedMember.memberType !== 'source' && (
                <div className="flex items-center gap-2 mt-1.5">
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-numbers font-semibold">
                    मोबाइल नंबर: {selectedMember.mobile}
                  </p>
                  {selectedMember.mobile && (
                    <a 
                      href={`tel:${selectedMember.mobile}`}
                      className="inline-flex items-center justify-center p-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition-colors shadow-sm"
                      title="कॉल करें"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Ledger Entries List */}
            <div className="flex-grow overflow-y-auto p-6 space-y-4 no-scrollbar">
              {Object.entries(selectedMember.contributions || {})
                .filter(([key]) => {
                  let conMode = 'masjid';
                  if (key.includes('_')) {
                    conMode = key.split('_')[0];
                  }
                  return conMode === mode;
                }).length === 0 ? (
                  <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm font-semibold">
                    इस {mode === 'masjid' ? 'मस्जिद' : 'मदरसा'} के लिए अभी तक कोई सहयोग राशि जमा नहीं है।
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-dark-border/50 text-xs font-bold text-gray-400 dark:text-gray-500">
                          <th className="py-2 px-1">तारीख</th>
                          <th className="py-2 px-1 text-right">सहयोग राशि</th>
                          {isAdmin && <th className="py-2 px-1 text-center">क्रिया</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-dark-border/30 text-sm font-numbers">
                        {Object.entries(selectedMember.contributions || {})
                          .filter(([key]) => {
                            let conMode = 'masjid';
                            if (key.includes('_')) {
                              conMode = key.split('_')[0];
                            }
                            return conMode === mode;
                          })
                          .map(([key, item]) => ({
                            key,
                            amount: item.amount,
                            date: item.date,
                            timestamp: item.timestamp || 0
                          }))
                          .sort((a, b) => b.timestamp - a.timestamp)
                          .map((c) => {
                            const isEditing = editingContributionKey === c.key;
                            return (
                              <tr key={c.key} className="hover:bg-emerald-50/10 transition-colors">
                                <td className="py-3 px-1 text-gray-600 dark:text-emerald-200/80 font-semibold">
                                  {formatDate(c.date)}
                                </td>
                                <td className="py-3 px-1 text-right font-extrabold text-islamic-green dark:text-emerald-400 text-base">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      value={editingAmountInput}
                                      onChange={(e) => setEditingAmountInput(e.target.value)}
                                      className="w-24 px-2 py-1 text-sm border border-emerald-500 rounded-lg text-center dark:bg-dark-bg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                                      autoFocus
                                    />
                                  ) : (
                                    `₹${c.amount.toLocaleString('en-IN')}`
                                  )}
                                </td>
                                {isAdmin && (
                                  <td className="py-3 px-1 text-center">
                                    {isEditing ? (
                                      <div className="flex items-center gap-1.5 justify-center">
                                        <button
                                          onClick={async () => {
                                            const val = parseFloat(editingAmountInput);
                                            if (isNaN(val) || val <= 0) return;
                                            if (onEditContribution) {
                                              await onEditContribution(selectedMember.id, c.key, val, c.date, c.timestamp);
                                            }
                                            setEditingContributionKey(null);
                                          }}
                                          className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg transition-colors cursor-pointer"
                                          title="सहेजें"
                                        >
                                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                          </svg>
                                        </button>
                                        <button
                                          onClick={() => setEditingContributionKey(null)}
                                          className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                                          title="रद्द करें"
                                        >
                                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1.5 justify-center">
                                        <button
                                          onClick={() => {
                                            setEditingContributionKey(c.key);
                                            setEditingAmountInput(c.amount.toString());
                                          }}
                                          className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg transition-colors cursor-pointer"
                                          title="संशोधित करें"
                                        >
                                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                          </svg>
                                        </button>
                                        <button
                                          onClick={() => onDeleteContribution && onDeleteContribution(selectedMember.id, c.key)}
                                          className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                                          title="हटाएं"
                                        >
                                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                          </svg>
                                        </button>
                                      </div>
                                    )}
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>

            {/* Total Section */}
            <div className="bg-slate-50 dark:bg-dark-bg/40 p-5 border-t border-gray-100 dark:border-dark-border/50 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-600 dark:text-gray-400">कुल सहयोग:</span>
              <span className="font-numbers font-extrabold text-islamic-green dark:text-emerald-400 text-xl">
                ₹{getMemberTotalContribution(selectedMember, mode).toLocaleString('en-IN')}
              </span>
            </div>

            {/* Admin Add Contribution Form at Bottom */}
            {isAdmin && (
              <div className="p-6 border-t border-gray-100 dark:border-dark-border/50 bg-emerald-50/5 dark:bg-emerald-950/5">
                <div className="flex items-center gap-2.5">
                  <input
                    type="number"
                    value={paymentInputs[selectedMember.id] || ''}
                    onChange={(e) => setPaymentInputs(prev => ({ ...prev, [selectedMember.id]: e.target.value }))}
                    placeholder="सहयोग राशि ₹ दर्ज करें"
                    className="flex-grow px-4 py-3 rounded-xl border border-gray-200 dark:border-white/5 bg-white dark:bg-dark-bg text-sm font-semibold font-numbers text-center focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                  />
                  <button
                    onClick={() => handlePaymentSubmit(selectedMember.id)}
                    className="px-5 py-3 bg-islamic-green hover:bg-islamic-green-hover text-white rounded-xl text-sm font-bold transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    जमा करें
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Contributor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <form 
            onSubmit={handleAddSubmit}
            className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl relative"
          >
            {/* Close button */}
            <button 
              type="button"
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-bold text-gray-800 dark:text-emerald-100 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>नया सहयोगी / स्रोत सदस्य जोड़ें</span>
            </h3>
            
            <div className="flex gap-4 mb-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="memberType" 
                  value="member" 
                  checked={newMemberType === 'member'} 
                  onChange={() => setNewMemberType('member')} 
                  className="text-islamic-green focus:ring-islamic-green"
                />
                <span className="text-sm font-bold text-gray-700 dark:text-emerald-100">सहयोगी</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="memberType" 
                  value="source" 
                  checked={newMemberType === 'source'} 
                  onChange={() => setNewMemberType('source')} 
                  className="text-islamic-green focus:ring-islamic-green"
                />
                <span className="text-sm font-bold text-gray-700 dark:text-emerald-100">स्रोत (Source)</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">
                {newMemberType === 'source' ? 'स्रोत का नाम' : 'सहयोगी का नाम'}
              </label>
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder={newMemberType === 'source' ? "जैसे: जुमा कलेक्शन" : "जैसे: सादिक इमाम"}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input"
              />
            </div>
            
            {newMemberType === 'member' && (
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">मोबाइल नंबर</label>
                <input
                  type="tel"
                  value={newMemberMobile}
                  onChange={(e) => setNewMemberMobile(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="जैसे: 8951214641"
                  maxLength={10}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input font-numbers"
                />
              </div>
            )}

            <button 
              type="submit" 
              className="w-full py-3 bg-islamic-green hover:bg-islamic-green-hover text-white rounded-xl text-sm font-bold shadow-md cursor-pointer"
            >
              {newMemberType === 'source' ? 'स्रोत जोड़ें' : 'सहयोगी जोड़ें'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

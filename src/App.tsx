import React, { useState, useEffect } from 'react';
import { Header } from './components/Shared/Header';
import { Footer } from './components/Shared/Footer';
import { Toast } from './components/Shared/Toast';
import type { ToastType } from './components/Shared/Toast';
import { ModeToggle } from './components/ModeToggle';
import { DashboardCards } from './components/DashboardCards';
import { PublicSources } from './components/PublicSources';
import { ExpenseSection } from './components/ExpenseSection';
import {
  initializeDb,
  getAdminNotifications,
  getMembers,
  getExpenses,
  getDonations,
  addMember,
  deleteMember,
  recordContribution,
  addExpense,
  updateExpense,
  deleteExpense,
  adminLogin,
  adminLogout,
  checkAdminAuthState
} from './db';
import type {
  FundStats,
  Member,
  Expense,
  Donation
} from './db';

export const App: React.FC = () => {
  // Views state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [mode, setMode] = useState<'masjid' | 'madrasa'>('masjid');
  const [timeFilter, setTimeFilter] = useState<'month' | 'year' | 'all'>('all');
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [hasUnreadNotes, setHasUnreadNotes] = useState<boolean>(false);

  const activeFilter = isAdminMode ? 'all' : timeFilter;

  // Status Loaders
  const [dbInitialized, setDbInitialized] = useState(false);
  const [loading, setLoading] = useState(true);

  // Toast Notifications
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Login Modal State
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [showCommitteeModal, setShowCommitteeModal] = useState<boolean>(false);
  const [loginCode, setLoginCode] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
  };

  // Initial Database Setup & Auth Listeners
  useEffect(() => {
    const setup = async () => {
      await initializeDb();
      setDbInitialized(true);
    };
    setup();

    const unsubscribe = checkAdminAuthState((loggedIn) => {
      setIsLoggedIn(loggedIn);
      setIsAdminMode(loggedIn);
    });
    return () => unsubscribe();
  }, []);

  const downloadCSVReport = async (reportMode: 'masjid' | 'madrasa') => {
    try {
      showToast(`${reportMode === 'masjid' ? 'मस्जिद' : 'मदरसा'} CSV रिपोर्ट तैयार की जा रही है...`, 'success');
      const memList = await getMembers(reportMode);
      const expList = await getExpenses(reportMode);
      const donList = await getDonations(reportMode, false);

      const donationsSum = donList.reduce((sum, d) => sum + d.amount, 0);
      let contributionsSum = 0;
      memList.forEach(m => {
        Object.entries(m.contributions || {}).forEach(([key, contribution]) => {
          let conMode = 'masjid';
          if (key.includes('_')) {
            conMode = key.split('_')[0];
          }
          if (conMode === reportMode) {
            contributionsSum += contribution.amount;
          }
        });
      });

      const totalCollection = donationsSum + contributionsSum;
      const totalExpenses = expList.reduce((sum, e) => sum + e.amount, 0);
      const netBalance = totalCollection - totalExpenses;

      const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

      let csvContent = '\uFEFF'; // UTF-8 BOM

      csvContent += `"${reportMode === 'masjid' ? 'अशरफ़ी जामा मस्जिद' : 'मदरसा गौसिया रिजविया रेयायतुल ऊलूम'}"\n`;
      csvContent += `"वित्तीय रिपोर्ट (Financial Report)","तारीख: ${today}"\n\n`;

      csvContent += `"विवरण (Summary)","राशि (Amount)"\n`;
      csvContent += `"कुल आय (Total Collection)","₹${totalCollection}"\n`;
      csvContent += `"कुल खर्च (Total Expenses)","₹${totalExpenses}"\n`;
      csvContent += `"शेष राशि (Net Balance)","₹${netBalance}"\n\n`;

      csvContent += `"1. सहयोगी सदस्य व स्रोत विवरण (Contributors & Sources)"\n`;
      csvContent += `"क्र.सं. (S.No.)","नाम (Name)","मोबाइल (Mobile)","प्रकार (Type)","कुल सहयोग (Total Paid)"\n`;
      memList.forEach((m, idx) => {
        let totalM = 0;
        Object.entries(m.contributions || {}).forEach(([key, contribution]) => {
          let conMode = 'masjid';
          if (key.includes('_')) {
            conMode = key.split('_')[0];
          }
          if (conMode === reportMode) {
            totalM += contribution.amount;
          }
        });
        csvContent += `"${idx + 1}","${m.name}","${m.mobile || 'N/A'}","${m.memberType === 'source' ? 'स्रोत (Source)' : 'सहयोगी (Member)'}","₹${totalM}"\n`;
      });
      csvContent += `\n`;

      csvContent += `"2. खर्चों की सूची (Expense Statement)"\n`;
      csvContent += `"क्र.सं. (S.No.)","तारीख (Date)","विवरण (Purpose)","राशि (Amount)"\n`;
      expList.forEach((e, idx) => {
        csvContent += `"${idx + 1}","${e.date}","${e.purpose}","₹${e.amount}"\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${reportMode}_report_${today.replace(/\//g, '-')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('CSV रिपोर्ट सफलतापूर्वक डाउनलोड की गई!', 'success');
    } catch (error) {
      console.error(error);
      showToast('CSV रिपोर्ट डाउनलोड करने में विफलता।', 'error');
    }
  };


  // Sync and fetch data whenever database setup is done or active mode changes
  const fetchDashboardData = async () => {
    if (!dbInitialized) return;
    setLoading(true);
    try {
      const memList = await getMembers(mode);
      const expList = await getExpenses(mode);
      const donList = await getDonations(mode, false);

      setMembers(memList);
      setExpenses(expList);
      setDonations(donList);

      // Check unread notifications count
      const notificationsList = await getAdminNotifications();
      const hasUnread = notificationsList.some(n => !n.read);
      setHasUnreadNotes(hasUnread);
    } catch (e) {
      console.error(e);
      showToast('डेटा सिंक्रोनाइज़ेशन विफल रहा।', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dbInitialized, mode]);

  // Auth Handlers
  const handleAdminClick = async () => {
    if (isLoggedIn) {
      await adminLogout();
      setIsLoggedIn(false);
      setIsAdminMode(false);
      showToast('लॉगआउट सफल!', 'success');
      fetchDashboardData();
    } else {
      setShowLoginModal(true);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      await adminLogin(loginCode);
      setIsLoggedIn(true);
      setIsAdminMode(true);
      setShowLoginModal(false);
      setLoginCode('');
      showToast('लॉगिन सफल!', 'success');
      fetchDashboardData();
    } catch (err: any) {
      setAuthError(err.message || 'लॉगिन असफल हुआ।');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleToggleViewClick = () => {
    setIsAdminMode((prev) => !prev);
  };

  const handleHomeClick = () => {
    // Scroll to top or refresh
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Administrative Actions
  const handleAddMember = async (name: string, mobile: string, memberType?: 'member' | 'source') => {
    try {
      await addMember({ name, mobile, address: '', monthlyFee: 0, mode, memberType: memberType || 'member' });
      showToast(memberType === 'source' ? 'नया स्रोत सफलतापूर्वक जोड़ा गया!' : 'नया सहयोगी सदस्य सफलतापूर्वक जोड़ा गया!', 'success');
      fetchDashboardData();
    } catch (e) {
      showToast(memberType === 'source' ? 'स्रोत जोड़ने में त्रुटि' : 'सहयोगी सदस्य जोड़ने में त्रुटि', 'error');
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!confirm(`क्या आप सच में "${name}" को हटाना चाहते हैं?`)) return;
    try {
      await deleteMember(id);
      showToast('सहयोगी सदस्य को हटा दिया गया', 'warning');
      fetchDashboardData();
    } catch (e) {
      showToast('सदस्य हटाने में त्रुटि', 'error');
    }
  };

  const handleRecordContribution = async (memberId: string, amount: number, date?: string) => {
    try {
      const member = members.find(m => m.id === memberId);
      if (!member) return;

      const targetDate = date || new Date().toISOString().split('T')[0];
      const parts = targetDate.split('-');
      const monthKey = `${parts[0]}-${parts[1]}`;

      await recordContribution(memberId, mode, monthKey, amount, true, undefined, targetDate);
      showToast('सहयोग राशि सफलतापूर्वक जमा की गई!', 'success');
      fetchDashboardData();
    } catch (e) {
      showToast('सहयोग राशि दर्ज करने में त्रुटि', 'error');
    }
  };

  const handleEditContribution = async (memberId: string, key: string, newAmount: number, date: string, timestamp: number) => {
    try {
      const parts = date.split('-');
      const monthKey = `${parts[0]}-${parts[1]}`;

      await recordContribution(memberId, mode, monthKey, newAmount, true, key, date, timestamp);
      showToast('सहयोग राशि सफलतापूर्वक संशोधित की गई!', 'success');
      fetchDashboardData();
    } catch (e) {
      showToast('सहयोग राशि संशोधित करने में त्रुटि', 'error');
    }
  };

  const handleDeleteContribution = async (memberId: string, key: string) => {
    if (!confirm('क्या आप सच में इस सहयोग राशि को हटाना चाहते हैं?')) return;
    try {
      await recordContribution(memberId, mode, '', 0, false, key);
      showToast('सहयोग राशि सफलतापूर्वक हटा दी गई!', 'warning');
      fetchDashboardData();
    } catch (e) {
      showToast('सहयोग राशि हटाने में त्रुटि', 'error');
    }
  };

  const handleAddExpense = async (amount: number, purpose: string, audio?: string) => {
    try {
      await addExpense({
        amount,
        purpose,
        description: '',
        date: new Date().toISOString().split('T')[0],
        mode,
        audio
      });
      showToast('खर्च सफलतापूर्वक दर्ज किया गया!', 'success');
      fetchDashboardData();
    } catch (e) {
      showToast('खर्च दर्ज करने में त्रुटि', 'error');
    }
  };

  const handleEditExpense = async (id: string, amount: number, purpose: string, audio?: string, date?: string) => {
    try {
      await updateExpense(id, {
        amount,
        purpose,
        audio,
        date
      });
      showToast('खर्च विवरण संशोधित किया गया!', 'success');
      fetchDashboardData();
    } catch (e) {
      showToast('खर्च संशोधित करने में त्रुटि', 'error');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('क्या आप सच में इस खर्च को हटाना चाहते हैं?')) return;
    try {
      await deleteExpense(id);
      showToast('खर्च को सफलतापूर्वक हटा दिया गया', 'warning');
      fetchDashboardData();
    } catch (e) {
      showToast('खर्च हटाने में त्रुटि', 'error');
    }
  };

  const getFilteredStats = (): FundStats => {
    const activeFilter = isAdminMode ? 'all' : timeFilter;
    const now = new Date();
    const currentYear = now.getFullYear().toString();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const currentMonthKey = `${currentYear}-${currentMonth}`;

    // 1. Filter donations
    const filteredDonations = donations.filter(d => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'month') return d.date.startsWith(currentMonthKey);
      if (activeFilter === 'year') return d.date.startsWith(currentYear);
      return true;
    });
    const donationsSum = filteredDonations.reduce((sum, d) => sum + d.amount, 0);

    // 2. Filter member contributions
    let contributionsSum = 0;
    members.forEach(m => {
      Object.entries(m.contributions || {}).forEach(([key, contribution]) => {
        let conMode = 'masjid';
        let conMonth = key;
        if (key.includes('_')) {
          const parts = key.split('_');
          conMode = parts[0];
          conMonth = parts[1];
        }

        if (conMode === mode) {
          if (activeFilter === 'all') {
            contributionsSum += contribution.amount;
          } else if (activeFilter === 'month' && conMonth === currentMonthKey) {
            contributionsSum += contribution.amount;
          } else if (activeFilter === 'year' && conMonth.startsWith(currentYear)) {
            contributionsSum += contribution.amount;
          }
        }
      });
    });

    const income = donationsSum + contributionsSum;

    // 3. Filter expenses
    const filteredExpenses = expenses.filter(e => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'month') return e.date.startsWith(currentMonthKey);
      if (activeFilter === 'year') return e.date.startsWith(currentYear);
      return true;
    });
    const expensesSum = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    // For Card 4: All-time balance is always all-time income minus all-time expenses
    const allTimeDonations = donations.reduce((sum, d) => sum + d.amount, 0);
    let allTimeContributions = 0;
    members.forEach(m => {
      Object.entries(m.contributions || {}).forEach(([key, contribution]) => {
        let conMode = 'masjid';
        if (key.includes('_')) {
          conMode = key.split('_')[0];
        }
        if (conMode === mode) {
          allTimeContributions += contribution.amount;
        }
      });
    });
    const allTimeExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const overallBalance = (allTimeDonations + allTimeContributions) - allTimeExpenses;

    return {
      totalCollection: income,
      thisMonthIncome: income,
      thisMonthExpenses: expensesSum,
      currentBalance: income - expensesSum,
      overallBalance: overallBalance
    } as any;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 text-gray-800 flex flex-col transition-colors duration-300 relative">
      <div className="absolute inset-0 bg-islamic-geometric pointer-events-none mix-blend-multiply opacity-50"></div>
      <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none"></div>

      {/* Header component */}
      <Header
        onHomeClick={handleHomeClick}
        mode={mode}
        onCommitteeClick={() => setShowCommitteeModal(true)}
      />

      {/* Main Content Area */}
      <main className="flex-grow pb-16 bg-islamic-geometric bg-repeat relative">
        {/* Subtle page background minarets silhouette */}
        <div className="absolute bottom-0 left-0 w-full h-44 bg-mosque-pattern opacity-5 pointer-events-none z-0"></div>

        <div className="relative z-10 space-y-6">
          {/* Top Swiper Toggle Mode */}
          <ModeToggle mode={mode} onChange={setMode} />

          {/* Time Frame Filter Selector */}
          {!isAdminMode && (
            <div className="w-full max-w-md mx-auto px-4 mt-2">
              <div className="relative">
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value as any)}
                  className="w-full pl-4 pr-10 py-3 text-base font-bold rounded-2xl glass-input appearance-none text-islamic-green dark:text-emerald-300 cursor-pointer shadow-sm text-center"
                >
                  <option value="month" className="bg-white dark:bg-dark-card text-gray-800 dark:text-emerald-100 text-left">इस महीने का लेखा-जोखा (This Month)</option>
                  <option value="year" className="bg-white dark:bg-dark-card text-gray-800 dark:text-emerald-100 text-left">इस साल का लेखा-जोखा (This Year)</option>
                  <option value="all" className="bg-white dark:bg-dark-card text-gray-800 dark:text-emerald-100 text-left">कुल लेखा-जोखा (All Time)</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-islamic-green dark:text-emerald-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Financial indicators cards */}
          <DashboardCards stats={getFilteredStats()} loading={loading} timeFilter={activeFilter} />

          {/* Unified Admin Contributors ledger list */}
          <PublicSources
            members={members}
            mode={mode}
            loading={loading}
            isAdmin={isAdminMode}
            onAddMember={handleAddMember}
            onDeleteMember={handleDeleteMember}
            onRecordContribution={handleRecordContribution}
            onDeleteContribution={handleDeleteContribution}
            onEditContribution={handleEditContribution}
            timeFilter={activeFilter}
          />

          {/* Unified Admin Expenses list */}
          <ExpenseSection
            expenses={expenses}
            loading={loading}
            isAdmin={isAdminMode}
            mode={mode}
            onAddExpense={handleAddExpense}
            onEditExpense={handleEditExpense}
            onDeleteExpense={handleDeleteExpense}
            timeFilter={activeFilter}
          />

          {/* Admin Reports Panel */}
          {isAdminMode && (
            <div className="max-w-7xl mx-auto px-4 mt-2">
              <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-3xl p-5 md:p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-emerald-100 flex items-center gap-2">
                      <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {mode === 'masjid' ? 'मस्जिद रिपोर्ट डाउनलोड करें (Download Masjid Report)' : 'मदरसा रिपोर्ट डाउनलोड करें (Download Madrasa Report)'}
                    </h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-medium">
                      {mode === 'masjid'
                        ? 'वर्तमान तिथि तक मस्जिद के वित्तीय विवरणों (आय, व्यय एवं खाता बही) की Excel CSV रिपोर्ट डाउनलोड करें।'
                        : 'वर्तमान तिथि तक मदरसा के वित्तीय विवरणों (आय, व्यय एवं खाता बही) की Excel CSV रिपोर्ट डाउनलोड करें।'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => downloadCSVReport(mode)}
                      className="flex items-center gap-2.5 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>CSV रिपोर्ट डाउनलोड करें</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer component */}
      <Footer
        isLoggedIn={isLoggedIn}
        isAdmin={isAdminMode}
        onAdminClick={handleAdminClick}
        onToggleViewClick={handleToggleViewClick}
        hasNotifications={hasUnreadNotes}
      />

      {/* Slide-in toast alerts notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Committee Details Modal Overlay */}
      {showCommitteeModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-0 md:p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-card border-0 md:border-2 border-emerald-800/20 dark:border-emerald-500/20 rounded-none md:rounded-3xl max-w-none md:max-w-2xl w-full h-full md:h-auto max-h-screen md:max-h-[90vh] shadow-2xl overflow-hidden flex flex-col relative">

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowCommitteeModal(false)}
              className="absolute top-4 right-4 text-emerald-900/60 hover:text-emerald-950 dark:text-emerald-300/60 dark:hover:text-white p-1.5 rounded-full hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors z-10"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Scrollable Container */}
            <div className="overflow-y-auto p-6 md:p-8 space-y-6 no-scrollbar">
              {/* Header Title with Bismillah */}
              <div className="text-center space-y-2 pb-4 border-b border-emerald-100 dark:border-emerald-950/50">
                <span className="text-lg md:text-xl font-arabic text-emerald-700 dark:text-emerald-400 block tracking-widest font-semibold">
                  بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
                </span>

                <h2 className="text-xl md:text-2xl font-black text-emerald-900 dark:text-emerald-200">
                  मदरसा गौसिया रिजविया रेयायतुल ऊलूम
                </h2>
                <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mt-2"></div>
              </div>

              {/* Officers section (Sadar & Secretary) */}
              <div className="grid grid-cols-2 gap-3.5">
                {/* Sadar */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-dark-card border border-emerald-800/10 dark:border-emerald-500/10 shadow-sm flex flex-col justify-between items-center text-center gap-2 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full translate-x-8 -translate-y-8"></div>
                  <div>
                    <span className="px-3 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full tracking-wider uppercase">सदर (President)</span>
                    <h4 className="text-lg font-extrabold text-gray-800 dark:text-emerald-100 mt-2">फ़ैयाज अहमद साहब</h4>
                  </div>
                  <a
                    href="tel:9801163209"
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 group-hover:shadow font-numbers mt-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>9801163209</span>
                  </a>
                </div>

                {/* Secretary */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-dark-card border border-emerald-800/10 dark:border-emerald-500/10 shadow-sm flex flex-col justify-between items-center text-center gap-2 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full translate-x-8 -translate-y-8"></div>
                  <div>
                    <span className="px-3 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full tracking-wider uppercase">सेक्रेट्री (Secretary)</span>
                    <h4 className="text-lg font-extrabold text-gray-800 dark:text-emerald-100 mt-2">नकी इमाम साहब</h4>
                  </div>
                  <a
                    href="tel:8051376767"
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 group-hover:shadow font-numbers mt-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>8051376767</span>
                  </a>
                </div>
              </div>

              {/* Members Ledger */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-500 dark:text-emerald-400 uppercase tracking-wider pl-1">
                  कमेटी मेंबर्स (Committee Members)
                </h3>
                <div className="border border-emerald-100 dark:border-emerald-950/50 rounded-2xl overflow-hidden bg-emerald-50/5 dark:bg-emerald-950/5">
                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-emerald-100 dark:border-emerald-950/40 text-[10px] font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/20">
                          <th className="py-2.5 px-4 w-12 text-center">क्र.सं.</th>
                          <th className="py-2.5 px-4">नाम (Name)</th>
                          <th className="py-2.5 px-4 text-right">संपर्क (Call Option)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-50 dark:divide-emerald-950/25 text-sm">
                        {[
                          { name: 'शहाब हैदर', phone: '9955665165' },
                          { name: 'कमरूज्जमा', phone: '8521161161' },
                          { name: 'वसीम रजा उर्फ छोटे भाई', phone: '9801686822' },
                          { name: 'इश्तेयाक अहमद उर्फ सोनू भाई', phone: '9128951786' },
                          { name: 'नसीम अख्तर उर्फ टीपू भाई', phone: '9592405465' },
                          { name: 'आफताब आलम', phone: '9931258753' },
                          { name: 'गुलाम मसूद रजा', phone: '9973922961' },
                          { name: 'नसीम अख्तर (हजाम)', phone: '8294280210' },
                          { name: 'शौकत अली उर्फ मेहमान', phone: '7766879987' },
                          { name: 'अरमान अहमद अशरफी', phone: '9546995123' },
                          { name: 'मोहम्मद दानिश', phone: '9128768115' },
                          { name: 'शमी अहमद', phone: '9006702655' },
                          { name: 'कमाल अशरफ', phone: '7761003727' }
                        ].map((member, idx) => (
                          <tr key={idx} className="hover:bg-emerald-50/10 dark:hover:bg-emerald-950/5 transition-colors">
                            <td className="py-3 px-4 text-center font-numbers text-gray-400 dark:text-gray-500 font-bold">{idx + 1}</td>
                            <td className="py-3 px-4 font-bold text-gray-700 dark:text-emerald-100">{member.name}</td>
                            <td className="py-3 px-4 text-right">
                              <a
                                href={`tel:${member.phone}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition-colors text-xs font-semibold font-numbers border border-emerald-200/50 dark:border-emerald-800/20"
                                title="डायरेक्ट कॉल करें"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span>{member.phone}</span>
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Tagline / Dua */}
              <div className="text-center pt-4 border-t border-emerald-100 dark:border-emerald-950/50">
                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-400 italic">
                  "अल्लाह हमारे इस नेक इरादे को कबूल फरमाए और मदरसे की तरक्की में बरकत अता फरमाए। आमीन"
                </p>
              </div>
            </div>

            {/* Bottom Close bar */}
            <div className="bg-slate-50 dark:bg-dark-bg/20 p-4 border-t border-emerald-100 dark:border-emerald-950/50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCommitteeModal(false)}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                बंद करें (Close)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal Overlay */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleLoginSubmit}
            className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-3xl p-6 md:p-8 max-w-md w-full space-y-4 shadow-2xl relative"
          >
            <button
              type="button"
              onClick={() => {
                setShowLoginModal(false);
                setAuthError('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-col items-center mb-2">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-islamic-green dark:text-emerald-400 rounded-2xl mb-3 shadow-inner">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-emerald-100">एडमिन सुरक्षित लॉगिन</h2>
            </div>

            {authError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-500/10 text-xs font-bold rounded-xl text-center">
                {authError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">एक्सेस कोड</label>
                <input
                  type="password"
                  value={loginCode}
                  onChange={(e) => setLoginCode(e.target.value)}
                  placeholder="कोड दर्ज करें"
                  className="w-full px-4 py-3 text-sm rounded-xl glass-input font-numbers text-center tracking-widest"
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 bg-islamic-green hover:bg-islamic-green-hover text-white rounded-xl text-sm font-bold shadow-md active:scale-98 transition-all cursor-pointer"
              >
                {authLoading ? 'सत्यापन हो रहा है...' : 'प्रवेश करें'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
export default App;

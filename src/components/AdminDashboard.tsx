import React, { useState, useEffect } from 'react';
import {
  adminLogin, adminLogout, checkAdminAuthState,
  getMembers, addMember, deleteMember, recordContribution,
  getExpenses, addExpense
} from '../db';
import type { Member, Expense } from '../db';
import { getMemberTotalContribution } from './PublicSources';
import { AudioIconPlayer } from './Shared/AudioIconPlayer';

interface AdminDashboardProps {
  activeMode: 'masjid' | 'madrasa';
  onNotificationUpdate: () => void;
  showToast: (msg: string, type: 'success' | 'warning' | 'error') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  activeMode,
  onNotificationUpdate,
  showToast
}) => {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Data state
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Forms state
  const [sourceForm, setSourceForm] = useState({ name: '', mobile: '' });
  const [expenseForm, setExpenseForm] = useState({ amount: '', purpose: '' });
  const [paymentInputs, setPaymentInputs] = useState<{ [memberId: string]: string }>({});

  // Auth Listener
  useEffect(() => {
    const unsubscribe = checkAdminAuthState((loggedIn) => {
      setIsLoggedIn(loggedIn);
      if (loggedIn) {
        loadData();
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch data on mode change
  useEffect(() => {
    if (isLoggedIn) {
      loadData();
    }
  }, [activeMode]);

  const loadData = async () => {
    setLoading(true);
    try {
      const mems = await getMembers();
      const exps = await getExpenses(activeMode);
      setMembers(mems);
      setExpenses(exps);
      onNotificationUpdate();
    } catch (e) {
      console.error(e);
      showToast('डेटा लोड करने में असमर्थ', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    try {
      await (adminLogin as any)(email, password);
      showToast('लॉगिन सफल!', 'success');
    } catch (err: any) {
      setAuthError(err.message || 'लॉगिन असफल हुआ।');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await adminLogout();
    setIsLoggedIn(false);
    showToast('लॉगआउट सफल!', 'success');
  };

  // Add Member / Source
  const handleAddSourceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceForm.name || !sourceForm.mobile) {
      showToast('कृपया नाम और मोबाइल नंबर दर्ज करें', 'warning');
      return;
    }
    try {
      await addMember({
        name: sourceForm.name,
        mobile: sourceForm.mobile,
        address: '',
        monthlyFee: 0 // Simplification: we don't need monthlyFee constraints anymore
      });
      showToast('नया सहयोगी सदस्य सफलतापूर्वक जोड़ा गया!', 'success');
      setSourceForm({ name: '', mobile: '' });
      loadData();
    } catch (e) {
      showToast('सदस्य जोड़ने में त्रुटि', 'error');
    }
  };

  // Delete Member / Source
  const handleDeleteSource = async (id: string, name: string) => {
    if (!confirm(`क्या आप सच में "${name}" को हटाना चाहते हैं?`)) return;
    try {
      await deleteMember(id);
      showToast('सदस्य को हटा दिया गया', 'warning');
      loadData();
    } catch (e) {
      showToast('हटाने में त्रुटि', 'error');
    }
  };

  // Record Payment (Khatabook Style)
  const handlePaymentSubmit = async (memberId: string) => {
    const payAmountStr = paymentInputs[memberId] || '';
    const payAmount = parseFloat(payAmountStr);
    if (isNaN(payAmount) || payAmount <= 0) {
      showToast('कृपया वैध सहयोग राशि दर्ज करें', 'warning');
      return;
    }

    try {
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const member = members.find(m => m.id === memberId);
      if (!member) return;

      const contributionKey = `${activeMode}_${monthKey}`;
      const existingAmount = member.contributions?.[contributionKey]?.amount || 0;
      const newTotal = existingAmount + payAmount;

      await recordContribution(memberId, activeMode, monthKey, newTotal, true);
      showToast('सहयोग राशि सफलतापूर्वक जमा की गई!', 'success');
      setPaymentInputs(prev => ({ ...prev, [memberId]: '' }));
      loadData();
    } catch (e) {
      showToast('भुगतान जमा करने में त्रुटि', 'error');
    }
  };

  // Add Expense
  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.amount || !expenseForm.purpose) {
      showToast('कृपया राशि और विवरण दर्ज करें', 'warning');
      return;
    }
    try {
      await addExpense({
        amount: parseFloat(expenseForm.amount),
        purpose: expenseForm.purpose,
        description: '',
        date: new Date().toISOString().split('T')[0],
        mode: activeMode
      });
      showToast('खर्च सफलतापूर्वक दर्ज किया गया!', 'success');
      setExpenseForm({ amount: '', purpose: '' });
      loadData();
    } catch (e) {
      showToast('खर्च दर्ज करने में त्रुटि', 'error');
    }
  };

  const filteredMembers = members.filter(m => {
    const q = searchQuery.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.mobile.includes(q);
  });

  // Render Login View if not authenticated
  if (!isLoggedIn) {
    return (
      <div className="px-4 py-12 max-w-md mx-auto">
        <form
          onSubmit={handleLogin}
          className="glass-card rounded-3xl p-6 md:p-8 shadow-xl border border-emerald-900/10 dark:border-white/5"
        >
          <div className="flex flex-col items-center mb-6">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-islamic-green dark:text-emerald-400 rounded-2xl mb-3 shadow-inner">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-emerald-100">
              एडमिन सुरक्षित लॉगिन
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-semibold">
              कमेटी प्रबंधन के लिए लॉगिन विवरण दर्ज करें
            </p>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-500/10 text-xs font-bold rounded-xl flex items-center gap-2">
              <span>{authError}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">ईमेल आईडी (Email)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sadiq.imam404@gmail.com"
                className="w-full px-4 py-3 text-sm rounded-xl glass-input font-numbers"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">पासवर्ड (Password)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 text-sm rounded-xl glass-input font-numbers"
                required
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3.5 bg-islamic-green hover:bg-islamic-green-hover text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2 mt-6 cursor-pointer"
            >
              {authLoading ? 'सत्यापन हो रहा है...' : 'प्रवेश करें (Login)'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Render Simple Admin Panel
  return (
    <section className="px-4 py-8 max-w-7xl mx-auto space-y-8" id="admin-panel">
      {/* Top Banner Control */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-5 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-islamic-green dark:text-emerald-400 rounded-2xl shadow-inner">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-gray-800 dark:text-emerald-100">
              Admin Panel ({activeMode === 'masjid' ? 'Masjid' : 'Madrasa'})
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold mt-1">
              सहयोगी सदस्यों को जोड़ें, सहयोग राशि जमा करें और खर्चों का हिसाब रखें
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-gray-200/50 dark:border-white/5 bg-gray-50 dark:bg-dark-bg text-gray-500 dark:text-gray-400 hover:text-islamic-green dark:hover:text-emerald-400 transition-all"
            title="रिफ्रेश डेटा"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-500/10 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/15 text-sm font-bold transition-all active:scale-95 cursor-pointer"
          >
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Grid: Forms to Add Contributor and Expenses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Card 1: Add Contributor */}
        <form onSubmit={handleAddSourceSubmit} className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-emerald-100 flex items-center gap-2">
            <span>👤</span> नया सहयोगी सदस्य जोड़ें (Add Contributor)
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
            सहयोग या चंदा देने वाले व्यक्ति का नाम व मोबाइल नंबर दर्ज करें
          </p>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">सहयोगी का नाम (Name) *</label>
            <input
              type="text"
              value={sourceForm.name}
              onChange={(e) => setSourceForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="जैसे: सादिक खान"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">मोबाइल नंबर (Mobile) *</label>
            <input
              type="tel"
              value={sourceForm.mobile}
              onChange={(e) => setSourceForm(prev => ({ ...prev, mobile: e.target.value.replace(/[^0-9]/g, '') }))}
              placeholder="जैसे: 9876543210"
              maxLength={10}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input font-numbers"
              required
            />
          </div>
          <button type="submit" className="w-full py-3 bg-islamic-green hover:bg-islamic-green-hover text-white rounded-xl text-sm font-bold shadow-sm transition-all active:scale-98 cursor-pointer">
            सहयोगी जोड़ें (Add Contributor)
          </button>
        </form>

        {/* Card 2: Record Expense */}
        <form onSubmit={handleExpenseSubmit} className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-emerald-100 flex items-center gap-2">
            <span>💸</span> खर्च प्रविष्टि (Record Expense)
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
            {activeMode === 'masjid' ? 'मस्जिद' : 'मदरसा'} के मद में किए गए खर्च का ब्यौरा दर्ज करें
          </p>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">खर्च राशि (Amount in ₹) *</label>
            <input
              type="number"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="जैसे: 500"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input font-numbers"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">खर्च विवरण (Purpose) *</label>
            <input
              type="text"
              value={expenseForm.purpose}
              onChange={(e) => setExpenseForm(prev => ({ ...prev, purpose: e.target.value }))}
              placeholder="जैसे: बिजली बिल, मरम्मत कार्य, आदि"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input"
              required
            />
          </div>
          <button type="submit" className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all active:scale-98 cursor-pointer">
            खर्च दर्ज करें (Record Expense)
          </button>
        </form>
      </div>

      {/* Card 3: Khatabook Style Contributor Ledger */}
      <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-3xl p-5 md:p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-dark-border">
          <div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-emerald-100 flex items-center gap-2">
              <span>📖</span> सहयोगी सदस्य खाता बही (Contributor Ledger)
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-medium">
              यहाँ से सहयोग राशि जमा करें और उनकी कुल जमा राशि देखें
            </p>
          </div>

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

        {filteredMembers.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm font-semibold">
            कोई सदस्य नहीं मिला।
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-dark-border/50 text-xs font-bold text-gray-400 dark:text-gray-500">
                  <th className="py-3 px-4">सहयोगी सदस्य</th>
                  <th className="py-3 px-4">कुल जमा</th>
                  <th className="py-3 px-4">सहयोग राशि जमा करें (Record Payment)</th>
                  <th className="py-3 px-4 text-center">क्रियाएं</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-dark-border/30 text-sm">
                {filteredMembers.map((member) => {
                  const totalPaid = getMemberTotalContribution(member, activeMode);
                  return (
                    <tr key={member.id} className="hover:bg-emerald-50/10 dark:hover:bg-emerald-950/5 transition-colors">
                      {/* Name and Mobile */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-700 dark:text-emerald-100 text-base">{member.name}</span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 font-numbers mt-0.5">{member.mobile}</span>
                        </div>
                      </td>

                      {/* Total Contributed */}
                      <td className="py-4 px-4 font-numbers font-extrabold text-islamic-green dark:text-emerald-400 text-base">
                        ₹{totalPaid.toLocaleString('en-IN')}
                      </td>

                      {/* Record payment inline input and button */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 max-w-[240px]">
                          <input
                            type="number"
                            value={paymentInputs[member.id] || ''}
                            onChange={(e) => setPaymentInputs(prev => ({ ...prev, [member.id]: e.target.value }))}
                            placeholder="सहयोग राशि ₹"
                            className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-dark-bg/50 text-sm font-semibold font-numbers text-center focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white"
                          />
                          <button
                            onClick={() => handlePaymentSubmit(member.id)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                          >
                            जमा करें
                          </button>
                        </div>
                      </td>

                      {/* Delete option */}
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleDeleteSource(member.id, member.name)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
                          title="हटाएं"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Card 4: Expense Ledger */}
      <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border rounded-3xl p-5 md:p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-gray-800 dark:text-emerald-100 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.25">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          खर्चों की सूची (Expense Ledger)
        </h3>
        {expenses.length === 0 ? (
          <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-sm font-semibold">
            कोई खर्च दर्ज नहीं है।
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 dark:border-dark-border/50 text-xs font-bold text-gray-400 dark:text-gray-500">
                  <th className="py-3 px-4">तारीख</th>
                  <th className="py-3 px-4">खर्च विवरण (Purpose)</th>
                  <th className="py-3 px-4 text-right">खर्च राशि</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-dark-border/30 text-sm">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-rose-50/5 dark:hover:bg-rose-950/5 transition-colors">
                    <td className="py-3.5 px-4 text-gray-500 dark:text-gray-400 font-numbers font-semibold">
                      {expense.date}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-700 dark:text-emerald-100">
                      {expense.audio ? (
                        <AudioIconPlayer src={expense.audio} />
                      ) : (
                        <span>{expense.purpose}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-numbers font-extrabold text-rose-600 dark:text-rose-400">
                      ₹{expense.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

import type { Donation, Expense, Member, AppSettings } from './mockData';

export type { Donation, Expense, Member, AppSettings } from './mockData';

export interface AdminNotification {
  id?: string;
  type: 'donation' | 'expense' | 'member' | 'system';
  message: string;
  timestamp: number;
  read: boolean;
}

// Stats indicator layout mapping
export interface FundStats {
  totalCollection: number;
  totalExpenses: number;
  currentBalance: number;
  thisMonthIncome: number;
  thisMonthExpenses: number;
}

// 1. Initialize
export const initializeDb = async (): Promise<void> => {
  // Database initialized by server startup
  return Promise.resolve();
};

// 2. Fund Stats
export const getFundStats = async (mode: 'masjid' | 'madrasa'): Promise<FundStats> => {
  const res = await fetch(`/api/stats?mode=${mode}`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
};

// 3. Donations
export const getDonations = async (mode: 'masjid' | 'madrasa', includePending = false): Promise<Donation[]> => {
  const res = await fetch(`/api/donations?mode=${mode}&includePending=${includePending}`);
  if (!res.ok) throw new Error('Failed to fetch donations');
  return res.json();
};

export const getPendingDonations = async (): Promise<Donation[]> => {
  const res = await fetch(`/api/donations?includePending=true`);
  if (!res.ok) throw new Error('Failed to fetch pending donations');
  const all: Donation[] = await res.json();
  return all.filter(d => d.status === 'pending');
};

export const submitDonationRequest = async (donation: Omit<Donation, 'id' | 'status' | 'date' | 'timestamp' | 'type'>): Promise<void> => {
  const res = await fetch('/api/donations/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(donation)
  });
  if (!res.ok) throw new Error('Failed to submit donation request');
};

export const recordOfflineDonation = async (donation: Omit<Donation, 'id' | 'status' | 'timestamp' | 'type'>): Promise<void> => {
  const res = await fetch('/api/donations/offline', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(donation)
  });
  if (!res.ok) throw new Error('Failed to record offline donation');
};

export const approveDonationRequest = async (id: string): Promise<void> => {
  const res = await fetch(`/api/donations/${id}/approve`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to approve donation');
};

export const rejectDonationRequest = async (id: string): Promise<void> => {
  const res = await fetch(`/api/donations/${id}/reject`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to reject donation');
};

// 4. Expenses
export const getExpenses = async (mode: 'masjid' | 'madrasa'): Promise<Expense[]> => {
  const res = await fetch(`/api/expenses?mode=${mode}`);
  if (!res.ok) throw new Error('Failed to fetch expenses');
  return res.json();
};

export const addExpense = async (expense: Omit<Expense, 'id' | 'timestamp'>): Promise<void> => {
  const res = await fetch('/api/expenses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expense)
  });
  if (!res.ok) throw new Error('Failed to add expense');
};

export const updateExpense = async (id: string, expense: Partial<Omit<Expense, 'id' | 'timestamp'>>): Promise<void> => {
  const res = await fetch(`/api/expenses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expense)
  });
  if (!res.ok) throw new Error('Failed to update expense');
};

export const deleteExpense = async (id: string): Promise<void> => {
  const res = await fetch(`/api/expenses/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete expense');
};


// 5. Members
export const getMembers = async (mode?: 'masjid' | 'madrasa'): Promise<Member[]> => {
  const url = mode ? `/api/members?mode=${mode}` : '/api/members';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch members');
  return res.json();
};

export const addMember = async (member: Omit<Member, 'id' | 'contributions' | 'createdAt'> & { mode?: 'masjid' | 'madrasa' }): Promise<void> => {
  const res = await fetch('/api/members', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(member)
  });
  if (!res.ok) throw new Error('Failed to add member');
};

export const updateMember = async (id: string, updatedFields: Partial<Omit<Member, 'id' | 'contributions' | 'createdAt'>>): Promise<void> => {
  const res = await fetch(`/api/members/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedFields)
  });
  if (!res.ok) throw new Error('Failed to update member');
};

export const deleteMember = async (id: string): Promise<void> => {
  const res = await fetch(`/api/members/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete member');
};

export const recordContribution = async (
  memberId: string, 
  mode: 'masjid' | 'madrasa', 
  monthKey: string, 
  amount: number,
  isPaid: boolean,
  key?: string,
  date?: string,
  timestamp?: number
): Promise<void> => {
  const res = await fetch(`/api/members/${memberId}/contribution`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, monthKey, amount, isPaid, key, date, timestamp })
  });
  if (!res.ok) throw new Error('Failed to record contribution');
};

// 6. Settings
export const getSettings = async (): Promise<AppSettings> => {
  const res = await fetch('/api/settings');
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
};

export const updateSettings = async (settings: Partial<AppSettings>): Promise<void> => {
  const res = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  if (!res.ok) throw new Error('Failed to update settings');
};

// 7. Auth (Frontend keeps session in localStorage after successful server auth check)
export const adminLogin = async (code: string): Promise<boolean> => {
  const correctCode = import.meta.env.VITE_ADMIN_CODE || '1900553';
  if (code === correctCode) {
    localStorage.setItem('masjid_fund_admin_logged_in', 'true');
    return true;
  }
  throw new Error('अमान्य एक्सेस कोड (Invalid Access Code)');
};

export const adminLogout = async (): Promise<void> => {
  localStorage.removeItem('masjid_fund_admin_logged_in');
  return Promise.resolve();
};

export const checkAdminAuthState = (callback: (isLoggedIn: boolean) => void): (() => void) => {
  const loggedIn = localStorage.getItem('masjid_fund_admin_logged_in') === 'true';
  callback(loggedIn);
  
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'masjid_fund_admin_logged_in') {
      callback(e.newValue === 'true');
    }
  };
  window.addEventListener('storage', handleStorageChange);
  
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
};

// 8. Notifications
export const getAdminNotifications = async (): Promise<AdminNotification[]> => {
  const res = await fetch('/api/notifications');
  if (!res.ok) throw new Error('Failed to fetch notifications');
  return res.json();
};

export const markNotificationsAsRead = async (): Promise<void> => {
  const res = await fetch('/api/notifications/read', {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to mark notifications as read');
};

export const clearNotifications = async (): Promise<void> => {
  const res = await fetch('/api/notifications/clear', {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to clear notifications');
};

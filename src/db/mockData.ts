export interface Donation {
  id: string;
  name: string;
  mobile: string;
  amount: number;
  screenshotUrl?: string;
  date: string;
  mode: 'masjid' | 'madrasa';
  status: 'pending' | 'approved' | 'rejected';
  approvedAt?: string;
  type: 'online' | 'offline';
  timestamp: number;
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  purpose: string;
  description: string;
  mode: 'masjid' | 'madrasa';
  timestamp: number;
  audio?: string;
}

export interface Contribution {
  amount: number;
  date: string;
  timestamp: number;
}

export interface Member {
  id: string;
  name: string;
  mobile: string;
  address?: string;
  monthlyFee: number;
  contributions: Record<string, Contribution>; // key: YYYY-MM (e.g., "2026-06")
  createdAt: string;
  memberType?: 'member' | 'source'; // optional for backward compatibility
}

export interface AppSettings {
  upiId: string;
  whatsappNumber: string;
  qrCodeUrl: string; // fallback if mode-specific is not set
  masjidQrUrl?: string;
  madrasaQrUrl?: string;
}

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'm1',
    name: 'अहमद ख़ान',
    mobile: '9876543210',
    address: 'मोहल्ला पूर्वी, मकान नं. 14',
    monthlyFee: 500,
    contributions: {
      '2026-06': { amount: 500, date: '2026-06-15', timestamp: 1781520000000 },
      '2026-05': { amount: 500, date: '2026-05-10', timestamp: 1778928000000 },
      '2026-04': { amount: 500, date: '2026-04-05', timestamp: 1776336000000 },
    },
    createdAt: '2026-01-01',
  },
  {
    id: 'm2',
    name: 'मोहम्मद साजिद',
    mobile: '8765432109',
    address: 'मोहल्ला पश्चिमी, मस्जिद गली',
    monthlyFee: 1000,
    contributions: {
      '2026-06': { amount: 1000, date: '2026-06-18', timestamp: 1781779200000 },
      '2026-05': { amount: 1000, date: '2026-05-12', timestamp: 1779100800000 },
    },
    createdAt: '2026-01-01',
  },
  {
    id: 'm3',
    name: 'अब्दुल रहमान',
    mobile: '7654321098',
    address: 'बाज़ार चौक, पुराना बाज़ार',
    monthlyFee: 3000,
    contributions: {
      '2026-05': { amount: 3000, date: '2026-05-08', timestamp: 1778755200000 },
      '2026-04': { amount: 3000, date: '2026-04-10', timestamp: 1776768000000 },
    },
    createdAt: '2026-01-05',
  },
  {
    id: 'm4',
    name: 'इरफ़ान अंसारी',
    mobile: '9543210987',
    address: 'नहर किनारा, वार्ड 4',
    monthlyFee: 200,
    contributions: {
      '2026-06': { amount: 200, date: '2026-06-02', timestamp: 1780396800000 },
      '2026-05': { amount: 200, date: '2026-05-05', timestamp: 1778496000000 },
      '2026-04': { amount: 200, date: '2026-04-03', timestamp: 1776163200000 },
    },
    createdAt: '2026-01-10',
  },
  {
    id: 'm5',
    name: 'सलीम शेख़',
    mobile: '9321098765',
    address: 'मदरसा रोड',
    monthlyFee: 500,
    contributions: {
      '2026-05': { amount: 500, date: '2026-05-15', timestamp: 1779360000000 },
    },
    createdAt: '2026-02-15',
  },
  {
    id: 'm6',
    name: 'साकिब अज़ीज़',
    mobile: '9012345678',
    address: 'मेन रोड',
    monthlyFee: 1000,
    contributions: {},
    createdAt: '2026-03-01',
  }
];

export const INITIAL_DONATIONS: Donation[] = [
  {
    id: 'd1',
    name: 'अशरफ़ अली',
    mobile: '9988776655',
    amount: 5000,
    date: '2026-06-18',
    mode: 'masjid',
    status: 'approved',
    approvedAt: '2026-06-18',
    type: 'online',
    timestamp: 1781779200000,
  },
  {
    id: 'd2',
    name: 'मोहम्मद सुहैल',
    mobile: '9944556677',
    amount: 2500,
    date: '2026-06-17',
    mode: 'madrasa',
    status: 'approved',
    approvedAt: '2026-06-17',
    type: 'online',
    timestamp: 1781692800000,
  },
  {
    id: 'd3',
    name: 'हाजी ज़मीर',
    mobile: '9123912301',
    amount: 10000,
    date: '2026-06-14',
    mode: 'masjid',
    status: 'approved',
    approvedAt: '2026-06-14',
    type: 'offline',
    timestamp: 1781433600000,
  },
  {
    id: 'd4',
    name: 'तारीक़ जमाल',
    mobile: '9898989898',
    amount: 1500,
    date: '2026-06-19',
    mode: 'masjid',
    status: 'pending',
    type: 'online',
    screenshotUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop&q=60',
    timestamp: 1781865600000,
  },
  {
    id: 'd5',
    name: 'मज़हर रज़ा',
    mobile: '9797979797',
    amount: 2000,
    date: '2026-06-19',
    mode: 'madrasa',
    status: 'pending',
    type: 'online',
    screenshotUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop&q=60',
    timestamp: 1781865600000,
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'e1',
    date: '2026-06-10',
    amount: 2500,
    purpose: 'मस्जिद की सफाई व धुलाई',
    description: 'रमज़ान/जुमा की विशेष सफाई हेतु मज़दूरों की मजदूरी व फिनाइल आदि।',
    mode: 'masjid',
    timestamp: 1781088000000,
  },
  {
    id: 'e2',
    date: '2026-06-12',
    amount: 5000,
    purpose: 'मदरसा की दीनी किताबें',
    description: 'गरीब बच्चों के लिए दीनी तालीम की किताबों का नया स्टॉक।',
    mode: 'madrasa',
    timestamp: 1781260800000,
  },
  {
    id: 'e3',
    date: '2026-06-15',
    amount: 1200,
    purpose: 'मस्जिद का माइक रिपेयरिंग',
    description: 'अज़ान लाउडस्पीकर एम्पलीफायर का कैपेसिटर बदला गया।',
    mode: 'masjid',
    timestamp: 1781520000000,
  },
  {
    id: 'e4',
    date: '2026-06-16',
    amount: 3500,
    purpose: 'मदरसा स्टाफ की चाय-पानी व स्टेशनरी',
    description: 'ऑफिस हेतु रजिस्टर, पेन, कॉपियां और साप्ताहिक चाय खर्च।',
    mode: 'madrasa',
    timestamp: 1781606400000,
  }
];

export const INITIAL_SETTINGS: AppSettings = {
  upiId: 'masjid.madrasa@upi',
  whatsappNumber: '+919876543210',
  qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=masjid.madrasa@upi&pn=Masjid%20Madrasa%20Committee',
  masjidQrUrl: '',
  madrasaQrUrl: '',
};

const express = require('express');
const cors = require('cors');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Support base64 image uploads

// Serve static files from Vite build
app.use(express.static(path.join(__dirname, 'dist')));

const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 5000;

let db;
let client;

// Default settings structure if not already initialized
const INITIAL_SETTINGS = {
  upiId: 'masjid.madrasa@upi',
  whatsappNumber: '+919876543210',
  qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=masjid.madrasa@upi&pn=Masjid%20Madrasa%20Committee',
  masjidQrUrl: '',
  madrasaQrUrl: '',
};

// Connect to MongoDB Atlas
async function connectDB() {
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db('masjid_fund_register');
    console.log('MongoDB connected successfully to DB: masjid_fund_register');

    // Ensure Settings document exists
    const settingsColl = db.collection('settings');
    const settingsCount = await settingsColl.countDocuments();
    if (settingsCount === 0) {
      await settingsColl.insertOne(INITIAL_SETTINGS);
      console.log('Created default settings document');
    }

    // Initialize notifications collection if empty
    const notificationsColl = db.collection('notifications');
    const notificationsCount = await notificationsColl.countDocuments();
    if (notificationsCount === 0) {
      await notificationsColl.insertOne({
        type: 'system',
        message: 'डेटाबेस सफलतापूर्वक कनेक्ट हुआ।',
        timestamp: Date.now(),
        read: false
      });
      console.log('Created system notification');
    }

  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

// Database Connection Middleware for Serverless/Vercel
app.use(async (req, res, next) => {
  try {
    if (!db) {
      await connectDB();
    }
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed: ' + err.message });
  }
});

// REST API Endpoints

// Calculate statistics
app.get('/api/stats', async (req, res) => {
  try {
    const { mode } = req.query;
    if (!mode || (mode !== 'masjid' && mode !== 'madrasa')) {
      return res.status(400).json({ error: 'Invalid mode param' });
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const monthKey = `${currentYear}-${currentMonth}`; // e.g. "2026-06"

    const donations = await db.collection('donations').find({ mode, status: 'approved' }).toArray();
    const expenses = await db.collection('expenses').find({ mode }).toArray();
    const members = await db.collection('members').find().toArray();

    // 1. Approved general donations
    const totalDonationsSum = donations.reduce((sum, d) => sum + d.amount, 0);

    // 2. Member contributions
    let totalContributionsSum = 0;
    let thisMonthContributionsSum = 0;

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
          totalContributionsSum += contribution.amount;
          if (conMonth === monthKey) {
            thisMonthContributionsSum += contribution.amount;
          }
        }
      });
    });

    const totalCollection = totalDonationsSum + totalContributionsSum;
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const currentBalance = totalCollection - totalExpenses;

    const thisMonthDonations = donations.filter(d => d.date.startsWith(monthKey));
    const thisMonthDonationsSum = thisMonthDonations.reduce((sum, d) => sum + d.amount, 0);
    const thisMonthIncome = thisMonthDonationsSum + thisMonthContributionsSum;

    const thisMonthExpensesList = expenses.filter(e => e.date.startsWith(monthKey));
    const thisMonthExpenses = thisMonthExpensesList.reduce((sum, e) => sum + e.amount, 0);

    res.json({
      totalCollection,
      totalExpenses,
      currentBalance,
      thisMonthIncome,
      thisMonthExpenses
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// App settings
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await db.collection('settings').findOne({});
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/settings', async (req, res) => {
  try {
    const fields = req.body;
    // Remove _id from body if exists
    delete fields._id;
    await db.collection('settings').updateOne({}, { $set: fields });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Members
app.get('/api/members', async (req, res) => {
  try {
    const { mode } = req.query;
    let query = {};
    if (mode === 'masjid') {
      query = { $or: [{ mode: 'masjid' }, { mode: { $exists: false } }] };
    } else if (mode === 'madrasa') {
      query = { mode: 'madrasa' };
    }
    const members = await db.collection('members').find(query).toArray();
    // Map _id to id for client compatibility
    const mapped = members.map(m => ({ ...m, id: m._id.toString() }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/members', async (req, res) => {
  try {
    const { name, mobile, address, monthlyFee, mode, memberType } = req.body;
    const newMember = {
      name,
      mobile: mobile || '',
      address: address || '',
      monthlyFee: Number(monthlyFee || 0),
      contributions: {},
      createdAt: new Date().toISOString().split('T')[0],
      mode: mode || 'masjid',
      memberType: memberType || 'member'
    };
    const result = await db.collection('members').insertOne(newMember);
    
    // Add notification log
    await db.collection('notifications').insertOne({
      type: 'member',
      message: `नया सदस्य जोड़ा गया: ${name} (मासिक शुल्क: ₹${monthlyFee}) - ${mode === 'madrasa' ? 'मदरसा' : 'मस्जिद'}`,
      timestamp: Date.now(),
      read: false
    });

    res.json({ success: true, id: result.insertedId.toString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, mobile, address, monthlyFee } = req.body;
    const updateFields = {};
    if (name) updateFields.name = name;
    if (mobile) updateFields.mobile = mobile;
    if (address !== undefined) updateFields.address = address;
    if (monthlyFee !== undefined) updateFields.monthlyFee = Number(monthlyFee);

    await db.collection('members').updateOne({ _id: new ObjectId(id) }, { $set: updateFields });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/members/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const member = await db.collection('members').findOne({ _id: new ObjectId(id) });
    await db.collection('members').deleteOne({ _id: new ObjectId(id) });
    
    if (member) {
      await db.collection('notifications').insertOne({
        type: 'member',
        message: `सदस्य हटाया गया: ${member.name}`,
        timestamp: Date.now(),
        read: false
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Record contribution
// Record contribution
app.post('/api/members/:id/contribution', async (req, res) => {
  try {
    const { id } = req.params;
    const { mode, monthKey, amount, isPaid, key, date, timestamp: reqTimestamp } = req.body;
    
    const member = await db.collection('members').findOne({ _id: new ObjectId(id) });
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const contributions = { ...(member.contributions || {}) };
    if (isPaid) {
      const timestamp = reqTimestamp ? Number(reqTimestamp) : Date.now();
      const uniqueKey = key || `${mode}_${monthKey}_${timestamp}`;
      contributions[uniqueKey] = {
        amount: Number(amount),
        date: date || new Date().toISOString().split('T')[0],
        timestamp: timestamp
      };
    } else {
      if (key) {
        delete contributions[key];
      } else {
        const contributionKey = `${mode}_${monthKey}`;
        delete contributions[contributionKey];
      }
    }

    await db.collection('members').updateOne({ _id: new ObjectId(id) }, { $set: { contributions } });
    
    // Log Notification
    await db.collection('notifications').insertOne({
      type: 'member',
      message: `${member.name} - ${mode === 'masjid' ? 'मस्जिद' : 'मदरसा'} का योगदान ${isPaid ? 'जमा किया गया (₹' + amount + ')' : 'हटाया गया'}`,
      timestamp: Date.now(),
      read: false
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Expenses
app.get('/api/expenses', async (req, res) => {
  try {
    const { mode } = req.query;
    const filter = mode ? { mode } : {};
    const expenses = await db.collection('expenses').find(filter).sort({ timestamp: -1 }).toArray();
    const mapped = expenses.map(e => ({ ...e, id: e._id.toString() }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const { amount, purpose, description, date, mode, audio } = req.body;
    const expensePurpose = purpose || 'ऑडियो रिकॉर्डिंग';
    const newExpense = {
      amount: Number(amount),
      purpose: expensePurpose,
      description: description || '',
      date,
      mode,
      timestamp: Date.now(),
      audio: audio || ''
    };
    await db.collection('expenses').insertOne(newExpense);

    // Notification Log
    await db.collection('notifications').insertOne({
      type: 'expense',
      message: `नया खर्च दर्ज किया गया: ₹${amount} (${audio ? 'ऑडियो स्पष्टीकरण' : expensePurpose}) - ${mode === 'masjid' ? 'मस्जिद' : 'मदरसा'}`,
      timestamp: Date.now(),
      read: false
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, purpose, description, date, audio } = req.body;

    const updateFields = {};
    if (amount !== undefined) updateFields.amount = Number(amount);
    if (purpose !== undefined) updateFields.purpose = purpose;
    if (description !== undefined) updateFields.description = description;
    if (date !== undefined) updateFields.date = date;
    if (audio !== undefined) updateFields.audio = audio;

    await db.collection('expenses').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    // Notification Log
    await db.collection('notifications').insertOne({
      type: 'expense',
      message: `खर्च विवरण संशोधित किया गया: ₹${amount || ''} (${audio ? 'ऑडियो स्पष्टीकरण' : purpose || ''})`,
      timestamp: Date.now(),
      read: false
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await db.collection('expenses').findOne({ _id: new ObjectId(id) });
    await db.collection('expenses').deleteOne({ _id: new ObjectId(id) });

    if (expense) {
      await db.collection('notifications').insertOne({
        type: 'expense',
        message: `खर्च हटाया गया: ₹${expense.amount} (${expense.purpose})`,
        timestamp: Date.now(),
        read: false
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Donations
app.get('/api/donations', async (req, res) => {
  try {
    const { mode, includePending } = req.query;
    const filter = {};
    if (mode) filter.mode = mode;
    if (includePending === 'false') {
      filter.status = 'approved';
    }
    const donations = await db.collection('donations').find(filter).sort({ timestamp: -1 }).toArray();
    const mapped = donations.map(d => ({ ...d, id: d._id.toString() }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Public submit donation (pending)
app.post('/api/donations/submit', async (req, res) => {
  try {
    const { name, mobile, amount, screenshotUrl, mode } = req.body;
    const newDonation = {
      name,
      mobile,
      amount: Number(amount),
      screenshotUrl,
      mode,
      status: 'pending',
      type: 'online',
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now()
    };
    await db.collection('donations').insertOne(newDonation);

    // Notification Log
    await db.collection('notifications').insertOne({
      type: 'donation',
      message: `नया ऑनलाइन चंदा अनुरोध प्राप्त हुआ: ₹${amount} - ${name} (${mode === 'masjid' ? 'मस्जिद' : 'मदरसा'})`,
      timestamp: Date.now(),
      read: false
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Offline direct donation (approved)
app.post('/api/donations/offline', async (req, res) => {
  try {
    const { name, mobile, amount, date, mode } = req.body;
    const newDonation = {
      name,
      mobile,
      amount: Number(amount),
      mode,
      status: 'approved',
      approvedAt: date,
      type: 'offline',
      date,
      timestamp: Date.now()
    };
    await db.collection('donations').insertOne(newDonation);

    // Notification Log
    await db.collection('notifications').insertOne({
      type: 'donation',
      message: `नया ऑफलाइन नकद चंदा दर्ज: ₹${amount} - ${name} (${mode === 'masjid' ? 'मस्जिद' : 'मदरसा'})`,
      timestamp: Date.now(),
      read: false
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve donation
app.post('/api/donations/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const don = await db.collection('donations').findOne({ _id: new ObjectId(id) });
    if (!don) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    const dateStr = new Date().toISOString().split('T')[0];
    await db.collection('donations').updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: 'approved', approvedAt: dateStr } }
    );

    // Log notification
    await db.collection('notifications').insertOne({
      type: 'donation',
      message: `चंदा अनुरोध स्वीकृत किया गया: ₹${don.amount} - ${don.name} (${don.mode === 'masjid' ? 'मस्जिद' : 'मदरसा'})`,
      timestamp: Date.now(),
      read: false
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reject donation
app.post('/api/donations/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const don = await db.collection('donations').findOne({ _id: new ObjectId(id) });
    if (!don) {
      return res.status(404).json({ error: 'Donation not found' });
    }

    await db.collection('donations').updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: 'rejected' } }
    );

    // Log notification
    await db.collection('notifications').insertOne({
      type: 'donation',
      message: `चंदा अनुरोध अस्वीकृत किया गया: ₹${don.amount} - ${don.name} (${don.mode === 'masjid' ? 'मस्जिद' : 'मदरसा'})`,
      timestamp: Date.now(),
      read: false
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auth
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const adminEmail = process.env.ADMIN_EMAIL || 'sadiq.imam404@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Imam@2004';

  if (email === adminEmail && password === adminPassword) {
    res.json({ success: true, message: 'Login successful' });
  } else {
    res.status(401).json({ error: 'गलत ईमेल या पासवर्ड।' });
  }
});

// Notifications
app.get('/api/notifications', async (req, res) => {
  try {
    const notifications = await db.collection('notifications').find().sort({ timestamp: -1 }).toArray();
    const mapped = notifications.map(n => ({ ...n, id: n._id.toString() }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/notifications/read', async (req, res) => {
  try {
    await db.collection('notifications').updateMany({ read: false }, { $set: { read: true } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/notifications/clear', async (req, res) => {
  try {
    await db.collection('notifications').deleteMany({});
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fallback for SPA routing (React Router) - serve index.html for all other non-API routes
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server (only if not running on Vercel as a Serverless function)
if (!process.env.VERCEL) {
  app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    try {
      await connectDB();
    } catch (err) {
      console.error('Failed initial MongoDB connection:', err);
    }
  });
}

module.exports = app;

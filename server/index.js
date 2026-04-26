require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const clientRoutes = require('./routes/clients');
const invoiceRoutes = require('./routes/invoices');
const paymentRoutes = require('./routes/payments');
const dashboardRoutes = require('./routes/dashboard');
const actionsRoutes = require('./routes/actions');
const agreementRoutes = require('./routes/agreements');
const settingsRoutes = require('./routes/settings');
const { initCron } = require('./services/automation');

const app = express();

// Database Connection Logic
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/freeos';
if (process.env.USE_MOCK !== 'true') {
    mongoose.connect(MONGODB_URI)
        .then(() => console.log('[DATABASE] Connected to MongoDB'))
        .catch(err => {
            console.error('[DATABASE] Connection Error:', err);
            console.log('[DATABASE] Falling back to Mock DB for safety...');
            process.env.USE_MOCK = 'true';
        });
} else {
    console.log('[DATABASE] Running in Mock Mode (Demo Stability)');
}

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// 🔹 GLOBAL LOGGING (DIAGNOSTIC)
app.use((req, res, next) => {
    console.log(`[API REQUEST] ${req.method} ${req.url}`);
    next();
});

// 🔹 ROUTE REGISTRATION (STRICT ISOLATION)
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', require('./routes/reports'));
app.use('/api/actions', actionsRoutes);
app.use('/api/agreements', agreementRoutes);
app.use('/api/settings', settingsRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[DEMO MODE] Server is LIVE and listening on port ${PORT}`);
  console.log(`Connecting to: http://localhost:${PORT}/api`);
  
  // 🚀 Start Automated Task Engine (Actual Multi-Stage Reminders)
  try {
      initCron();
      console.log('----------------------------------------------------');
      console.log('✅ [AUTOMATION] Actual Multi-Stage Engine ACTIVATED');
      console.log('✅ [AUTOMATION] Stage 1: 1-Day Upcoming (Automatic)');
      console.log('✅ [AUTOMATION] Stage 2: Due Today (Automatic)');
      console.log('✅ [AUTOMATION] Stage 3: Continual Overdue (Automatic)');
      console.log('----------------------------------------------------');
  } catch (err) {
      console.error('❌ [AUTOMATION] Failed to start engine:', err.message);
  }
});

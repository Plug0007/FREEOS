const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const financeService = require('../services/financeService');

/**
 * 🔹 Unified Dashboard Route
 * Leverages central financeService for absolute data consistency.
 */
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const stats = await financeService.getFinancialStats(userId);

    // 🔹 RECENT ACTIVITY MAPPING (Hardened for clarity)
    const now = new Date();
    const recentActivity = [
        ...stats.allInvoices.map(i => ({ 
            _id: i._id, 
            type: 'invoice', 
            title: `Invoice Generated`, 
            amount: i.totalAmount, 
            status: i.status || 'pending', 
            date: i.createdAt || now,
            clientId: i.clientId || { name: 'Demo Client' }
        })),
        ...stats.allPayments.map(p => ({ 
            _id: p._id, 
            type: 'payment', 
            title: `Payment Collected`, 
            amount: p.amount, 
            status: 'paid', 
            date: p.date || p.createdAt || now,
            clientId: (p.invoiceId && p.invoiceId.clientId) || { name: 'Demo Client' }
        }))
    ].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

    // Priorities
    const today = new Date();
    today.setHours(0,0,0,0);
    const actions = stats.allInvoices
        .filter(i => i.status !== 'paid')
        .map(i => {
           const d = new Date(i.dueDate);
           if (!isNaN(d.getTime()) && d < today) {
               return { 
                   id: i._id, 
                   priority: 'high', 
                   message: `₹${(i.totalAmount - (i.paidAmount || 0)).toLocaleString()} overdue`, 
                   delay: Math.ceil((today - d) / (1000 * 60 * 60 * 24)) 
               };
           }
           return null;
        }).filter(Boolean);

    res.json({
      earnedThisMonth: stats.earnedThisMonth || 0,
      pendingAmount: stats.pendingAmount || 0,
      expectedIncome: stats.expectedIncome || 0,
      recentInvoices: recentActivity,
      actions: actions || []
    });
  } catch (error) {
    console.error('[DASHBOARD ERROR]', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

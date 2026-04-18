const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const financeService = require('../services/financeService');
const { sendEmail, templates } = require('../services/emailService');

/**
 * POST /api/reports/send-monthly-summary
 * Fetches current month's invoices and sends a clean HTML summary to the specified email.
 */
router.post('/send-monthly-summary', auth, async (req, res) => {
  try {
    const { email } = req.body;
    const userId = req.userId;

    if (!email) {
      return res.status(400).json({ message: 'Target email is required' });
    }

    // 1. Fetch unified financial stats & data
    const stats = await financeService.getFinancialStats(userId);
    
    // 2. Identify invoices from current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthName = now.toLocaleString('default', { month: 'long' });

    const monthlyInvoices = stats.allInvoices
        .filter(i => {
            const iDate = new Date(i.createdAt || i.date || now);
            return iDate >= startOfMonth;
        })
        .map(i => ({
            clientName: i.clientId?.name || 'Client',
            project: i.project || 'Project Work',
            total: i.totalAmount,
            paid: i.paidAmount,
            status: i.status
        }));

    if (monthlyInvoices.length === 0) {
        return res.status(400).json({ message: 'No invoices found for the current month' });
    }

    // 3. Prepare Template Data
    const totals = {
        earned: stats.earnedThisMonth,
        pending: stats.pendingAmount,
        projected: stats.expectedIncome
    };

    // 4. Generate & Send Email
    const template = templates.monthlySummary(monthName, monthlyInvoices, totals);
    const success = await sendEmail({
        to: email,
        subject: template.subject,
        html: template.html
    });

    if (success) {
        res.json({ message: `Monthly summary for ${monthName} sent successfully to ${email}` });
    } else {
        res.status(500).json({ message: 'Failed to send email report' });
    }
  } catch (error) {
    console.error('[REPORT ERROR]', error.message);
    res.status(500).json({ message: 'Server error generating monthly report' });
  }
});

module.exports = router;

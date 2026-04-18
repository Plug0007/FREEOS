const express = require('express');
const router = express.Router();
const InvoiceOriginal = require('../models/Invoice');
const mockDb = require('../mockDb');
const auth = require('../middleware/auth');

const Invoice = process.env.USE_MOCK === 'true' ? mockDb.Invoice : InvoiceOriginal;

router.get('/', auth, async (req, res) => {
  try {
    const invoices = await Invoice.find({
      userId: req.userId,
      status: { $in: ['pending', 'partial', 'overdue'] }
    }).populate('clientId');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const actions = invoices.map(invoice => {
      const dueDate = new Date(invoice.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      
      const diffTime = today - dueDate;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const amount = invoice.totalAmount - invoice.paidAmount;
      const clientName = invoice.clientId?.name || 'Client';

      let type, message, priority, delay;

      if (diffDays > 0) {
        type = 'overdue';
        priority = 'high';
        delay = `${diffDays} days overdue`;
        message = `Follow up with ${clientName} – ₹${amount.toLocaleString()} overdue (${delay})`;
      } else if (diffDays === 0) {
        type = 'due_today';
        priority = 'medium';
        message = `Invoice due today from ${clientName} – ₹${amount.toLocaleString()}`;
      } else if (diffDays === -1) {
        type = 'upcoming';
        priority = 'low';
        message = `Upcoming payment from ${clientName} tomorrow – ₹${amount.toLocaleString()}`;
      } else {
        return null;
      }

      return {
        id: invoice._id,
        type,
        message,
        clientName,
        amount,
        priority,
        delay: diffDays > 0 ? diffDays : 0
      };
    }).filter(Boolean);

    // Sort: High priority first, then medium, then low
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    res.json(actions);
  } catch (error) {
    console.error('[ACTIONS ERROR]', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

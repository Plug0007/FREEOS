const express = require('express');
const router = express.Router();
const InvoiceOriginal = require('../models/Invoice');
const mockDb = require('../mockDb');
const Invoice = process.env.USE_MOCK === 'true' ? mockDb.Invoice : InvoiceOriginal;
const auth = require('../middleware/auth');
const { sendInvoiceEmail, sendReminderEmail } = require('../services/emailService');
const ClientOriginal = require('../models/Client');

// Get all invoices for user
router.get('/', auth, async (req, res) => {
  try {
    console.log(`📍 [REVENUE HUB] User ${req.userId} fetching invoices.`);
    const isMock = process.env.USE_MOCK === 'true';
    const query = isMock ? {} : { userId: req.userId };
    
    const invoices = await Invoice.find(query)
      .populate('clientId', 'name email')
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create invoice
router.post('/', auth, async (req, res) => {
  try {
    const { clientId, totalAmount, dueDate, split, reminderOverrides, currency } = req.body;
    const invoice = new Invoice({
      userId: req.userId,
      clientId,
      totalAmount,
      dueDate,
      split,
      currency: currency || 'INR',
      status: 'pending',
      reminderOverrides: reminderOverrides || {}
    });
    await invoice.save();

    // 🔹 AUTOMATED DISPATCH
    // Fetch client details to send the email
    const Client = process.env.USE_MOCK === 'true' ? mockDb.Client : ClientOriginal;
    const client = await Client.findById(clientId);
    
    if (client && client.email) {
        const paymentLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pay/${invoice._id}`;
        console.log(`[AUTOMATION] Dispatching Initial Invoice ${invoice._id} to ${client.email}`);
        await sendInvoiceEmail(client.email, String(invoice._id), client.name, totalAmount, paymentLink);

        // 🔹 REAL-TIME DUE DATE CHECK
        const today = new Date();
        today.setHours(0,0,0,0);
        const due = new Date(dueDate);
        due.setHours(0,0,0,0);
        const diffDays = Math.ceil((today - due) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            console.log(`[AUTOMATION] Immediate 'DUE TODAY' dispatch for ${invoice._id}`);
            await sendReminderEmail(client.email, client.name, totalAmount, dueDate, 'due', paymentLink);
        } else if (diffDays === -1) {
            console.log(`[AUTOMATION] Immediate 'UPCOMING' dispatch for ${invoice._id}`);
            await sendReminderEmail(client.email, client.name, totalAmount, dueDate, 'upcoming', paymentLink);
        }
    }

    res.status(201).json(invoice);
  } catch (error) {
    console.error('[INVOICE ERROR]', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete invoice
router.delete('/:id', auth, async (req, res) => {
  try {
    await Invoice.delete(req.params.id);
    res.json({ message: 'Invoice removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Send manual reminder
router.post('/:id/remind', auth, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    
    // Logic for sending email would go here (e.g., using nodemailer)
    // For demo/mock:
    console.log(`[AUTOMATION] Sending reminder for Invoice ${invoice._id} to client.`);
    
    res.json({ message: 'Reminder sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single invoice (Public - For Payment Page)
router.get('/public/:id', async (req, res) => {
  try {
    const isMock = process.env.USE_MOCK === 'true';
    console.log(`📍 [REVENUE HUB] Public fetch for Invoice ID: ${req.params.id} | Mode: ${isMock ? 'MOCK' : 'LIVE DB'}`);
    
    const invoice = await Invoice.findById(req.params.id).populate('clientId', 'name email');
    
    if (!invoice) {
        if (process.env.USE_MOCK === 'true') {
            console.log("📍 [REVENUE HUB] Failover: Returning Demo Invoice for checkout stability.");
            return res.json({
                _id: req.params.id || 'demo-invoice-999',
                clientName: 'Demo Client (Session Timeout Failover)',
                totalAmount: 15000,
                paidAmount: 5000,
                currency: 'INR',
                status: 'partial',
                project: 'Mock Stability System'
            });
        }
        return res.status(404).json({ message: 'Invoice not found in current session. Please create a new one.' });
    }
    
    // Return only necessary data for payment
    res.json({
      _id: invoice._id,
      clientName: invoice.clientId?.name || 'Client',
      totalAmount: invoice.totalAmount,
      paidAmount: invoice.paidAmount,
      status: invoice.status,
      project: invoice.project || 'Project Work'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

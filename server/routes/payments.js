const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const PaymentOriginal = require('../models/Payment');
const InvoiceOriginal = require('../models/Invoice');
const mockDb = require('../mockDb');
const Payment = process.env.USE_MOCK === 'true' ? mockDb.Payment : PaymentOriginal;
const Invoice = process.env.USE_MOCK === 'true' ? mockDb.Invoice : InvoiceOriginal;
const auth = require('../middleware/auth');
const financeService = require('../services/financeService');
const { sendReceiptEmail } = require('../services/emailService');

// 🔹 Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret'
});

// 🔹 Public Keys (Client Handshake)
router.get('/key', (req, res) => {
    res.json({ key: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder' });
});

// Create Order (Public/Auth)
console.log("🚀 [GLOBAL] create-order route hit");

router.post('/create-order', async (req, res) => {
  try {
    const { invoiceId, amount: requestedAmount } = req.body;
    
    let invoice = await Invoice.findById(invoiceId);
    
    // 🔹 MOCK STABILITY GUARD: Ensure checkout never fails due to missing mock data
    if (!invoice && process.env.USE_MOCK === 'true') {
        console.warn(`⚠️ [PAYMENTS FAILOVER] Invoice ${invoiceId} not found, using temporary demo context.`);
        invoice = {
            _id: invoiceId,
            totalAmount: 15000,
            paidAmount: 5000,
            clientName: 'Demo Client',
            currency: 'INR'
        };
    }

    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    
    const amountRemaining = Math.max(0, invoice.totalAmount - (invoice.paidAmount || 0));
    const amountPaise = requestedAmount ? Math.round(requestedAmount * 100) : Math.round(amountRemaining * 100);
    
    if (amountPaise < 100) return res.status(400).json({ message: 'Minimum amount is 100 paise' });
    const options = {
      amount: amountPaise,
      currency: "INR",
      receipt: `receipt_${invoiceId}_${Date.now()}`,
    };
    console.log(`📍 [RAZORPAY] Creating order for invoice ${invoiceId} | amount ${amountPaise}`);
    try {
        const order = await razorpay.orders.create(options);
        console.log(`✅ [RAZORPAY] Order created: ${order.id}`);
        return res.json(order);
    } catch (rzpErr) {
        if (process.env.USE_MOCK === 'true') {
            console.warn(`⚠️ [RAZORPAY FAILOVER] Real API failed, generating MOCK ORDER for demo stability.`, rzpErr.message);
            return res.json({
                id: `order_mock_${Date.now()}`,
                amount: amountPaise,
                currency: "INR",
                receipt: options.receipt,
                status: 'created'
            });
        }
        throw rzpErr;
    }
  } catch (error) {
    console.error('📍 [RAZORPAY ORDER ERROR]', error);
    res.status(500).json({ 
        message: 'Razorpay API error', 
        details: error.error?.description || error.message 
    });
  }
});

// Verify Payment
router.post('/verify-payment', async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      invoiceId 
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ message: 'Missing required payment fields' });
    }

    // 1. Verify signature
    const hmacSource = `${razorpay_order_id}|${razorpay_payment_id}`;
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret');
    shasum.update(hmacSource);
    const digest = shasum.digest('hex');

    // 🔹 MOCK BYPASS: Allow simulation if USE_MOCK is true
    const isMock = process.env.USE_MOCK === 'true' && (razorpay_signature === 'mock_sig' || razorpay_order_id.startsWith('mock_') || razorpay_order_id.startsWith('order_mock_'));
    
    if (digest !== razorpay_signature && !isMock) {
      console.error('❌ [VERIFY FAIL] Signature Mismatch:', { received: razorpay_signature, calculated: digest });
      return res.status(400).json({ message: 'Signature verification failed. Potential tampering or key mismatch.' });
    }
    
    if (isMock) console.log('✅ [VERIFY SUCCESS] Mock Signature Accepted');
    
    // 2. Fetch Invoice
    const invoice = await Invoice.findById(invoiceId).populate('clientId');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    const amountPaid = (req.body.amount || (invoice.totalAmount - invoice.paidAmount));
    const payment = new Payment({
      userId: invoice.userId, // 🔹 FIX: Link to owner to pass Data Integrity Guard
      invoiceId,
      amount: amountPaid,
      method: 'Razorpay',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      signature: razorpay_signature,
      date: new Date()
    });
    await payment.save();

    const allPayments = await Payment.find({ invoiceId });
    const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    
    invoice.paidAmount = totalPaid;
    invoice.status = (invoice.paidAmount >= invoice.totalAmount - 0.01) ? 'paid' : 'partial';
    
    await invoice.save();

    if (invoice.clientId?.email) {
      await sendReceiptEmail(
        invoice.clientId.email, 
        invoice.clientId.name, 
        amountPaid, 
        (invoice.totalAmount - invoice.paidAmount),
        invoice._id
      );
    }

    res.json({ success: true, invoice });
  } catch (error) {
    console.error('📍 [VERIFY ERROR]', error);
    res.status(500).json({ message: 'Payment verification failed' });
  }
});

// Add payment
router.post('/', auth, async (req, res) => {
  try {
    const { invoiceId, amount, method, date } = req.body;
    
    // 1. Create payment
    const payment = new Payment({
      invoiceId,
      amount,
      method,
      date: date || new Date()
    });
    await payment.save();

    // 2. Reconcile invoice balance
    const invoice = await Invoice.findById(invoiceId).populate('clientId');
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

    // Fetch all payments for this invoice to perform a clean sum (Reconciliation)
    const allPaymentsForInvoice = await Payment.find({ invoiceId });
    const reconciledSum = allPaymentsForInvoice.reduce((sum, p) => sum + Number(p.amount), 0);
    
    invoice.paidAmount = reconciledSum;
    
    if (invoice.paidAmount >= invoice.totalAmount - 0.01) {
      invoice.status = 'paid';
    } else if (invoice.paidAmount > 0) {
      invoice.status = 'partial';
    }

    await invoice.save();

    // 3. Smart Automation: Send Email Receipt (Non-Blocking)
    const balanceRemaining = Math.max(0, invoice.totalAmount - invoice.paidAmount);
    
    if (invoice.clientId && invoice.clientId.email) {
      console.log(`[AUTOMATION] Attempting receipt for ₹${amount} to ${invoice.clientId.email}`);
      try {
        // We don't await this if we want it truly non-blocking, 
        // but putting a try/catch around the await is safer for error handling.
        await sendReceiptEmail(
          invoice.clientId.email, 
          invoice.clientId.name, 
          Number(amount), 
          balanceRemaining,
          invoice._id
        );
      } catch (emailErr) {
        console.error('[AUTOMATION ERROR] Failed to send receipt email:', emailErr.message);
      }
    } else {
      console.log(`[AUTOMATION ALERT] Could not send receipt: Client email missing for invoice ${invoice._id}`);
    }

    res.status(201).json({ payment, invoice });
  } catch (error) {
    console.error('[PAYMENT ERROR]', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const stats = await financeService.getFinancialStats(userId);
    
    // stats.allPayments is already filtered based on Mode (Universal Mock vs User-Specific)
    res.json(stats.allPayments.sort((a,b) => {
        const dateA = new Date(a.date || a.createdAt || 0);
        const dateB = new Date(b.date || b.createdAt || 0);
        return dateB - dateA;
    }));
  } catch (error) {
    console.error('[PAYMENTS HISTORY ERROR]', error.message);
    res.status(500).json({ message: 'Server error fetching history' });
  }
});

// Get payments for a specific invoice
router.get('/:invoiceId', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ invoiceId: req.params.invoiceId });
    res.json(payments.sort((a,b) => new Date(b.date) - new Date(a.date)));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

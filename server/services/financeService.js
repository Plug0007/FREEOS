const InvoiceOriginal = require('../models/Invoice');
const PaymentOriginal = require('../models/Payment');
const UserOriginal = require('../models/User');
const mockDb = require('../mockDb');

const Invoice = process.env.USE_MOCK === 'true' ? mockDb.Invoice : InvoiceOriginal;
const Payment = process.env.USE_MOCK === 'true' ? mockDb.Payment : PaymentOriginal;
const User = process.env.USE_MOCK === 'true' ? mockDb.User : UserOriginal;

// 🔹 STATIC EXCHANGE RATES (USD/EUR/GBP to INR)
// Base currency: INR (Market values for 2026-approx)
const RATES = {
    'INR': 1,
    'USD': 83.0,
    'EUR': 90.0,
    'GBP': 105.0
};

/**
 * 🔹 Currency Converter
 * Converts any amount from its source currency to the user's target/default currency.
 */
const convert = (amount, sourceCurrency, targetCurrency) => {
    const src = sourceCurrency || 'INR';
    const tgt = targetCurrency || 'INR';
    if (src === tgt) return Number(amount);
    
    // Amount -> INR -> Target
    const baseValue = Number(amount) * (RATES[src] || 1);
    const converted = baseValue / (RATES[tgt] || 1);
    return Number(converted.toFixed(2));
};

/**
 * Single Source of Truth for Financial Calculations
 * 🔹 ENSURES LEGDER & DASHBOARD PARITY
 * 🔹 NOW SUPPORTS NATIVE CURRENCY CONVERSION
 */
const getFinancialStats = async (userId) => {
    try {
        const isMock = process.env.USE_MOCK === 'true';
        const uId = String(userId);
        
        let allInvoices = [];
        let allPayments = [];
        let defaultCurrency = 'INR';

        // 1. Fetch User Default Currency
        const user = await User.findById(uId);
        if (user && user.settings?.defaultCurrency) {
            defaultCurrency = user.settings.defaultCurrency;
        }

        if (isMock) {
            if (mockDb._debug_storage) {
                const storage = mockDb._debug_storage;
                allInvoices = JSON.parse(JSON.stringify(storage.invoices || []));
                allPayments = JSON.parse(JSON.stringify(storage.payments || []));
                const clients = storage.clients || [];

                allInvoices.forEach(inv => {
                    if (inv.clientId && typeof inv.clientId === 'string') {
                        inv.clientId = clients.find(c => String(c._id) === String(inv.clientId)) || { name: 'Demo Client' };
                    }
                });

                allPayments.forEach(p => {
                    if (p.invoiceId && typeof p.invoiceId === 'string') {
                        const parentInv = allInvoices.find(inv => String(inv._id) === String(p.invoiceId));
                        if (parentInv) {
                            p.invoiceId = parentInv;
                        }
                    }
                });
            }
        } else {
            allInvoices = await Invoice.find({ userId: uId }).populate('clientId');
            const rawPayments = await Payment.find({}).populate({
                path: 'invoiceId',
                populate: { path: 'clientId' }
            });
            allPayments = rawPayments.filter(p => p.invoiceId && String(p.invoiceId.userId) === uId);
        }

        // 🔹 CALCULATION ENGINE (WITH NATIVE CONVERSION)
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // A. Earned This Month (TOTAL CONVERTED TO DEFAULT CURRENCY)
        const earnedThisMonth = allPayments
            .filter(p => {
                const pDate = new Date(p.date || p.createdAt || now);
                return pDate >= startOfMonth;
            })
            .reduce((sum, p) => {
                // Payments use the currency of their parent invoice
                const pCurrency = p.invoiceId?.currency || 'INR';
                const nativeValue = convert(p.amount, pCurrency, defaultCurrency);
                return sum + nativeValue;
            }, 0);

        // B. Expected Income (TOTAL CONVERTED)
        const expectedIncome = allInvoices.reduce((sum, i) => {
            const nativeValue = convert(i.totalAmount, i.currency, defaultCurrency);
            return sum + nativeValue;
        }, 0);
        
        // C. Pending Amount (TOTAL CONVERTED)
        const pendingAmount = allInvoices.reduce((sum, i) => {
            const unpaidOriginal = Number(i.totalAmount) - (Number(i.paidAmount) || 0);
            const nativeValue = convert(Math.max(0, unpaidOriginal), i.currency, defaultCurrency);
            return sum + nativeValue;
        }, 0);

        return {
            earnedThisMonth: Number(earnedThisMonth.toFixed(2)),
            pendingAmount: Number(pendingAmount.toFixed(2)),
            expectedIncome: Number(expectedIncome.toFixed(2)),
            defaultCurrency,
            allInvoices,
            allPayments
        };
    } catch (error) {
        console.error('[FINANCE SERVICE ERROR]', error);
        throw error;
    }
};

module.exports = {
    getFinancialStats
};

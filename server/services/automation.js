const cron = require('node-cron');
const InvoiceOriginal = require('../models/Invoice');
const mockDb = require('../mockDb');
const { sendReminderEmail, sendFreelancerAlert } = require('./emailService');

const Invoice = process.env.USE_MOCK === 'true' ? mockDb.Invoice : InvoiceOriginal;

const simulateTelegram = (username, message) => {
  console.log(`[TELEGRAM SIMULATED] @${username}: ${message}`);
};

/**
 * 🔹 ROBUST DATE DELTA HELPER
 * Ensures timezone variations don't break the reminder window.
 */
const getDaysDiff = (date1, date2) => {
    const d1 = new Date(date1);
    d1.setHours(0,0,0,0);
    const d2 = new Date(date2);
    d2.setHours(0,0,0,0);
    const diffTime = d1 - d2;
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

const runReminders = async () => {
    console.log('[AUTOMATION] 🚀 Executing Daily Multi-Stage Reminder Engine...');
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const invoices = await Invoice.find({
        status: { $in: ['pending', 'partial', 'overdue'] }
      }).populate('clientId userId');

      console.log(`[AUTOMATION] Processing ${invoices.length} active invoices.`);

      for (const invoice of invoices) {
        const user = invoice.userId;
        const client = invoice.clientId;
        if (!user || !client) continue;

        // 🔹 Calculating Delta (Standardized)
        const diffDays = getDaysDiff(today, invoice.dueDate);

        let stage = null;
        let notifyFreelancer = false;

        // 🟢 STAGE 1: 1 Day To Go (Primary Requirement)
        if (diffDays === -1) {
          stage = 'upcoming';
        } 
        // 🟡 STAGE 2: Due Today
        else if (diffDays === 0) {
          stage = 'due';
        } 
        // 🔴 STAGE 3: Overdue (Day 1 and repeating every 2 days)
        else if (diffDays > 0) {
          // A. Mark as overdue if not already
          if (invoice.status !== 'overdue') {
            invoice.status = 'overdue';
            await invoice.save();
          }

          // B. Trigger Logic (Day 1 OR Even Days)
          if (diffDays === 1 || diffDays % 2 === 0) {
            stage = 'overdue';
            notifyFreelancer = true;
          }
        }

        // 🔹 DISPATCH
        if (stage || notifyFreelancer) {
          const amountRemaining = Number(invoice.totalAmount) - Number(invoice.paidAmount || 0);
          if (amountRemaining <= 0) continue; 
          
          const paymentLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pay/${invoice._id}`;

          // A. Notify Client
          if (stage && (user.settings?.emailReminders || process.env.USE_MOCK === 'true')) {
            console.log(`[AUTOMATION] 📨 Client Email Dispatched: ${client.email} | Target: ${client.name} | Stage: ${stage}`);
            await sendReminderEmail(client.email, client.name, amountRemaining, invoice.dueDate, stage, paymentLink);
          }

          // B. Notify Freelancer
          if (notifyFreelancer && (user.settings?.emailReminders || process.env.USE_MOCK === 'true')) {
            console.log(`[AUTOMATION] 🔔 Freelancer Alert Dispatched: ${user.email || process.env.EMAIL_USER} | Status: ${stage || 'Overdue'}`);
            await sendFreelancerAlert(user.email || process.env.EMAIL_USER, client.name, amountRemaining, stage || 'overdue');
          }

          // C. Telegram
          if (user.settings?.telegramNotifications && user.settings?.telegramUsername) {
            simulateTelegram(user.settings.telegramUsername, `₹${amountRemaining.toLocaleString()} ${stage || 'Overdue'} alert for ${client.name}`);
          }
        }
      }
      return { success: true, count: invoices.length };
    } catch (error) {
      console.error('[AUTOMATION CRITICAL ERROR]', error);
      throw error;
    }
};

const initCron = () => {
  // Run every day at 9 AM
  cron.schedule('0 9 * * *', runReminders);
};

module.exports = { initCron, runReminders };

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendInvoiceEmail = async (email, invoiceId, clientName, amount, paymentLink) => {
  const mailOptions = {
    from: `"FREEOS Financial" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Invoice from FREEOS - Ref: #${invoiceId.slice(-6).toUpperCase()}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
        <h2 style="color: #4f46e5;">Invoice Generated</h2>
        <p>Hi <b>${clientName}</b>,</p>
        <p>A new invoice has been generated for your recent project.</p>
        <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase;">Amount Due</p>
            <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: 900;">₹${amount.toLocaleString()}</p>
        </div>
        <a href="${paymentLink}" style="display: inline-block; background: #000; color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Pay Now</a>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 30px;">Ref: ${invoiceId}</p>
      </div>
    `
  };
  return transporter.sendMail(mailOptions);
};

const sendReminderEmail = async (email, clientName, amount, dueDate, stage, paymentLink) => {
  const subjects = {
    upcoming: 'Reminder: Payment Due Tomorrow',
    due: 'Action Required: Payment Due Today',
    followup: 'Friendly Follow-up: Invoice Balance',
    overdue: 'URGENT: Your Payment is Overdue'
  };

  const mailOptions = {
    from: `"FREEOS Financial" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subjects[stage] || 'Payment Reminder',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
        <h2 style="color: #4f46e5;">Payment ${stage === 'upcoming' ? 'Upcoming' : 'Reminder'}</h2>
        <p>Hi <b>${clientName}</b>,</p>
        <p>This is a reminder regarding your outstanding balance of <b>₹${amount.toLocaleString()}</b>.</p>
        <p>Due Date: ${new Date(dueDate).toLocaleDateString()}</p>
        <a href="${paymentLink}" style="display: inline-block; background: #4f46e5; color: #fff; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px;">Submit Payment</a>
      </div>
    `
  };
  return transporter.sendMail(mailOptions);
};

/**
 * 🔹 FREELANCER ALERT
 * Notifies the freelancer (user) specifically when clients miss payments.
 */
const sendFreelancerAlert = async (freelancerEmail, clientName, amount, stage) => {
  const mailOptions = {
    from: `"FREEOS Automation" <${process.env.EMAIL_USER}>`,
    to: freelancerEmail,
    subject: `[ALERT] ${clientName} - Invoice is ${stage.toUpperCase()}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
        <h2 style="color: #ef4444;">Status Alert: ${stage.toUpperCase()}</h2>
        <p>Your invoice for <b>${clientName}</b> is now at the <b>${stage}</b> stage.</p>
        <div style="background: #fff1f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">Outstanding Amount: ₹${amount.toLocaleString()}</p>
        </div>
        <p>The client has been notified, but you may want to follow up manually.</p>
      </div>
    `
  };
  return transporter.sendMail(mailOptions);
};

const sendAgreementEmail = async (email, clientName, title, content) => {
  const mailOptions = {
    from: `"FREEOS Agreements" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Contract Review: ${title}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
        <h2 style="color: #4f46e5;">Agreement for Review</h2>
        <p>Hi <b>${clientName}</b>,</p>
        <p>A new project agreement has been prepared for your review and signature.</p>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; margin: 25px 0; font-family: 'Courier New', Courier, monospace; color: #334155; line-height: 1.6;">
            <p style="margin: 0; font-weight: bold; border-bottom: 2px solid #cbd5e1; padding-bottom: 10px; margin-bottom: 15px; color: #1e293b;">${title.toUpperCase()}</p>
            <div style="white-space: pre-wrap;">${content}</div>
        </div>

        <p>Please review the terms above. If everything is in order, you can proceed with the project commencement.</p>
        <div style="margin-top: 30px; border-top: 1px solid #eee; pt: 20px; font-size: 11px; color: #94a3b8;">
            <p>This is an automated delivery from FREEOS Financial Command Centre.</p>
        </div>
      </div>
    `
  };
  return transporter.sendMail(mailOptions);
};

const sendReceiptEmail = async (email, clientName, amountPaid, balanceRemaining, invoiceId) => {
  const mailOptions = {
    from: `"FREEOS Financial" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Payment Confirmation: Ref #${invoiceId.slice(-6).toUpperCase()}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; background: #ecfdf5; color: #059669; padding: 10px 20px; border-radius: 50px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Payment Successful</div>
        </div>
        <h2 style="color: #4f46e5; text-align: center;">Transaction Confirmed</h2>
        <p>Hi <b>${clientName}</b>,</p>
        <p>We have successfully received your payment for <b>Invoice #${invoiceId.slice(-6).toUpperCase()}</b>.</p>
        
        <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin: 25px 0;">
            <table style="width: 100%;">
                <tr>
                    <td style="color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: bold; padding-bottom: 5px;">Amount Collected</td>
                    <td style="text-align: right; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: bold; padding-bottom: 5px;">Remaining Balance</td>
                </tr>
                <tr>
                    <td style="font-size: 24px; font-weight: 900; color: #059669;">₹${amountPaid.toLocaleString()}</td>
                    <td style="text-align: right; font-size: 24px; font-weight: 900; color: #1e293b;">₹${balanceRemaining.toLocaleString()}</td>
                </tr>
            </table>
        </div>

        <p style="color: #94a3b8; font-size: 12px; margin-top: 30px;">Reference: ${invoiceId}</p>
        <p style="color: #94a3b8; font-size: 12px;">This is an automated confirmation from FREEOS Financial Command Centre.</p>
      </div>
    `
  };
  return transporter.sendMail(mailOptions);
};

const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: `"FREEOS Financial" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL SENT] To: ${to} | Subject: ${subject}`);
    return true;
  } catch (error) {
    console.error('[EMAIL ERROR]', error);
    return false;
  }
};

const templates = {
    monthlySummary: (monthName, invoices, totals) => ({
        subject: `Financial Summary - ${monthName}`,
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
                <h2 style="color: #4f46e5;">Monthly Summary: ${monthName}</h2>
                <div style="display: flex; gap: 10px; margin: 20px 0;">
                    <div style="flex: 1; background: #ecfdf5; padding: 15px; border-radius: 8px;">
                        <p style="margin: 0; font-size: 10px; color: #059669; font-weight: bold;">EARNED</p>
                        <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: 900;">₹${totals.earned.toLocaleString()}</p>
                    </div>
                </div>
                <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                    <tr style="background: #f8fafc; text-align: left;">
                        <th style="padding: 10px; font-size: 12px;">Client</th>
                        <th style="padding: 10px; font-size: 12px;">Total</th>
                        <th style="padding: 10px; font-size: 12px;">Status</th>
                    </tr>
                    ${invoices.map(inv => `
                        <tr style="border-bottom: 1px solid #eee;">
                            <td style="padding: 10px; font-size: 13px;">${inv.clientName}</td>
                            <td style="padding: 10px; font-size: 13px;">₹${inv.total.toLocaleString()}</td>
                            <td style="padding: 10px; font-size: 11px; font-weight: bold;">${inv.status.toUpperCase()}</td>
                        </tr>
                    `).join('')}
                </table>
                <p style="color: #94a3b8; font-size: 11px; margin-top: 30px;">This is an automated performance report from FREEOS.</p>
            </div>
        `
    })
};

module.exports = { 
    sendInvoiceEmail, 
    sendReminderEmail, 
    sendFreelancerAlert,
    sendAgreementEmail,
    sendReceiptEmail,
    sendEmail,
    templates
};

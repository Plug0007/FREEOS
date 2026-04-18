const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  dueDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'overdue'],
    default: 'pending'
  },
  reminderOverrides: {
    upcomingDays: Number,
    followUpDays: Number,
    overdueDays: Number
  },
  split: {
    type: String,
    enum: ['Full', '50/50', 'Custom'],
    default: '50/50'
  }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', InvoiceSchema);

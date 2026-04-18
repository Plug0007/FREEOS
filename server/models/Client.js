const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  project: {
    type: String,
    default: ''
  },
  paymentTerms: {
    type: String,
    enum: ['Full', '50/50', 'Custom'],
    default: '50/50'
  }
}, { timestamps: true });

module.exports = mongoose.model('Client', ClientSchema);

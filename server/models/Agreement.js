const mongoose = require('mongoose');

const AgreementSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  templateType: { type: String, enum: ['basic', 'milestone'], default: 'basic' },
  status: { type: String, enum: ['draft', 'sent', 'signed'], default: 'draft' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Agreement', AgreementSchema);

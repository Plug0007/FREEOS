const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  settings: {
    businessName: { type: String, default: '' },
    upiId: { type: String, default: '' },
    bankDetails: { type: String, default: '' },
    telegramUsername: { type: String, default: '' },
    emailReminders: { type: Boolean, default: true },
    telegramNotifications: { type: Boolean, default: false },
    telegramUsername: String,
    reminderSettings: {
      upcomingDays: { type: Number, default: 1 },
      followUpDays: { type: Number, default: 2 },
      overdueDays: { type: Number, default: 5 }
    },
    defaultCurrency: { type: String, default: 'INR' }
  }
}, { timestamps: true });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);

const express = require('express');
const router = express.Router();
const UserOriginal = require('../models/User');
const mockDb = require('../mockDb');
const User = process.env.USE_MOCK === 'true' ? mockDb.User : UserOriginal;
const auth = require('../middleware/auth');

// Get settings
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json(user.settings || {});
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update settings
router.post('/', auth, async (req, res) => {
  try {
    const { settings } = req.body;
    const user = await User.findById(req.userId);
    user.settings = { ...user.settings, ...settings };
    await user.save();
    res.json(user.settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

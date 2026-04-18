const express = require('express');
const router = express.Router();
const ClientOriginal = require('../models/Client');
const mockDb = require('../mockDb');
const Client = process.env.USE_MOCK === 'true' ? mockDb.Client : ClientOriginal;
const auth = require('../middleware/auth');
const { parseChat } = require('../services/importService');

// Import from chat
router.post('/import', auth, async (req, res) => {
  try {
    const { chatText } = req.body;
    const extractedData = parseChat(chatText);
    res.json(extractedData);
  } catch (error) {
    res.status(500).json({ message: 'Import failed' });
  }
});

// Get all clients for user
router.get('/', auth, async (req, res) => {
  try {
    const clients = await Client.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add client
router.post('/', auth, async (req, res) => {
  try {
    const { name, email, project, paymentTerms, budget, chatHistory } = req.body;
    console.log('[CLIENT DEBUG] Creating client for user:', req.userId);
    console.log('[CLIENT DEBUG] Payload:', { name, email, project });

    const client = new Client({
      userId: req.userId,
      name,
      email,
      project,
      paymentTerms,
      budget: Number(budget) || 0,
      chatHistory: chatHistory || []
    });

    console.log('[CLIENT DEBUG] Attempting save...');
    await client.save();
    console.log('[CLIENT DEBUG] Save successful!');
    res.status(201).json(client);
  } catch (error) {
    console.error('[CLIENT CREATE ERROR] Fatal Exception:', error.message);
    console.error('[CLIENT CREATE ERROR] Stack:', error.stack);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
});

module.exports = router;

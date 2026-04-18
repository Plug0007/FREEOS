const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const UserOriginal = require('../models/User');
const mockDb = require('../mockDb');
const { getAllJobs } = require('../services/jobService');
const { calculateMatchScore, calculateTrustScore } = require('../services/scoringService');

const User = process.env.USE_MOCK === 'true' ? mockDb.User : UserOriginal;

// GET /jobs - Fetch, score, and sort jobs
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const rawJobs = await getAllJobs();
    
    // Apply scoring
    const scoredJobs = rawJobs.map(job => {
      const match = calculateMatchScore(job, user);
      const trust = calculateTrustScore(job);
      return {
        ...job,
        matchScore: match.score,
        explanation: match.explanation,
        trustScore: trust.score,
        trustReasons: trust.reasons
      };
    });

    // Sort by matchScore descending
    scoredJobs.sort((a, b) => b.matchScore - a.matchScore);

    res.json(scoredJobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;

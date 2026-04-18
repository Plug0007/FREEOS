const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // 🔹 Extract Token
  const authHeader = req.header('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

  // 🔹 UNIVERSAL MOCK BYPASS (Hardened for Demo)
  // Check if we are in mock mode - use loose check for safety
  const isMockMode = String(process.env.USE_MOCK).trim() === 'true';

  if (isMockMode) {
    if (!token || token === 'mock-token' || token === 'null' || token === 'undefined') {
      req.userId = 'seed-user-1';
      return next();
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    // 🔹 MOCK FALLBACK: If token is invalid but we are in mock mode, proceed as seed user
    if (isMockMode) {
      req.userId = 'seed-user-1';
      return next();
    }
    return res.status(401).json({ message: 'Token is not valid' });
  }
};

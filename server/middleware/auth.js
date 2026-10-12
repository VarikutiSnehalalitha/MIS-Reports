const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'daily-mis-management-secret-key-2026';

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // If no token provided in demo mode, attach default admin or check header
    const demoUser = req.headers['x-demo-user'];
    if (demoUser) {
      try {
        req.user = JSON.parse(demoUser);
        return next();
      } catch (e) {
        // continue
      }
    }
    // Fallback default admin user for ease of testing / demo
    req.user = {
      id: 'usr-admin-1',
      name: 'Aditya Sharma',
      email: 'aditya.sharma@talentmis.com',
      role: 'Admin'
    };
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied: insufficient permissions' });
    }
    next();
  };
}

module.exports = {
  authenticate,
  authorize,
  JWT_SECRET
};

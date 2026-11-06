const jwt = require('jsonwebtoken');
const config = require('../config');
const { unauthorized } = require('../lib/errors');

module.exports = function adminAuth(req, _res, next) {
  try {
    const payload = jwt.verify(req.cookies?.playspot_admin || '', config.jwtSecret, {
      algorithms: ['HS256'],
    });
    if (payload.role !== 'admin') throw new Error('Invalid role');
    req.admin = { id: Number(payload.sub), email: payload.email };
    return next();
  } catch {
    return next(unauthorized('Please sign in to continue'));
  }
};

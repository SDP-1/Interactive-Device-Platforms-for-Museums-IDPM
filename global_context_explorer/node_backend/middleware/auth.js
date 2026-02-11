const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');

/**
 * Protect routes – require valid JWT
 */
const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorised – no token' });
    }

    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = await User.findById(decoded.id).select('-passwordHash');
        if (!req.user || !req.user.isActive) {
            return res.status(401).json({ message: 'User not found or inactive' });
        }
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token is invalid' });
    }
};

/**
 * Restrict to specific roles
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res
                .status(403)
                .json({ message: `Role '${req.user.role}' is not authorised` });
        }
        next();
    };
};

module.exports = { protect, authorize };

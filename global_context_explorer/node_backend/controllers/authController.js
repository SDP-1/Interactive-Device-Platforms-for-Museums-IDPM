const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');

const signToken = (id) =>
    jwt.sign({ id }, config.jwtSecret, { expiresIn: config.jwtExpire });

// POST /api/auth/register
exports.register = async (req, res) => {
    try {
        const { email, password, name, role } = req.body;

        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(400).json({ message: 'Email already in use' });
        }

        const user = await User.create({
            email,
            passwordHash: password,
            name,
            role: role || 'viewer',
        });

        const token = signToken(user._id);
        res.status(201).json({
            token,
            user: { id: user._id, email: user.email, name: user.name, role: user.role },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/auth/login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ message: 'Email and password required' });

        const user = await User.findOne({ email }).select('+passwordHash');
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const isMatch = await user.matchPassword(password);
        if (!isMatch)
            return res.status(401).json({ message: 'Invalid credentials' });

        user.lastLogin = Date.now();
        await user.save({ validateModifiedOnly: true });

        const token = signToken(user._id);
        res.json({
            token,
            user: { id: user._id, email: user.email, name: user.name, role: user.role },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
    res.json({ user: req.user });
};

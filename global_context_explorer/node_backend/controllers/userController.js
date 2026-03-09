const User = require('../models/User');

// GET /api/users
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().sort('-createdAt');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/users
exports.createUser = async (req, res) => {
    try {
        const { email, password, name, role } = req.body;
        const exists = await User.findOne({ email });
        if (exists) return res.status(400).json({ message: 'Email already in use' });

        const user = await User.create({
            email,
            passwordHash: password,
            name,
            role: role || 'viewer',
        });
        res.status(201).json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PUT /api/users/:id
exports.updateUser = async (req, res) => {
    try {
        const updates = { ...req.body };
        if (updates.password) {
            updates.passwordHash = updates.password;
            delete updates.password;
        }
        const user = await User.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true,
        });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

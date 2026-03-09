const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        passwordHash: {
            type: String,
            required: [true, 'Password is required'],
            select: false,
        },
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        role: {
            type: String,
            enum: ['admin', 'curator', 'viewer'],
            default: 'viewer',
        },
        avatar: { type: String, default: '' },
        isActive: { type: Boolean, default: true },
        lastLogin: { type: Date },
    },
    { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function (next) {
    if (!this.isModified('passwordHash')) return next();
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
});

// Compare password
userSchema.methods.matchPassword = async function (entered) {
    return bcrypt.compare(entered, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);

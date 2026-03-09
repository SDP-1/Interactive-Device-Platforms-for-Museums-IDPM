const mongoose = require('mongoose');

const citySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'City name is required'],
            unique: true,
            trim: true,
        },
        sinhalaName: { type: String, default: '' },
        tamilName: { type: String, default: '' },
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        svgPathId: {
            type: String,
            default: '',
            trim: true,
        },
        description: { type: String, default: '' },
        isActive: { type: Boolean, default: true },
        coverImage: { type: String, default: '' },
        province: { type: String, default: '' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('City', citySchema);

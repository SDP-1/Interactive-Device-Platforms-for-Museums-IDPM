const mongoose = require('mongoose');

const districtMuseumSchema = new mongoose.Schema(
    {
        districtSlug: {
            type: String,
            required: [true, 'District slug is required'],
            trim: true,
            lowercase: true,
            index: true,
        },
        districtName: {
            type: String,
            required: [true, 'District name is required'],
            trim: true,
        },
        museumName: {
            type: String,
            required: [true, 'Museum name is required'],
            trim: true,
        },
        imageUrl: {
            type: String,
            required: [true, 'Museum image URL is required'],
            trim: true,
        },
        sortOrder: {
            type: Number,
            default: 0,
        },
        description: {
            type: String,
            default: '',
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

districtMuseumSchema.index({ districtSlug: 1, sortOrder: 1 });

module.exports = mongoose.model('DistrictMuseum', districtMuseumSchema);
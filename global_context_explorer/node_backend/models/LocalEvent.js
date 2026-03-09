const mongoose = require('mongoose');

const localEventSchema = new mongoose.Schema(
    {
        cityId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'City',
            required: [true, 'City is required'],
            index: true,
        },
        nodeId: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
        },
        eventName: {
            type: String,
            required: [true, 'Event name is required'],
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true
        },
        wikiUrl: { type: String, default: '' },
        descriptionShort: { type: String, default: '' },
        descriptionFull: { type: String, default: '' },
        date: {
            type: String,
            required: [true, 'Date is required'],
            trim: true
        },
        dateNumeric: { type: Number, default: 0, index: true },
        location: { type: String, default: '' },
        purpose: { type: String, default: '' },
        exhibitName: { type: String, default: '' },
        imageUrl: { type: String, default: '' },
        sourceCount: { type: Number, default: 0 },
        maxSourcesRequired: { type: Number, default: 0 },
        sourceReferences: { type: String, default: '' },
        noGlobalInfluence: { type: Boolean, default: false },
        referenceLinks: [
            {
                title: { type: String, default: '' },
                url: { type: String, default: '' },
            },
        ],
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    { timestamps: true }
);

// Compound index for timeline queries
localEventSchema.index({ cityId: 1, dateNumeric: 1 });

module.exports = mongoose.model('LocalEvent', localEventSchema);

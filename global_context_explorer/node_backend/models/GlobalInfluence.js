const mongoose = require('mongoose');

const globalInfluenceSchema = new mongoose.Schema(
    {
        localEventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'LocalEvent',
            required: true,
            index: true,
        },
        globalEventName: { type: String, required: true },
        globalEventDate: { type: String, default: '' },
        globalEventLocation: { type: String, default: '' },
        globalEventDescription: { type: String, default: '' },
        globalEventDescriptionShort: { type: String, default: '' },
        globalEventDescriptionFull: { type: String, default: '' },
        causalStrength: { type: Number, default: 0 },
        reliabilityScore: { type: Number, default: 0 },
        finalScore: { type: Number, default: 0 },
        mechanism: { type: String, default: '' },
        influenceType: {
            type: String,
            enum: ['direct', 'indirect'],
            default: 'indirect',
        },
        reliabilityComponents: {
            directness: { type: Number, default: 0 },
            sourceConsistency: { type: Number, default: 0 },
            temporalProximity: { type: Number, default: 0 },
        },
        explanationPaths: { type: Array, default: [] },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending',
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        reviewedAt: { type: Date },
        rejectionReason: { type: String, default: '' },
        rawPipelineOutput: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
);

// Compound index to quickly fetch non-rejected influences for an event
globalInfluenceSchema.index({ localEventId: 1, status: 1 });

module.exports = mongoose.model('GlobalInfluence', globalInfluenceSchema);

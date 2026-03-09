const GlobalInfluence = require('../models/GlobalInfluence');
const LocalEvent = require('../models/LocalEvent');
const { runPipeline } = require('../services/mlBridge');

// POST /api/influences/analyze/:eventId  — run the ML pipeline
exports.analyzeEvent = async (req, res) => {
    try {
        const event = await LocalEvent.findById(req.params.eventId);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        if (event.noGlobalInfluence) {
            return res.status(400).json({ message: 'Global influence analysis is disabled for this event by curator.' });
        }

        // Run the Python ML pipeline
        const pipelineResult = await runPipeline({
            input: event.eventName,
            date: event.date || undefined,
            location: event.location || undefined,
            topK: 10,
        });

        if (pipelineResult.error) {
            return res.status(400).json({ message: pipelineResult.error });
        }

        // Update LocalEvent with improved descriptions and discovery references
        if (pipelineResult.local_event?.data) {
            const leData = pipelineResult.local_event.data;
            const wikiPages = pipelineResult.evidence_summary?.wikipedia_pages || [];

            await LocalEvent.findByIdAndUpdate(event._id, {
                descriptionShort: leData.description_short || '',
                descriptionFull: leData.description_full || leData.description || '',
                referenceLinks: wikiPages.map(p => ({ title: p.title, url: p.url })),
            });
        }

        // Get previously rejected influence names for this event (to skip)
        const rejected = await GlobalInfluence.find({
            localEventId: event._id,
            status: 'rejected',
        }).select('globalEventName');
        const rejectedNames = new Set(
            rejected.map((r) => r.globalEventName.toLowerCase())
        );

        // Return suggested influences without saving them to DB
        const influences = [];
        for (const inf of pipelineResult.top_influences || []) {
            const name = inf.global_event?.name || '';
            if (rejectedNames.has(name.toLowerCase())) continue;

            // We don't save yet, just return the data structure
            influences.push({
                globalEventName: name,
                globalEventDate: inf.global_event?.date || '',
                globalEventLocation: inf.global_event?.location || '',
                globalEventDescription: inf.global_event?.description || '',
                globalEventDescriptionShort: inf.global_event?.description_short || '',
                globalEventDescriptionFull: inf.global_event?.description_full || '',
                causalStrength: inf.causal_strength || 0,
                reliabilityScore: inf.reliability_score || 0,
                finalScore: inf.final_score || 0,
                mechanism: inf.mechanism || '',
                influenceType: inf.influence_type || 'indirect',
                reliabilityComponents: {
                    directness: inf.reliability_components?.directness || 0,
                    sourceConsistency: inf.reliability_components?.source_consistency || 0,
                    temporalProximity: inf.reliability_components?.temporal_proximity || 0,
                },
                explanationPaths: inf.explanation_paths || [],
                status: 'suggested', // Custom status for frontend handling
                rawPipelineOutput: inf,
            });
        }

        const updatedEvent = await LocalEvent.findById(event._id);

        res.json({
            eventId: event._id,
            eventName: event.eventName,
            event: updatedEvent,
            statistics: pipelineResult.statistics || {},
            influences,
        });
    } catch (err) {
        console.error('[ML Bridge Error]', err.message);
        res.status(500).json({ message: err.message });
    }
};

// GET /api/influences  — query: eventId, status
exports.getInfluences = async (req, res) => {
    try {
        const { eventId, status } = req.query;
        const filter = {};
        if (eventId) filter.localEventId = eventId;
        if (status) {
            if (status.includes(',')) {
                filter.status = { $in: status.split(',') };
            } else {
                filter.status = status;
            }
        }
        const influences = await GlobalInfluence.find(filter)
            .populate('localEventId', 'eventName')
            .sort('-finalScore');
        res.json(influences);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST or PUT /api/influences/accept
exports.acceptInfluence = async (req, res) => {
    try {
        const { id } = req.params;
        let influence;

        if (id && id !== 'undefined') {
            // Updating existing record
            influence = await GlobalInfluence.findByIdAndUpdate(
                id,
                {
                    status: 'accepted',
                    reviewedBy: req.user?._id,
                    reviewedAt: new Date(),
                },
                { new: true }
            );
        } else {
            // Creating new accepted record from suggested data
            const data = { ...req.body, status: 'accepted' };
            if (req.user) {
                data.reviewedBy = req.user._id;
                data.reviewedAt = new Date();
            }
            influence = await GlobalInfluence.create(data);
        }

        if (!influence)
            return res.status(404).json({ message: 'Influence not found' });
        res.json(influence);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST or PUT /api/influences/reject
exports.rejectInfluence = async (req, res) => {
    try {
        const { id } = req.params;
        let influence;

        if (id && id !== 'undefined') {
            influence = await GlobalInfluence.findByIdAndUpdate(
                id,
                {
                    status: 'rejected',
                    reviewedBy: req.user?._id,
                    reviewedAt: new Date(),
                    rejectionReason: req.body.reason || '',
                },
                { new: true }
            );
        } else {
            // Save as rejected to prevent future suggestions
            const data = {
                ...req.body,
                status: 'rejected',
                rejectionReason: req.body.reason || '',
            };
            if (req.user) {
                data.reviewedBy = req.user._id;
                data.reviewedAt = new Date();
            }
            influence = await GlobalInfluence.create(data);
        }

        if (!influence)
            return res.status(404).json({ message: 'Influence not found' });
        res.json(influence);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

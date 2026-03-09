const LocalEvent = require('../models/LocalEvent');
const GlobalInfluence = require('../models/GlobalInfluence');

// GET /api/events  — query: cityId, yearStart, yearEnd, page, limit
exports.getEvents = async (req, res) => {
    try {
        const { cityId, yearStart, yearEnd, search, page = 1, limit = 10 } = req.query;
        const filter = {};

        if (cityId && cityId !== 'all' && cityId !== 'undefined') {
            filter.cityId = cityId;
        }

        if (search) {
            const searchRegex = new RegExp(search, 'i');
            filter.$or = [
                { eventName: searchRegex },
                { description: searchRegex }
            ];
        }

        if (yearStart || yearEnd) {
            filter.dateNumeric = {};
            if (yearStart) filter.dateNumeric.$gte = Number(yearStart);
            if (yearEnd) filter.dateNumeric.$lte = Number(yearEnd);
        }

        const skip = (Number(page) - 1) * Number(limit);

        const totalCount = await LocalEvent.countDocuments(filter);
        const events = await LocalEvent.find(filter)
            .populate('cityId', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        res.json({
            events,
            totalCount,
            page: Number(page),
            pages: Math.ceil(totalCount / Number(limit))
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/events/:id  — includes accepted influences
exports.getEvent = async (req, res) => {
    try {
        const event = await LocalEvent.findById(req.params.id).populate(
            'cityId',
            'name'
        );
        if (!event) return res.status(404).json({ message: 'Event not found' });

        const influences = await GlobalInfluence.find({
            localEventId: event._id,
            status: 'accepted',
        });

        res.json({ event, influences });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/events
exports.createEvent = async (req, res) => {
    try {
        const data = { ...req.body };
        if (req.user) data.createdBy = req.user._id;

        // Backend safety: Check for duplicate again before creating
        if (data.eventName && !data.bypassDuplicateCheck) {
            const trimmedName = data.eventName.trim();
            const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const existing = await LocalEvent.findOne({
                eventName: { $regex: new RegExp(`^${escapedName}$`, 'i') }
            });
            if (existing) {
                console.log(`[EventController] Blocking duplicate creation: "${trimmedName}"`);
                return res.status(400).json({
                    message: `An event named "${trimmedName}" already exists.`,
                    isDuplicate: true
                });
            }
        }

        // Auto-generate nodeId if not provided
        if (!data.nodeId) {
            const lastEvent = await LocalEvent.findOne().sort({ nodeId: -1 });
            let nextNum = 1;
            if (lastEvent && lastEvent.nodeId && lastEvent.nodeId.startsWith('LOC_')) {
                const lastNum = parseInt(lastEvent.nodeId.replace('LOC_', ''), 10);
                if (!isNaN(lastNum)) {
                    nextNum = lastNum + 1;
                }
            }
            data.nodeId = `LOC_${String(nextNum).padStart(3, '0')}`;
        }

        const event = await LocalEvent.create(data);
        console.log(`[EventController] Created event ${event.nodeId}, noGlobalInfluence: ${event.noGlobalInfluence}`);

        // SYNC WITH ML MODEL: Skip if noGlobalInfluence is true
        if (!event.noGlobalInfluence) {
            try {
                const { addEventToHistory } = require('../services/mlBridge');
                const syncResult = await addEventToHistory({
                    eventName: event.eventName,
                    date: event.date,
                    location: event.location,
                    description: event.description,
                    purpose: event.purpose,
                    exhibitName: event.exhibitName,
                    sources: event.wikiUrl ? `Wikipedia: ${event.wikiUrl}` : '',
                });

                if (syncResult.nodeId && syncResult.nodeId !== event.nodeId) {
                    console.log(`[EventController] Updating event nodeID from ${event.nodeId} to ${syncResult.nodeId}`);
                    await LocalEvent.findByIdAndUpdate(event._id, { nodeId: syncResult.nodeId });
                    event.nodeId = syncResult.nodeId; // Update the object we return to frontend
                }

                console.log(`[EventController] Successfully synced event ${event.nodeId} to ML CSV`);

                // TRIGGER BACKGROUND RETRAINING
                const { retrainModel } = require('../services/mlBridge');
                retrainModel().catch(err => console.error('[EventController] Retraining trigger failed:', err.message));

            } catch (syncErr) {
                console.error(`[EventController] Failed to sync event ${event.nodeId} to ML CSV:`, syncErr.message);
                // We don't fail the request if sync fails, but we log it.
            }
        } else {
            console.log(`[EventController] Skipping ML sync for event ${event.nodeId} (noGlobalInfluence=true)`);
        }

        res.status(201).json(event);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PUT /api/events/:id
exports.updateEvent = async (req, res) => {
    try {
        const event = await LocalEvent.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!event) return res.status(404).json({ message: 'Event not found' });
        res.json(event);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE /api/events/:id
exports.deleteEvent = async (req, res) => {
    try {
        const event = await LocalEvent.findByIdAndDelete(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        // Also remove related influences
        await GlobalInfluence.deleteMany({ localEventId: event._id });

        // Synchronize with ML history if it has a nodeId
        if (event.nodeId) {
            try {
                const { removeEventFromHistory, retrainModel } = require('../services/mlBridge');
                await removeEventFromHistory(event.nodeId);
                console.log(`[EventController] Synced deletion of ${event.nodeId} to ML history.`);

                // Trigger background retraining
                retrainModel().catch(err => console.error('[EventController] Retraining trigger failed:', err.message));
            } catch (syncErr) {
                console.error(`[EventController] Failed to sync deletion of ${event.nodeId} to ML history:`, syncErr.message);
            }
        }

        res.json({ message: 'Event and related influences deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
// GET /api/events/check-duplicate — query: name
exports.checkDuplicate = async (req, res) => {
    try {
        const { name } = req.query;
        if (!name) return res.status(400).json({ message: 'Name query parameter is required' });

        const trimmedName = name.trim();
        console.log(`[EventController] Checking duplicate for: "${trimmedName}"`);

        // Escape regex special characters to prevent errors
        const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const existingEvent = await LocalEvent.findOne({
            eventName: { $regex: new RegExp(`^${escapedName}$`, 'i') }
        });

        if (existingEvent) {
            console.log(`[EventController] Found duplicate: ${existingEvent.nodeId} - ${existingEvent.eventName}`);
        } else {
            console.log(`[EventController] No duplicate found for "${name}"`);
        }

        res.json({ exists: !!existingEvent, event: existingEvent });
    } catch (err) {
        console.error('[EventController] Duplicate check error:', err.message);
        res.status(500).json({ message: err.message });
    }
};

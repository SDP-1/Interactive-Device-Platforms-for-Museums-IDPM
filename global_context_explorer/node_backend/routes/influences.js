const router = require('express').Router();
const {
    analyzeEvent,
    getInfluences,
    acceptInfluence,
    rejectInfluence,
} = require('../controllers/influenceController');
const { protect, authorize } = require('../middleware/auth');

// All influence routes are protected
router.use(protect, authorize('admin', 'curator'));

router.post('/analyze/:eventId', analyzeEvent);
router.get('/', getInfluences);

router.post('/accept', acceptInfluence);
router.put('/:id/accept', acceptInfluence);

router.post('/reject', rejectInfluence);
router.put('/:id/reject', rejectInfluence);

module.exports = router;

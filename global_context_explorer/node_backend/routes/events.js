const router = require('express').Router();
const {
    getEvents,
    getEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    checkDuplicate,
} = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/auth');

// Public
router.get('/', getEvents);
router.get('/check-duplicate', protect, authorize('admin', 'curator'), checkDuplicate);
router.get('/:id', getEvent);

// Protected – admin / curator
router.post('/', protect, authorize('admin', 'curator'), createEvent);
router.put('/:id', protect, authorize('admin', 'curator'), updateEvent);
router.delete('/:id', protect, authorize('admin'), deleteEvent);

module.exports = router;

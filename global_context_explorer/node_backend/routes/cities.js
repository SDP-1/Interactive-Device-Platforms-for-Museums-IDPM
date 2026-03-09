const router = require('express').Router();
const {
    getCities,
    getCity,
    createCity,
    updateCity,
    deleteCity,
} = require('../controllers/cityController');
const { protect, authorize } = require('../middleware/auth');

// Public
router.get('/', getCities);
router.get('/:id', getCity);

// Protected – admin / curator
router.post('/', protect, authorize('admin', 'curator'), createCity);
router.put('/:id', protect, authorize('admin', 'curator'), updateCity);
router.delete('/:id', protect, authorize('admin'), deleteCity);

module.exports = router;

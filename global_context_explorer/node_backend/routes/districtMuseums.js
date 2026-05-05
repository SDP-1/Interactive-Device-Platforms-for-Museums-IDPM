const router = require('express').Router();
const { getDistrictMuseumsByDistrict } = require('../controllers/districtMuseumController');

router.get('/:districtSlug', getDistrictMuseumsByDistrict);

module.exports = router;
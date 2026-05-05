const DistrictMuseum = require('../models/DistrictMuseum');

const normalizeDistrictSlug = (value = '') => value.toString().toLowerCase().trim();

// GET /api/district-museums/:districtSlug
exports.getDistrictMuseumsByDistrict = async (req, res) => {
    try {
        const districtSlug = normalizeDistrictSlug(req.params.districtSlug);

        if (!districtSlug) {
            return res.status(400).json({ message: 'District slug is required' });
        }

        const museums = await DistrictMuseum.find({
            districtSlug,
            isActive: true,
        }).sort({ sortOrder: 1, museumName: 1 });

        res.json({
            districtSlug,
            museums,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
const City = require('../models/City');

// GET /api/cities
exports.getCities = async (req, res) => {
    try {
        const cities = await City.find().sort('name');
        res.json(cities);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// GET /api/cities/:id
exports.getCity = async (req, res) => {
    try {
        const city = await City.findById(req.params.id);
        if (!city) return res.status(404).json({ message: 'City not found' });
        res.json(city);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// POST /api/cities
exports.createCity = async (req, res) => {
    try {
        const city = await City.create(req.body);
        res.status(201).json(city);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// PUT /api/cities/:id
exports.updateCity = async (req, res) => {
    try {
        const city = await City.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!city) return res.status(404).json({ message: 'City not found' });
        res.json(city);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE /api/cities/:id
exports.deleteCity = async (req, res) => {
    try {
        const city = await City.findByIdAndDelete(req.params.id);
        if (!city) return res.status(404).json({ message: 'City not found' });
        res.json({ message: 'City deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

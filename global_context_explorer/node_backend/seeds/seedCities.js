/**
 * Seed script: populate cities collection with Sri Lankan cities.
 *
 * Usage:  node seeds/seedCities.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const City = require('../models/City');
const connectDB = require('../config/db');

const cities = [
    {
        name: 'Anuradhapura',
        sinhalaName: 'අනුරාධපුරය',
        tamilName: 'அனுராதபுரம்',
        latitude: 8.3114,
        longitude: 80.4037,
        svgPathId: 'anuradhapura',
        description:
            'Ancient capital of Sri Lanka, UNESCO World Heritage Site with sacred Buddhist ruins dating back to the 4th century BCE.',
        isActive: true,
        province: 'North Central',
    },
    {
        name: 'Colombo',
        sinhalaName: 'කොළඹ',
        tamilName: 'கொழும்பு',
        latitude: 6.9271,
        longitude: 79.8612,
        svgPathId: 'colombo',
        description:
            'Commercial capital and largest city, major colonial trade hub and administrative centre.',
        isActive: false,
        province: 'Western',
    },
    {
        name: 'Kandy',
        sinhalaName: 'මහනුවර',
        tamilName: 'கண்டி',
        latitude: 7.2906,
        longitude: 80.6337,
        svgPathId: 'kandy',
        description:
            'Last royal capital of Sri Lanka, home of the Temple of the Tooth Relic.',
        isActive: false,
        province: 'Central',
    },
    {
        name: 'Galle',
        sinhalaName: 'ගාල්ල',
        tamilName: 'காலி',
        latitude: 6.0535,
        longitude: 80.221,
        svgPathId: 'galle',
        description:
            'Southern port city with a UNESCO-listed Dutch Fort, key colonial maritime outpost.',
        isActive: false,
        province: 'Southern',
    },
    {
        name: 'Jaffna',
        sinhalaName: 'යාපනය',
        tamilName: 'யாழ்ப்பாணம்',
        latitude: 9.6615,
        longitude: 80.0255,
        svgPathId: 'jaffna',
        description:
            'Capital of the Northern Province, centre of Tamil cultural heritage and the medieval Jaffna Kingdom.',
        isActive: false,
        province: 'Northern',
    },
    {
        name: 'Trincomalee',
        sinhalaName: 'ත්‍රිකුණාමලය',
        tamilName: 'திருகோணமலை',
        latitude: 8.5874,
        longitude: 81.2152,
        svgPathId: 'trincomalee',
        description:
            'Major natural harbour on the east coast, strategic British naval base.',
        isActive: false,
        province: 'Eastern',
    },
    {
        name: 'Polonnaruwa',
        sinhalaName: 'පොළොන්නරුව',
        tamilName: 'பொலன்னறுவை',
        latitude: 7.9403,
        longitude: 81.0188,
        svgPathId: 'polonnaruwa',
        description:
            'Second ancient capital, UNESCO site with well-preserved ruins of the medieval kingdom.',
        isActive: false,
        province: 'North Central',
    },
    {
        name: 'Sigiriya',
        sinhalaName: 'සීගිරිය',
        tamilName: 'சிகிரியா',
        latitude: 7.957,
        longitude: 80.7603,
        svgPathId: 'sigiriya',
        description:
            'Ancient rock fortress and UNESCO World Heritage Site, 5th century palace.',
        isActive: false,
        province: 'Central',
    },
    {
        name: 'Mannar',
        sinhalaName: 'මන්නාරම',
        tamilName: 'மன்னார்',
        latitude: 8.9766,
        longitude: 79.9044,
        svgPathId: 'mannar',
        description:
            'Ancient port city (Mantai/Mahathitha) on the Indian Ocean trade route.',
        isActive: false,
        province: 'Northern',
    },
    {
        name: 'Nuwara Eliya',
        sinhalaName: 'නුවර එළිය',
        tamilName: 'நுவரெலியா',
        latitude: 6.9497,
        longitude: 80.7891,
        svgPathId: 'nuwaraeliya',
        description:
            'Hill-country tea capital, centre of the Ceylon plantation industry.',
        isActive: false,
        province: 'Central',
    },
];

async function seedCities() {
    await connectDB();
    console.log('[Seed] Clearing existing cities...');
    await City.deleteMany({});
    console.log('[Seed] Inserting cities...');
    const docs = await City.insertMany(cities);
    console.log(`[Seed] Inserted ${docs.length} cities.`);
    mongoose.connection.close();
}

seedCities().catch((err) => {
    console.error(err);
    process.exit(1);
});

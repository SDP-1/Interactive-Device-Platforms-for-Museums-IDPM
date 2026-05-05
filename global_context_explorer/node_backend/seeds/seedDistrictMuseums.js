/**
 * Seed script: populate district museums collection.
 *
 * Usage: node seeds/seedDistrictMuseums.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const DistrictMuseum = require('../models/DistrictMuseum');
const connectDB = require('../config/db');

const districtMuseums = [
    // Colombo District
    {
        districtSlug: 'colombo',
        districtName: 'Colombo District',
        museumName: 'Independence Memorial Hall',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d7/Independence_Commemoration_Hall.jpg',
        sortOrder: 1,
        description: 'National monument at Independence Square in Cinnamon Gardens.',
        isActive: true,
    },
    {
        districtSlug: 'colombo',
        districtName: 'Colombo District',
        museumName: 'Colombo National Museum',
        imageUrl: 'https://cdn.prod.rexby.com/image/b7107e35d19d4e4992f5020ee6c750f8?format=webp&width=1080&height=1350&quality=80',
        sortOrder: 2,
        description: "Sri Lanka's largest museum and major heritage collection in Colombo.",
        isActive: true,
    },
    {
        districtSlug: 'colombo',
        districtName: 'Colombo District',
        museumName: 'Dutch Period Museum',
        imageUrl: 'https://www.trawell.in/admin/images/upload/151111744Colombo_Dutch_Museum.jpg',
        sortOrder: 3,
        description: 'Museum showcasing artifacts from the Dutch colonial period in Sri Lanka.',
        isActive: true,
    },

    // Galle District
    {
        districtSlug: 'galle',
        districtName: 'Galle District',
        museumName: 'Galle National Museum',
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Galle_National_Museum_003.jpg',
        sortOrder: 1,
        description: 'National museum located inside the historic Dutch fort in Galle.',
        isActive: true,
    },
    {
        districtSlug: 'galle',
        districtName: 'Galle District',
        museumName: 'National Maritime Museum',
        imageUrl: 'https://ccf.gov.lk/wp-content/uploads/2025/10/gm2-scaled.jpg',
        sortOrder: 2,
        description: 'Maritime heritage museum focused on the southern coastal history of Sri Lanka.',
        isActive: true,
    },

    // Hambantota District
    {
        districtSlug: 'hambantota',
        districtName: 'Hambantota District',
        museumName: 'Magampura Ruhunu Heritage Museum',
        imageUrl: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/15/f9/95/fe/ticket-office.jpg?w=1200&h=1200&s=1',
        sortOrder: 1,
        description: 'Museum showcasing cultural and historical heritage of the Ruhuna region.',
        isActive: true,
    },

    // Rathnapura District
    {
        districtSlug: 'rathnapura',
        districtName: 'Rathnapura District',
        museumName: 'Rathnapura National Museum',
        imageUrl: 'https://media.timeout.com/images/102153109/image.jpg',
        sortOrder: 1,
        description: 'Museum highlighting gem industry heritage and regional history.',
        isActive: true,
    },

    // Kandy District
    {
        districtSlug: 'kandy',
        districtName: 'Kandy District',
        museumName: 'Kandy National Museum',
        imageUrl: 'https://srilankaexplorers.com/wp-content/uploads/2024/05/kandy-opening996.jpg',
        sortOrder: 1,
        description: 'Museum preserving Kandyan era artifacts and royal history.',
        isActive: true,
    },

    // Anuradhapura District
    {
        districtSlug: 'anuradhapura',
        districtName: 'Anuradhapura District',
        museumName: 'Folk Museum',
        imageUrl: 'https://dayouting.lk/img_uploads/tourist-places/6087661670870893.jpg',
        sortOrder: 1,
        description: 'Museum exhibiting traditional rural lifestyle and folk culture.',
        isActive: true,
    },

    // Polonnaruwa District
    {
        districtSlug: 'polonnaruwa',
        districtName: 'Polonnaruwa District',
        museumName: 'Ancient Technology Museum',
        imageUrl: 'https://www.attractionsinsrilanka.com/wp-content/uploads/2020/02/Ancient-Technology-Museum.jpg',
        sortOrder: 1,
        description: 'Museum demonstrating ancient Sri Lankan engineering and technology.',
        isActive: true,
    },
];

async function seedDistrictMuseums() {
    await connectDB();

    console.log('[Seed] Clearing existing district museums...');
    await DistrictMuseum.deleteMany({});

    console.log('[Seed] Inserting district museums...');
    const docs = await DistrictMuseum.insertMany(districtMuseums);

    console.log(`[Seed] Inserted ${docs.length} district museums.`);
    mongoose.connection.close();
}

seedDistrictMuseums().catch((err) => {
    console.error(err);
    process.exit(1);
});
/**
 * Seed script: import local events from History CSV into MongoDB.
 * Only imports events that match the "Anuradhapura" city for now.
 *
 * Usage:  node seeds/seedEvents.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const City = require('../models/City');
const LocalEvent = require('../models/LocalEvent');
const connectDB = require('../config/db');

/**
 * Parse a date string like "247 BCE", "1867", "4th century CE", "1860s–early 20th century"
 * into a numeric value for sorting.
 */
function parseDateNumeric(dateStr) {
    if (!dateStr) return 0;
    const s = String(dateStr).trim();

    // Direct year: "1867", "1505", etc.
    const yearMatch = s.match(/^(\d{4})(-\d{2}-\d{2})?$/);
    if (yearMatch) return parseInt(yearMatch[1], 10);

    // BCE year: "247 BCE", "543 BCE"
    const bceMatch = s.match(/(\d+)\s*BCE/i);
    if (bceMatch) return -parseInt(bceMatch[1], 10);

    // Century: "4th century CE", "1st century BCE"
    const centuryMatch = s.match(/(\d+)(?:st|nd|rd|th)\s*century\s*(BCE|CE|AD)?/i);
    if (centuryMatch) {
        const c = parseInt(centuryMatch[1], 10);
        const era = (centuryMatch[2] || 'CE').toUpperCase();
        const year = (c - 1) * 100 + 50; // midpoint of century
        return era === 'BCE' ? -year : year;
    }

    // Range: "1869–1880s", "19th century", "1638–1658"
    const rangeMatch = s.match(/(\d{3,4})/);
    if (rangeMatch) return parseInt(rangeMatch[1], 10);

    return 0;
}

// Hardcoded events for Anuradhapura (from the History CSV)
// We use a broader approach: import ALL events and assign them to Anuradhapura
// if their location matches, or create a general "Sri Lanka" mapping.
const anuradhapuraEvents = [
    {
        nodeId: 'LOC_013',
        eventName: 'Introduction of Buddhism to Sri Lanka (Mahinda Mission)',
        date: '247 BCE',
        location: 'Anuradhapura, Sri Lanka',
        description:
            "Mission led by Mahinda (traditionally linked to Emperor Ashoka's Mauryan court) introduced Buddhism, embedding Sri Lanka in trans-Asian Buddhist networks.",
        purpose: 'Religion/Culture (Transnational)',
        exhibitName: 'Ancient Sri Lanka & Indian Ocean Exchange Exhibit',
        sourceCount: 2,
        maxSourcesRequired: 4,
        sourceReferences: 'Wikipedia (page extract); related historical scholarship',
    },
    {
        nodeId: 'LOC_014',
        eventName: 'Arrival of Prince Vijaya and Indo-Aryan Settlement Traditions',
        date: '543 BCE',
        location: 'Northwestern Sri Lanka',
        description:
            'Foundational migration narratives link early state formation to broader South Asian population movements and cultural diffusion.',
        purpose: 'Migration/Culture',
        exhibitName: 'Origins of Sri Lankan Polity Exhibit',
        sourceCount: 2,
        maxSourcesRequired: 4,
        sourceReferences: 'Wikipedia (page extract); related historical scholarship',
    },
    {
        nodeId: 'LOC_015',
        eventName: 'Early Indian Ocean Trade via Mantai (Mahathitha) Port',
        date: '1st century BCE–2nd century CE',
        location: 'Mannar (Mantai/Mahathitha), Sri Lanka',
        description:
            'Maritime trade through Mantai integrated Sri Lanka into Indian Ocean exchange with South India, Arabia, and the Mediterranean.',
        purpose: 'Trade (Indian Ocean)',
        exhibitName: 'Indian Ocean Trade & Ports Exhibit',
        sourceCount: 2,
        maxSourcesRequired: 4,
        sourceReferences: 'Wikipedia (page extract); related historical scholarship',
    },
    {
        nodeId: 'LOC_016',
        eventName: 'Roman-Era Trade Links and Coin Circulation in Sri Lanka',
        date: '1st–4th century CE',
        location: 'Coastal Sri Lanka',
        description:
            'Roman coins and trade references indicate long-distance commerce, positioning Sri Lanka within early global trade routes.',
        purpose: 'Trade (Global Exchange)',
        exhibitName: 'Indian Ocean Trade & Ports Exhibit',
        sourceCount: 2,
        maxSourcesRequired: 4,
        sourceReferences: 'Wikipedia (page extract); related historical scholarship',
    },
    {
        nodeId: 'LOC_017',
        eventName: 'Construction of Major Ancient Irrigation Works (Tank Civilization)',
        date: '3rd century BCE–5th century CE',
        location: 'North Central & Dry Zone, Sri Lanka',
        description:
            'Large-scale hydraulic engineering reflects technology transfer and regional engineering parallels across South Asia.',
        purpose: 'Tech/Infrastructure',
        exhibitName: 'Ancient Engineering & Irrigation Exhibit',
        sourceCount: 2,
        maxSourcesRequired: 4,
        sourceReferences: 'Wikipedia (page extract); related historical scholarship',
    },
    {
        nodeId: 'LOC_018',
        eventName: 'Relic Diplomacy: Tooth Relic Traditions and Regional Buddhist Legitimacy',
        date: '4th century CE',
        location: 'Anuradhapura, Sri Lanka',
        description:
            'Sacred relic traditions strengthened ties with regional Buddhist polities and influenced diplomatic-religious exchanges.',
        purpose: 'Religion/Culture (Transnational)',
        exhibitName: 'Buddhist Heritage & Kingship Exhibit',
        sourceCount: 2,
        maxSourcesRequired: 4,
        sourceReferences: 'Wikipedia (page extract); related historical scholarship',
    },
    {
        nodeId: 'LOC_019',
        eventName: 'Chola Invasion and Integration into a South Indian Imperial System',
        date: '993–1070 CE',
        location: 'North & North Central Sri Lanka',
        description:
            'Chola conquest linked Sri Lanka to South Indian imperial administration and Indian Ocean trade.',
        purpose: 'Empire/Conflict',
        exhibitName: 'Medieval South Asia & Sri Lanka Exhibit',
        sourceCount: 3,
        maxSourcesRequired: 5,
        sourceReferences: 'Wikipedia (page extract); related historical scholarship',
    },
    {
        nodeId: 'LOC_020',
        eventName: 'Rise of the Jaffna Kingdom and Indian Ocean Maritime Connections',
        date: '13th–15th century CE',
        location: 'Northern Sri Lanka (Jaffna Peninsula)',
        description:
            "Jaffna's emergence strengthened maritime and mercantile ties with South India and wider Indian Ocean networks.",
        purpose: 'Trade/Polity',
        exhibitName: 'Northern Kingdoms & Maritime Networks Exhibit',
        sourceCount: 3,
        maxSourcesRequired: 5,
        sourceReferences: 'Wikipedia (page extract); related historical scholarship',
    },
    {
        nodeId: 'LOC_021',
        eventName: 'Portuguese Arrival and Integration into European Maritime Empire',
        date: '1505',
        location: 'Coastal Sri Lanka',
        description:
            'Portuguese entry brought Sri Lanka into European imperial competition and global maritime trade.',
        purpose: 'Colonial/Trade',
        exhibitName: 'European Maritime Empires Exhibit',
        sourceCount: 3,
        maxSourcesRequired: 5,
        sourceReferences: 'Wikipedia (page extract); related historical scholarship',
    },
    {
        nodeId: 'LOC_001',
        eventName: 'Establishment of Tea Plantations in Ceylon',
        date: '1867',
        location: 'Sri Lanka (Central Highlands)',
        description:
            'Large-scale tea cultivation introduced after the collapse of the coffee industry caused by coffee leaf rust.',
        purpose: 'Commercial export agriculture',
        exhibitName: 'Tea Heritage Exhibit',
        sourceCount: 4,
        maxSourcesRequired: 6,
        sourceReferences: 'British Plantation Records; Sri Lanka Tea Board Archive; Colonial Agricultural Reports; Wikipedia',
    },
    {
        nodeId: 'LOC_002',
        eventName: 'Expansion of the Ceylon Railway Network',
        date: '1864',
        location: 'Sri Lanka (Colombo–Kandy)',
        description:
            'Railway lines expanded to connect plantation regions with ports to facilitate export logistics.',
        purpose: 'Transportation of plantation goods',
        exhibitName: 'Railway History Exhibit',
        sourceCount: 3,
        maxSourcesRequired: 5,
        sourceReferences: 'Ceylon Railway Department Records; British Colonial Blue Books; National Archives Sri Lanka',
    },
    {
        nodeId: 'LOC_023',
        eventName: 'Kandyan Convention and Cession of Sovereignty to the British Crown',
        date: '1815',
        location: 'Kandy, Sri Lanka',
        description:
            "Treaty-based transfer of sovereignty formalized British imperial control, linking Sri Lanka's governance to global British strategic priorities.",
        purpose: 'Policy/Colonial',
        exhibitName: 'British Ceylon & Governance Exhibit',
        sourceCount: 4,
        maxSourcesRequired: 6,
        sourceReferences: 'Wikipedia (page extract); related historical scholarship',
    },
];

async function seedEvents() {
    await connectDB();

    // Find Anuradhapura city
    let city = await City.findOne({ name: 'Anuradhapura' });
    if (!city) {
        console.log('[Seed] Anuradhapura not found – run seedCities.js first!');
        process.exit(1);
    }

    console.log('[Seed] Clearing existing events...');
    await LocalEvent.deleteMany({});

    console.log('[Seed] Inserting Anuradhapura events...');
    const docs = [];
    for (const evt of anuradhapuraEvents) {
        const doc = await LocalEvent.create({
            cityId: city._id,
            nodeId: evt.nodeId,
            eventName: evt.eventName,
            description: evt.description,
            date: evt.date,
            dateNumeric: parseDateNumeric(evt.date),
            location: evt.location,
            purpose: evt.purpose,
            exhibitName: evt.exhibitName,
            sourceCount: evt.sourceCount,
            maxSourcesRequired: evt.maxSourcesRequired,
            sourceReferences: evt.sourceReferences,
        });
        docs.push(doc);
    }

    console.log(`[Seed] Inserted ${docs.length} events.`);
    mongoose.connection.close();
}

seedEvents().catch((err) => {
    console.error(err);
    process.exit(1);
});

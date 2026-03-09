/**
 * Fetch Sri Lanka GeoJSON and convert to SVG path.
 * Run: node geo_to_svg.js
 */
const https = require('https');

const url = 'https://raw.githubusercontent.com/johan/world.geo.json/master/countries/LKA.geo.json';

function fetch(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (c) => data += c);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

function geoToSvg(coords, width, height, padding) {
    // Flatten to get all points
    const flat = coords.flat(3).length > 0 ? coords : [coords];
    const allPoints = [];

    function extractPoints(arr) {
        if (typeof arr[0] === 'number') {
            allPoints.push(arr);
            return;
        }
        for (const item of arr) extractPoints(item);
    }
    extractPoints(coords);

    // Get bounds
    const lons = allPoints.map(p => p[0]);
    const lats = allPoints.map(p => p[1]);
    const minLon = Math.min(...lons), maxLon = Math.max(...lons);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats);

    const geoWidth = maxLon - minLon;
    const geoHeight = maxLat - minLat;

    // Scale to fit SVG
    const scaleX = (width - 2 * padding) / geoWidth;
    const scaleY = (height - 2 * padding) / geoHeight;
    const scale = Math.min(scaleX, scaleY);

    const offsetX = padding + ((width - 2 * padding) - geoWidth * scale) / 2;
    const offsetY = padding + ((height - 2 * padding) - geoHeight * scale) / 2;

    function project(lon, lat) {
        const x = (lon - minLon) * scale + offsetX;
        const y = (maxLat - lat) * scale + offsetY; // flip Y
        return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
    }

    // Build SVG paths
    function ringToPath(ring) {
        const pts = ring.map(p => project(p[0], p[1]));
        let d = `M${pts[0][0]},${pts[0][1]}`;
        for (let i = 1; i < pts.length; i++) {
            d += ` L${pts[i][0]},${pts[i][1]}`;
        }
        d += ' Z';
        return d;
    }

    // Also output city positions
    const cities = {
        jaffna: [80.0255, 9.6615],
        mannar: [79.9044, 8.9766],
        anuradhapura: [80.4037, 8.3114],
        trincomalee: [81.2152, 8.5874],
        polonnaruwa: [81.0188, 7.9403],
        sigiriya: [80.7603, 7.957],
        kandy: [80.6337, 7.2906],
        nuwaraeliya: [80.7891, 6.9497],
        colombo: [79.8612, 6.9271],
        galle: [80.221, 6.0535],
    };

    console.log('\n// City SVG positions:');
    console.log('const cityPositions = {');
    for (const [name, [lon, lat]] of Object.entries(cities)) {
        const [x, y] = project(lon, lat);
        console.log(`    ${name.padEnd(14)}: { x: ${x}, y: ${y} },`);
    }
    console.log('};');

    return { ringToPath, project };
}

async function main() {
    console.log('Fetching Sri Lanka GeoJSON...');
    const raw = await fetch(url);
    const json = JSON.parse(raw);

    const feature = json.features ? json.features[0] : json;
    const geometry = feature.geometry;

    const width = 500, height = 540, padding = 30;
    const { ringToPath } = geoToSvg(geometry.coordinates, width, height, padding);

    console.log(`\n// SVG viewBox="0 0 ${width} ${height}"`);

    if (geometry.type === 'Polygon') {
        for (let i = 0; i < geometry.coordinates.length; i++) {
            console.log(`\n// Ring ${i}:`);
            console.log(ringToPath(geometry.coordinates[i]));
        }
    } else if (geometry.type === 'MultiPolygon') {
        for (let p = 0; p < geometry.coordinates.length; p++) {
            for (let r = 0; r < geometry.coordinates[p].length; r++) {
                console.log(`\n// Polygon ${p}, Ring ${r}:`);
                console.log(ringToPath(geometry.coordinates[p][r]));
            }
        }
    }
}

main().catch(console.error);

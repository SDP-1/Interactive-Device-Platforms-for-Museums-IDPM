const API_BASE = 'http://localhost:5000/api';

let allArtifacts = [];
let currentArtifact = null;
let currentZoom = 1;
let currentFilter = 'all';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadArtifacts();
    setupFilters();
});

// Load artifacts from API
async function loadArtifacts() {
    try {
        const response = await fetch(`${API_BASE}/artifacts`);
        allArtifacts = await response.json();
        displayArtifacts(allArtifacts);
    } catch (error) {
        console.error('Error loading artifacts:', error);
        document.getElementById('artifact-gallery').innerHTML =
            '<p style="text-align: center; color: red;">Error loading artifacts. Make sure the server is running.</p>';
    }
}

// Setup filter buttons
function setupFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            filterArtifacts();
        });
    });
}

// Filter artifacts
function filterArtifacts() {
    let filtered = allArtifacts;

    if (currentFilter === 'sri-lankan') {
        filtered = allArtifacts.filter(a => a.is_sri_lankan);
    } else if (currentFilter === 'comparison') {
        filtered = allArtifacts.filter(a => !a.is_sri_lankan);
    }

    displayArtifacts(filtered);
}

// Display artifacts in gallery
function displayArtifacts(artifacts) {
    const gallery = document.getElementById('artifact-gallery');
    gallery.innerHTML = '';

    if (artifacts.length === 0) {
        gallery.innerHTML = '<p style="text-align: center; color: #666;">No artifacts found.</p>';
        return;
    }

    artifacts.forEach(artifact => {
        const card = document.createElement('div');
        card.className = 'artifact-card';
        card.onclick = () => showArtifactDetail(artifact.id);

        let imageHtml = '';
        if (artifact.image) {
            // Ensure path starts with / and uses correct format
            let imgSrc = artifact.image;
            if (!imgSrc.startsWith('/')) {
                imgSrc = '/' + imgSrc;
            }
            imageHtml = `<img src="${imgSrc}" alt="${artifact.name}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px 8px 0 0; margin: -20px -20px 15px -20px;" onerror="console.error('Image failed:', this.src); this.style.display='none'">`;
        }

        card.innerHTML = `
            ${imageHtml}
            <h3>${artifact.name}</h3>
            <div class="category">${artifact.category}</div>
            <div class="origin">${artifact.origin}</div>
            <div class="badge">${artifact.is_sri_lankan ? 'Sri Lankan' : 'Comparison'}</div>
        `;

        gallery.appendChild(card);
    });
}

// Show artifact detail
async function showArtifactDetail(artifactId) {
    try {
        const response = await fetch(`${API_BASE}/artifacts/${artifactId}`);
        currentArtifact = await response.json();

        // Update UI
        document.getElementById('gallery-section').classList.add('hidden');
        document.getElementById('comparison-section').classList.add('hidden');
        document.getElementById('detail-section').classList.remove('hidden');

        displayArtifactDetail(currentArtifact);
        loadHotspots(artifactId);
        // Don't auto-load explanation - user will click button
    } catch (error) {
        console.error('Error loading artifact:', error);
        alert('Error loading artifact details');
    }
}

// Display artifact detail
function displayArtifactDetail(artifact) {
    document.getElementById('artifact-name').textContent = artifact.name;
    document.getElementById('artifact-category').textContent = artifact.category;
    document.getElementById('artifact-origin').textContent = artifact.origin;
    document.getElementById('artifact-era').textContent = artifact.era;
    document.getElementById('artifact-materials').textContent = artifact.materials;
    document.getElementById('artifact-function').textContent = artifact.function;
    document.getElementById('artifact-symbolism').textContent = artifact.symbolism;
    document.getElementById('artifact-notes').textContent = artifact.notes;

    // Display image if available
    const imageContainer = document.getElementById('artifact-image');
    if (artifact.image) {
        const img = document.createElement('img');
        // Ensure path starts with /
        let imgSrc = artifact.image;
        if (!imgSrc.startsWith('/')) {
            imgSrc = '/' + imgSrc;
        }
        img.src = imgSrc;
        img.alt = artifact.name;
        img.style.cssText = 'max-width: 100%; height: auto; border-radius: 8px;';
        img.onerror = function () {
            console.error('Image failed to load:', this.src);
            imageContainer.innerHTML = `
                <div class="placeholder-content">
                    <span class="icon">🏺</span>
                    <p>Artifact Image</p>
                    <p style="font-size: 0.8em; color: #999;">Image not available</p>
                </div>
            `;
        };
        img.onload = function () {
            console.log('Image loaded successfully:', this.src);
        };
        imageContainer.innerHTML = '';
        imageContainer.appendChild(img);
    } else {
        imageContainer.innerHTML = `
            <div class="placeholder-content">
                <span class="icon">🏺</span>
                <p>Artifact Image</p>
            </div>
        `;
    }

    // Reset zoom
    currentZoom = 1;
    updateImageZoom();
}

// Load hotspots
async function loadHotspots(artifactId) {
    try {
        const response = await fetch(`${API_BASE}/hotspots/${artifactId}`);
        const hotspots = await response.json();
        displayHotspots(hotspots);
    } catch (error) {
        console.error('Error loading hotspots:', error);
    }
}

// Display hotspots
function displayHotspots(hotspots) {
    const overlay = document.getElementById('hotspots-overlay');
    overlay.innerHTML = '';

    hotspots.forEach(hotspot => {
        const element = document.createElement('div');
        element.className = 'hotspot';
        element.style.left = `${hotspot.x}%`;
        element.style.top = `${hotspot.y}%`;
        element.onclick = (e) => {
            e.stopPropagation();
            showHotspotPopup(hotspot);
        };
        overlay.appendChild(element);
    });
}

// Show hotspot popup
function showHotspotPopup(hotspot) {
    const popup = document.getElementById('hotspot-popup');
    document.getElementById('hotspot-title').textContent = hotspot.title;
    document.getElementById('hotspot-description').textContent = hotspot.description;
    popup.classList.remove('hidden');

    // Add overlay
    if (!document.querySelector('.overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.onclick = closeHotspot;
        document.body.appendChild(overlay);
    }
}

// Close hotspot popup
function closeHotspot() {
    document.getElementById('hotspot-popup').classList.add('hidden');
    const overlay = document.querySelector('.overlay');
    if (overlay) overlay.remove();
}

// Zoom functions
function zoomIn() {
    currentZoom = Math.min(currentZoom + 0.2, 3);
    updateImageZoom();
}

function zoomOut() {
    currentZoom = Math.max(currentZoom - 0.2, 0.5);
    updateImageZoom();
}

function resetZoom() {
    currentZoom = 1;
    updateImageZoom();
}

function updateImageZoom() {
    const container = document.getElementById('image-container');
    container.style.transform = `scale(${currentZoom})`;
    container.style.transformOrigin = 'center center';
}

// Load AI explanation
async function loadExplanation(artifactId) {
    const contentDiv = document.getElementById('ai-explanation-content');
    contentDiv.textContent = 'Loading explanation...';

    try {
        const response = await fetch(`${API_BASE}/artifacts/${artifactId}/explain`);
        const data = await response.json();
        // Display as plain text with preserved line breaks
        contentDiv.style.whiteSpace = 'pre-wrap';
        contentDiv.textContent = data.explanation;
    } catch (error) {
        console.error('Error loading explanation:', error);
        contentDiv.textContent = 'Unable to load AI explanation at this time.';
    }
}

// Generate AI explanation (triggered by button)
async function generateAIExplanation() {
    if (!currentArtifact) return;

    const button = document.getElementById('generate-explanation-btn');
    const contentDiv = document.getElementById('ai-explanation-content');

    // Show loading state
    button.disabled = true;
    button.textContent = '⏳ Generating...';
    contentDiv.style.display = 'block';
    contentDiv.textContent = 'Generating AI explanation using T5 model...';
    contentDiv.className = 'loading';

    try {
        const response = await fetch(`${API_BASE}/artifacts/${currentArtifact.id}/explain`);
        const data = await response.json();

        // Display the explanation
        contentDiv.className = '';
        contentDiv.style.whiteSpace = 'pre-wrap';
        contentDiv.style.lineHeight = '1.8';
        contentDiv.style.padding = '15px';
        contentDiv.style.background = '#f8f9fa';
        contentDiv.style.borderRadius = '8px';
        contentDiv.style.marginTop = '10px';
        contentDiv.textContent = data.explanation;

        // Update button
        button.textContent = '✓ Explanation Generated';
        button.style.background = '#28a745';

        // Reset button after 2 seconds
        setTimeout(() => {
            button.textContent = '✨ Regenerate AI Explanation';
            button.style.background = '';
            button.disabled = false;
        }, 2000);

    } catch (error) {
        console.error('Error generating explanation:', error);
        contentDiv.className = '';
        contentDiv.textContent = 'Unable to generate AI explanation at this time. Please try again.';
        contentDiv.style.color = 'red';

        button.disabled = false;
        button.textContent = '✨ Generate AI Explanation';
    }
}

// Show comparison view
async function showComparison() {
    if (!currentArtifact) return;

    document.getElementById('detail-section').classList.add('hidden');
    document.getElementById('comparison-section').classList.remove('hidden');

    const container = document.getElementById('comparison-container');
    container.innerHTML = '<div class="loading">Loading similar artifacts...</div>';

    try {
        const response = await fetch(`${API_BASE}/artifacts/${currentArtifact.id}/similar?limit=5`);
        const similarArtifacts = await response.json();

        displayComparisons(similarArtifacts);
    } catch (error) {
        console.error('Error loading comparisons:', error);
        container.innerHTML = '<p style="text-align: center; color: red;">Error loading comparisons.</p>';
    }
}

// Display comparisons
function displayComparisons(similarArtifacts) {
    const container = document.getElementById('comparison-container');
    container.innerHTML = '';

    if (similarArtifacts.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">No similar artifacts found.</p>';
        return;
    }

    similarArtifacts.forEach(similar => {
        const item = document.createElement('div');
        item.className = 'comparison-item';
        item.onclick = () => compareArtifacts(currentArtifact, similar);

        const similarityPercent = Math.round(similar.similarity_score * 100);

        item.innerHTML = `
            <h3>${similar.name}</h3>
            <div class="similarity-score">${similarityPercent}% Similar</div>
            <div class="category">${similar.category}</div>
            <div class="origin">${similar.origin}</div>
            <p style="margin-top: 10px; color: #666;">${similar.function.substring(0, 150)}...</p>
        `;

        container.appendChild(item);
    });
}

// Compare two artifacts
async function compareArtifacts(artifact1, artifact2) {
    const container = document.getElementById('comparison-container');
    container.innerHTML = '<div class="loading">Generating comparison...</div>';

    try {
        const response = await fetch(`${API_BASE}/compare`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                artifact1_id: artifact1.id,
                artifact2_id: artifact2.id
            })
        });

        const comparison = await response.json();
        displayComparison(comparison);
    } catch (error) {
        console.error('Error comparing artifacts:', error);
        container.innerHTML = '<p style="text-align: center; color: red;">Error generating comparison.</p>';
    }
}

// Display comparison
function displayComparison(comparison) {
    const container = document.getElementById('comparison-container');

    container.innerHTML = `
        <div class="comparison-grid">
            <div class="comparison-artifact">
                <h3>${comparison.artifact1.name}</h3>
                <div class="info-item">
                    <strong>Origin:</strong> ${comparison.artifact1.origin}
                </div>
                <div class="info-item">
                    <strong>Era:</strong> ${comparison.artifact1.era}
                </div>
                <div class="info-item">
                    <strong>Materials:</strong> ${comparison.artifact1.materials}
                </div>
                <div class="info-item full-width">
                    <strong>Function:</strong>
                    <p>${comparison.artifact1.function}</p>
                </div>
                <div class="info-item full-width">
                    <strong>Symbolism:</strong>
                    <p>${comparison.artifact1.symbolism}</p>
                </div>
            </div>
            
            <div class="comparison-artifact">
                <h3>${comparison.artifact2.name}</h3>
                <div class="info-item">
                    <strong>Origin:</strong> ${comparison.artifact2.origin}
                </div>
                <div class="info-item">
                    <strong>Era:</strong> ${comparison.artifact2.era}
                </div>
                <div class="info-item">
                    <strong>Materials:</strong> ${comparison.artifact2.materials}
                </div>
                <div class="info-item full-width">
                    <strong>Function:</strong>
                    <p>${comparison.artifact2.function}</p>
                </div>
                <div class="info-item full-width">
                    <strong>Symbolism:</strong>
                    <p>${comparison.artifact2.symbolism}</p>
                </div>
            </div>
            
            <div class="comparison-text">
                <h3 style="color: #667eea; margin-bottom: 15px;">AI-Generated Comparison</h3>
                <div style="white-space: pre-wrap; line-height: 1.8;">${comparison.comparison}</div>
            </div>
        </div>
    `;
}

// Navigation functions
function showGallery() {
    document.getElementById('detail-section').classList.add('hidden');
    document.getElementById('comparison-section').classList.add('hidden');
    document.getElementById('gallery-section').classList.remove('hidden');
    currentArtifact = null;
}

function showDetail() {
    if (currentArtifact) {
        showArtifactDetail(currentArtifact.id);
    } else {
        showGallery();
    }
}


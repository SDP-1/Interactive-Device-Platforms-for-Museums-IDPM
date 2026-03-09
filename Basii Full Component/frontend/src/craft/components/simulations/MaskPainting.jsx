import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image, Path } from 'react-konva';
import useImage from 'use-image';
import { loadMaskDatasets } from '../../data/csvParser';
import '../../styles/MaskPainting.css';

// Define mask regions for each mask - precise regions matching actual mask features
const MASK_REGIONS = {
  'raksha1': [
    // Central face area
    { name: 'Forehead', path: 'M 250 80 L 550 80 L 580 180 L 220 180 Z', color: null },
    { name: 'Face Center', path: 'M 220 180 L 580 180 L 560 420 L 240 420 Z', color: null },
    { name: 'Chin', path: 'M 280 420 L 520 420 L 500 520 L 300 520 Z', color: null },
    
    // Eyes
    { name: 'Left Eye White', path: 'M 270 200 Q 320 180 370 200 Q 370 240 320 250 Q 270 240 270 200 Z', color: null },
    { name: 'Left Pupil', path: 'M 305 210 A 20 25 0 1 1 335 210 A 20 25 0 1 1 305 210 Z', color: null },
    { name: 'Right Eye White', path: 'M 430 200 Q 480 180 530 200 Q 530 240 480 250 Q 430 240 430 200 Z', color: null },
    { name: 'Right Pupil', path: 'M 465 210 A 20 25 0 1 1 495 210 A 20 25 0 1 1 465 210 Z', color: null },
    
    // Eyebrows
    { name: 'Left Eyebrow', path: 'M 260 160 Q 320 140 380 155 L 370 170 Q 320 160 265 175 Z', color: null },
    { name: 'Right Eyebrow', path: 'M 420 155 Q 480 140 540 160 L 535 175 Q 480 160 430 170 Z', color: null },
    
    // Nose
    { name: 'Nose Bridge', path: 'M 370 240 L 430 240 L 425 290 L 375 290 Z', color: null },
    { name: 'Nose Tip', path: 'M 375 290 L 425 290 L 435 330 L 365 330 Z', color: null },
    
    // Mouth area
    { name: 'Upper Lip', path: 'M 320 350 Q 400 340 480 350 L 470 370 Q 400 365 330 370 Z', color: null },
    { name: 'Mouth Interior', path: 'M 330 370 Q 400 385 470 370 Q 470 395 400 405 Q 330 395 330 370 Z', color: null },
    { name: 'Lower Lip', path: 'M 330 395 Q 400 405 470 395 L 480 415 Q 400 420 320 415 Z', color: null },
    { name: 'Upper Teeth', path: 'M 340 370 L 460 370 L 455 382 L 345 382 Z', color: null },
    { name: 'Lower Teeth', path: 'M 345 390 L 455 390 L 460 402 L 340 402 Z', color: null },
    
    // Mustache
    { name: 'Left Mustache', path: 'M 250 330 Q 300 320 350 335 Q 320 345 260 350 Z', color: null },
    { name: 'Right Mustache', path: 'M 450 335 Q 500 320 550 330 Q 540 350 480 345 Z', color: null },
    
    // Ears
    { name: 'Left Ear', path: 'M 200 230 Q 180 280 190 350 Q 210 340 225 290 Q 230 240 200 230 Z', color: null },
    { name: 'Right Ear', path: 'M 600 230 Q 620 280 610 350 Q 590 340 575 290 Q 570 240 600 230 Z', color: null },
    
    // Cheeks
    { name: 'Left Cheek', path: 'M 240 260 Q 260 310 280 360 Q 255 330 240 280 Z', color: null },
    { name: 'Right Cheek', path: 'M 560 260 Q 540 310 520 360 Q 545 330 560 280 Z', color: null },
    
    // Hair/Crown ornaments
    { name: 'Left Hair', path: 'M 200 100 Q 220 60 250 80 L 250 150 Q 230 130 200 140 Z', color: null },
    { name: 'Right Hair', path: 'M 600 100 Q 580 60 550 80 L 550 150 Q 570 130 600 140 Z', color: null },
  ],
  'gurulu': [
    // Face base
    { name: 'Forehead', path: 'M 250 80 L 550 80 L 580 180 L 220 180 Z', color: null },
    { name: 'Face Center', path: 'M 220 180 L 580 180 L 560 380 L 240 380 Z', color: null },
    
    // Eyes
    { name: 'Left Eye White', path: 'M 270 200 Q 320 180 370 200 Q 370 240 320 250 Q 270 240 270 200 Z', color: null },
    { name: 'Left Pupil', path: 'M 305 210 A 20 25 0 1 1 335 210 A 20 25 0 1 1 305 210 Z', color: null },
    { name: 'Right Eye White', path: 'M 430 200 Q 480 180 530 200 Q 530 240 480 250 Q 430 240 430 200 Z', color: null },
    { name: 'Right Pupil', path: 'M 465 210 A 20 25 0 1 1 495 210 A 20 25 0 1 1 465 210 Z', color: null },
    
    // Beak
    { name: 'Beak Upper', path: 'M 350 280 L 450 280 L 440 350 L 360 350 Z', color: null },
    { name: 'Beak Lower', path: 'M 360 355 L 440 355 L 425 410 L 375 410 Z', color: null },
    { name: 'Beak Tip', path: 'M 375 410 L 425 410 L 415 450 L 385 450 Z', color: null },
    
    // Crest/Crown
    { name: 'Crest Center', path: 'M 370 50 Q 400 20 430 50 L 420 80 L 380 80 Z', color: null },
    { name: 'Crest Left Feather', path: 'M 320 60 Q 340 30 360 65 L 355 90 L 325 85 Z', color: null },
    { name: 'Crest Right Feather', path: 'M 480 60 Q 460 30 440 65 L 445 90 L 475 85 Z', color: null },
    
    // Wing decorations
    { name: 'Left Wing Upper', path: 'M 180 220 Q 200 200 220 220 L 215 280 L 185 270 Z', color: null },
    { name: 'Left Wing Lower', path: 'M 185 280 L 215 290 L 210 350 L 180 340 Z', color: null },
    { name: 'Right Wing Upper', path: 'M 620 220 Q 600 200 580 220 L 585 280 L 615 270 Z', color: null },
    { name: 'Right Wing Lower', path: 'M 615 280 L 585 290 L 590 350 L 620 340 Z', color: null },
    
    // Neck feathers
    { name: 'Neck Feathers Top', path: 'M 300 420 L 500 420 L 490 470 L 310 470 Z', color: null },
    { name: 'Neck Feathers Bottom', path: 'M 310 475 L 490 475 L 480 530 L 320 530 Z', color: null },
  ]
};

// Custom hook for loading mask images
const useMaskImage = (src) => {
  const [image] = useImage(src, 'anonymous');
  return image;
};

// Mask selection component
function MaskSelector({ masks, onSelectMask, colors }) {
  return (
    <div className="mask-selector-screen">
      <div className="mask-selector-header">
        <h1 className="mask-selector-title">Traditional Kolam Mask Painting</h1>
        <p className="mask-selector-subtitle">Choose a mask to begin your artistic journey</p>
      </div>
      
      <div className="masks-grid">
        {masks.map((mask) => (
          <div key={mask.id} className="mask-card" onClick={() => onSelectMask(mask)}>
            <div className="mask-image-container">
              <img src={mask.filename} alt={mask.name} className="mask-preview-image" />
            </div>
            <div className="mask-card-content">
              <h3 className="mask-name">{mask.name}</h3>
              <p className="mask-type">{mask.maskType}</p>
              <p className="mask-ritual">{mask.ritualContext}</p>
              <p className="mask-description">{mask.shortDescription}</p>
              
              <div className="mask-details">
                <div className="mask-detail-item">
                  <span className="detail-label">Period:</span>
                  <span className="detail-value">{mask.period}</span>
                </div>
                <div className="mask-detail-item">
                  <span className="detail-label">Region:</span>
                  <span className="detail-value">{mask.region}</span>
                </div>
              </div>
              
              <div className="traditional-colors-preview">
                <span className="colors-label">Traditional Colors:</span>
                <div className="colors-dots">
                  {mask.traditionalColors.map((colorName, idx) => {
                    const color = colors.find(c => c.colorName === colorName);
                    return color ? (
                      <div 
                        key={idx} 
                        className="color-dot-small" 
                        style={{ backgroundColor: color.hexCode }}
                        title={color.traditionalName}
                      />
                    ) : null;
                  })}
                </div>
              </div>
              
              <button className="select-mask-button">Select This Mask</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Main painting component
function MaskPainting() {
  const [datasets, setDatasets] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMask, setSelectedMask] = useState(null);
  const [selectedColor, setSelectedColor] = useState('#DC143C'); // Red default
  const [maskRegions, setMaskRegions] = useState([]); // Stores colored regions
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedColor, setDraggedColor] = useState(null);
  const [showColorInfo, setShowColorInfo] = useState(null);
  const [showCulturalInfo, setShowCulturalInfo] = useState(false);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  
  const maskImage = useMaskImage(selectedMask?.filename);
  
  const canvasWidth = 800;
  const canvasHeight = 600;

  // Load datasets
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await loadMaskDatasets();
      if (data) {
        setDatasets(data);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const handleSelectMask = (mask) => {
    // Initialize mask regions from the template
    const regionTemplate = MASK_REGIONS[mask.id] || MASK_REGIONS['raksha1'];
    setMaskRegions(regionTemplate.map(r => ({ ...r, color: null })));
    setSelectedMask(mask);
  };

  const handleBackToSelection = () => {
    setSelectedMask(null);
    setMaskRegions([]);
  };

  const handleRegionClick = (regionIndex) => {
    if (!selectedColor) return;
    
    // Update the color of the clicked region
    const updatedRegions = [...maskRegions];
    updatedRegions[regionIndex] = { ...updatedRegions[regionIndex], color: selectedColor };
    setMaskRegions(updatedRegions);
  };

  const handleRegionMouseEnter = (regionIndex) => {
    setHoveredRegion(regionIndex);
  };

  const handleRegionMouseLeave = () => {
    setHoveredRegion(null);
  };

  const handleDragStart = (color) => {
    setIsDragging(true);
    setDraggedColor(color);
    setSelectedColor(color.hexCode);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedColor(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    
    // Color will be applied when clicking on a region
    // Just end the drag state
    handleDragEnd();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleClearCanvas = () => {
    if (window.confirm('Are you sure you want to clear your painting?')) {
      const clearedRegions = maskRegions.map(r => ({ ...r, color: null }));
      setMaskRegions(clearedRegions);
    }
  };

  const handleSavePainting = () => {
    const uri = stageRef.current.toDataURL();
    const link = document.createElement('a');
    link.download = `${selectedMask.name.replace(/\s+/g, '_')}_painting.png`;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color.hexCode);
    setShowColorInfo(color);
    setTimeout(() => setShowColorInfo(null), 3000);
  };

  const getCurrentColorInfo = () => {
    if (!datasets) return null;
    return datasets.MASK_COLORS.find(c => c.hexCode === selectedColor);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading Kolam Mask Collection...</p>
      </div>
    );
  }

  if (!datasets) {
    return (
      <div className="error-screen">
        <p>Error loading mask data. Please refresh the page.</p>
      </div>
    );
  }

  if (!selectedMask) {
    return (
      <MaskSelector 
        masks={datasets.KOLAM_MASKS_DATA}
        colors={datasets.MASK_COLORS}
        onSelectMask={handleSelectMask}
      />
    );
  }

  const currentColorInfo = getCurrentColorInfo();

  return (
    <div className="mask-painting-container">
      {/* Header */}
      <div className="painting-header">
        <button className="back-button" onClick={handleBackToSelection}>
          ← Back to Selection
        </button>
        <div className="painting-title-section">
          <h2 className="painting-mask-name">{selectedMask.name}</h2>
          <p className="painting-mask-type">{selectedMask.maskType}</p>
        </div>
        <button className="info-button" onClick={() => setShowCulturalInfo(!showCulturalInfo)}>
          ℹ Cultural Info
        </button>
      </div>

      <div className="painting-main-area">
        {/* Left sidebar - Instructions */}
        <div className="painting-sidebar-left">
          <div className="tools-section">
            <h3 className="tools-title">How to Paint</h3>
            
            {/* Instructions */}
            <div className="instructions-box">
              <div className="instruction-item">
                <span className="instruction-number">1</span>
                <p className="instruction-text">Select a color from the palette or drag it to the canvas</p>
              </div>
              <div className="instruction-item">
                <span className="instruction-number">2</span>
                <p className="instruction-text">Click on mask parts (eyes, nose, mouth, etc.) to fill them</p>
              </div>
              <div className="instruction-item">
                <span className="instruction-number">3</span>
                <p className="instruction-text">Each part can be painted individually with different colors</p>
              </div>
            </div>

            {/* Current color display */}
            {currentColorInfo && (
              <div className="current-color-display">
                <div className="color-preview-large" style={{ backgroundColor: selectedColor }}></div>
                <div className="color-info-compact">
                  <p className="color-name">{currentColorInfo.colorName}</p>
                  <p className="color-traditional">{currentColorInfo.traditionalName}</p>
                  <p className="color-meaning">{currentColorInfo.culturalMeaning}</p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="action-buttons">
              <button className="action-button clear-button" onClick={handleClearCanvas}>
                🗑️ Clear All
              </button>
              <button className="action-button save-button" onClick={handleSavePainting}>
                💾 Save Painting
              </button>
            </div>
          </div>
        </div>

        {/* Center - Canvas */}
        <div className="painting-canvas-area">
          <div 
            className="canvas-wrapper"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            ref={canvasRef}
          >
            <Stage
              width={canvasWidth}
              height={canvasHeight}
              ref={stageRef}
              className="painting-stage"
            >
              <Layer>
                {/* Background mask image */}
                {maskImage && (
                  <Image
                    image={maskImage}
                    x={0}
                    y={0}
                    width={canvasWidth}
                    height={canvasHeight}
                    opacity={0.3}
                  />
                )}
                
                {/* Paintable regions */}
                {maskRegions.map((region, index) => (
                  <Path
                    key={index}
                    data={region.path}
                    fill={region.color || 'transparent'}
                    stroke={hoveredRegion === index ? '#FFD700' : 'rgba(255, 255, 255, 0.2)'}
                    strokeWidth={hoveredRegion === index ? 3 : 1}
                    opacity={region.color ? 0.85 : (hoveredRegion === index ? 0.3 : 0.1)}
                    onClick={() => handleRegionClick(index)}
                    onMouseEnter={() => handleRegionMouseEnter(index)}
                    onMouseLeave={handleRegionMouseLeave}
                    onTouchStart={() => handleRegionClick(index)}
                  />
                ))}
              </Layer>
            </Stage>
            {isDragging && (
              <div className="drop-hint">Drop color on mask parts to paint</div>
            )}
            {hoveredRegion !== null && (
              <div className="region-name-tooltip">
                {maskRegions[hoveredRegion].name}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar - Color palette */}
        <div className="painting-sidebar-right">
          <h3 className="palette-title">Traditional Colors</h3>
          
          <div className="color-palette">
            {datasets.MASK_COLORS.map((color, idx) => (
              <div key={idx} className="color-palette-item">
                <div
                  className={`color-button ${selectedColor === color.hexCode ? 'selected' : ''}`}
                  style={{ backgroundColor: color.hexCode }}
                  draggable="true"
                  onDragStart={() => handleDragStart(color)}
                  onDragEnd={handleDragEnd}
                  onClick={() => handleColorSelect(color)}
                  onMouseEnter={() => setShowColorInfo(color)}
                  onMouseLeave={() => setShowColorInfo(null)}
                  title="Drag to canvas or click to select"
                >
                  {selectedColor === color.hexCode && <span className="checkmark">✓</span>}
                </div>
                <div className="color-label-small">
                  <p className="color-name-small">{color.colorName}</p>
                  <p className="color-traditional-small">{color.traditionalName}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Color info popup */}
          {showColorInfo && (
            <div className="color-info-popup">
              <h4>{showColorInfo.colorName}</h4>
              <p className="traditional-name">{showColorInfo.traditionalName}</p>
              <p className="cultural-meaning">{showColorInfo.culturalMeaning}</p>
              <p className="symbolic">{showColorInfo.symbolicSignificance}</p>
            </div>
          )}
        </div>
      </div>

      {/* Cultural info modal */}
      {showCulturalInfo && (
        <div className="cultural-info-modal" onClick={() => setShowCulturalInfo(false)}>
          <div className="cultural-info-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowCulturalInfo(false)}>×</button>
            
            <h2>{selectedMask.name}</h2>
            <p className="modal-subtitle">{selectedMask.ritualContext}</p>
            
            <div className="cultural-sections">
              <div className="cultural-section">
                <h3>Cultural Background</h3>
                <p>{selectedMask.culturalInfo.background}</p>
              </div>
              
              <div className="cultural-section">
                <h3>Spiritual Purpose</h3>
                <p>{selectedMask.culturalInfo.spiritualPurpose}</p>
              </div>
              
              {selectedMask.culturalInfo.demonRepresented && (
                <div className="cultural-section">
                  <h3>Demon Represented</h3>
                  <p>{selectedMask.culturalInfo.demonRepresented}</p>
                </div>
              )}
              
              {selectedMask.culturalInfo.healingProperties && (
                <div className="cultural-section">
                  <h3>Healing Properties</h3>
                  <p>{selectedMask.culturalInfo.healingProperties}</p>
                </div>
              )}
              
              <div className="cultural-section">
                <h3>Performance Context</h3>
                <p>{selectedMask.culturalInfo.performanceContext}</p>
              </div>
              
              <div className="cultural-section">
                <h3>Symbolism</h3>
                <p>{selectedMask.culturalInfo.symbolism}</p>
              </div>
              
              <div className="cultural-section">
                <h3>Crafting Tradition</h3>
                <p>{selectedMask.culturalInfo.craftingTradition}</p>
              </div>
              
              <div className="cultural-section">
                <h3>Modern Relevance</h3>
                <p>{selectedMask.culturalInfo.modernRelevance}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MaskPainting;
/**
 * ============================================================================
 * MUSEUM KIOSK - POT COLORING EXPERIENCE
 * ============================================================================
 * Design Theme: "Modern Heritage" - Big, Bold, Accessible
 * Target: Large-format digital kiosk displays
 * 
 * Features:
 * - Interactive pot coloring with flood fill algorithm
 * - 4 different pot designs (Pot-deco 1-4)
 * - Touch-friendly color palette
 * - Canvas-centered layout with proper alignment
 * - No overlay issues with properly positioned controls
 * ============================================================================
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';

// ============================================================================
// TRADITIONAL SRI LANKAN COLOR PALETTE FOR POTTERY
// ============================================================================
const COLOR_PALETTE = [
  { id: 'terracotta', name: 'Terracotta', hex: '#E2725B', sinhala: 'මැටි රතු', meaning: 'Traditional Clay' },
  { id: 'ochre', name: 'Ochre', hex: '#CC7722', sinhala: 'තැඹිලි දුඹුරු', meaning: 'Earth Pigment' },
  { id: 'crimson', name: 'Crimson', hex: '#DC143C', sinhala: 'රතු', meaning: 'Power & Energy' },
  { id: 'gold', name: 'Royal Gold', hex: '#FFD700', sinhala: 'රන්', meaning: 'Divinity & Royalty' },
  { id: 'black', name: 'Deep Black', hex: '#2C2416', sinhala: 'කළු', meaning: 'Ancient Ink' },
  { id: 'blue', name: 'Ocean Blue', hex: '#1E90FF', sinhala: 'නිල්', meaning: 'Sky & Water' },
  { id: 'green', name: 'Forest Green', hex: '#228B22', sinhala: 'කොළ', meaning: 'Nature & Life' },
  { id: 'white', name: 'Pure White', hex: '#FFFFFF', sinhala: 'සුදු', meaning: 'Purity' },
  { id: 'brown', name: 'Earth Brown', hex: '#8B4513', sinhala: 'දුඹුරු', meaning: 'Stability' },
  { id: 'burnt-orange', name: 'Burnt Orange', hex: '#CC5500', sinhala: 'තැඹිලි', meaning: 'Fire' },
  { id: 'ivory', name: 'Ivory', hex: '#FFFFF0', sinhala: 'ඇතින්', meaning: 'Elegance' },
  { id: 'jade', name: 'Jade Green', hex: '#00A86B', sinhala: 'මරකත', meaning: 'Precious Stone' },
];

// Available pots for coloring (using Pot-deco images)
const AVAILABLE_POTS = [
  { id: 'pot1', name: 'Ancient Clay Vessel', displayImage: 'Pot (1).jpg', coloringImage: 'Pot-deco (1).png' },
  { id: 'pot2', name: 'Decorated Urn', displayImage: 'Pot (3).jpg', coloringImage: 'Pot-deco (2).png' },
  { id: 'pot3', name: 'Traditional Pot', displayImage: 'Pot (4).jpg', coloringImage: 'Pot-deco (3).png' },
  { id: 'pot4', name: 'Ceremonial Vessel', displayImage: 'Pot (5).jpg', coloringImage: 'Pot-deco (4).png' },
];

// ============================================================================
// FLOOD FILL ALGORITHM UTILITIES
// ============================================================================

/** Convert hex color string to RGBA array */
const hexToRgba = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
    255
  ] : [0, 0, 0, 255];
};

/** Get pixel color at (x, y) position */
const getPixel = (data, width, x, y) => {
  const idx = (y * width + x) * 4;
  return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
};

/** Set pixel color at (x, y) position */
const setPixel = (data, width, x, y, color) => {
  const idx = (y * width + x) * 4;
  data[idx] = color[0];
  data[idx + 1] = color[1];
  data[idx + 2] = color[2];
  data[idx + 3] = color[3];
};

/** Check if two colors match within tolerance */
const colorsMatch = (c1, c2, tolerance = 32) => {
  return Math.abs(c1[0] - c2[0]) <= tolerance &&
    Math.abs(c1[1] - c2[1]) <= tolerance &&
    Math.abs(c1[2] - c2[2]) <= tolerance &&
    Math.abs(c1[3] - c2[3]) <= tolerance;
};

/** Check if pixel is a boundary (black/dark line) */
const isBoundary = (color, threshold = 100) => {
  const brightness = (color[0] * 0.299 + color[1] * 0.587 + color[2] * 0.114);
  return brightness < threshold && color[3] > 200;
};

/**
 * Stack-based flood fill algorithm (non-recursive)
 * Fills a region with the target color
 */
const floodFill = (imageData, startX, startY, fillColor) => {
  const { data, width, height } = imageData;
  const targetColor = getPixel(data, width, startX, startY);
  const fillRgba = hexToRgba(fillColor);

  // Don't fill if clicking on the same color or a boundary
  if (colorsMatch(targetColor, fillRgba) || isBoundary(targetColor)) {
    return;
  }

  const stack = [[startX, startY]];
  const visited = new Set();

  while (stack.length > 0) {
    const [x, y] = stack.pop();
    const key = `${x},${y}`;

    // Skip if out of bounds or already visited
    if (x < 0 || x >= width || y < 0 || y >= height || visited.has(key)) {
      continue;
    }

    visited.add(key);
    const currentColor = getPixel(data, width, x, y);

    // Stop at boundaries and different colors
    if (isBoundary(currentColor) || !colorsMatch(currentColor, targetColor)) {
      continue;
    }

    // Fill the pixel
    setPixel(data, width, x, y, fillRgba);

    // Add neighbors to stack (4-way connectivity)
    stack.push([x + 1, y]);
    stack.push([x - 1, y]);
    stack.push([x, y + 1]);
    stack.push([x, y - 1]);
  }
};

// ============================================================================
// POT COLORING COMPONENT
// ============================================================================

const PotColoring = ({ onBackToMenu }) => {
  const canvasRef = useRef(null);
  const originalImageRef = useRef(null);
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const [selectedPot, setSelectedPot] = useState(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 1000 });
  const [hoveredCard, setHoveredCard] = useState(null);
  const [mode, setMode] = useState('select'); // 'select' or 'color'

  // Calculate canvas size based on window
  useEffect(() => {
    const updateCanvasSize = () => {
      const maxWidth = Math.min(window.innerWidth * 0.5, 800);
      const maxHeight = Math.min(window.innerHeight * 0.7, 1000);
      setCanvasSize({ width: maxWidth, height: maxHeight });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Load the selected pot image
  useEffect(() => {
    if (!selectedPot || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const img = new Image();
    
    img.onload = () => {
      originalImageRef.current = img;
      
      // Calculate scaling to fit canvas while maintaining aspect ratio
      const scale = Math.min(
        canvasSize.width / img.width,
        canvasSize.height / img.height
      );
      
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      
      // Set canvas to scaled size
      canvas.width = scaledWidth;
      canvas.height = scaledHeight;
      
      // Draw the image
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);
      
      setIsImageLoaded(true);
    };
    
    img.src = selectedPot.coloringImage;
  }, [selectedPot, canvasSize]);

  // Handle canvas click for coloring
  const handleCanvasClick = useCallback((event) => {
    if (!isImageLoaded || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const rect = canvas.getBoundingClientRect();
    
    // Calculate click position relative to canvas
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((event.clientX - rect.left) * scaleX);
    const y = Math.floor((event.clientY - rect.top) * scaleY);

    // Get current image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Apply flood fill
    floodFill(imageData, x, y, selectedColor.hex);
    
    // Put the modified image data back
    ctx.putImageData(imageData, 0, 0);
  }, [isImageLoaded, selectedColor]);

  // Reset canvas to original image
  const handleReset = useCallback(() => {
    if (!originalImageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(originalImageRef.current, 0, 0, canvas.width, canvas.height);
  }, []);

  // Download the colored pot
  const handleDownload = useCallback(() => {
    if (!canvasRef.current) return;

    const link = document.createElement('a');
    link.download = `colored-pot-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  }, []);

  // Select a new pot
  const handleSelectPot = (pot) => {
    setSelectedPot(pot);
    setMode('color');
    setIsImageLoaded(false);
  };

  // Go back to pot selection
  const handleBackToSelection = () => {
    setMode('select');
    setSelectedPot(null);
    setIsImageLoaded(false);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100 overflow-y-auto">
      {/* POT SELECTION MODE */}
      {mode === 'select' && (
        <div className="w-full min-h-screen px-8 py-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto pb-20">
            {/* Header */}
            <div className="text-center mb-12 relative">
              {onBackToMenu && (
                <button
                  onClick={onBackToMenu}
                  className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-xl border-2 border-stone-200 text-museum-primary px-8 py-4 rounded-2xl font-bold text-lg hover:bg-stone-50 hover:border-museum-accent transition-all shadow-lg flex items-center gap-3 group"
                >
                  <span className="text-2xl group-hover:-translate-x-1 transition-transform">←</span>
                  <span>BACK TO MENU</span>
                </button>
              )}
              <h1 className="text-6xl font-serif font-bold text-museum-primary mb-4 drop-shadow-sm">
                🎨 Pot Coloring Experience
              </h1>
              <p className="text-2xl text-museum-secondary font-light">
                Select a pot to bring it to life with vibrant colors
              </p>
            </div>

            {/* Pot Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 pb-32">
              {AVAILABLE_POTS.map((pot) => (
                <div
                  key={pot.id}
                  className="bg-white border-2 border-stone-200 rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-2xl group"
                  style={{
                    transform: hoveredCard === pot.id ? 'translateY(-12px) scale(1.02)' : 'none',
                    borderColor: hoveredCard === pot.id ? '#C2410C' : '#E5E7EB',
                  }}
                  onMouseEnter={() => setHoveredCard(pot.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => handleSelectPot(pot)}
                >
                  <div className="h-[450px] bg-gradient-to-b from-stone-50 to-white flex items-center justify-center p-12 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-stone-100/30 z-10" />
                    <img
                      src={pot.displayImage}
                      alt={pot.name}
                      className="h-full object-contain filter drop-shadow-2xl transition-transform duration-700 ease-out z-0"
                      style={{
                        transform: hoveredCard === pot.id ? 'scale(1.1) rotate(2deg)' : 'scale(1)',
                      }}
                    />
                  </div>

                  <div className="p-10 bg-white border-t-2 border-stone-100">
                    <h3 className="text-3xl font-serif font-bold text-museum-primary mb-4 group-hover:text-museum-accent transition-colors">
                      {pot.name}
                    </h3>
                    <p className="text-xl text-museum-secondary mb-6 leading-relaxed font-light italic">
                      "Add your creative touch to this ancient pottery design"
                    </p>

                    <div className="flex flex-wrap gap-3 mb-6">
                      <span className="px-5 py-2 rounded-full bg-amber-50 border-2 border-amber-200 text-sm text-museum-primary font-bold tracking-wider">
                        🏺 Ancient Design
                      </span>
                      <span className="px-5 py-2 rounded-full bg-blue-50 border-2 border-blue-200 text-sm text-museum-primary font-bold tracking-wider">
                        🎨 Colorable
                      </span>
                    </div>

                    <button className="w-full py-6 bg-gradient-to-r from-museum-primary to-museum-accent text-white font-bold tracking-widest text-xl rounded-2xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 group-hover:scale-105 active:scale-95">
                      <span className="text-2xl">✨</span> START COLORING
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* COLORING MODE */}
      {mode === 'color' && selectedPot && (
        <div className="w-full min-h-screen flex flex-col">
          {/* Top Header Bar */}
          <div className="bg-white border-b-4 border-stone-200 shadow-xl px-8 py-6 z-20 flex-shrink-0">
            <div className="max-w-[1800px] mx-auto flex justify-between items-center">
              <div className="flex items-center gap-6">
                <button
                  onClick={handleBackToSelection}
                  className="bg-stone-100 border-2 border-stone-300 text-museum-primary px-6 py-3 rounded-xl font-bold text-lg hover:bg-stone-200 transition-all flex items-center gap-2 group"
                >
                  <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span>
                  <span>CHANGE POT</span>
                </button>
                <h2 className="text-3xl font-serif font-bold text-museum-primary">
                  Coloring: {selectedPot.name}
                </h2>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={handleReset}
                  className="bg-amber-100 border-2 border-amber-300 text-amber-900 px-6 py-3 rounded-xl font-bold text-lg hover:bg-amber-200 transition-all flex items-center gap-2"
                >
                  <span className="text-xl">↻</span>
                  <span>RESET</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="bg-green-500 border-2 border-green-600 text-white px-6 py-3 rounded-xl font-bold text-lg hover:bg-green-600 transition-all flex items-center gap-2"
                >
                  <span className="text-xl">💾</span>
                  <span>DOWNLOAD</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex min-h-0">
            {/* Left Sidebar - Color Palette */}
            <div className="w-80 bg-white border-r-4 border-stone-200 p-6 overflow-y-auto shadow-xl flex-shrink-0" style={{ maxHeight: 'calc(100vh - 120px)' }}>
              <div>
                <h3 className="text-2xl font-serif font-bold text-museum-primary mb-6 pb-3 border-b-2 border-stone-200">
                  🎨 Color Palette
                </h3>
                <p className="text-base text-museum-secondary mb-6 italic">
                  Click a color, then click on the pot to fill
                </p>
                
                <div className="space-y-3">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setSelectedColor(color)}
                      className={`w-full p-4 rounded-xl border-3 transition-all duration-200 group ${
                        selectedColor.id === color.id
                          ? 'border-museum-accent shadow-2xl scale-105 ring-4 ring-museum-accent/30'
                          : 'border-stone-300 hover:border-stone-400 hover:shadow-lg'
                      }`}
                      style={{
                        backgroundColor: selectedColor.id === color.id ? `${color.hex}15` : 'white'
                      }}
                    >
                      <div className="flex items-center gap-4">
                        {/* Color Swatch */}
                        <div 
                          className="w-16 h-16 rounded-lg border-2 border-stone-300 shadow-md flex-shrink-0 transition-transform group-hover:scale-110"
                          style={{ 
                            backgroundColor: color.hex,
                            boxShadow: selectedColor.id === color.id ? `0 0 20px ${color.hex}80` : 'none'
                          }}
                        />
                        
                        {/* Color Info */}
                        <div className="text-left flex-1">
                          <div className="font-bold text-lg text-museum-primary">
                            {color.name}
                          </div>
                          <div className="text-sm text-museum-secondary italic">
                            {color.meaning}
                          </div>
                          <div className="text-xs text-stone-400 mt-1 font-mono">
                            {color.hex}
                          </div>
                        </div>

                        {/* Selected Indicator */}
                        {selectedColor.id === color.id && (
                          <div className="text-3xl">✓</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Center - Canvas Area */}
            <div className="flex-1 flex items-center justify-center p-12 bg-gradient-to-br from-stone-50 via-amber-50/20 to-stone-100 overflow-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
              <div className="relative">
                {/* Canvas Container */}
                <div 
                  className="bg-white rounded-3xl shadow-2xl p-8 border-4 border-stone-200"
                  style={{
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    className="cursor-crosshair rounded-xl"
                    style={{
                      maxWidth: '100%',
                      height: 'auto',
                      imageRendering: 'crisp-edges'
                    }}
                  />
                </div>

                {/* Instructions Overlay */}
                {isImageLoaded && (
                  <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 bg-museum-primary text-white px-8 py-4 rounded-2xl shadow-xl whitespace-nowrap">
                    <p className="text-xl font-bold">
                      ✨ Click on the pot areas to fill them with color!
                    </p>
                  </div>
                )}

                {/* Loading State */}
                {!isImageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-3xl">
                    <div className="text-center">
                      <div className="text-6xl mb-4 animate-bounce">🏺</div>
                      <p className="text-2xl font-bold text-museum-primary">Loading pot...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar - Tips & Info */}
            <div className="w-80 bg-white border-l-4 border-stone-200 p-6 overflow-y-auto shadow-xl flex-shrink-0" style={{ maxHeight: 'calc(100vh - 120px)' }}>
              <div>
                <h3 className="text-2xl font-serif font-bold text-museum-primary mb-6 pb-3 border-b-2 border-stone-200">
                  💡 Coloring Tips
                </h3>
                
                <div className="space-y-4">
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                    <div className="text-3xl mb-2">🎨</div>
                    <h4 className="font-bold text-lg text-museum-primary mb-2">How to Color</h4>
                    <p className="text-sm text-museum-secondary">
                      Select a color from the palette, then click on any area of the pot to fill it with that color.
                    </p>
                  </div>

                  <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                    <div className="text-3xl mb-2">🖌️</div>
                    <h4 className="font-bold text-lg text-museum-primary mb-2">Change Colors</h4>
                    <p className="text-sm text-museum-secondary">
                      You can color the same area multiple times with different colors until you're happy with the result.
                    </p>
                  </div>

                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                    <div className="text-3xl mb-2">💾</div>
                    <h4 className="font-bold text-lg text-museum-primary mb-2">Save Your Work</h4>
                    <p className="text-sm text-museum-secondary">
                      Click the DOWNLOAD button to save your masterpiece as an image file!
                    </p>
                  </div>

                  <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                    <div className="text-3xl mb-2">↻</div>
                    <h4 className="font-bold text-lg text-museum-primary mb-2">Start Over</h4>
                    <p className="text-sm text-museum-secondary">
                      Use the RESET button to return the pot to its original uncolored state.
                    </p>
                  </div>

                  <div className="bg-rose-50 border-2 border-rose-200 rounded-xl p-4">
                    <div className="text-3xl mb-2">🏺</div>
                    <h4 className="font-bold text-lg text-museum-primary mb-2">Traditional Designs</h4>
                    <p className="text-sm text-museum-secondary">
                      These pot designs are inspired by ancient Sri Lankan pottery. Add your own creative interpretation!
                    </p>
                  </div>
                </div>

                {/* Current Color Display */}
                <div className="mt-8 bg-gradient-to-br from-stone-100 to-stone-50 border-2 border-stone-300 rounded-xl p-6">
                  <h4 className="font-bold text-lg text-museum-primary mb-4 text-center">
                    Active Color
                  </h4>
                  <div 
                    className="w-full h-24 rounded-xl border-3 border-white shadow-lg mb-3"
                    style={{ 
                      backgroundColor: selectedColor.hex,
                      boxShadow: `0 8px 16px ${selectedColor.hex}40, inset 0 2px 4px rgba(255,255,255,0.3)`
                    }}
                  />
                  <div className="text-center">
                    <div className="font-bold text-xl text-museum-primary">
                      {selectedColor.name}
                    </div>
                    <div className="text-sm text-museum-secondary italic mt-1">
                      {selectedColor.meaning}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PotColoring;

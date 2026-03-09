/**
 * ============================================================================
 * MUSEUM KIOSK - TRADITIONAL MASK COLORING EXPERIENCE
 * ============================================================================
 * Design Theme: "Modern Heritage" - Big, Bold, Accessible
 * Target: Large-format digital kiosk displays (British Museum / Smithsonian style)
 * 
 * Features:
 * - Stack-based flood fill algorithm (non-recursive)
 * - Sobel edge detection for line art conversion
 * - Touch-friendly 80px+ color buttons with glowing active states
 * - Canvas-centered layout (60-70% of screen)
 * - Large typography (2-3rem headings, 1.5rem instructions)
 * - Proper coordinate scaling for all resolutions
 * ============================================================================
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Papa from 'papaparse';
import GameUI from '../GameUI';


// ============================================================================
// TRADITIONAL SRI LANKAN COLOR PALETTE - MUSEUM COLLECTION
// ============================================================================
const COLOR_PALETTE = [
  { id: 'crimson', name: 'Crimson', hex: '#DC143C', sinhala: 'රතු', meaning: 'Power & Protection' },
  { id: 'gold', name: 'Royal Gold', hex: '#FFD700', sinhala: 'රන්', meaning: 'Divinity & Royalty' },
  { id: 'black', name: 'Deep Black', hex: '#1a1a1a', sinhala: 'කළු', meaning: 'Mystery & Demons' },
  { id: 'blue', name: 'Ocean Blue', hex: '#1E90FF', sinhala: 'නිල්', meaning: 'Sky & Water' },
  { id: 'green', name: 'Forest', hex: '#228B22', sinhala: 'කොළ', meaning: 'Nature & Life' },
  { id: 'white', name: 'Pure White', hex: '#FFFFFF', sinhala: 'සුදු', meaning: 'Purity & Peace' },
  { id: 'orange', name: 'Sunset', hex: '#FF6600', sinhala: 'තැඹිලි', meaning: 'Energy & Fire' },
  { id: 'brown', name: 'Earth', hex: '#8B4513', sinhala: 'දුඹුරු', meaning: 'Stability' },
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
    Math.abs(c1[2] - c2[2]) <= tolerance;
};

/** Check if pixel is a boundary (black/dark line) */
const isBoundary = (color, threshold = 80) => {
  const brightness = (color[0] * 0.299 + color[1] * 0.587 + color[2] * 0.114);
  return brightness < threshold && color[3] > 200;
};

// ============================================================================
// SOBEL EDGE DETECTION - LINE ART CONVERSION
// ============================================================================

/**
 * Convert image to clean line art using Sobel edge detection
 * Creates black outlines on white background for coloring
 */
const convertToLineArt = (imageData, width, height) => {
  const src = new Uint8ClampedArray(imageData.data);
  const dst = imageData.data;

  // Step 1: Convert to grayscale
  const grayscale = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const gray = Math.round(src[idx] * 0.299 + src[idx + 1] * 0.587 + src[idx + 2] * 0.114);
      grayscale[y * width + x] = gray;
    }
  }

  // Step 2: Apply Sobel edge detection
  const edges = new Uint8Array(width * height);
  const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
  const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const pixel = grayscale[(y + ky) * width + (x + kx)];
          gx += pixel * sobelX[ky + 1][kx + 1];
          gy += pixel * sobelY[ky + 1][kx + 1];
        }
      }
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      edges[y * width + x] = Math.min(255, magnitude);
    }
  }

  // Step 3: Threshold to create black/white image
  const edgeThreshold = 30;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const isEdge = edges[y * width + x] > edgeThreshold;
      const value = isEdge ? 0 : 255;
      dst[idx] = value;
      dst[idx + 1] = value;
      dst[idx + 2] = value;
      dst[idx + 3] = 255;
    }
  }

  return imageData;
};

// ============================================================================
// STACK-BASED SCANLINE FLOOD FILL ALGORITHM (Non-recursive)
// ============================================================================

/**
 * Stack-based scanline flood fill algorithm
 * Colors specific shapes within outlines, not rectangular blocks
 * Non-recursive to prevent stack overflow on large areas
 */
const floodFill = (imageData, startX, startY, fillColorHex) => {
  const { width, height, data } = imageData;
  const fillColor = hexToRgba(fillColorHex);
  const startColor = getPixel(data, width, startX, startY);

  // Don't fill if clicking on boundary or same color
  if (isBoundary(startColor)) return imageData;
  if (colorsMatch(startColor, fillColor, 5)) return imageData;

  const visited = new Uint8Array(width * height);
  const stack = [[startX, startY]];

  const canFill = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    const idx = y * width + x;
    if (visited[idx]) return false;
    const pixel = getPixel(data, width, x, y);
    if (isBoundary(pixel)) return false;
    return colorsMatch(pixel, startColor, 40);
  };

  let filledCount = 0;

  while (stack.length > 0) {
    const [px, py] = stack.pop();
    if (!canFill(px, py)) continue;

    // Find left edge
    let x = px;
    while (x > 0 && canFill(x - 1, py)) x--;

    let spanAbove = false;
    let spanBelow = false;

    // Fill right while checking above and below
    while (x < width && canFill(x, py)) {
      const idx = py * width + x;
      visited[idx] = 1;
      setPixel(data, width, x, py, fillColor);
      filledCount++;

      // Check above
      if (py > 0) {
        if (canFill(x, py - 1)) {
          if (!spanAbove) {
            stack.push([x, py - 1]);
            spanAbove = true;
          }
        } else {
          spanAbove = false;
        }
      }

      // Check below
      if (py < height - 1) {
        if (canFill(x, py + 1)) {
          if (!spanBelow) {
            stack.push([x, py + 1]);
            spanBelow = true;
          }
        } else {
          spanBelow = false;
        }
      }

      x++;
    }
  }

  console.log(`Flood fill completed: ${filledCount} pixels colored`);
  return imageData;
};

// ============================================================================
// MAIN MUSEUM KIOSK COMPONENT
// ============================================================================

function MaskColoring({ gameState, updateGameState, onBackToMenu }) {
  // ========== STATE ==========
  const [masks, setMasks] = useState([]);
  const [selectedMask, setSelectedMask] = useState(null);
  const [activeColor, setActiveColor] = useState(COLOR_PALETTE[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [masksLoading, setMasksLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [zoom, setZoom] = useState(1);
  const [hoveredCard, setHoveredCard] = useState(null);

  // ========== REFS ==========
  const canvasRef = useRef(null);
  const originalImageRef = useRef(null);

  // Canvas dimensions for large kiosk display
  const canvasSize = { width: 800, height: 900 };

  // ========== LOAD MASKS FROM CSV ==========
  useEffect(() => {
    const loadMasks = async () => {
      try {
        const response = await fetch('/data/kolamMasksData.csv');
        const csvText = await response.text();

        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const loadedMasks = results.data.map(row => ({
              id: row.id,
              name: row.name,
              src: 'mask (' + (results.data.indexOf(row) + 1) + ').png',
              displayImage: row.src,
              origin: row.origin || 'Southern Province',
              shortDescription: row.shortDescription,
              maskType: row.maskType,
              carvingTime: row.carvingTime,
            }));
            setMasks(loadedMasks);
            setMasksLoading(false);
          },
        });
      } catch (error) {
        console.error('Error loading masks:', error);
        setMasksLoading(false);
      }
    };
    loadMasks();
  }, []);

  // ========== RESET PROGRESS ON SELECTION ==========
  useEffect(() => {
    if (selectedMask) {
      updateGameState({
        progress: { ...gameState.progress, mask: 0 }
      });
    }
  }, [selectedMask]);

  // ========== LOAD AND PROCESS IMAGE ==========
  useEffect(() => {
    if (!selectedMask || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const img = new Image();

    img.onload = () => {
      // Clear canvas with white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Scale and center the image
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.9;
      const x = (canvas.width - img.width * scale) / 2;
      const y = (canvas.height - img.height * scale) / 2;

      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

      // Convert to line art
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const lineArt = convertToLineArt(imageData, canvas.width, canvas.height);
      ctx.putImageData(lineArt, 0, 0);

      // Store original for reset
      originalImageRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([originalImageRef.current]);
      setHistoryIndex(0);
      setIsLoading(false);
    };

    img.onerror = () => {
      console.error('Failed to load mask image');
      setIsLoading(false);
    };

    setIsLoading(true);
    img.src = selectedMask.src;
  }, [selectedMask]);

  // ========== CANVAS CLICK - FLOOD FILL ==========
  const handleCanvasClick = useCallback((e) => {
    if (!selectedMask || isLoading) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) return;

    // Perform flood fill
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const filled = floodFill(imageData, x, y, activeColor.hex);

    // Check if anything actually changed (floodFill returns same object if click on boundary/same color)
    ctx.putImageData(filled, 0, 0);

    // Update history for undo
    const newHistory = history.slice(0, historyIndex + 1);
    const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    newHistory.push(currentFrame);
    if (newHistory.length > 30) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    // Award points and update progress
    // We treat each unique coloring action as progress
    const newProgress = Math.min((historyIndex + 2) * 5, 100); // 5% per click up to 100%
    updateGameState({
      score: gameState.score + 100,
      progress: { ...gameState.progress, mask: newProgress / 100 }
    });
  }, [activeColor, selectedMask, isLoading, history, historyIndex, gameState, updateGameState]);

  // ========== UNDO ==========
  const handleUndo = () => {
    if (historyIndex > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.putImageData(history[historyIndex - 1], 0, 0);
      setHistoryIndex(historyIndex - 1);

      // Update progress and subtract points
      const newProgress = Math.min((historyIndex) * 5, 100);
      updateGameState({
        score: Math.max(0, gameState.score - 100),
        progress: { ...gameState.progress, mask: newProgress / 100 }
      });
    }
  };

  // ========== RESET MASK (with icon) ==========
  const handleReset = () => {
    if (originalImageRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.putImageData(originalImageRef.current, 0, 0);
      setHistory([originalImageRef.current]);
      setHistoryIndex(0);

      // Reset progress (don't subtract all points, just stay at current score but reset progress)
      updateGameState({
        progress: { ...gameState.progress, mask: 0 }
      });
    }
  };

  // ========== SAVE ARTWORK ==========
  const handleSave = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `${selectedMask?.name || 'mask'}_colored.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // ========== ZOOM CONTROLS ==========
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  // ============================================================================
  // RENDER: LOADING STATE
  // ============================================================================
  if (masksLoading) {
    return (
      <div className="w-full h-full min-h-[600px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 bg-white/90 p-12 rounded-3xl border border-stone-200 backdrop-blur-xl shadow-xl">
          <div className="w-16 h-16 border-4 border-museum-accent/20 border-t-museum-accent rounded-full animate-spin"></div>
          <p className="text-xl text-museum-primary font-serif tracking-wider animate-pulse">Loading Museum Collection...</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: MASK SELECTION SCREEN
  // ============================================================================
  if (!selectedMask) {
    return (
      <div className="w-full h-full px-8 py-8">
        <div className="flex flex-col gap-8 animate-fade-in">
          {/* Title */}
          <div className="text-center mb-4 relative">
            {onBackToMenu && (
              <button
                className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-xl border border-stone-200 text-museum-primary px-6 py-3 rounded-xl font-semibold hover:bg-stone-50 hover:border-museum-accent transition-all shadow-md flex items-center gap-2 group"
                onClick={onBackToMenu}
              >
                <span className="group-hover:-translate-x-1 transition-transform">←</span>
                <span>BACK TO MENU</span>
              </button>
            )}
            <h1 className="text-5xl font-serif font-bold text-museum-primary mb-2 drop-shadow-sm">
              🎭 Traditional Mask Coloring
            </h1>
            <p className="text-xl text-museum-secondary font-light">
              Select a sacred Sri Lankan mask to begin your artistic journey
            </p>
          </div>

          {/* Mask Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8 pb-20">
            {masks.map((mask) => (
              <div
                key={mask.id}
                className="bg-white border border-stone-200 rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-xl group flex flex-col h-full"
                style={{
                  transform: hoveredCard === mask.id ? 'translateY(-10px)' : 'none',
                  borderColor: hoveredCard === mask.id ? '#C2410C' : '#E5E7EB',
                }}
                onMouseEnter={() => setHoveredCard(mask.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => setSelectedMask(mask)}
              >
                <div className="h-[400px] bg-stone-50 flex items-center justify-center p-10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-stone-100/50 z-10" />
                  <img
                    src={mask.displayImage}
                    alt={mask.name}
                    className="h-full object-contain filter drop-shadow-2xl transition-transform duration-700 ease-out z-0"
                    style={{
                      transform: hoveredCard === mask.id ? 'scale(1.15)' : 'none',
                    }}
                  />
                </div>

                <div className="p-10 flex-1 flex flex-col bg-white border-t border-stone-100">
                  <h3 className="text-3xl font-serif font-bold text-museum-primary mb-4 group-hover:text-museum-accent transition-colors">{mask.name}</h3>
                  <p className="text-lg text-museum-secondary mb-8 leading-relaxed flex-1 font-light italic">"{mask.shortDescription}"</p>

                  <div className="flex flex-wrap gap-3 mb-8">
                    <span className="px-4 py-2 rounded-full bg-stone-100 border border-stone-200 text-sm text-museum-primary font-bold tracking-wider flex items-center gap-2">📍 {mask.origin}</span>
                    <span className="px-4 py-2 rounded-full bg-stone-100 border border-stone-200 text-sm text-museum-primary font-bold tracking-wider flex items-center gap-2">🎭 {mask.maskType}</span>
                  </div>

                  <button className="w-full py-5 bg-museum-primary text-white font-bold tracking-widest text-lg rounded-2xl hover:bg-black transition-all shadow-lg flex items-center justify-center gap-3 group-hover:shadow-2xl active:scale-95">
                    <span>🎨</span> START COLORING
                  </button>
                </div>
              </div>
            ))}
          </div>


        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: COLORING SCREEN (MAIN KIOSK INTERFACE)
  // ============================================================================
  return (
    <div className="w-full h-full flex flex-col p-4 relative">
      {/* Header */}
      <header className="flex flex-col items-center mb-6 z-10 relative">
        <button
          className="absolute left-4 top-0 bg-white/90 backdrop-blur-xl border border-stone-200 text-museum-primary px-5 py-2 rounded-xl font-semibold hover:bg-stone-50 hover:border-museum-accent transition-all shadow-sm flex items-center gap-2 group"
          onClick={() => setSelectedMask(null)}
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          <span className="text-sm">BACK TO MASKS</span>
        </button>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-museum-primary drop-shadow-sm mb-2">{selectedMask.name}</h1>
        <p className="text-lg text-museum-secondary font-medium tracking-wide">Touch any white area to fill with your selected color</p>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
        {/* Canvas Section */}
        <div className="flex-1 flex flex-col relative bg-stone-100 rounded-3xl border border-stone-200 overflow-hidden group bg-[url('/assets/textures/graph-paper.png')]">
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-white/90 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
                <div className="w-12 h-12 border-4 border-museum-accent/30 border-t-museum-accent rounded-full animate-spin mb-4"></div>
                <p className="text-museum-primary tracking-widest text-sm uppercase">Preparing Canvas...</p>
              </div>
            )}

            {/* Canvas */}
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              onClick={handleCanvasClick}
              className="max-w-full max-h-full object-contain cursor-crosshair drop-shadow-xl transition-transform duration-200 ease-out"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
              }}
            />
          </div>

          {/* Zoom Controls */}
          <div className="absolute bottom-6 right-6 flex flex-col gap-2 bg-white/90 backdrop-blur-md p-2 rounded-2xl border border-stone-200 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button className="w-10 h-10 flex items-center justify-center bg-stone-100 rounded-xl text-xl hover:bg-museum-primary hover:text-white transition-colors" onClick={handleZoomIn} disabled={zoom >= 2.5}>+</button>
            <span className="text-center text-xs font-bold text-museum-primary">{Math.round(zoom * 100)}%</span>
            <button className="w-10 h-10 flex items-center justify-center bg-stone-100 rounded-xl text-xl hover:bg-museum-primary hover:text-white transition-colors" onClick={handleZoomOut} disabled={zoom <= 0.5}>−</button>
            <div className="h-px bg-stone-200 my-1"></div>
            <button className="w-10 h-10 flex items-center justify-center bg-stone-100 rounded-xl text-xl hover:bg-museum-primary hover:text-white transition-colors" onClick={handleResetZoom}>⟲</button>
          </div>

          {/* Instructions */}
          <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md px-6 py-3 rounded-full border border-stone-200 text-sm text-museum-secondary pointer-events-none shadow-sm">
            <span className="mr-4">🖌️ <strong>Tap</strong> to fill</span>
            <span className="mr-4">🔍 <strong>Zoom</strong> for detail</span>
            <span>↩️ <strong>Undo</strong> mistakes</span>
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-full lg:w-96 flex flex-col gap-6 shrink-0">
          {/* Color Palette Panel */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 flex flex-col flex-1 shadow-lg">
            <h2 className="text-xl font-serif font-bold text-museum-primary mb-4 flex items-center gap-2">
              <span>🎨</span> Color Palette
            </h2>

            <div className="grid grid-cols-2 gap-3 mb-6 overflow-y-auto pr-2 custom-scrollbar flex-1 min-h-[300px]">
              {COLOR_PALETTE.map((color) => (
                <button
                  key={color.id}
                  className={`relative w-full aspect-square rounded-2xl shadow-sm transition-all duration-200 group overflow-hidden border-4
                    ${activeColor.id === color.id ? 'border-museum-primary scale-95 ring-4 ring-stone-200 z-10' : 'border-transparent hover:scale-105 hover:z-10'}`}
                  style={{ backgroundColor: color.hex }}
                  onClick={() => setActiveColor(color)}
                >
                  <div className={`absolute inset-x-0 bottom-0 bg-white/80 p-2 text-center backdrop-blur-sm transform transition-transform duration-300 ${activeColor.id === color.id ? 'translate-y-0' : 'translate-y-full group-hover:translate-y-0'}`}>
                    <span className="text-xs font-bold text-museum-primary uppercase tracking-wider">{color.name}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Active Color Info */}
            <div className="mt-auto bg-stone-50 rounded-2xl p-4 border border-stone-200 flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-full border-2 border-stone-200 shadow-inner"
                style={{ backgroundColor: activeColor.hex }}
              />
              <div>
                <p className="text-museum-primary font-bold">{activeColor.name}</p>
                <p className="text-xs text-museum-secondary italic">"{activeColor.meaning}"</p>
              </div>
            </div>
          </div>

          {/* Action Buttons Panel */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-lg">
            <h2 className="text-xl font-serif font-bold text-museum-primary mb-4 flex items-center gap-2">
              <span>⚡</span> Actions
            </h2>

            <div className="flex flex-col gap-3">
              <button
                className="w-full py-3 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-xl text-museum-primary font-bold tracking-wide transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
              >
                <span>↩️</span> UNDO
              </button>

              <button
                className="w-full py-3 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-red-700 font-bold tracking-wide transition-all active:scale-95 flex items-center justify-center gap-2"
                onClick={handleReset}
              >
                <span>🔄</span> RESET
              </button>

              <button
                className="w-full py-4 mt-2 bg-museum-primary hover:bg-black text-white font-bold tracking-widest text-lg rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                onClick={handleSave}
              >
                <span>💾</span> SAVE ARTWORK
              </button>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}

export default MaskColoring;

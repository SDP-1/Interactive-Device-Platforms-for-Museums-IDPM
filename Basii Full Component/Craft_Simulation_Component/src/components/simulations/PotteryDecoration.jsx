/**
 * ============================================================================
 * MUSEUM KIOSK - POTTERY RESTORATION & DECORATION
 * ============================================================================
 * Design Theme: "Modern Heritage" - Big, Bold, Accessible
 * Target: Large-format digital kiosk displays
 * ============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Group, Circle } from 'react-konva';
import PotColoring from './PotColoring';

// Available pots
const AVAILABLE_POTS = [
  { id: 'pot1', name: 'Ancient Clay Pot', image: 'Pot (1).jpg' },
  { id: 'pot3', name: 'Decorated Vessel', image: 'Pot (3).jpg' },
  { id: 'pot4', name: 'Traditional Pot', image: 'Pot (4).jpg' },
  { id: 'pot5', name: 'Ceremonial Pot', image: 'Pot (5).jpg' },
];

// Decoration patterns that can be added to pots
const DECORATIONS = [
  { id: 'lotus', name: 'Lotus', color: '#8B4513', symbol: '🪷' },
  { id: 'spiral', name: 'Spiral', color: '#654321', symbol: '🌀' },
  { id: 'wave', name: 'Wave', color: '#2C5F2D', symbol: '〰️' },
  { id: 'dots', name: 'Dots', color: '#8B0000', symbol: '⚫' },
  { id: 'zigzag', name: 'Zigzag', color: '#DAA520', symbol: '⚡' },
  { id: 'triangle', name: 'Triangle', color: '#4A4A4A', symbol: '▲' },
];

// Pot piece component - displays a cropped section of the pot image
const PotPiece = ({ piece, onDragEnd, isDragging, isRestored, potImage }) => {
  const imageRef = useRef();

  return (
    <Group
      x={piece.x}
      y={piece.y}
      draggable={!isRestored}
      rotation={piece.rotation || 0}
      onDragEnd={(e) => onDragEnd(piece.id, e.target.x(), e.target.y())}
      shadowBlur={isDragging ? 15 : 5}
      shadowColor="black"
      shadowOpacity={0.4}
    >
      <KonvaImage
        ref={imageRef}
        image={potImage}
        x={0}
        y={0}
        width={piece.fullWidth}
        height={piece.fullHeight}
        crop={{
          x: piece.cropX,
          y: piece.cropY,
          width: piece.cropWidth,
          height: piece.cropHeight
        }}
      />
    </Group>
  );
};

const PotteryDecoration = ({ gameState, updateGameState, onBackToMenu }) => {
  const [selectedPot, setSelectedPot] = useState(null);
  const [mode, setMode] = useState('select'); // 'select', 'restore', 'decorate', 'color'
  const [potPieces, setPotPieces] = useState([]);
  const [restoredPieces, setRestoredPieces] = useState([]);
  const [decorations, setDecorations] = useState([]);
  const [selectedDecoration, setSelectedDecoration] = useState(null);
  const [potImage, setPotImage] = useState(null);
  const [undoStack, setUndoStack] = useState([]); // For undo functionality
  const [hoveredCard, setHoveredCard] = useState(null);
  const stageRef = useRef();
  const canvasWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const canvasHeight = typeof window !== 'undefined' ? window.innerHeight : 900;

  // Load pot image
  useEffect(() => {
    if (selectedPot) {
      const img = new window.Image();
      img.src = selectedPot.image;
      img.onload = () => {
        setPotImage(img);
      };
    }
  }, [selectedPot]);

  // Initialize pot pieces when entering restore mode
  useEffect(() => {
    if (mode === 'restore' && selectedPot && potPieces.length === 0 && potImage) {
      createPotPieces();
    }
  }, [mode, selectedPot, potImage]);

  const createPotPieces = () => {
    if (!potImage) return;

    // Calculate pot dimensions on canvas - centered
    const stageHeight = canvasHeight - 100; // Header space only
    const potWidth = 550;
    const potHeight = 800;
    const potX = (canvasWidth - potWidth) / 2; // Perfect center
    const potY = (stageHeight - potHeight) / 2;

    // Divide pot into 8 pieces (2 columns x 4 rows)
    const pieceWidth = potWidth / 2;
    const pieceHeight = potHeight / 4;

    const pieces = [];
    const types = ['top-left', 'top-right', 'upper-mid-left', 'upper-mid-right', 'lower-mid-left', 'lower-mid-right', 'bottom-left', 'bottom-right'];

    // Define left and right side boundaries - straight vertical columns
    const leftEdgeX = 40;
    const rightEdgeX = canvasWidth - pieceWidth - 40;

    // Create shuffled row positions for left and right sides separately
    const leftRowPositions = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
    const rightRowPositions = [0, 1, 2, 3].sort(() => Math.random() - 0.5);

    // Create left side pieces (indices 0-3)
    for (let i = 0; i < 4; i++) {
      const row = i;
      const col = 0; // Left column
      const index = row * 2 + col;
      const assignedRow = leftRowPositions[i];
      const originalY = 60 + assignedRow * (pieceHeight + 50);

      pieces.push({
        id: `piece-${index + 1}`,
        x: leftEdgeX,
        y: originalY,
        originalX: leftEdgeX,
        originalY: originalY,
        inCollection: true,
        correctX: potX + col * pieceWidth,
        correctY: potY + row * pieceHeight,
        cropX: col * (potImage.width / 2),
        cropY: row * (potImage.height / 4),
        cropWidth: potImage.width / 2,
        cropHeight: potImage.height / 4,
        fullWidth: pieceWidth,
        fullHeight: pieceHeight,
        pieceType: types[index],
        rotation: 0
      });
    }

    // Create right side pieces (indices 4-7)
    for (let i = 0; i < 4; i++) {
      const row = i + 2; // Offset for right side pieces
      const col = 1; // Right column
      const index = row * 2 + col;
      const assignedRow = rightRowPositions[i];
      const originalY = 60 + assignedRow * (pieceHeight + 50);

      pieces.push({
        id: `piece-${index + 1}`,
        x: rightEdgeX,
        y: originalY,
        originalX: rightEdgeX,
        originalY: originalY,
        inCollection: true,
        correctX: potX + col * pieceWidth,
        correctY: potY + (row - 2) * pieceHeight,
        cropX: col * (potImage.width / 2),
        cropY: (row - 2) * (potImage.height / 4),
        cropWidth: potImage.width / 2,
        cropHeight: potImage.height / 4,
        fullWidth: pieceWidth,
        fullHeight: pieceHeight,
        pieceType: types[index],
        rotation: 0
      });
    }

    setPotPieces(pieces);
    setRestoredPieces([]);
    setUndoStack([]); // Clear undo stack on new restore
  };

  const handlePieceFromCollection = (pieceId) => {
    const piece = potPieces.find(p => p.id === pieceId);
    if (!piece || !piece.inCollection) return;

    // Move piece from side to center of canvas
    const stageHeight = canvasHeight - 100;
    setPotPieces(prev => prev.map(p =>
      p.id === pieceId
        ? { ...p, x: canvasWidth / 2 - p.fullWidth / 2, y: stageHeight / 2 - p.fullHeight / 2, inCollection: false }
        : p
    ));
  };

  const handlePieceDragEnd = (pieceId, x, y) => {
    const piece = potPieces.find(p => p.id === pieceId);
    if (!piece) return;

    // Check if piece is close to correct position (auto-fit threshold)
    const threshold = 120; // Very generous threshold for easy auto-fitting
    const isCorrect = Math.abs(x - piece.correctX) < threshold &&
      Math.abs(y - piece.correctY) < threshold;

    if (isCorrect && !restoredPieces.includes(pieceId)) {
      // Save state to undo stack before making changes
      setUndoStack(prev => [...prev, { restored: [...restoredPieces], lastPieceId: pieceId }]);

      // Auto-fit/snap to correct position
      setPotPieces(prev => prev.map(p =>
        p.id === pieceId
          ? { ...p, x: piece.correctX, y: piece.correctY, rotation: 0 }
          : p
      ));
      setRestoredPieces(prev => [...prev, pieceId]);

      // Check if all pieces are restored
      // if (restoredPieces.length + 1 === potPieces.length) {
      //   setTimeout(() => {
      //     alert('Pot restored! Now you can color it!');
      //     setMode('color');
      //   }, 500);
      // }
    } else {
      // Update position
      setPotPieces(prev => prev.map(p =>
        p.id === pieceId ? { ...p, x, y } : p
      ));
    }
  };

  const handleCanvasClick = (e) => {
    if (mode !== 'decorate' || !selectedDecoration) return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();

    const newDecoration = {
      id: `dec-${Date.now()}`,
      type: selectedDecoration.id,
      x: point.x,
      y: point.y,
      color: selectedDecoration.color,
      size: 20
    };

    setDecorations(prev => [...prev, newDecoration]);
  };

  const resetPot = () => {
    setRestoredPieces([]);
    setDecorations([]);
    setUndoStack([]);
    createPotPieces(); // Recreate pieces
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;

    const lastState = undoStack[undoStack.length - 1];
    const pieceIdToUndo = lastState.lastPieceId;

    // Move the piece back to its original position on the side
    setPotPieces(prev => prev.map(p =>
      p.id === pieceIdToUndo
        ? { ...p, x: p.originalX, y: p.originalY, inCollection: true }
        : p
    ));

    // Restore the previous restored pieces array
    setRestoredPieces(lastState.restored);
    setUndoStack(prev => prev.slice(0, -1));
  };

  return (
    <div className="w-full h-screen overflow-y-auto relative">
      <div className="flex flex-col items-center min-h-full">
        {/* Pot Selection */}
        {mode === 'select' && (
          <div className="w-full min-h-screen px-8 py-8 overflow-y-auto">
            <div className="flex flex-col gap-8 animate-fade-in pb-20">{/* Title */}
              {/* Title */}
              <div className="text-center mb-4 relative">
                {onBackToMenu && (
                  <button
                    onClick={onBackToMenu}
                    className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-xl border border-stone-200 text-museum-primary px-6 py-3 rounded-xl font-semibold hover:bg-stone-50 hover:border-museum-accent transition-all shadow-md flex items-center gap-2 group"
                  >
                    <span className="group-hover:-translate-x-1 transition-transform">←</span>
                    <span>BACK TO MENU</span>
                  </button>
                )}
                <h1 className="text-5xl font-serif font-bold text-museum-primary mb-2 drop-shadow-sm">
                  🏺 Pottery Restoration & Decoration
                </h1>
                <p className="text-xl text-museum-secondary font-light">
                  Select an ancient pot to begin your restoration journey
                </p>
              </div>

              {/* Pot Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-8 pb-32">
                {AVAILABLE_POTS.map((pot) => (
                  <div
                    key={pot.id}
                    className="bg-white border border-stone-200 rounded-3xl overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-xl group flex flex-col h-full"
                    style={{
                      transform: hoveredCard === pot.id ? 'translateY(-10px)' : 'none',
                      borderColor: hoveredCard === pot.id ? '#C2410C' : '#E5E7EB',
                    }}
                    onMouseEnter={() => setHoveredCard(pot.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    onClick={() => {
                      setSelectedPot(pot);
                      setMode('restore');
                    }}
                  >
                    <div className="h-[400px] bg-stone-50 flex items-center justify-center p-10 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-stone-100/50 z-10" />
                      <img
                        src={pot.image}
                        alt={pot.name}
                        className="h-full object-contain filter drop-shadow-2xl transition-transform duration-700 ease-out z-0"
                        style={{
                          transform: hoveredCard === pot.id ? 'scale(1.15)' : 'none',
                        }}
                      />
                    </div>

                    <div className="p-10 flex-1 flex flex-col bg-white border-t border-stone-100">
                      <h3 className="text-3xl font-serif font-bold text-museum-primary mb-4 group-hover:text-museum-accent transition-colors">
                        {pot.name}
                      </h3>
                      <p className="text-lg text-museum-secondary mb-8 leading-relaxed flex-1 font-light italic">
                        "Carefully restore the broken pieces and decorate this ancient treasure"
                      </p>

                      <div className="flex flex-wrap gap-3 mb-8">
                        <span className="px-4 py-2 rounded-full bg-stone-100 border border-stone-200 text-sm text-museum-primary font-bold tracking-wider flex items-center gap-2">
                          🏛️ Museum Collection
                        </span>
                        <span className="px-4 py-2 rounded-full bg-stone-100 border border-stone-200 text-sm text-museum-primary font-bold tracking-wider flex items-center gap-2">
                          🎨 Interactive
                        </span>
                      </div>

                      <button className="w-full py-5 bg-museum-primary text-white font-bold tracking-widest text-lg rounded-2xl hover:bg-black transition-all shadow-lg flex items-center justify-center gap-3 group-hover:shadow-2xl active:scale-95">
                        <span>🔧</span> START RESTORATION
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Restoration Mode */}
        {mode === 'restore' && selectedPot && (
          <div className="w-full h-full flex flex-col bg-stone-50">
            {/* Header */}
            <div className="bg-white border-b-2 border-stone-200 p-4 shadow-md">
              <div className="flex justify-between items-center max-w-[1600px] mx-auto">
                <h2 className="text-2xl font-serif font-bold text-museum-primary">
                  Restore the {selectedPot.name}
                </h2>
                <div className="flex gap-4 items-center">
                  <div className="text-lg font-semibold text-museum-secondary">
                    Progress: {restoredPieces.length}/8 pieces
                  </div>
                  <button
                    onClick={handleUndo}
                    disabled={undoStack.length === 0}
                    className="px-4 py-2 bg-blue-200 rounded-lg hover:bg-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Undo last piece placement"
                  >
                    ↶ Undo
                  </button>
                  <button
                    onClick={resetPot}
                    className="px-4 py-2 bg-stone-200 rounded-lg hover:bg-stone-300 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Canvas Area - 4 pieces left column, pot centered, 4 pieces right column */}
            <div className="flex-1 overflow-hidden relative">
              <div
                className="w-full h-full bg-stone-50"
                onDrop={(e) => {
                  e.preventDefault();
                  const pieceId = e.dataTransfer.getData("pieceId");
                  if (pieceId) {
                    handlePieceFromCollection(pieceId);
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
              >
                <Stage
                  ref={stageRef}
                  width={canvasWidth}
                  height={canvasHeight - 100}
                >
                  <Layer>
                    {/* Draw outline guide - centered pot silhouette */}
                    {potImage && (
                      <KonvaImage
                        image={potImage}
                        x={(canvasWidth - 550) / 2}
                        y={((canvasHeight - 100) - 800) / 2}
                        width={550}
                        height={800}
                        opacity={0.15}
                      />
                    )}

                    {/* Render all pot pieces on canvas */}
                    {potPieces.map(piece => (
                      <PotPiece
                        key={piece.id}
                        piece={piece}
                        onDragEnd={handlePieceDragEnd}
                        isRestored={restoredPieces.includes(piece.id)}
                        potImage={potImage}
                      />
                    ))}
                  </Layer>
                </Stage>

                {/* Restoration Complete Button - Appearing below pot */}
                {restoredPieces.length > 0 && restoredPieces.length === potPieces.length && (
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 animate-bounce-in flex flex-col items-center">
                    <div className="mb-4 bg-white/90 backdrop-blur-md px-6 py-2 rounded-full shadow-sm border border-stone-200 text-museum-primary font-bold">
                      ✨ Pot Restored!
                    </div>
                    <button
                      onClick={() => setMode('color')}
                      className="px-10 py-5 bg-gradient-to-r from-museum-primary to-museum-accent text-white font-bold text-2xl rounded-2xl shadow-2xl hover:scale-105 hover:shadow-museum-accent/30 transition-all flex items-center gap-4 border-4 border-white ring-4 ring-black/5"
                    >
                      <span className="text-3xl">🎨</span>
                      <span>LET'S DECORATE</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Decoration Mode */}
        {mode === 'decorate' && selectedPot && (
          <div className="w-full h-screen flex flex-col overflow-hidden">
            <div className="absolute top-24 left-6 right-6 z-10 bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-serif font-bold text-museum-primary">
                  Decorate Your Pot
                </h2>
                <div className="flex gap-4">
                  <button
                    onClick={() => setDecorations([])}
                    className="px-4 py-2 bg-stone-200 rounded-lg hover:bg-stone-300"
                  >
                    Clear Decorations
                  </button>
                  <button
                    onClick={() => {
                      setMode('select');
                      setPotPieces([]);
                      setRestoredPieces([]);
                      setDecorations([]);
                      setSelectedPot(null);
                    }}
                    className="px-4 py-2 bg-museum-accent text-white rounded-lg hover:bg-opacity-90"
                  >
                    New Pot
                  </button>
                </div>
              </div>

              {/* Decoration Tools */}
              <div className="flex gap-3 flex-wrap items-center">
                <span className="text-lg font-semibold">Select Pattern:</span>
                {DECORATIONS.map(dec => (
                  <button
                    key={dec.id}
                    onClick={() => setSelectedDecoration(dec)}
                    className={`px-4 py-2 rounded-xl border-2 transition-all text-xl ${selectedDecoration?.id === dec.id
                      ? 'border-museum-accent bg-museum-accent text-white shadow-lg scale-110'
                      : 'border-stone-300 bg-white hover:border-museum-accent'
                      }`}
                    title={dec.name}
                  >
                    {dec.symbol}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full h-screen bg-stone-50">
              <Stage
                ref={stageRef}
                width={canvasWidth}
                height={canvasHeight}
                onClick={handleCanvasClick}
              >
                <Layer>
                  {/* Restored pot - show full image */}
                  {potImage && (
                    <KonvaImage
                      image={potImage}
                      x={(canvasWidth - 900) / 2}
                      y={(canvasHeight - 1200) / 2}
                      width={900}
                      height={1200}
                    />
                  )}

                  {/* Decorations */}
                  {decorations.map(dec => (
                    <Group key={dec.id} x={dec.x} y={dec.y}>
                      <Circle
                        radius={dec.size}
                        fill={dec.color}
                        stroke="#000"
                        strokeWidth={2}
                      />
                    </Group>
                  ))}
                </Layer>
              </Stage>
            </div>
          </div>
        )}

        {/* Coloring Mode - Separate Component */}
        {mode === 'color' && (
          <PotColoring
            onBackToMenu={() => {
              setMode('select');
              setPotPieces([]);
              setRestoredPieces([]);
              setDecorations([]);
              setSelectedPot(null);
            }}
          />
        )}

      </div>
    </div>
  );
};

export default PotteryDecoration;

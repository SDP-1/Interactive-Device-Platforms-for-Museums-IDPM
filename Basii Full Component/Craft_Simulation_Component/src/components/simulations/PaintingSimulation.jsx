/**
 * ============================================================================
 * MUSEUM KIOSK - PAINTING RESTORATION SIMULATION
 * ============================================================================
 * Design Theme: "Modern Heritage" - Big, Bold, Accessible
 * Target: Large-format digital kiosk displays
 * ============================================================================
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Stage, Layer, Image, Rect, Group } from 'react-konva';

import { loadAllDatasets } from '../../data/csvParser';
import GameUI from '../GameUI';

const SNAP_DISTANCE = 30;
const PIECE_SIZE = { width: 140, height: 120 }; // Increased for better visibility
const TARGET_POSITION = { x: 300, y: 40 };
const CANVAS_SIZE = { width: 1600, height: 800 };

// Custom hook to load images
const useImageLoader = (src) => {
  const [image, setImage] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!src) {
      setStatus('idle');
      return;
    }

    const img = new window.Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      setImage(img);
      setStatus('loaded');
      console.log('Image loaded successfully:', img.width, 'x', img.height);
    };

    img.onerror = () => {
      setStatus('failed');
      console.error('Failed to load image:', src);
    };

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return [image, status];
};

// Puzzle piece component with actual image fragment
const PuzzlePiece = ({ piece, image, onDragEnd, isPlaced }) => {
  const [isDragging, setIsDragging] = useState(false);

  if (!image) return null;

  return (
    <Group
      x={piece.x}
      y={piece.y}
      draggable={!isPlaced}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(e) => {
        setIsDragging(false);
        onDragEnd(piece.id, e.target.x(), e.target.y());
      }}
    >
      {/* Image fragment */}
      <Image
        image={image}
        x={0}
        y={0}
        width={PIECE_SIZE.width}
        height={PIECE_SIZE.height}
        crop={{
          x: piece.sourceX,
          y: piece.sourceY,
          width: piece.sourceWidth,
          height: piece.sourceHeight
        }}
        stroke={isPlaced ? '#C8AA69' : (isDragging ? '#D4AF37' : '#C8AA69')}
        strokeWidth={isPlaced ? 1 : (isDragging ? 2 : 1)}
        opacity={isDragging ? 0.9 : 1}
        shadowBlur={isDragging ? 15 : (isPlaced ? 0 : 5)}
        shadowColor="black"
        cornerRadius={2}
      />

      {/* Subtle overlay for unplaced pieces */}
      {!isPlaced && !isDragging && (
        <Rect
          width={PIECE_SIZE.width}
          height={PIECE_SIZE.height}
          fill="rgba(200, 170, 105, 0.05)"
          cornerRadius={2}
          pointerEvents="none"
        />
      )}
    </Group>
  );
};

// Target zone component
const TargetZone = ({ piece, isOccupied }) => (
  <Group x={piece.targetX} y={piece.targetY}>
    <Rect
      width={PIECE_SIZE.width}
      height={PIECE_SIZE.height}
      fill={isOccupied ? "rgba(200, 170, 105, 0.2)" : "rgba(200, 170, 105, 0.05)"}
      stroke="#C8AA69"
      strokeWidth={1}
      dash={isOccupied ? [] : [4, 4]}
      opacity={0.5}
      cornerRadius={2}
    />
  </Group>
);

const PaintingSimulation = ({ gameState, updateGameState, onBackToMenu }) => {
  const [selectedPainting, setSelectedPainting] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [image, status] = useImageLoader(selectedPainting?.filename);

  // CSV Data state
  const [ROYAL_PORTRAITS_DATA, setRoyalPortraitsData] = useState([]);
  const [RESTORATION_CONFIGS, setRestorationConfigs] = useState({});
  const [COLLECTION_METADATA, setCollectionMetadata] = useState({});
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load CSV data on component mount
  useEffect(() => {
    const loadData = async () => {
      const datasets = await loadAllDatasets();
      if (datasets) {
        setRoyalPortraitsData(datasets.ROYAL_PORTRAITS_DATA);
        setRestorationConfigs(datasets.RESTORATION_CONFIGS);
        setCollectionMetadata(datasets.COLLECTION_METADATA);
        setDataLoaded(true);
      }
    };
    loadData();
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('Image loading status:', status);
    console.log('Image object:', image);
    console.log('Selected painting:', selectedPainting);
    console.log('Selected difficulty:', selectedDifficulty);
  }, [image, status, selectedPainting, selectedDifficulty]);

  // Generate puzzle pieces based on the image dimensions and difficulty
  const puzzlePieces = useMemo(() => {
    if (!image || !selectedDifficulty) return [];

    const config = RESTORATION_CONFIGS[selectedDifficulty];
    const pieces = [];
    const sourceWidth = image.width / config.cols;
    const sourceHeight = image.height / config.rows;

    for (let row = 0; row < config.rows; row++) {
      for (let col = 0; col < config.cols; col++) {
        const id = row * config.cols + col + 1;
        pieces.push({
          id,
          // Initially pieces are "in collection" and don't have a canvas position
          x: -200,
          y: -200,
          // Target position (where piece should go in completed puzzle)
          targetX: TARGET_POSITION.x + (col * PIECE_SIZE.width),
          targetY: TARGET_POSITION.y + (row * PIECE_SIZE.height),
          // Source coordinates in the original image
          sourceX: col * sourceWidth,
          sourceY: row * sourceHeight,
          sourceWidth,
          sourceHeight,
          // State
          placed: false,
          inCollection: true,
          row,
          col
        });
      }
    }

    return pieces;
  }, [image, selectedDifficulty]);
  const [pieces, setPieces] = useState([]);
  const [completedPieces, setCompletedPieces] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const stageRef = useRef();

  // Initialize pieces when puzzle pieces are generated
  useEffect(() => {
    if (puzzlePieces.length > 0) {
      setPieces(puzzlePieces);
      setCompletedPieces(0);
      setShowInstructions(true);
      // Initialize progress
      updateGameState({
        progress: { ...gameState.progress, painting: 0 }
      });
    }
  }, [puzzlePieces]);

  const checkSnapToTarget = (pieceId, newX, newY) => {
    const piece = pieces.find(p => p.id === pieceId);
    const targetX = piece.targetX;
    const targetY = piece.targetY;

    const distance = Math.sqrt(
      Math.pow(newX - targetX, 2) + Math.pow(newY - targetY, 2)
    );

    if (distance < SNAP_DISTANCE) {
      return { x: targetX, y: targetY, snapped: true };
    }

    return { x: newX, y: newY, snapped: false };
  };

  const handlePieceDragEnd = (pieceId, newX, newY) => {
    if (showInstructions) setShowInstructions(false);

    // If dragged near the bottom edge, put it back in collection
    if (newY > CANVAS_SIZE.height - 40) {
      const pieceToReturn = pieces.find(p => p.id === pieceId);
      const wasPlaced = pieceToReturn?.placed;

      setPieces(prev => prev.map(p => {
        if (p.id === pieceId) {
          return { ...p, inCollection: true, placed: false, x: 0, y: 0 };
        }
        return p;
      }));

      setCompletedPieces(prev => wasPlaced ? prev - 1 : prev);

      // Update score: -50 if it was on stage or placed
      updateGameState({
        score: Math.max(0, gameState.score - 50),
        progress: {
          ...gameState.progress,
          painting: pieces.length > 0 ? (completedPieces - (wasPlaced ? 1 : 0)) / pieces.length : 0
        }
      });
      return;
    }

    const snapResult = checkSnapToTarget(pieceId, newX, newY);

    setPieces(prevPieces => {
      const updatedPieces = prevPieces.map(piece => {
        if (piece.id === pieceId) {
          const wasAlreadyPlaced = piece.placed;
          const isNowPlaced = snapResult.snapped;

          return {
            ...piece,
            x: snapResult.x,
            y: snapResult.y,
            placed: snapResult.snapped
          };
        }
        return piece;
      });

      // Count completed pieces after update
      const newCompletedCount = updatedPieces.filter(p => !p.inCollection && p.placed).length;
      setCompletedPieces(newCompletedCount);

      // Update game state with new progress
      const totalPieces = updatedPieces.length;
      const progressPercent = totalPieces > 0 ? newCompletedCount / totalPieces : 0;

      // Find the piece that was moved
      const movedPiece = updatedPieces.find(p => p.id === pieceId);
      const wasAlreadyPlaced = pieces.find(p => p.id === pieceId)?.placed;
      const isNowPlaced = movedPiece?.placed;

      // Update score
      let scoreChange = 0;
      if (!wasAlreadyPlaced && isNowPlaced) {
        scoreChange = 100;
      }

      updateGameState({
        score: Math.max(0, gameState.score + scoreChange),
        progress: { ...gameState.progress, painting: progressPercent }
      });

      return updatedPieces;
    });
  };

  useEffect(() => {
    if (completedPieces === puzzlePieces.length && puzzlePieces.length > 0 && !showSuccess && completedPieces > 0) {
      setShowSuccess(true);

      const difficultyBonus = selectedDifficulty === 'hard' ? 750 : 500; // Extra bonus for hard difficulty

      // Only update score, no longer storing achievement in gameState
      updateGameState({
        score: gameState.score + difficultyBonus
      });
    }
  }, [completedPieces, puzzlePieces.length, selectedPainting]);

  const resetPuzzle = () => {
    if (puzzlePieces.length > 0 && selectedDifficulty) {
      setPieces(puzzlePieces);
      setCompletedPieces(0);
      setShowSuccess(false);

      updateGameState({
        progress: { ...gameState.progress, painting: 0 }
      });
    }
  };

  const handlePieceFromCollection = (pieceId) => {
    setPieces(prev => prev.map(p => {
      if (p.id === pieceId) {
        return {
          ...p,
          inCollection: false,
          x: 100 + Math.random() * 100, // Drop it onto the stage
          y: 100 + Math.random() * 100
        };
      }
      return p;
    }));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (stageRef.current) {
      stageRef.current.setPointersPositions(e);
      const pieceId = parseInt(e.dataTransfer.getData("pieceId"));
      const pos = stageRef.current.getPointerPosition();

      if (pieceId) {
        setPieces(prev => prev.map(p => {
          if (p.id === pieceId) {
            return {
              ...p,
              inCollection: false,
              x: pos.x - PIECE_SIZE.width / 2,
              y: pos.y - PIECE_SIZE.height / 2
            };
          }
          return p;
        }));
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handlePaintingSelect = (painting) => {
    setSelectedPainting(painting);
    setSelectedDifficulty(null); // Reset difficulty when changing painting
    // Reset all puzzle state when switching paintings
    setPieces([]);
    setCompletedPieces(0);
    setShowSuccess(false);
    updateGameState({
      progress: { ...gameState.progress, painting: 0 }
    });
  };

  const handleDifficultySelect = (difficulty) => {
    setSelectedDifficulty(difficulty);
    // Reset puzzle state when changing difficulty
    setPieces([]);
    setCompletedPieces(0);
    setShowSuccess(false);
    updateGameState({
      progress: { ...gameState.progress, painting: 0 }
    });
  };

  // Loading state while CSV data is being fetched
  if (!dataLoaded) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-black/90">
        <div className="flex flex-col items-center gap-6 p-12 bg-black/40 border border-gold-primary/30 rounded-3xl backdrop-blur-xl">
          <div className="w-16 h-16 border-4 border-gold-primary/20 border-t-gold-primary rounded-full animate-spin"></div>
          <h3 className="text-2xl font-display font-bold text-gold-secondary tracking-widest animate-pulse">Loading Royal Portrait Collection...</h3>
          <p className="text-xl text-ivory/60 mt-4">
            Retrieving historical data from museum archives
          </p>
        </div>
      </div>
    );
  }

  // If no painting is selected, show selection interface
  if (!selectedPainting) {
    return (
      <div className="w-full h-full px-8 py-8">
        <div className="flex flex-col gap-12">
          {/* Hero Section */}
          <div className="text-center mb-4 relative">
            {onBackToMenu && (
              <button
                onClick={onBackToMenu}
                className="absolute left-0 top-1/2 -translate-y-1/2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-gold-primary/30 text-gold-primary rounded-xl transition-all flex items-center gap-2 group"
              >
                <span className="group-hover:-translate-x-1 transition-transform">←</span>
                <span>BACK TO MENU</span>
              </button>
            )}
            <h1 className="text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold-primary to-gold-secondary mb-4 drop-shadow-sm">🎨 Royal Portrait Restoration</h1>
            <p className="text-xl text-ivory/70 font-light tracking-wide">Choose a Historical Painting to Restore</p>
          </div>

          {/* Painting Selection Grid - Full Details */}
          <div className="flex flex-col gap-12 px-2 md:px-8">
            {ROYAL_PORTRAITS_DATA.map((painting) => (
              <div
                key={painting.id}
                className="w-full bg-black/60 border border-gold-primary/30 rounded-3xl p-8 backdrop-blur-md shadow-xl"
              >
                {/* Top Section: Image + Basic Info */}
                <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8 mb-8">
                  {/* Painting Image */}
                  <div className="bg-gradient-to-b from-white to-gray-100 rounded-2xl p-8 flex justify-center items-center shadow-inner">
                    <img
                      src={painting.filename}
                      alt={painting.name}
                      className="max-h-[300px] w-auto object-contain drop-shadow-2xl"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>

                  {/* Basic Info */}
                  <div className="flex flex-col justify-center">
                    <h2 className="text-4xl font-display font-bold text-gold-primary mb-4 leading-tight">
                      {painting.name}
                    </h2>

                    <p className="text-xl text-ivory/80 leading-relaxed mb-6 font-light">
                      {painting.shortDescription}
                    </p>

                    {/* Meta Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                      <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                        <span className="text-xs text-gold-accent uppercase tracking-wider mb-1">📅 Period</span>
                        <span className="text-ivory font-semibold">{painting.period}</span>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                        <span className="text-xs text-gold-accent uppercase tracking-wider mb-1">👑 Dynasty</span>
                        <span className="text-ivory font-semibold">{painting.dynasty}</span>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                        <span className="text-xs text-gold-accent uppercase tracking-wider mb-1">⏱️ Reign</span>
                        <span className="text-ivory font-semibold">{painting.reign}</span>
                      </div>
                    </div>

                    {/* Select Button */}
                    <button
                      onClick={() => handlePaintingSelect(painting)}
                      className="w-full sm:w-auto self-start px-8 py-4 bg-gradient-to-r from-gold-primary to-gold-accent hover:brightness-110 text-black font-bold tracking-widest text-lg rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 group"
                    >
                      SELECT FOR RESTORATION <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </button>
                  </div>
                </div>

                {/* Historical Background */}
                {painting.historicalContext.background && (
                  <div className="bg-black/40 p-8 rounded-2xl mb-6 border border-gold-primary/20">
                    <h3 className="text-2xl font-display font-bold text-gold-primary mb-4">
                      📜 Historical Background
                    </h3>
                    <p className="text-lg text-ivory/70 leading-relaxed">
                      {painting.historicalContext.background}
                    </p>
                  </div>
                )}

                {/* Achievements */}
                {painting.historicalContext.achievements && painting.historicalContext.achievements.length > 0 && (
                  <div className="bg-black/40 p-8 rounded-2xl mb-6 border border-gold-primary/20">
                    <h3 className="text-2xl font-display font-bold text-gold-primary mb-4">
                      🏆 Major Achievements & Legacy
                    </h3>
                    <ul className="list-disc list-inside text-lg text-ivory/70 leading-loose space-y-2">
                      {painting.historicalContext.achievements.map((achievement, index) => (
                        <li key={index} className="pl-2">{achievement}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Two Column Grid for Additional Details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Cultural Significance */}
                  {painting.historicalContext.culturalSignificance && (
                    <div className="bg-gold-primary/10 p-6 rounded-2xl border border-gold-primary/20">
                      <h4 className="text-xl font-bold text-gold-primary mb-3">
                        🏛️ Cultural Significance
                      </h4>
                      <p className="text-ivory/70 leading-relaxed">
                        {painting.historicalContext.culturalSignificance}
                      </p>
                    </div>
                  )}

                  {/* Military Context */}
                  {painting.historicalContext.militaryContext && (
                    <div className="bg-red-900/10 p-6 rounded-2xl border border-red-500/20">
                      <h4 className="text-xl font-bold text-red-400 mb-3">
                        ⚔️ Military & Political Context
                      </h4>
                      <p className="text-ivory/70 leading-relaxed">
                        {painting.historicalContext.militaryContext}
                      </p>
                    </div>
                  )}

                  {/* Religious Legacy */}
                  {painting.historicalContext.religiousLegacy && (
                    <div className="bg-green-900/10 p-6 rounded-2xl border border-green-500/20">
                      <h4 className="text-xl font-bold text-green-400 mb-3">
                        🛕 Religious Legacy
                      </h4>
                      <p className="text-ivory/70 leading-relaxed">
                        {painting.historicalContext.religiousLegacy}
                      </p>
                    </div>
                  )}

                  {/* Historical Impact */}
                  {painting.historicalContext.historicalImpact && (
                    <div className="bg-black/40 p-6 rounded-2xl border border-gold-primary/20">
                      <h4 className="text-xl font-bold text-gold-primary mb-3">
                        📈 Historical Impact
                      </h4>
                      <p className="text-ivory/70 leading-relaxed">
                        {painting.historicalContext.historicalImpact}
                      </p>
                    </div>
                  )}

                  {/* Archaeological Evidence */}
                  {painting.historicalContext.archaeologicalEvidence && (
                    <div className="bg-black/40 p-6 rounded-2xl border border-gold-primary/20">
                      <h4 className="text-xl font-bold text-gold-primary mb-3">
                        🔬 Archaeological Evidence
                      </h4>
                      <p className="text-ivory/70 leading-relaxed">
                        {painting.historicalContext.archaeologicalEvidence}
                      </p>
                    </div>
                  )}

                  {/* Cultural Influence */}
                  {painting.historicalContext.culturalInfluence && (
                    <div className="bg-gold-primary/10 p-6 rounded-2xl border border-gold-primary/20">
                      <h4 className="text-xl font-bold text-gold-primary mb-3">
                        🌏 Cultural Influence
                      </h4>
                      <p className="text-ivory/70 leading-relaxed">
                        {painting.historicalContext.culturalInfluence}
                      </p>
                    </div>
                  )}

                  {/* Artistic Tradition */}
                  {painting.historicalContext.artisticTradition && (
                    <div className="bg-orange-900/10 p-6 rounded-2xl border border-orange-500/20">
                      <h4 className="text-xl font-bold text-orange-400 mb-3">
                        🎨 Artistic Tradition & Iconography
                      </h4>
                      <p className="text-ivory/70 leading-relaxed">
                        {painting.historicalContext.artisticTradition}
                      </p>
                    </div>
                  )}

                  {/* Architectural Heritage */}
                  {painting.historicalContext.architecturalHeritage && (
                    <div className="bg-black/40 p-6 rounded-2xl border border-gold-primary/20">
                      <h4 className="text-xl font-bold text-gold-primary mb-3">
                        🏗️ Architectural Heritage
                      </h4>
                      <p className="text-ivory/70 leading-relaxed">
                        {painting.historicalContext.architecturalHeritage}
                      </p>
                    </div>
                  )}

                  {/* Scholarly Tradition */}
                  {painting.historicalContext.scholarlyTradition && (
                    <div className="bg-black/40 p-6 rounded-2xl border border-gold-primary/20">
                      <h4 className="text-xl font-bold text-gold-primary mb-3">
                        📚 Scholarly Tradition
                      </h4>
                      <p className="text-ivory/70 leading-relaxed">
                        {painting.historicalContext.scholarlyTradition}
                      </p>
                    </div>
                  )}

                  {/* Cultural Synthesis */}
                  {painting.historicalContext.culturalSynthesis && (
                    <div className="bg-gold-primary/10 p-6 rounded-2xl border border-gold-primary/20">
                      <h4 className="text-xl font-bold text-gold-primary mb-3">
                        🔄 Cultural Synthesis
                      </h4>
                      <p className="text-ivory/70 leading-relaxed">
                        {painting.historicalContext.culturalSynthesis}
                      </p>
                    </div>
                  )}

                  {/* End of Era */}
                  {painting.historicalContext.endOfEra && (
                    <div className="bg-amber-900/20 p-6 rounded-2xl border border-amber-700/40">
                      <h4 className="text-xl font-bold text-amber-500 mb-3">
                        🏺 End of Era
                      </h4>
                      <p className="text-ivory/70 leading-relaxed">
                        {painting.historicalContext.endOfEra}
                      </p>
                    </div>
                  )}

                  {/* Modern Legacy */}
                  {painting.historicalContext.modernLegacy && (
                    <div className="bg-green-900/10 p-6 rounded-2xl border border-green-500/20">
                      <h4 className="text-xl font-bold text-green-400 mb-3">
                        🌟 Modern Legacy
                      </h4>
                      <p className="text-ivory/70 leading-relaxed">
                        {painting.historicalContext.modernLegacy}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Collection Info Panel */}
          <div className="w-full max-w-[1400px] mx-auto mt-12 mb-8 bg-black/40 border border-gold-primary/20 rounded-3xl p-8">
            <h3 className="text-3xl font-display font-bold text-gold-secondary mb-4 flex items-center gap-3 border-b border-white/10 pb-4">
              <span>📚</span> {COLLECTION_METADATA.title}
            </h3>
            <p className="text-xl text-ivory/80 leading-relaxed text-center mb-8 max-w-4xl mx-auto">
              {COLLECTION_METADATA.description}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                <span className="text-3xl">📅</span>
                <span className="text-lg text-ivory/90 font-medium">Historical Period: {COLLECTION_METADATA.timeSpan}</span>
              </div>
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                <span className="text-3xl">🗺️</span>
                <span className="text-lg text-ivory/90 font-medium">Coverage: {COLLECTION_METADATA.totalPeriodCovered}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If painting is selected but no difficulty, show difficulty selection with historical context
  if (selectedPainting && !selectedDifficulty) {
    return (
      <div className="w-full h-full px-8 py-8">
        <div className="flex flex-col gap-8">
          {/* Hero Section */}
          <div className="text-center mb-4 relative">
            <button
              onClick={() => setSelectedPainting(null)}
              className="absolute left-0 top-1/2 -translate-y-1/2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-gold-primary/30 text-gold-primary rounded-xl transition-all flex items-center gap-2 group"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              <span>BACK TO LIST</span>
            </button>
            <h1 className="text-5xl font-display font-bold text-gold-primary mb-2 drop-shadow-sm">👑 {selectedPainting.name}</h1>
            <p className="text-xl text-ivory/70 font-light tracking-wide">{selectedPainting.period} • {selectedPainting.dynasty}</p>
          </div>

          {/* Full Historical Context Panel */}
          <div className="w-full bg-black/60 border border-gold-primary/30 rounded-3xl p-8 backdrop-blur-md mb-8">
            <h2 className="text-3xl font-display font-bold text-gold-secondary mb-8 border-b border-white/10 pb-4">
              📜 Complete Historical Analysis
            </h2>

            {/* Basic Info */}
            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 mb-8 bg-black/20 p-8 rounded-2xl border border-white/5">
              <div className="bg-gradient-to-b from-white to-gray-100 rounded-xl p-6 flex justify-center items-center shadow-inner">
                <img
                  src={selectedPainting.filename}
                  alt={selectedPainting.name}
                  className="max-h-[250px] w-auto object-contain drop-shadow-xl"
                />
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-xl text-ivory/80 leading-relaxed mb-6 font-light">
                  {selectedPainting.shortDescription}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                    <span className="text-xs text-gold-accent uppercase tracking-wider mb-1">📅 Period</span>
                    <span className="text-ivory font-semibold">{selectedPainting.period}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                    <span className="text-xs text-gold-accent uppercase tracking-wider mb-1">👑 Dynasty</span>
                    <span className="text-ivory font-semibold">{selectedPainting.dynasty}</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center justify-center text-center">
                    <span className="text-xs text-gold-accent uppercase tracking-wider mb-1">⏱️ Reign</span>
                    <span className="text-ivory font-semibold">{selectedPainting.reign}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Historical Background - Full */}
            {selectedPainting.historicalContext.background && (
              <div className="bg-black/40 p-8 rounded-2xl mb-6 border border-gold-primary/20">
                <h3 className="text-2xl font-bold text-gold-primary mb-4">
                  📜 Historical Background
                </h3>
                <p className="text-lg text-ivory/70 leading-relaxed">
                  {selectedPainting.historicalContext.background}
                </p>
              </div>
            )}

            {/* Achievements - Full */}
            {selectedPainting.historicalContext.achievements && selectedPainting.historicalContext.achievements.length > 0 && (
              <div className="bg-black/40 p-8 rounded-2xl mb-6 border border-gold-primary/20">
                <h3 className="text-2xl font-bold text-gold-primary mb-4">
                  🏆 Major Achievements & Legacy
                </h3>
                <ul className="list-disc list-inside text-lg text-ivory/70 leading-loose space-y-2">
                  {selectedPainting.historicalContext.achievements.map((achievement, index) => (
                    <li key={index} className="pl-2">{achievement}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Grid of All Context Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cultural Significance */}
              {selectedPainting.historicalContext.culturalSignificance && (
                <div className="bg-gold-primary/10 p-8 rounded-2xl border border-gold-primary/20">
                  <h4 className="text-xl font-bold text-gold-primary mb-3">
                    🏛️ Cultural Significance
                  </h4>
                  <p className="text-ivory/70 leading-relaxed text-lg">
                    {selectedPainting.historicalContext.culturalSignificance}
                  </p>
                </div>
              )}

              {/* Military Context */}
              {selectedPainting.historicalContext.militaryContext && (
                <div className="bg-red-900/10 p-8 rounded-2xl border border-red-500/20">
                  <h4 className="text-xl font-bold text-red-400 mb-3">
                    ⚔️ Military & Political Context
                  </h4>
                  <p className="text-ivory/70 leading-relaxed text-lg">
                    {selectedPainting.historicalContext.militaryContext}
                  </p>
                </div>
              )}

              {/* Religious Legacy */}
              {selectedPainting.historicalContext.religiousLegacy && (
                <div className="bg-green-900/10 p-8 rounded-2xl border border-green-500/20">
                  <h4 className="text-xl font-bold text-green-400 mb-3">
                    🛕 Religious Legacy
                  </h4>
                  <p className="text-ivory/70 leading-relaxed text-lg">
                    {selectedPainting.historicalContext.religiousLegacy}
                  </p>
                </div>
              )}

              {/* Historical Impact */}
              {selectedPainting.historicalContext.historicalImpact && (
                <div className="bg-black/40 p-8 rounded-2xl border border-gold-primary/20">
                  <h4 className="text-xl font-bold text-gold-primary mb-3">
                    📈 Historical Impact
                  </h4>
                  <p className="text-ivory/70 leading-relaxed text-lg">
                    {selectedPainting.historicalContext.historicalImpact}
                  </p>
                </div>
              )}

              {/* Archaeological Evidence */}
              {selectedPainting.historicalContext.archaeologicalEvidence && (
                <div className="bg-amber-900/10 p-8 rounded-2xl border border-amber-500/20">
                  <h4 className="text-xl font-bold text-amber-500 mb-3">
                    🔬 Archaeological Evidence
                  </h4>
                  <p className="text-ivory/70 leading-relaxed text-lg">
                    {selectedPainting.historicalContext.archaeologicalEvidence}
                  </p>
                </div>
              )}

              {/* Cultural Influence */}
              {selectedPainting.historicalContext.culturalInfluence && (
                <div className="bg-gold-primary/10 p-8 rounded-2xl border border-gold-primary/20">
                  <h4 className="text-xl font-bold text-gold-primary mb-3">
                    🌏 Cultural Influence
                  </h4>
                  <p className="text-ivory/70 leading-relaxed text-lg">
                    {selectedPainting.historicalContext.culturalInfluence}
                  </p>
                </div>
              )}

              {/* Artistic Tradition */}
              {selectedPainting.historicalContext.artisticTradition && (
                <div className="bg-orange-900/10 p-8 rounded-2xl border border-orange-500/20">
                  <h4 className="text-xl font-bold text-orange-400 mb-3">
                    🎨 Artistic Tradition & Iconography
                  </h4>
                  <p className="text-ivory/70 leading-relaxed text-lg">
                    {selectedPainting.historicalContext.artisticTradition}
                  </p>
                </div>
              )}

              {/* Architectural Heritage */}
              {selectedPainting.historicalContext.architecturalHeritage && (
                <div className="bg-black/40 p-8 rounded-2xl border border-gold-primary/20">
                  <h4 className="text-xl font-bold text-gold-primary mb-3">
                    🏗️ Architectural Heritage
                  </h4>
                  <p className="text-ivory/70 leading-relaxed text-lg">
                    {selectedPainting.historicalContext.architecturalHeritage}
                  </p>
                </div>
              )}

              {/* Scholarly Tradition */}
              {selectedPainting.historicalContext.scholarlyTradition && (
                <div className="bg-black/40 p-8 rounded-2xl border border-gold-primary/20">
                  <h4 className="text-xl font-bold text-gold-primary mb-3">
                    📚 Scholarly Tradition
                  </h4>
                  <p className="text-ivory/70 leading-relaxed text-lg">
                    {selectedPainting.historicalContext.scholarlyTradition}
                  </p>
                </div>
              )}

              {/* Cultural Synthesis */}
              {selectedPainting.historicalContext.culturalSynthesis && (
                <div className="bg-gold-primary/10 p-8 rounded-2xl border border-gold-primary/20">
                  <h4 className="text-xl font-bold text-gold-primary mb-3">
                    🔄 Cultural Synthesis
                  </h4>
                  <p className="text-ivory/70 leading-relaxed text-lg">
                    {selectedPainting.historicalContext.culturalSynthesis}
                  </p>
                </div>
              )}

              {/* End of Era */}
              {selectedPainting.historicalContext.endOfEra && (
                <div className="bg-amber-900/20 p-8 rounded-2xl border border-amber-700/40">
                  <h4 className="text-xl font-bold text-amber-500 mb-3">
                    🏺 End of Era
                  </h4>
                  <p className="text-ivory/70 leading-relaxed text-lg">
                    {selectedPainting.historicalContext.endOfEra}
                  </p>
                </div>
              )}

              {/* Modern Legacy */}
              {selectedPainting.historicalContext.modernLegacy && (
                <div className="bg-green-900/10 p-8 rounded-2xl border border-green-500/20">
                  <h4 className="text-xl font-bold text-green-400 mb-3">
                    🌟 Modern Legacy
                  </h4>
                  <p className="text-ivory/70 leading-relaxed text-lg">
                    {selectedPainting.historicalContext.modernLegacy}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Difficulty Selection */}
          <div className="w-full max-w-[1200px] mx-auto pb-12">
            <h2 className="text-4xl font-display font-bold text-gold-primary text-center mb-12 drop-shadow-sm">
              🎯 Select Restoration Complexity
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Object.entries(RESTORATION_CONFIGS).map(([key, config]) => (
                <button
                  key={key}
                  className="bg-black/60 border-2 border-gold-primary/30 rounded-3xl p-8 hover:bg-black/90 hover:border-gold-primary hover:scale-[1.02] hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(212,175,55,0.3)] transition-all duration-300 group flex flex-col items-center text-center backdrop-blur-sm"
                  onClick={() => handleDifficultySelect(key)}
                >
                  <span className="text-8xl block mb-6 transition-transform group-hover:scale-110 duration-300">
                    {key === 'easy' ? '🟢' : key === 'hard' ? '🔴' : '💎'}
                  </span>
                  <h3 className="text-3xl font-display font-bold text-gold-secondary mb-4 group-hover:text-gold-primary transition-colors">{config.label}</h3>
                  <p className="text-lg text-ivory/80 mb-8 min-h-[3rem] group-hover:text-ivory transition-colors">{config.description}</p>

                  <div className="grid grid-cols-2 gap-4 w-full mb-8">
                    <div className="bg-white/5 rounded-xl p-3 flex flex-col">
                      <span className="text-xs text-gold-accent font-bold uppercase tracking-wider mb-1">Grid</span>
                      <span className="text-2xl font-bold text-white">{config.rows} × {config.cols}</span>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 flex flex-col">
                      <span className="text-xs text-gold-accent font-bold uppercase tracking-wider mb-1">Pieces</span>
                      <span className="text-2xl font-bold text-white">{config.pieces}</span>
                    </div>
                  </div>

                  <div className="w-full py-4 mt-auto rounded-xl bg-gold-primary/10 border border-gold-primary/30 text-gold-primary font-bold tracking-widest group-hover:bg-gold-primary group-hover:text-black transition-all flex items-center justify-center gap-2">
                    <span>SELECT DIFFICULTY</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </button>
              ))}
            </div>


          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen overflow-hidden flex flex-col bg-[#2D2E28]">
      <div className="pt-4">
        <GameUI gameState={gameState} />
      </div>
      {/* Header - Styled as per NewDesign.png */}
      <div className="bg-[#21221D] px-8 pt-6 pb-2 border-b-4 border-[#1A1B16] relative z-50">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col">
            <h1 className="text-2xl font-serif font-bold text-[#C8AA69] tracking-wider uppercase">
              {selectedPainting.name} Restoration
            </h1>
            <p className="text-sm text-[#8B8C7A] font-sans mt-0.5">
              {selectedPainting.period} • {selectedPainting.dynasty} • {selectedPainting.reign}
            </p>
          </div>

          <div className="flex items-center gap-8">
            {/* Stats Display */}
            <div className="flex gap-8">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-[#C8AA69] leading-none">
                  {completedPieces}/{puzzlePieces.length}
                </span>
                <span className="text-[10px] text-[#8B8C7A] font-bold uppercase tracking-[0.2em] mt-1">Placed</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-[#C8AA69] leading-none">
                  {puzzlePieces.length > 0 ? Math.round((completedPieces / puzzlePieces.length) * 100) : 0}%
                </span>
                <span className="text-[10px] text-[#8B8C7A] font-bold uppercase tracking-[0.2em] mt-1">Complete</span>
              </div>
            </div>

            {/* Role Badge */}
            <div className="bg-[#1A1B16] border border-[#C8AA69]/30 rounded px-4 py-2 flex flex-col items-center min-w-[140px]">
              <span className="text-[10px] text-[#C8AA69] font-bold uppercase tracking-wider mb-0.5">
                {RESTORATION_CONFIGS[selectedDifficulty]?.label || 'Conservator'}
              </span>
              <span className="text-xs text-[#8B8C7A]">{puzzlePieces.length} pieces</span>
            </div>

            <div className="flex gap-3">
              <button
                className="bg-transparent hover:bg-white/5 text-[#8B8C7A] hover:text-white font-bold py-2 px-6 rounded border border-[#8B8C7A]/30 transition-all active:scale-95"
                onClick={resetPuzzle}
              >
                <span className="text-sm font-sans tracking-wide">↺ Reset</span>
              </button>
              <button
                className="bg-transparent hover:bg-white/5 text-gold-primary hover:text-white font-bold py-2 px-6 rounded border border-gold-primary/30 transition-all active:scale-95"
                onClick={() => setSelectedDifficulty(null)}
              >
                <span className="text-sm font-sans tracking-wide">← Back to Info</span>
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-[#1A1B16] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#C8AA69] transition-all duration-500 shadow-[0_0_10px_rgba(200,170,105,0.5)]"
            style={{ width: `${puzzlePieces.length > 0 ? (completedPieces / puzzlePieces.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center p-8">

        {/* Loading State */}
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center z-10">
            <div className="w-16 h-16 border-4 border-gold-primary/20 border-t-gold-primary rounded-full animate-spin mb-6"></div>
            <h3 className="text-2xl font-display font-bold text-gold-secondary animate-pulse">Loading {selectedPainting.name}...</h3>
            <p className="text-ivory/50 mt-2">Preparing restoration canvas</p>
          </div>
        )}

        {/* Error State */}
        {status === 'failed' && (
          <div className="bg-red-900/10 border border-red-500/30 p-12 rounded-3xl text-center backdrop-blur-md max-w-2xl">
            <span className="text-6xl block mb-6">❌</span>
            <h2 className="text-3xl font-bold text-red-400 mb-4">
              Failed to load {selectedPainting.name}
            </h2>
            <p className="text-xl text-ivory/60 mb-8">
              Please ensure the image file exists in the public folder.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => window.location.reload()}
                className="px-8 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold rounded-xl border border-red-500/30 transition-colors"
              >
                Retry Loading
              </button>
              <button
                onClick={() => setSelectedPainting(null)}
                className="px-8 py-3 bg-white/5 hover:bg-white/10 text-ivory font-bold rounded-xl border border-white/10 transition-colors"
              >
                Choose Different
              </button>
            </div>
          </div>
        )}

        {/* Canvas Area */}
        {image && status === 'loaded' && (
          <div className="relative flex-1 flex flex-col items-center justify-start pt-10">
            {/* Target Area with Grid Lines */}
            <div
              className="relative bg-[#21221D] rounded p-2 shadow-inner border-[1px] border-[#C8AA69]/20"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <Stage
                width={CANVAS_SIZE.width}
                height={CANVAS_SIZE.height}
                ref={stageRef}
              >
                <Layer>
                  {/* Grid/Target Zones */}
                  <Group x={TARGET_POSITION.x} y={TARGET_POSITION.y}>
                    <Rect
                      width={PIECE_SIZE.width * RESTORATION_CONFIGS[selectedDifficulty].cols}
                      height={PIECE_SIZE.height * RESTORATION_CONFIGS[selectedDifficulty].rows}
                      fill="#2D2E28"
                      stroke="#C8AA69"
                      strokeWidth={2}
                      cornerRadius={2}
                    />
                    {pieces.map(piece => (
                      <Group key={`target-group-${piece.id}`} x={piece.targetX - TARGET_POSITION.x} y={piece.targetY - TARGET_POSITION.y}>
                        <Rect
                          width={PIECE_SIZE.width}
                          height={PIECE_SIZE.height}
                          fill="transparent"
                          stroke="#C8AA69"
                          strokeWidth={1}
                          dash={[4, 4]}
                          opacity={0.3}
                        />
                      </Group>
                    ))}
                  </Group>

                  {/* Active Puzzle Pieces */}
                  {pieces.filter(p => !p.inCollection).map(piece => (
                    <PuzzlePiece
                      key={piece.id}
                      piece={piece}
                      image={image}
                      onDragEnd={handlePieceDragEnd}
                      isPlaced={piece.placed}
                    />
                  ))}
                </Layer>
              </Stage>

              {/* Next Hint Notification */}
              <div className="absolute top-20 right-[-220px] w-48 bg-[#1A1B16] border border-[#C8AA69]/30 rounded p-4 shadow-xl">
                <span className="text-[10px] text-[#8B8C7A] font-bold uppercase tracking-widest block mb-1">Next Hint Available</span>
                <p className="text-[#C8AA69] font-bold text-sm">Corner Pieces First</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fragment Collection Drawer */}
      {selectedPainting && selectedDifficulty && (
        <div className="bg-[#1D1E19] border-t-2 border-[#1A1B16] p-6 relative">
          <div className="max-w-[1500px] mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[#C8AA69] text-xs font-bold tracking-[0.3em] uppercase">Fragment Collection</h2>
              <p className="text-[#8B8C7A] text-[10px] uppercase font-sans tracking-widest">Drag pieces to the restoration grid above</p>
            </div>

            <div className="flex flex-wrap gap-4 pb-4 items-center px-2 justify-center min-h-[150px]">
              {pieces.filter(p => p.inCollection).length === 0 && (
                <div className="flex-1 flex items-center justify-center italic text-[#8B8C7A] text-sm py-8">
                  All fragments collected! Finish the restoration above.
                </div>
              )}
              {pieces.filter(p => p.inCollection).map(piece => (
                <div
                  key={`collection-${piece.id}`}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("pieceId", piece.id);
                  }}
                  onClick={() => handlePieceFromCollection(piece.id)}
                  className="w-24 h-20 bg-[#2D2E28] border border-[#C8AA69]/30 rounded cursor-pointer hover:border-[#C8AA69] hover:scale-110 transition-all p-1 group relative overflow-hidden shadow-lg mb-2"
                >
                  {/* Miniature piece representation */}
                  <div className="w-full h-full relative overflow-hidden rounded-sm bg-[#1A1B16]">
                    <img
                      src={selectedPainting.filename}
                      className="absolute max-w-none grayscale-[0.3] group-hover:grayscale-0 transition-all duration-300"
                      style={{
                        width: (image?.width / piece.sourceWidth) * 88,
                        height: (image?.height / piece.sourceHeight) * 72,
                        left: - (piece.sourceX / piece.sourceWidth) * 88,
                        top: - (piece.sourceY / piece.sourceHeight) * 72,
                      }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Success Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-500">
          <div className="bg-black/80 border border-gold-primary/30 p-12 rounded-3xl text-center max-w-4xl shadow-2xl relative overflow-hidden">
            {/* Confetti/Rays effect background (simplified with CSS) */}
            <div className="absolute inset-0 bg-gradient-radial from-gold-primary/10 to-transparent pointer-events-none"></div>

            <span className="text-8xl block mb-6 animate-bounce">🎉</span>
            <h2 className="text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold-primary to-gold-secondary mb-6">
              Restoration Complete!
            </h2>

            {/* Achievement Badge */}
            <div className="inline-flex items-center gap-4 bg-green-900/20 border border-green-500/30 px-8 py-4 rounded-2xl mb-8">
              <span className="text-4xl">🏆</span>
              <div className="text-left">
                <span className="block text-green-400 font-bold tracking-widest text-sm uppercase">Achievement Unlocked</span>
                <span className="text-xl text-white font-bold">{selectedPainting.name} Restorer</span>
              </div>
            </div>

            <p className="text-2xl text-ivory/80 leading-relaxed mb-8 font-light">
              You have successfully restored the ancient portrait of <strong className="text-gold-primary">{selectedPainting.name}</strong>.
            </p>

            <div className="bg-white/5 border border-white/10 p-8 rounded-2xl mb-10 text-left">
              <h3 className="text-gold-primary font-bold text-xl mb-3 flex items-center gap-2">
                <span>📜</span> Historical Significance
              </h3>
              <p className="text-lg text-ivory/70 leading-relaxed">
                {selectedPainting.shortDescription}
              </p>
            </div>

            <button
              onClick={() => setShowSuccess(false)}
              className="px-12 py-4 bg-gradient-to-r from-gold-primary to-gold-accent hover:brightness-110 text-black font-bold tracking-widest text-xl rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              CONTINUE JOURNEY
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaintingSimulation;
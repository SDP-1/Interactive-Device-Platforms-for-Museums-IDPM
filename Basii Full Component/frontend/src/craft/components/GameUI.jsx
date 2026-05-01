/**
 * ============================================================================
 * MUSEUM KIOSK - GAME UI (Score & Progress Display)
 * ============================================================================
 * Design Theme: "Modern Heritage" - Big, Bold, Accessible
 * Target: Large-format digital kiosk displays
 * ============================================================================
 */

import React from 'react';


const GameUI = ({ gameState, currentCraft }) => {
  const { score, level, progress = {} } = gameState;
  
  // Calculate based on actual progress if available, otherwise fallback to score-based
  let displayProgress = 0;
  if (currentCraft && progress[currentCraft] !== undefined) {
    displayProgress = progress[currentCraft] * 100;
  } else {
    const values = Object.values(progress);
    if (values.length > 0) {
      // Average of all active crafts
      displayProgress = (values.reduce((a, b) => a + b, 0) / values.length) * 100;
    } else {
      // Fallback for initial state
      displayProgress = (score / 1000) * 100;
    }
  }

  const overallProgress = Math.min(100, Math.floor(displayProgress));

  return (
    <div className="w-[95%] mx-auto mb-6 z-10 relative">
      {/* Score & Level Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Score Card */}
        <div className="bg-white/80 border border-stone-200 rounded-2xl p-4 flex items-center gap-4 backdrop-blur-md shadow-lg">
          <span className="text-4xl filter drop-shadow-sm">⭐</span>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-museum-primary font-serif">{score}</span>
            <span className="text-xs uppercase tracking-wide text-museum-secondary font-semibold">Cultural Points</span>
          </div>
        </div>

        {/* Level Card */}
        <div className="bg-white/80 border border-stone-200 rounded-2xl p-4 flex items-center gap-4 backdrop-blur-md shadow-lg">
          <span className="text-4xl filter drop-shadow-sm">🏆</span>
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-museum-primary font-serif">Level {level}</span>
            <span className="text-xs uppercase tracking-wide text-museum-secondary font-semibold">Craftsperson</span>
          </div>
        </div>

        {/* Progress Card */}
        <div className="bg-white/80 border border-stone-200 rounded-2xl p-4 flex items-center gap-4 backdrop-blur-md shadow-lg md:col-span-1">
          <span className="text-4xl filter drop-shadow-sm">📈</span>
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <span className="text-xs uppercase tracking-wide text-museum-secondary font-semibold">Overall Progress</span>
              <span className="text-xl font-bold text-museum-accent font-serif">{overallProgress}%</span>
            </div>
            <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden border border-stone-200">
              <div
                className="h-full bg-gradient-to-r from-museum-accent to-museum-gold transition-all duration-1000 ease-out shadow-sm"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameUI;
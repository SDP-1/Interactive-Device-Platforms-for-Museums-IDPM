/**
 * ============================================================================
 * MUSEUM KIOSK - MAIN APPLICATION
 * ============================================================================
 * Design Theme: "Modern Heritage" - Big, Bold, Accessible
 * Target: Large-format digital kiosk displays (1920x1080 - 4K)
 * ============================================================================
 */

import React, { useState } from 'react';
import CraftSelector from './components/CraftSelector';
import PaintingSimulation from './components/simulations/PaintingSimulation';
import MaskColoring from './components/simulations/MaskColoring';
import PotteryDecoration from './components/simulations/PotteryDecoration';
import GameUI from './components/GameUI';
import CulturalGuidance from './components/CulturalGuidance';

const CRAFT_TYPES = {
  PAINTING: 'painting',
  MASK: 'mask',
  POTTERY: 'pottery'
};

function App() {
  const [currentCraft, setCurrentCraft] = useState(null);
  const [gameState, setGameState] = useState({
    score: 0,
    level: 1,
    achievements: [],
    progress: {}
  });
  const [showGuidance, setShowGuidance] = useState(false);

  const handleCraftSelect = (craftType) => {
    setCurrentCraft(craftType);
    setShowGuidance(false);
  };

  const handleBackToMenu = () => {
    setCurrentCraft(null);
  };

  const updateGameState = (updates) => {
    setGameState(prev => {
      const newState = { ...prev, ...updates };
      // Automatically calculate level based on score (1 level per 1000 points)
      newState.level = Math.floor(newState.score / 1000) + 1;
      return newState;
    });
  };

  const renderCurrentCraft = () => {
    const commonProps = {
      gameState,
      updateGameState,
      onBackToMenu: handleBackToMenu
    };

    switch (currentCraft) {
      case CRAFT_TYPES.PAINTING:
        return <PaintingSimulation {...commonProps} />;
      case CRAFT_TYPES.MASK:
        return <MaskColoring {...commonProps} />;
      case CRAFT_TYPES.POTTERY:
        return <PotteryDecoration {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-museum-bg font-sans flex flex-col text-museum-secondary">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 px-6 py-4 bg-white/90 backdrop-blur-xl border-b border-stone-200 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-serif font-bold text-museum-primary flex items-center gap-3 drop-shadow-sm">
            <span className="text-3xl">🏛️</span>
            Sri Lankan Cultural Museum
          </h1>
        </div>

        <nav className="flex items-center gap-4">
          {!currentCraft && (
            <button
              onClick={() => window.location.href = 'http://localhost:8000/main_dashboard.html'}
              className="px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 border border-stone-200 hover:bg-stone-100 text-stone-700 hover:border-museum-accent"
            >
              <span>🏠</span> Dashboard
            </button>
          )}
          {currentCraft && (
            <>
              <button
                onClick={handleBackToMenu}
                className="px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 border border-stone-200 hover:bg-stone-100 text-museum-primary hover:border-museum-accent"
              >
                <span>←</span> Back to Menu
              </button>
              <button
                onClick={() => setShowGuidance(!showGuidance)}
                className="px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 bg-museum-accent/10 border border-museum-accent/30 hover:bg-museum-accent/20 text-museum-accent hover:text-museum-primary"
              >
                <span>📖</span> {showGuidance ? 'Hide Guide' : 'Cultural Guide'}
              </button>
            </>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full p-4 md:p-6 lg:p-8 flex flex-col">
        {!currentCraft ? (
          <CraftSelector onCraftSelect={handleCraftSelect} />
        ) : (
          <div className="relative flex-1 flex flex-col w-full bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden min-h-[800px]">
            <div className="flex-1 relative">
              {renderCurrentCraft()}
            </div>
          </div>
        )}
      </main>

      {/* Cultural Guidance Overlay */}
      {showGuidance && currentCraft && (
        <CulturalGuidance
          craftType={currentCraft}
          onClose={() => setShowGuidance(false)}
        />
      )}
    </div>
  );
}

export default App;
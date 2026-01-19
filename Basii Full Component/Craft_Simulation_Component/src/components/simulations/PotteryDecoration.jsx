/**
 * ============================================================================
 * MUSEUM KIOSK - POTTERY DECORATION (Coming Soon)
 * ============================================================================
 * Design Theme: "Modern Heritage" - Big, Bold, Accessible
 * Target: Large-format digital kiosk displays
 * ============================================================================
 */

import React from 'react';
import GameUI from '../GameUI';


const PotteryDecoration = ({ gameState, updateGameState, onBackToMenu }) => {
  return (
    <div className="w-full h-full px-8 py-8">
      <GameUI gameState={gameState} />
      <div className="flex flex-col items-center">
        <div className="text-center mb-12 relative w-full">
          {onBackToMenu && (
            <button
              onClick={onBackToMenu}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-white border border-stone-200 text-museum-primary px-6 py-3 rounded-xl font-semibold hover:bg-stone-50 hover:border-museum-accent transition-all shadow-md flex items-center gap-2 group"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span>
              <span>BACK TO MENU</span>
            </button>
          )}
          <h1 className="text-5xl font-serif font-bold text-museum-primary mb-4 drop-shadow-sm">🏺 Clay Pot Decoration</h1>
          <p className="text-xl text-museum-secondary font-light tracking-wide">
            Decorate pottery with ancient motifs and learn their symbolic meanings
          </p>
        </div>

        {/* Coming Soon Panel */}
        <div className="w-full max-w-4xl mx-auto bg-white/80 border border-stone-200 rounded-3xl p-12 backdrop-blur-md shadow-2xl">
          <div className="text-center">
            <span className="text-8xl block mb-8 animate-bounce">
              🏺
            </span>
            <h2 className="text-4xl font-serif font-bold text-museum-primary mb-6">Coming Soon!</h2>
            <p className="text-2xl text-museum-secondary leading-relaxed mb-12 max-w-2xl mx-auto">
              This simulation will let you decorate traditional Sri Lankan pottery
              with authentic patterns from the Anuradhapura and Polonnaruwa periods.
            </p>

            {/* Feature List */}
            <div className="bg-stone-50 rounded-3xl p-10 border border-stone-200 shadow-inner">
              <h3 className="text-2xl font-serif font-bold text-museum-primary mb-8">
                Planned Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                {[
                  { icon: '🪷', text: 'Pattern stamp tools (lotus, elephant, peacock)' },
                  { icon: '📐', text: 'Geometric border creators' },
                  { icon: '📚', text: 'Traditional motif library with meanings' },
                  { icon: '⚖️', text: 'Symmetrical design assistance' },
                  { icon: '🎨', text: 'Authentic historical color palettes' },
                  { icon: '🏛️', text: 'Cultural context for each motif' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-4 bg-white rounded-xl border border-stone-200 transition-transform hover:scale-105 shadow-sm"
                  >
                    <span className="text-3xl">{item.icon}</span>
                    <span className="text-lg text-museum-secondary font-medium">
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>


          </div>
        </div>
      </div>
    </div>
  );
};

export default PotteryDecoration;
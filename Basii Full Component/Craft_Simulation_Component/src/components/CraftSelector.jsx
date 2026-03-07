/**
 * ============================================================================
 * MUSEUM KIOSK - CRAFT SELECTOR
 * ============================================================================
 * Design Theme: "Modern Heritage" - Big, Bold, Accessible
 * Target: Large-format digital kiosk displays (1920x1080 - 4K)
 * ============================================================================
 */

import React, { useState } from 'react';

const CRAFTS = [
  {
    id: 'painting',
    title: 'Kandyan Painting Restoration',
    description: 'Restore ancient temple murals using traditional techniques from the Kingdom of Kandy.',
    icon: '🎨',
    difficulty: 'Beginner',
    estimatedTime: '10-15 min',
    culturalFocus: 'Buddhist temple art',
    historicalPeriod: '17th-19th Century CE',
  },
  {
    id: 'mask',
    title: 'Kolam Mask Painting',
    description: 'Create protective ritual masks using ancestral techniques from Southern coastal regions.',
    icon: '🎭',
    difficulty: 'Intermediate',
    estimatedTime: '15-20 min',
    culturalFocus: 'Ritual theater',
    historicalPeriod: 'Pre-Buddhist Era',
  },
  {
    id: 'pottery',
    title: 'Clay Pot Decoration',
    description: 'Decorate ceremonial vessels with motifs from ancient Anuradhapura and Polonnaruwa.',
    icon: '🏺',
    difficulty: 'Advanced',
    estimatedTime: '20-25 min',
    culturalFocus: 'Ceremonial vessels',
    historicalPeriod: '3rd Century BCE',
  }
];

const CraftSelector = ({ onCraftSelect }) => {
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <div className="w-full px-8 lg:px-12 py-8">
      {/* Main Content Area */}
      <div className="flex flex-col gap-12 w-full">

        {/* Hero Section */}
        <div className="text-center py-12 animate-fade-in-down bg-white/50 backdrop-blur-xl rounded-3xl shadow-soft border border-stone-200/50 mb-8">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-museum-primary via-museum-gold to-museum-primary mb-6 drop-shadow-sm tracking-tight">
            Sri Lankan Cultural Crafts
          </h1>
          <p className="text-xl md:text-2xl text-museum-secondary font-light font-sans tracking-wide">
            Choose Your Interactive Heritage Experience
          </p>
        </div>

        {/* Craft Cards Section - Now Centered */}
        <div className="flex flex-wrap justify-center gap-10 mb-12 w-full">
          {CRAFTS.map((craft, index) => (
            <div
              key={craft.id}
              className={`relative group bg-white border border-stone-200 rounded-[3rem] p-12 transition-all duration-500 hover:shadow-2xl hover:border-museum-accent/50 hover:-translate-y-4
                w-full md:w-[calc(50%-2rem)] lg:w-[calc(33.333%-2.5rem)] xl:w-[500px] flex flex-col items-center text-center
                ${hoveredCard === craft.id ? 'z-10 bg-gradient-to-b from-stone-50 to-white scale-105' : ''}`}
              onMouseEnter={() => setHoveredCard(craft.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-museum-accent/10 to-transparent rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              {/* Large Icon */}
              <div className="relative mb-10 transform transition-transform duration-500 group-hover:scale-110 flex justify-center w-full">
                <div className="absolute inset-0 bg-museum-gold/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <span className="text-9xl block drop-shadow-2xl relative z-10 transition-all duration-500 group-hover:rotate-6">
                  {craft.icon}
                </span>
              </div>

              {/* Title - Extra Large */}
              <h2 className="text-4xl lg:text-5xl font-serif font-bold text-museum-primary mb-6 group-hover:text-museum-accent transition-colors leading-tight">
                {craft.title}
              </h2>

              {/* Description - Larger text */}
              <p className="text-xl text-museum-secondary/90 mb-10 min-h-[80px] leading-relaxed font-sans">
                {craft.description}
              </p>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-4 my-6 p-4 bg-stone-100/50 rounded-2xl border border-stone-200/50 backdrop-blur-sm group-hover:bg-white/80 transition-colors">
                <div className="flex flex-col items-center">
                  <span className="text-xs uppercase tracking-wider text-museum-accent mb-1 font-bold">Duration</span>
                  <span className="font-semibold text-museum-primary">{craft.estimatedTime}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs uppercase tracking-wider text-museum-accent mb-1 font-bold">Level</span>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold w-fit shadow-sm
                    ${craft.difficulty === 'Beginner' ? 'text-green-800 bg-green-100' : ''}
                    ${craft.difficulty === 'Intermediate' ? 'text-amber-800 bg-amber-100' : ''}
                    ${craft.difficulty === 'Advanced' ? 'text-red-800 bg-red-100' : ''}
                  `}>
                    {craft.difficulty}
                  </span>
                </div>
                <div className="col-span-2 flex flex-col items-center pt-3 border-t border-stone-200/50">
                  <span className="text-xs uppercase tracking-wider text-museum-accent mb-1 font-bold">Period</span>
                  <span className="font-semibold text-museum-primary text-sm font-serif">{craft.historicalPeriod}</span>
                </div>
              </div>

              {/* CTA Button - Bigger & Bolder */}
              <div className="mt-10 w-full">
                <button
                  onClick={() => onCraftSelect(craft.id)}
                  className="w-full py-6 bg-white border-2 border-museum-accent text-museum-accent hover:bg-museum-accent hover:text-white font-bold tracking-[0.3em] uppercase text-lg rounded-2xl transition-all duration-300 flex items-center justify-center gap-4 shadow-xl shadow-museum-accent/30 group-hover:shadow-museum-accent/50 active:scale-95"
                >
                  <span>Begin Experience</span>
                  <span className="text-2xl transform transition-transform duration-300 group-hover:translate-x-3">→</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Learning Objectives Panel - Enhanced & Enlarged */}
        <div className="bg-white/60 border border-stone-200 rounded-[3rem] p-12 backdrop-blur-xl shadow-lg mt-12">
          <h3 className="text-4xl font-serif font-bold text-museum-primary mb-12 flex items-center gap-6 border-b border-stone-200/50 pb-8">
            <span className="text-5xl">📚</span> What You'll Learn
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            <div className="flex flex-col items-center text-center gap-6 bg-white p-10 rounded-3xl border border-stone-100 shadow-md hover:shadow-xl transition-all hover:-translate-y-2">
              <span className="text-7xl mb-2">🎯</span>
              <span className="text-museum-secondary font-bold text-xl font-sans leading-snug">Traditional artistic techniques</span>
            </div>
            <div className="flex flex-col items-center text-center gap-6 bg-white p-10 rounded-3xl border border-stone-100 shadow-md hover:shadow-xl transition-all hover:-translate-y-2">
              <span className="text-7xl mb-2">🧠</span>
              <span className="text-museum-secondary font-bold text-xl font-sans leading-snug">Cultural symbolism & iconography</span>
            </div>
            <div className="flex flex-col items-center text-center gap-6 bg-white p-10 rounded-3xl border border-stone-100 shadow-md hover:shadow-xl transition-all hover:-translate-y-2">
              <span className="text-7xl mb-2">🏛️</span>
              <span className="text-museum-secondary font-bold text-xl font-sans leading-snug">Religious & spiritual significance</span>
            </div>
            <div className="flex flex-col items-center text-center gap-6 bg-white p-10 rounded-3xl border border-stone-100 shadow-md hover:shadow-xl transition-all hover:-translate-y-2">
              <span className="text-7xl mb-2">🔬</span>
              <span className="text-museum-secondary font-bold text-xl font-sans leading-snug">Heritage preservation methods</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CraftSelector;
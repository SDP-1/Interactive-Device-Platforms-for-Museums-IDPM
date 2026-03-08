/**
 * ============================================================================
 * MUSEUM KIOSK - CULTURAL GUIDANCE OVERLAY
 * ============================================================================
 * Design Theme: "Modern Heritage" - Big, Bold, Accessible
 * Target: Large-format digital kiosk displays
 * ============================================================================
 */

import React, { useState } from 'react';


const GUIDANCE_CONTENT = {
  painting: {
    title: "Kandyan Painting Restoration",
    icon: "🎨",
    introduction: "You are restoring a traditional Kandyan mural from the Kingdom of Kandy (1469-1815 CE). These masterpieces represent the pinnacle of Sri Lankan Buddhist art.",
    steps: [
      {
        title: "Sacred Iconography & Pigments",
        content: "Traditional Kandyan paintings employ sophisticated color symbology rooted in Theravada Buddhist cosmology. Red ochre represents passion and power. Blue signifies wisdom and tranquility. Gold indicates divine radiance.",
        tip: "Divine figures use cooler, transcendent hues while earthly beings use warmer tones."
      },
      {
        title: "Compositional Elements",
        content: "The lotus represents spiritual purity. Elephants symbolize mental strength. Geometric borders represent cosmic order. Floral scrollwork indicates the abundance of merit.",
        tip: "Larger figures indicate spiritual importance, smaller elements represent earthly concerns."
      },
      {
        title: "Narrative Sequences",
        content: "You're reconstructing Jataka stories (Buddha's previous lives). These visual narratives served as teaching tools for both monks and lay devotees.",
        tip: "Each scene connects to larger themes of karma, rebirth, and liberation."
      }
    ],
    culturalContext: "These murals adorned the Dalada Maligawa (Temple of the Sacred Tooth Relic). Created under royal patronage, they represent court art, religious instruction, and cultural identity."
  },
  mask: {
    title: "Kolam Mask Painting",
    icon: "🎭",
    introduction: "You are creating a traditional Kolam mask for Sanni Yakuma ceremonies, an ancient healing tradition representing one of the world's oldest forms of psychological therapy.",
    steps: [
      {
        title: "Sacred Foundation Colors",
        content: "The red base represents fierce protective energy of benevolent demons. This foundation color connects to ancient animistic beliefs where red symbolized life force.",
        tip: "Apply base colors with reverent attention - this was considered a sacred act."
      },
      {
        title: "Apotropaic Features",
        content: "Exaggerated eyes create hypnotic power to entrance evil spirits. The gaping mouth represents the demon's ability to devour illness. Flared nostrils indicate breath control.",
        tip: "Bold, confident strokes channel the mask's spiritual energy."
      },
      {
        title: "Protective Symbols",
        content: "Geometric patterns derive from Hindu-Buddhist yantra traditions. Flame motifs represent purification. Spiral designs indicate cosmic energy.",
        tip: "Hand-crafted irregularities add authentic spiritual character."
      }
    ],
    culturalContext: "Kolam masks belong to the Sanni Yakuma tradition. These healing ceremonies combine pre-Buddhist shamanic practices with Ayurvedic medicine and Buddhist psychological insights."
  },
  pottery: {
    title: "Clay Pot Decoration",
    icon: "🏺",
    introduction: "You are decorating a ceremonial vessel using motifs that evolved over 2,500 years of Sri Lankan ceramic traditions from Anuradhapura and Polonnaruwa.",
    steps: [
      {
        title: "Sacred Iconographic Motifs",
        content: "The lotus represents spiritual purity. Elephants signify mental strength and royal power. Peacocks indicate vigilance against spiritual dangers.",
        tip: "Begin with central motifs, then add secondary elements."
      },
      {
        title: "Rhythmic Patterns",
        content: "Border patterns create protective boundaries. Wave patterns represent the ocean of samsara. Spiral motifs indicate energy transformation.",
        tip: "Use stamp tools to achieve consistent repetition."
      },
      {
        title: "Functional Beauty",
        content: "Your completed vessel embodies the Lankan principle that everyday objects should elevate daily life through beauty and spiritual meaning.",
        tip: "Overall harmony is more important than individual detail perfection."
      }
    ],
    culturalContext: "Lankan pottery traditions began with indigenous proto-historic cultures and reached sophisticated heights during the Anuradhapura period (377 BCE - 1017 CE)."
  }
};

const CulturalGuidance = ({ craftType, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const guidance = GUIDANCE_CONTENT[craftType];

  if (!guidance) return null;

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, guidance.steps.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-4xl bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center bg-stone-50 px-8 py-6 border-b border-stone-200">
          <div className="flex items-center gap-4">
            <span className="text-4xl bg-white w-16 h-16 rounded-full flex items-center justify-center border border-stone-200 shadow-sm">
              {guidance.icon}
            </span>
            <h2 className="text-3xl font-serif font-bold text-museum-primary">{guidance.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-stone-100 hover:bg-stone-200 text-stone-400 hover:text-museum-primary transition-colors text-xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto custom-scrollbar">
          {/* Introduction */}
          <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 mb-8">
            <p className="text-xl text-museum-secondary leading-relaxed font-light font-sans">
              {guidance.introduction}
            </p>
          </div>

          {/* Step Navigation */}
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-stone-200 shadow-sm">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className="px-6 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-museum-primary disabled:opacity-30 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-2"
              >
                <span>←</span> Previous
              </button>
              <span className="text-museum-accent font-bold tracking-widest text-sm uppercase">
                Step {currentStep + 1} of {guidance.steps.length}
              </span>
              <button
                onClick={nextStep}
                disabled={currentStep === guidance.steps.length - 1}
                className="px-6 py-3 rounded-xl bg-museum-accent/10 hover:bg-museum-accent/20 text-museum-accent disabled:opacity-30 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-2"
              >
                Next <span>→</span>
              </button>
            </div>

            {/* Current Step Content */}
            <div className="bg-white border border-stone-200 p-8 rounded-2xl min-h-[300px] flex flex-col justify-center shadow-lg">
              <h3 className="text-2xl font-bold text-museum-primary mb-4 font-serif">
                {guidance.steps[currentStep]?.title}
              </h3>
              <p className="text-xl text-museum-secondary leading-relaxed mb-8">
                {guidance.steps[currentStep]?.content}
              </p>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl flex gap-4 items-start">
                <span className="text-2xl">💡</span>
                <span className="text-lg text-museum-secondary">
                  <strong className="text-blue-800 block mb-1">Expert Tip:</strong>
                  {guidance.steps[currentStep]?.tip}
                </span>
              </div>
            </div>
          </div>

          {/* Cultural Context */}
          <div className="border-t border-stone-200 pt-8 mt-8">
            <h4 className="text-museum-primary font-bold text-lg mb-3 flex items-center gap-2">
              <span>📜</span> Cultural Context
            </h4>
            <p className="text-lg text-museum-secondary leading-relaxed italic">
              {guidance.culturalContext}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CulturalGuidance;
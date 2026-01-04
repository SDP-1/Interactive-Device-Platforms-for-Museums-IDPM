import { useState, useEffect } from 'react';
import { X, Info, Palette, Hammer, Sparkles, Crown, Shield, Star } from 'lucide-react';

// Generate hotspots based on artifact details
const generateHotspots = (artifact) => {
  if (!artifact) return [];

  const hotspots = [];
  const category = artifact.category?.toLowerCase() || '';
  const name = artifact.name?.toLowerCase() || '';
  const materials = artifact.details?.material?.toLowerCase() || '';
  const symbolism = artifact.details?.symbolism || '';
  const func = artifact.details?.function || '';

  // Material hotspot - always add if materials exist
  if (artifact.details?.material && artifact.details.material !== 'Unknown') {
    hotspots.push({
      id: 'material',
      x: 25,
      y: 30,
      icon: Hammer,
      title: 'Materials & Craftsmanship',
      description: `Crafted from ${artifact.details.material}. ${materials.includes('wood') ? 'Traditional woodworking techniques were used to shape and finish this piece.' :
        materials.includes('brass') || materials.includes('bronze') ? 'Metal casting and hand-finishing techniques demonstrate master craftsmanship.' :
          materials.includes('stone') || materials.includes('granite') ? 'Stone carving required skilled artisans working over extended periods.' :
            materials.includes('clay') || materials.includes('terracotta') ? 'Traditional pottery methods were employed in its creation.' :
              'Expert artisans employed traditional techniques passed down through generations.'
        }`,
      color: 'amber'
    });
  }

  // Symbolism hotspot
  if (symbolism && symbolism !== 'Unknown') {
    hotspots.push({
      id: 'symbolism',
      x: 75,
      y: 25,
      icon: Sparkles,
      title: 'Symbolic Meaning',
      description: symbolism.length > 200 ? symbolism.substring(0, 200) + '...' : symbolism,
      color: 'purple'
    });
  }

  // Function/Use hotspot
  if (func && func !== 'Unknown') {
    hotspots.push({
      id: 'function',
      x: 50,
      y: 70,
      icon: Crown,
      title: 'Purpose & Function',
      description: func.length > 200 ? func.substring(0, 200) + '...' : func,
      color: 'blue'
    });
  }

  // Category-specific hotspots
  if (category.includes('mask') || name.includes('mask')) {
    hotspots.push({
      id: 'colors',
      x: 35,
      y: 55,
      icon: Palette,
      title: 'Colors & Pigments',
      description: 'Traditional masks feature vibrant colors derived from natural pigments. Red symbolizes power, yellow represents divinity, and black denotes supernatural forces.',
      color: 'rose'
    });
    hotspots.push({
      id: 'regional',
      x: 70,
      y: 60,
      icon: Star,
      title: 'Regional Significance',
      description: 'This mask style reflects the distinctive artistic traditions of its region, incorporating local mythology and ceremonial practices unique to the area.',
      color: 'emerald'
    });
  }

  if (category.includes('weapon') || name.includes('sword') || name.includes('kasthane')) {
    hotspots.push({
      id: 'metallurgy',
      x: 30,
      y: 45,
      icon: Shield,
      title: 'Metallurgy',
      description: 'The blade demonstrates advanced metallurgical knowledge, with careful tempering and folding techniques that create both strength and flexibility.',
      color: 'slate'
    });
    hotspots.push({
      id: 'engravings',
      x: 65,
      y: 40,
      icon: Star,
      title: 'Decorative Engravings',
      description: 'Intricate engravings along the blade and hilt feature traditional motifs including lotus flowers, mythical creatures, and royal insignia.',
      color: 'emerald'
    });
    hotspots.push({
      id: 'ceremonial',
      x: 50,
      y: 85,
      icon: Crown,
      title: 'Ceremonial Role',
      description: 'Beyond its practical use, this weapon served important ceremonial functions in royal courts and religious ceremonies.',
      color: 'amber'
    });
  }

  if (category.includes('statue') || category.includes('sculpture') || name.includes('buddha') || name.includes('statue')) {
    hotspots.push({
      id: 'posture',
      x: 50,
      y: 35,
      icon: Star,
      title: 'Sacred Posture',
      description: 'The specific posture (mudra) and hand gestures carry deep spiritual significance, representing meditation, teaching, or protection.',
      color: 'emerald'
    });
    hotspots.push({
      id: 'iconography',
      x: 30,
      y: 65,
      icon: Info,
      title: 'Iconographic Elements',
      description: 'Every detail from the elongated earlobes to the flame-like ushnisha follows precise iconographic traditions.',
      color: 'blue'
    });
  }

  if (category.includes('textile') || name.includes('textile') || name.includes('cloth')) {
    hotspots.push({
      id: 'weaving',
      x: 40,
      y: 40,
      icon: Hammer,
      title: 'Weaving Technique',
      description: 'Traditional handloom weaving techniques create intricate patterns that can take weeks or months to complete.',
      color: 'amber'
    });
    hotspots.push({
      id: 'patterns',
      x: 60,
      y: 60,
      icon: Star,
      title: 'Pattern Symbolism',
      description: 'The geometric and floral patterns carry cultural meanings, often representing prosperity, protection, or social status.',
      color: 'emerald'
    });
  }

  if (category.includes('jewelry') || name.includes('jewelry') || name.includes('ornament')) {
    hotspots.push({
      id: 'gemstones',
      x: 45,
      y: 35,
      icon: Sparkles,
      title: 'Precious Elements',
      description: 'Traditional jewelry incorporates gemstones and metals believed to have protective and auspicious properties.',
      color: 'purple'
    });
    hotspots.push({
      id: 'design',
      x: 55,
      y: 65,
      icon: Star,
      title: 'Design Traditions',
      description: 'The design follows centuries-old patterns, each element carefully placed according to traditional aesthetics.',
      color: 'emerald'
    });
  }

  // Ensure we have at least 3 hotspots
  if (hotspots.length < 3) {
    if (!hotspots.find(h => h.id === 'origin')) {
      hotspots.push({
        id: 'origin',
        x: 20,
        y: 75,
        icon: Info,
        title: 'Cultural Origin',
        description: `This artifact originates from ${artifact.origin || 'Sri Lanka'}, reflecting the rich cultural heritage and artistic traditions of the region during the ${artifact.era || 'historical'} period.`,
        color: 'blue'
      });
    }
    if (!hotspots.find(h => h.id === 'preservation')) {
      hotspots.push({
        id: 'preservation',
        x: 80,
        y: 80,
        icon: Shield,
        title: 'Historical Preservation',
        description: 'This artifact has been carefully preserved, offering valuable insights into historical craftsmanship and cultural practices.',
        color: 'slate'
      });
    }
  }

  return hotspots;
};

const colorClasses = {
  amber: {
    bg: 'bg-amber-500',
    bgLight: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    ring: 'ring-amber-400'
  },
  purple: {
    bg: 'bg-purple-500',
    bgLight: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-800',
    ring: 'ring-purple-400'
  },
  blue: {
    bg: 'bg-blue-500',
    bgLight: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    ring: 'ring-blue-400'
  },
  emerald: {
    bg: 'bg-emerald-500',
    bgLight: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-800',
    ring: 'ring-emerald-400'
  },
  rose: {
    bg: 'bg-rose-500',
    bgLight: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-800',
    ring: 'ring-rose-400'
  },
  slate: {
    bg: 'bg-slate-500',
    bgLight: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-800',
    ring: 'ring-slate-400'
  }
};

const HotspotImage = ({ artifact, image, alt, activeHotspot: externalActiveHotspot, onHotspotChange }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [hotspotsVisible, setHotspotsVisible] = useState(false);
  const [internalActiveHotspot, setInternalActiveHotspot] = useState(null);
  const [hotspots, setHotspots] = useState([]);

  // Use external state if provided, otherwise use internal state
  const activeHotspot = externalActiveHotspot !== undefined ? externalActiveHotspot : internalActiveHotspot;
  const setActiveHotspot = onHotspotChange || setInternalActiveHotspot;

  useEffect(() => {
    if (artifact) {
      setHotspots(generateHotspots(artifact));
    }
  }, [artifact]);

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    setHotspotsVisible(false);
    setActiveHotspot(null);
  }, [image]);

  const handleImageClick = (e) => {
    // Don't toggle if clicking on a hotspot
    if (e.target.closest('.hotspot-marker')) return;
    setHotspotsVisible(!hotspotsVisible);
    if (hotspotsVisible) {
      setActiveHotspot(null);
    }
  };

  const handleHotspotClick = (e, hotspot) => {
    e.stopPropagation();
    // Synchronize by ID across all instances
    const isSameId = activeHotspot === hotspot.id;
    setActiveHotspot(isSameId ? null : hotspot.id);
  };

  const closeTooltip = (e) => {
    e.stopPropagation();
    setActiveHotspot(null);
  };

  return (
    <div className="relative w-full h-full">
      {/* Main Image Container */}
      <div
        className={`relative w-full h-full cursor-pointer overflow-hidden rounded-xl sm:rounded-2xl 
                    border border-stone-200 bg-stone-100 transition-all duration-300
                    ${hotspotsVisible ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`}
        onClick={handleImageClick}
      >
        {/* Loading State */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 image-loading" />
        )}

        {/* Error/Fallback State */}
        {imageError || !image ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-100">
            <span className="text-4xl sm:text-6xl mb-2 sm:mb-4">🏺</span>
            <span className="text-stone-400 font-sans text-sm sm:text-base">Image unavailable</span>
          </div>
        ) : (
          <img
            src={image}
            alt={alt}
            className={`w-full h-full object-cover transition-all duration-500
                       ${imageLoaded ? 'opacity-100' : 'opacity-0'}
                       ${hotspotsVisible ? 'brightness-95' : ''}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}

        {/* Tap Indicator - shows when image is loaded but hotspots not visible */}
        {imageLoaded && !imageError && !hotspotsVisible && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 
                          opacity-0 hover:opacity-100 transition-opacity duration-300">
            <div className="bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 sm:px-6 sm:py-3 
                            shadow-lg flex items-center gap-2 animate-pulse">
              <Info size={18} className="text-amber-600" />
              <span className="text-sm sm:text-base font-sans text-stone-700 font-medium">
                Tap to explore hotspots
              </span>
            </div>
          </div>
        )}

        {/* Hotspots */}
        {(hotspotsVisible || activeHotspot) && imageLoaded && !imageError && (
          <>
            {hotspots.map((hotspot) => {
              const colors = colorClasses[hotspot.color] || colorClasses.amber;
              const Icon = hotspot.icon;
              const isActive = activeHotspot === hotspot.id;
              const isOtherActive = activeHotspot !== null && !isActive;

              // If another hotspot is active, hide this marker for focus
              if (isOtherActive) return null;

              return (
                <div
                  key={hotspot.id}
                  className="hotspot-marker absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                  style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                >
                  {/* Hotspot Button */}
                  <button
                    onClick={(e) => handleHotspotClick(e, hotspot)}
                    className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-full ${colors.bg} 
                               shadow-lg flex items-center justify-center
                               transition-all duration-300 hover:scale-110
                               ${isActive ? `ring-4 ${colors.ring} scale-110` : ''}
                               animate-pulse hover:animate-none`}
                  >
                    <Icon size={16} className="text-white sm:w-5 sm:h-5" />

                    {/* Ripple Effect */}
                    <span className={`absolute inset-0 rounded-full ${colors.bg} opacity-40 
                                     animate-ping`} />
                  </button>

                  {/* Tooltip */}
                  {isActive && (
                    <div
                      className={`absolute z-20 w-64 sm:w-72 ${colors.bgLight} ${colors.border} 
                                  border rounded-xl shadow-xl p-3 sm:p-4 animate-fadeIn
                                  ${hotspot.x > 50 ? 'right-full mr-3' : 'left-full ml-3'}
                                  ${hotspot.y > 60 ? 'bottom-0' : 'top-0'}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Close Button */}
                      <button
                        onClick={closeTooltip}
                        className="absolute top-2 right-2 p-1 hover:bg-white/50 rounded-full 
                                   transition-colors"
                      >
                        <X size={14} className="text-stone-500" />
                      </button>

                      {/* Content */}
                      <div className="flex items-start gap-2 sm:gap-3 pr-6">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${colors.bg} 
                                        flex items-center justify-center flex-shrink-0`}>
                          <Icon size={16} className="text-white sm:w-5 sm:h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-serif font-bold text-sm sm:text-base ${colors.text} mb-1`}>
                            {hotspot.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-stone-600 font-sans leading-relaxed">
                            {hotspot.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Instructions overlay */}
            <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4">
              <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 
                              flex items-center justify-between">
                <span className="text-white/90 text-xs sm:text-sm font-sans">
                  {activeHotspot ? 'Tap another point or image to continue' : 'Tap colored points to learn more'}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setHotspotsVisible(false);
                    setActiveHotspot(null);
                  }}
                  className="text-white/70 hover:text-white text-xs sm:text-sm font-sans 
                             underline ml-3"
                >
                  Close
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Hotspot Count Badge */}
      {hotspots.length > 0 && !hotspotsVisible && imageLoaded && !imageError && (
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
          <div className="bg-amber-600 text-white rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 
                          shadow-lg flex items-center gap-1.5 text-xs sm:text-sm font-sans font-medium">
            <Info size={14} />
            <span>{hotspots.length} hotspots</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default HotspotImage;

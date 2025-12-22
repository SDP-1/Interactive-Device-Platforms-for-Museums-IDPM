import { useState } from 'react';
import { MapPin, Clock, Tag, Eye, Info } from 'lucide-react';

const ArtifactCard = ({ artifact, onClick, delay = 0 }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-xl sm:rounded-2xl shadow-md border border-stone-200 
                 overflow-hidden cursor-pointer card-hover animate-fadeIn h-full flex flex-col"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Image Container - Responsive height */}
      <div className="relative h-48 sm:h-56 md:h-64 lg:h-72 bg-stone-100 overflow-hidden flex-shrink-0">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 image-loading" />
        )}
        
        {imageError || !artifact.image ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-100">
            <span className="text-5xl sm:text-6xl mb-3">🏺</span>
            <span className="text-stone-400 text-sm sm:text-base font-sans">Image unavailable</span>
          </div>
        ) : (
          <img
            src={artifact.image}
            alt={artifact.name}
            className={`w-full h-full object-cover transition-transform duration-500 
                       group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent 
                        opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Quick view icon */}
        <div className="absolute inset-0 flex items-center justify-center 
                        opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-white/90 rounded-full p-3 sm:p-4 shadow-lg transform 
                          translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <Eye size={24} className="text-amber-700 sm:w-7 sm:h-7" />
          </div>
        </div>

        {/* Category Badge */}
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-4 sm:py-1.5 bg-white/90 backdrop-blur-sm 
                          rounded-full text-xs sm:text-sm font-sans text-stone-700 shadow-sm font-medium">
            <Tag size={14} className="sm:w-4 sm:h-4" />
            <span className="truncate max-w-[100px] sm:max-w-none">{artifact.category}</span>
          </span>
        </div>

        {/* Hotspot Indicator Badge */}
        {imageLoaded && !imageError && (
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
            <span className="inline-flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 
                            bg-amber-500 text-white rounded-full text-xs font-sans font-medium shadow-sm">
              <Info size={12} className="sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">Hotspots</span>
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 md:p-6 flex flex-col flex-1">
        <h3 className="font-serif text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-stone-800 mb-3 sm:mb-4 
                 group-hover:text-amber-700 transition-colors line-clamp-2">
          {artifact.name}
        </h3>
        
        <div className="space-y-1.5 sm:space-y-2 mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-2.5 text-sm sm:text-base text-stone-500 font-sans">
            <MapPin size={16} className="text-stone-400 flex-shrink-0 sm:w-5 sm:h-5" />
            <span className="line-clamp-1">{artifact.origin}</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-2.5 text-sm sm:text-base text-stone-500 font-sans">
            <Clock size={16} className="text-stone-400 flex-shrink-0 sm:w-5 sm:h-5" />
            <span className="line-clamp-1">{artifact.era}</span>
          </div>
        </div>

        <p className="text-sm sm:text-base text-stone-600 font-sans line-clamp-3 mb-4 sm:mb-5 flex-1">
          {artifact.description}
        </p>

        {/* View Details Button */}
        <button
          className="w-full py-3 sm:py-4 bg-amber-700 hover:bg-amber-800 text-white 
                     rounded-lg font-sans text-base sm:text-lg font-medium transition-colors
                     flex items-center justify-center gap-3 sm:gap-3 mt-auto"
        >
          <span>View Details</span>
          <svg 
            className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:translate-x-1 transition-transform" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ArtifactCard;

import { useState } from 'react';
import { MapPin, Clock, Tag, Eye, Info } from 'lucide-react';

const ArtifactCard = ({ artifact, onClick, delay = 0 }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-[2.5rem] shadow-lg border-2 border-stone-100 
                 overflow-hidden cursor-pointer active:scale-95 transition-all duration-300 
                 hover:shadow-2xl hover:border-orange-500/50 animate-fadeIn h-full flex flex-col"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Image Container - Significantly Enlarged */}
      <div className="relative h-64 sm:h-80 md:h-96 bg-stone-50 overflow-hidden flex-shrink-0 border-b border-stone-100">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 image-loading" />
        )}

        {imageError || !artifact.image ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-50">
            <span className="text-7xl sm:text-9xl mb-4">🏺</span>
            <span className="text-stone-400 text-lg sm:text-xl font-sans font-medium uppercase tracking-widest">Image unavailable</span>
          </div>
        ) : (
          <img
            src={artifact.image}
            alt={artifact.name}
            className={`w-full h-full object-contain transition-all duration-700 
                       group-hover:scale-110 p-6 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
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

        {/* Hotspot Indicator Badge - Larger */}
        {imageLoaded && !imageError && (
          <div className="absolute top-6 right-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 
                            bg-amber-600 text-white rounded-full text-sm font-sans font-bold shadow-lg">
              <Info size={16} className="flex-shrink-0" />
              <span>Hotspots</span>
            </span>
          </div>
        )}
      </div>

      {/* Content - Bolder & Larger */}
      <div className="p-8 sm:p-10 flex flex-col flex-1">
        <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-stone-800 mb-6 
                 group-hover:text-amber-700 transition-colors line-clamp-2 leading-tight">
          {artifact.name}
        </h3>

        <div className="space-y-3 mb-8">
          <div className="flex items-center gap-4 text-lg sm:text-xl text-stone-500 font-sans font-medium">
            <MapPin size={24} className="text-amber-700/60 flex-shrink-0" />
            <span className="line-clamp-1 italic">{artifact.origin}</span>
          </div>
          <div className="flex items-center gap-4 text-lg sm:text-xl text-stone-500 font-sans font-medium">
            <Clock size={24} className="text-amber-700/60 flex-shrink-0" />
            <span className="line-clamp-1 italic">{artifact.era}</span>
          </div>
        </div>

        <p className="text-lg sm:text-xl text-stone-600 font-sans line-clamp-3 mb-10 flex-1 leading-relaxed">
          {artifact.description}
        </p>

        <button
          className="w-full py-5 sm:py-6 bg-white border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white 
                     rounded-2xl font-sans text-xl sm:text-2xl font-bold tracking-[0.1em] uppercase transition-all
                     flex items-center justify-center gap-4 mt-auto shadow-xl hover:shadow-orange-500/30 active:scale-95"
        >
          <span>View Details</span>
          <svg
            className="w-6 h-6 sm:w-8 sm:h-8 transform group-hover:translate-x-2 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ArtifactCard;

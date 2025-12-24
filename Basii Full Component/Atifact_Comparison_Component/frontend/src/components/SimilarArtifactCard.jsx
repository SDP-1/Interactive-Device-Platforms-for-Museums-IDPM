import { useState } from 'react';
import { Scale, ArrowRight } from 'lucide-react';

const SimilarArtifactCard = ({ artifact, onCompare, delay = 0 }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Format similarity score color
  const getScoreColor = (score) => {
    if (score >= 90) return 'bg-emerald-100 text-emerald-700';
    if (score >= 80) return 'bg-amber-100 text-amber-700';
    return 'bg-stone-100 text-stone-700';
  };

  return (
    <div
      className="group bg-white rounded-xl sm:rounded-2xl shadow-md border border-stone-200 
                 overflow-hidden animate-fadeIn h-full flex flex-col"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Image Container */}
      <div className="relative h-36 sm:h-44 md:h-52 bg-stone-100 overflow-hidden flex-shrink-0">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 image-loading" />
        )}
        
        {imageError || !artifact.image ? (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-100">
            <span className="text-4xl sm:text-5xl">🏺</span>
          </div>
        ) : (
          <img
            src={artifact.image}
            alt={artifact.name}
            className={`w-full h-full object-cover transition-all duration-500 
                       group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        )}

        {/* Similarity Score Badge */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
          <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full 
                           text-xs sm:text-sm font-semibold font-sans shadow-sm ${getScoreColor(artifact.similarityScore)}`}>
            {artifact.similarityScore}% Match
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <h3 className="font-serif text-base sm:text-lg md:text-xl font-bold text-stone-800 mb-1.5 sm:mb-2 line-clamp-2">
          {artifact.name}
        </h3>
        
        <div className="text-xs sm:text-sm text-stone-500 font-sans mb-3 sm:mb-4 line-clamp-1">
          <span>{artifact.era}</span>
          <span className="mx-1.5">•</span>
          <span>{artifact.origin}</span>
        </div>

        <p className="text-sm sm:text-base text-stone-600 font-sans line-clamp-3 mb-4 sm:mb-5 flex-1">
          {artifact.description}
        </p>

        {/* Compare Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCompare();
          }}
          className="w-full py-2.5 sm:py-3 bg-stone-100 hover:bg-amber-700 text-stone-700 
                     hover:text-white rounded-xl font-sans text-sm sm:text-base font-medium 
                     transition-all duration-300 flex items-center justify-center gap-2 sm:gap-2.5
                     border border-stone-200 hover:border-amber-700 mt-auto"
        >
          <Scale size={18} className="sm:w-5 sm:h-5" />
          <span>Compare</span>
          <ArrowRight size={18} className="opacity-0 group-hover:opacity-100 transition-opacity sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
};

export default SimilarArtifactCard;

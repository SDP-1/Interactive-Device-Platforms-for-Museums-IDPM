import { useState, useEffect } from 'react';
import {
  ArrowLeft, Scale, CheckCircle, XCircle, BookOpen,
  Sparkles, MapPin, Clock, Layers, Home, RefreshCw, AlertCircle
} from 'lucide-react';
import HotspotImage from './HotspotImage';

const API_BASE = '/api';

const ComparisonScreen = ({ artifactA, artifactB, onBack, onBackToGallery }) => {
  const [imageALoaded, setImageALoaded] = useState(false);
  const [imageBLoaded, setImageBLoaded] = useState(false);
  const [imageAError, setImageAError] = useState(false);
  const [imageBError, setImageBError] = useState(false);
  const [showAiInsights, setShowAiInsights] = useState(false);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [apiComparison, setApiComparison] = useState(null);
  const [comparisonError, setComparisonError] = useState(null);
  const [activeHotspot, setActiveHotspot] = useState(null);

  // Fetch comparison from API
  const handleGenerateInsights = async () => {
    if (!artifactA?.id || !artifactB?.id) return;

    setIsLoadingInsights(true);
    setComparisonError(null);
    try {
      const response = await fetch(`${API_BASE}/compare`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artifact1_id: artifactA.id,
          artifact2_id: artifactB.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate comparison');
      }

      const data = await response.json();
      setApiComparison(data);
      setShowAiInsights(true);
    } catch (err) {
      console.error('Error generating comparison:', err);
      setComparisonError('Failed to generate AI comparison. Using local analysis.');
      setShowAiInsights(true);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  // Auto-generate insights on load
  useEffect(() => {
    const timer = setTimeout(() => {
      handleGenerateInsights();
    }, 500);
    return () => clearTimeout(timer);
  }, [artifactA?.id, artifactB?.id]);

  // Generate comparison data
  const generateComparison = () => {
    if (!artifactA || !artifactB) return null;

    // Determine similarities and differences
    const similarities = [];
    const differences = [];

    // Category comparison
    if (artifactA.category === artifactB.category) {
      similarities.push(`Both artifacts belong to the "${artifactA.category}" category`);
    } else {
      differences.push({
        aspect: 'Category',
        a: artifactA.category,
        b: artifactB.category
      });
    }

    // Origin comparison
    if (artifactA.origin === artifactB.origin) {
      similarities.push(`Both originate from ${artifactA.origin}`);
    } else {
      differences.push({
        aspect: 'Origin',
        a: artifactA.origin,
        b: artifactB.origin
      });
    }

    // Check for shared cultural elements
    const sharedKeywords = findSharedKeywords(
      artifactA.description + ' ' + artifactA.details.symbolism,
      artifactB.description + ' ' + artifactB.details.symbolism
    );

    if (sharedKeywords.length > 0) {
      similarities.push(`Share cultural themes: ${sharedKeywords.slice(0, 3).join(', ')}`);
    }

    // Material comparison
    const materialsA = artifactA.details.material.toLowerCase();
    const materialsB = artifactB.details.material.toLowerCase();
    const sharedMaterials = findSharedMaterials(materialsA, materialsB);

    if (sharedMaterials.length > 0) {
      similarities.push(`Common materials used: ${sharedMaterials.join(', ')}`);
    }

    // Add some standard comparisons
    if (artifactA.origin.includes('Sri Lanka') && artifactB.origin.includes('Sri Lanka')) {
      similarities.push('Both represent Sri Lankan cultural heritage');
    }

    // Era difference
    if (artifactA.era !== artifactB.era) {
      differences.push({
        aspect: 'Time Period',
        a: artifactA.era,
        b: artifactB.era
      });
    }

    // Function difference
    if (artifactA.details.function !== artifactB.details.function) {
      differences.push({
        aspect: 'Primary Function',
        a: artifactA.details.function.substring(0, 100) + '...',
        b: artifactB.details.function.substring(0, 100) + '...'
      });
    }

    // Cultural significance text
    const culturalSignificance = generateCulturalSignificance(artifactA, artifactB);

    return { similarities, differences, culturalSignificance };
  };

  const findSharedKeywords = (textA, textB) => {
    const keywords = ['sacred', 'ceremonial', 'traditional', 'ritual', 'Buddhist',
      'cultural', 'religious', 'royal', 'ancient', 'heritage',
      'symbolic', 'spiritual', 'artistic', 'craftsmanship'];
    return keywords.filter(keyword =>
      textA.toLowerCase().includes(keyword) && textB.toLowerCase().includes(keyword)
    );
  };

  const findSharedMaterials = (a, b) => {
    const materials = ['wood', 'stone', 'metal', 'brass', 'bronze', 'gold', 'silver',
      'clay', 'terracotta', 'granite', 'steel', 'iron', 'paint'];
    return materials.filter(m => a.includes(m) && b.includes(m));
  };

  const generateCulturalSignificance = (a, b) => {
    // Use pre-written comparison if available
    if (a.comparisonTo && a.comparisonTo[b.id]) {
      return a.comparisonTo[b.id];
    }
    if (b.comparisonTo && b.comparisonTo[a.id]) {
      return b.comparisonTo[a.id];
    }

    // Generate generic comparison
    return `The comparison between "${a.name}" and "${b.name}" reveals fascinating insights into cultural exchange and artistic traditions across ${a.origin === b.origin ? a.origin : `${a.origin} and ${b.origin}`}. While each artifact serves its unique purpose within its cultural context, both demonstrate the sophisticated craftsmanship and deep symbolic meanings that characterize traditional material culture. The ${a.category.toLowerCase()} traditions represented by "${a.name}" and the ${b.category.toLowerCase()} traditions of "${b.name}" both reflect their respective societies' values, beliefs, and aesthetic sensibilities, offering valuable perspectives on human cultural expression.`;
  };

  const comparison = generateComparison();

  if (!artifactA || !artifactB) {
    return (
      <div className="text-center py-8 sm:py-16">
        <p className="text-sm sm:text-base text-stone-500 font-sans">Missing artifact data for comparison</p>
        <button
          onClick={onBackToGallery}
          className="mt-4 px-4 sm:px-6 py-2 bg-amber-700 text-white rounded-lg text-sm sm:text-base"
        >
          Return to Gallery
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <Scale size={22} className="text-amber-600 sm:w-7 sm:h-7" />
            <h1 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-stone-800">
              Comparative Analysis
            </h1>
          </div>
          {/* Similarity Score Badge */}
          {apiComparison?.similarity_score !== undefined && (
            <div className={`self-start px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold ${apiComparison.similarity_score >= 70
              ? 'bg-emerald-100 text-emerald-800'
              : apiComparison.similarity_score >= 50
                ? 'bg-amber-100 text-amber-800'
                : 'bg-rose-100 text-rose-800'
              }`}>
              {apiComparison.similarity_score}% Match
            </div>
          )}
        </div>
        <p className="text-xs sm:text-sm text-stone-500 font-sans">
          {apiComparison?.source === 'trained_model'
            ? 'Powered by trained AI model'
            : 'AI-powered comparison of cultural artifacts'}
        </p>

        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-stone-100 
                       hover:bg-stone-200 text-stone-700 rounded-lg 
                       transition-colors font-sans text-xs sm:text-sm"
          >
            <ArrowLeft size={14} className="sm:w-[18px] sm:h-[18px]" />
            <span className="hidden xs:inline">Back to Artifact</span>
            <span className="xs:hidden">Back</span>
          </button>
          <button
            onClick={onBackToGallery}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-700 
                       hover:bg-amber-800 text-white rounded-lg 
                       transition-colors font-sans text-xs sm:text-sm"
          >
            <Home size={14} className="sm:w-[18px] sm:h-[18px]" />
            <span>Gallery</span>
          </button>
        </div>
      </div>

      {/* Visual Comparison - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-10">
        {/* Artifact A */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="bg-amber-50 px-3 sm:px-4 py-1.5 sm:py-2 border-b border-amber-100">
            <span className="text-xs sm:text-sm font-medium text-amber-800 font-sans">Artifact A - Tap image for hotspots</span>
          </div>
          <div className="bg-stone-100 p-6 md:p-8 lg:p-10 h-56 md:h-80 lg:h-96 xl:h-[560px]">
            <HotspotImage
              artifact={artifactA}
              image={artifactA.image}
              alt={artifactA.name}
              activeHotspot={activeHotspot}
              onHotspotChange={setActiveHotspot}
            />
          </div>
          <div className="p-4 sm:p-5 md:p-6">
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-stone-800 mb-3 sm:mb-4 line-clamp-2">
              {artifactA.name}
            </h2>
            <div className="space-y-1.5 sm:space-y-2">
              <CompactMetadata icon={MapPin} label="Origin" value={artifactA.origin} />
              <CompactMetadata icon={Clock} label="Era" value={artifactA.era} />
              <CompactMetadata icon={Layers} label="Material" value={artifactA.details.material} />
            </div>
          </div>
        </div>

        {/* Artifact B */}
        <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-stone-200 overflow-hidden">
          <div className="bg-slate-50 px-3 sm:px-4 py-1.5 sm:py-2 border-b border-slate-100">
            <span className="text-xs sm:text-sm font-medium text-slate-700 font-sans">Artifact B - Tap image for hotspots</span>
          </div>
          <div className="bg-stone-100 p-6 md:p-8 lg:p-10 h-56 md:h-80 lg:h-96 xl:h-[560px]">
            <HotspotImage
              artifact={artifactB}
              image={artifactB.image}
              alt={artifactB.name}
              activeHotspot={activeHotspot}
              onHotspotChange={setActiveHotspot}
            />
          </div>
          <div className="p-4 sm:p-5 md:p-6">
            <h2 className="font-serif text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-stone-800 mb-2 sm:mb-3 line-clamp-2">
              {artifactB.name}
            </h2>
            <div className="space-y-1.5 sm:space-y-2">
              <CompactMetadata icon={MapPin} label="Origin" value={artifactB.origin} />
              <CompactMetadata icon={Clock} label="Era" value={artifactB.era} />
              <CompactMetadata icon={Layers} label="Material" value={artifactB.details.material} />
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights Section */}
      <div className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-stone-200 p-4 sm:p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles size={16} className="text-amber-600 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-stone-800">
                AI Research Insights
              </h2>
              <p className="text-stone-500 font-sans text-xs sm:text-sm">
                Intelligent analysis of artifact relationships
              </p>
            </div>
          </div>
          {showAiInsights && (
            <button
              onClick={handleGenerateInsights}
              className="flex items-center gap-1 text-amber-700 hover:text-amber-800 
                         text-xs sm:text-sm font-sans self-start sm:self-auto"
            >
              <RefreshCw size={12} className="sm:w-3.5 sm:h-3.5" />
              <span>Regenerate</span>
            </button>
          )}
        </div>

        {isLoadingInsights && (
          <div className="py-10 sm:py-16 text-center">
            <div className="spinner mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-stone-500 font-sans">Analyzing artifacts and generating insights...</p>
          </div>
        )}

        {showAiInsights && !isLoadingInsights && comparison && (
          <div className="animate-fadeIn space-y-4 sm:space-y-6 md:space-y-8">
            {/* Show API comparison if available */}
            {apiComparison ? (
              <>
                {/* Artifact Details Comparison Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                  {/* Artifact 1 Details */}
                  <div className="bg-amber-50 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 border border-amber-200">
                    <h3 className="font-serif text-base sm:text-lg font-semibold text-amber-900 mb-3 sm:mb-4 line-clamp-2">
                      {apiComparison.artifact1?.name || artifactA.name}
                    </h3>
                    <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                      <div className="flex flex-wrap gap-1">
                        <span className="font-medium text-amber-800">Origin:</span>
                        <span className="text-amber-700">{apiComparison.artifact1?.origin || artifactA.origin}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <span className="font-medium text-amber-800">Era:</span>
                        <span className="text-amber-700">{apiComparison.artifact1?.era || artifactA.era}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <span className="font-medium text-amber-800">Materials:</span>
                        <span className="text-amber-700">{apiComparison.artifact1?.materials || artifactA.details?.material}</span>
                      </div>
                      <div>
                        <span className="font-medium text-amber-800">Function:</span>
                        <p className="mt-0.5 sm:mt-1 text-amber-700 line-clamp-3">{(apiComparison.artifact1?.function || artifactA.details?.function)?.substring(0, 150)}...</p>
                      </div>
                      <div>
                        <span className="font-medium text-amber-800">Symbolism:</span>
                        <p className="mt-0.5 sm:mt-1 text-amber-700 line-clamp-3">{(apiComparison.artifact1?.symbolism || artifactA.details?.symbolism)?.substring(0, 150)}...</p>
                      </div>
                    </div>
                  </div>

                  {/* Artifact 2 Details */}
                  <div className="bg-slate-50 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 border border-slate-200">
                    <h3 className="font-serif text-base sm:text-lg font-semibold text-slate-800 mb-3 sm:mb-4 line-clamp-2">
                      {apiComparison.artifact2?.name || artifactB.name}
                    </h3>
                    <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                      <div className="flex flex-wrap gap-1">
                        <span className="font-medium text-slate-700">Origin:</span>
                        <span className="text-slate-600">{apiComparison.artifact2?.origin || artifactB.origin}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <span className="font-medium text-slate-700">Era:</span>
                        <span className="text-slate-600">{apiComparison.artifact2?.era || artifactB.era}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <span className="font-medium text-slate-700">Materials:</span>
                        <span className="text-slate-600">{apiComparison.artifact2?.materials || artifactB.details?.material}</span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Function:</span>
                        <p className="mt-0.5 sm:mt-1 text-slate-600 line-clamp-3">{(apiComparison.artifact2?.function || artifactB.details?.function)?.substring(0, 150)}...</p>
                      </div>
                      <div>
                        <span className="font-medium text-slate-700">Symbolism:</span>
                        <p className="mt-0.5 sm:mt-1 text-slate-600 line-clamp-3">{(apiComparison.artifact2?.symbolism || artifactB.details?.symbolism)?.substring(0, 150)}...</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* API-generated Similarities */}
                <div className="bg-emerald-50 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 border border-emerald-100">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                    <CheckCircle size={16} className="text-emerald-600 sm:w-5 sm:h-5" />
                    <h3 className="font-serif text-base sm:text-lg font-semibold text-emerald-800">
                      Similarities
                    </h3>
                  </div>
                  <ul className="space-y-2 sm:space-y-3">
                    {apiComparison.similarities && apiComparison.similarities.length > 0 ? (
                      apiComparison.similarities.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 sm:gap-3">
                          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-emerald-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0" />
                          <span className="text-xs sm:text-sm text-emerald-800 font-sans">{item}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs sm:text-sm text-emerald-700 font-sans italic">
                        These artifacts represent distinct cultural traditions.
                      </li>
                    )}
                  </ul>
                </div>

                {/* API-generated Differences */}
                <div className="bg-rose-50 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 border border-rose-100">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                    <XCircle size={16} className="text-rose-600 sm:w-5 sm:h-5" />
                    <h3 className="font-serif text-base sm:text-lg font-semibold text-rose-800">
                      Differences
                    </h3>
                  </div>
                  <ul className="space-y-2 sm:space-y-3">
                    {apiComparison.differences && apiComparison.differences.length > 0 ? (
                      apiComparison.differences.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 sm:gap-3">
                          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-rose-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0" />
                          <span className="text-xs sm:text-sm text-rose-800 font-sans">{item}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs sm:text-sm text-rose-700 font-sans italic">
                        These artifacts share remarkable similarities.
                      </li>
                    )}
                  </ul>
                </div>

                {/* API-generated Full Comparison */}
                <div className="bg-slate-50 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 border border-slate-200">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                    <BookOpen size={16} className="text-slate-600 sm:w-5 sm:h-5" />
                    <h3 className="font-serif text-base sm:text-lg font-semibold text-slate-800">
                      AI-Generated Comparison
                    </h3>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-700 font-sans leading-relaxed whitespace-pre-line">
                    {apiComparison.comparison}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Fallback to local comparison */}
                {comparisonError && (
                  <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <AlertCircle size={14} className="text-amber-600 sm:w-4 sm:h-4" />
                      <span className="text-amber-700 text-xs sm:text-sm font-sans">{comparisonError}</span>
                    </div>
                  </div>
                )}

                {/* Similarities Section */}
                <div className="bg-emerald-50 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 border border-emerald-100">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                    <CheckCircle size={16} className="text-emerald-600 sm:w-5 sm:h-5" />
                    <h3 className="font-serif text-base sm:text-lg font-semibold text-emerald-800">
                      Similarities
                    </h3>
                  </div>
                  <ul className="space-y-2 sm:space-y-3">
                    {comparison.similarities.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 sm:gap-3">
                        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-emerald-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-emerald-800 font-sans">{item}</span>
                      </li>
                    ))}
                    {comparison.similarities.length === 0 && (
                      <li className="text-xs sm:text-sm text-emerald-700 font-sans italic">
                        These artifacts represent distinct cultural traditions with unique characteristics.
                      </li>
                    )}
                  </ul>
                </div>

                {/* Differences Section */}
                <div className="bg-rose-50 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 border border-rose-100">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                    <XCircle size={16} className="text-rose-600 sm:w-5 sm:h-5" />
                    <h3 className="font-serif text-base sm:text-lg font-semibold text-rose-800">
                      Differences
                    </h3>
                  </div>

                  {comparison.differences.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      {comparison.differences.map((diff, index) => (
                        <div key={index} className="bg-white/60 rounded-lg p-3 sm:p-4">
                          <div className="text-xs sm:text-sm font-medium text-rose-700 font-sans mb-1.5 sm:mb-2">
                            {diff.aspect}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                            <div>
                              <span className="text-[10px] sm:text-xs text-rose-500 font-sans block mb-0.5 sm:mb-1 line-clamp-1">
                                {artifactA.name}
                              </span>
                              <span className="text-xs sm:text-sm text-rose-800 font-sans">
                                {diff.a}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] sm:text-xs text-rose-500 font-sans block mb-0.5 sm:mb-1 line-clamp-1">
                                {artifactB.name}
                              </span>
                              <span className="text-xs sm:text-sm text-rose-800 font-sans">
                                {diff.b}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-rose-700 font-sans italic">
                      These artifacts share remarkable similarities across all major categories.
                    </p>
                  )}
                </div>

                {/* Cultural Significance */}
                <div className="bg-slate-50 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-5 border border-slate-200">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                    <BookOpen size={16} className="text-slate-600 sm:w-5 sm:h-5" />
                    <h3 className="font-serif text-base sm:text-lg font-semibold text-slate-800">
                      Cultural Significance
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 font-sans leading-relaxed">
                    {comparison.culturalSignificance}
                  </p>
                </div>
              </>
            )}

            {/* Footer Note */}
            <div className="text-center pt-3 sm:pt-4 border-t border-stone-100">
              <p className="text-[10px] sm:text-xs text-stone-400 font-sans">
                {apiComparison?.source === 'trained_model'
                  ? '🤖 Analysis by trained Sentence Transformer model • Real-time semantic comparison'
                  : apiComparison?.source === 'openai'
                    ? '✨ Analysis by OpenAI GPT • Cloud-powered insights'
                    : 'Analysis generated by AI • Based on artifact metadata and cultural context'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Compact Metadata Component
const CompactMetadata = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
    <Icon size={12} className="text-stone-400 flex-shrink-0 sm:w-3.5 sm:h-3.5" />
    <span className="text-stone-500 font-sans">{label}:</span>
    <span className="text-stone-700 font-sans truncate">{value}</span>
  </div>
);

export default ComparisonScreen;

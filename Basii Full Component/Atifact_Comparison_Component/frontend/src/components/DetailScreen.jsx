import { useState, useEffect } from 'react';
import {
  MapPin, Clock, Layers, Ruler, Sparkles, ArrowLeft,
  BookOpen, Zap, Scale, RefreshCw, AlertCircle
} from 'lucide-react';
import SimilarArtifactCard from './SimilarArtifactCard';
import HotspotImage from './HotspotImage';

const API_BASE = '/api';

const DetailScreen = ({ artifact, onBack, onCompare }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');
  const [aiError, setAiError] = useState(null);
  const [similarArtifacts, setSimilarArtifacts] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [similarError, setSimilarError] = useState(null);

  // Load similar artifacts from API
  useEffect(() => {
    if (artifact) {
      loadSimilarArtifacts();
    }
  }, [artifact]);

  const loadSimilarArtifacts = async () => {
    if (!artifact?.id) return;

    setLoadingSimilar(true);
    setSimilarError(null);
    try {
      const response = await fetch(`${API_BASE}/artifacts/${artifact.id}/similar?limit=5`);
      if (!response.ok) {
        throw new Error('Failed to fetch similar artifacts');
      }
      const data = await response.json();
      // Transform API data
      const transformedData = data.map(a => ({
        ...a,
        image: a.image ? `/${a.image}` : null,
        similarityScore: Math.round((a.similarity_score || 0.8) * 100),
        description: a.function || a.notes || '',
        details: {
          material: a.materials || 'Unknown',
          function: a.function || 'Unknown',
          dimensions: a.dimensions || 'Unknown',
          symbolism: a.symbolism || 'Unknown'
        }
      }));
      setSimilarArtifacts(transformedData);
    } catch (err) {
      console.error('Error loading similar artifacts:', err);
      setSimilarError('Failed to load similar artifacts');
    } finally {
      setLoadingSimilar(false);
    }
  };

  // Reset states when artifact changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    setShowAiAnalysis(false);
    setIsLoadingAnalysis(false);
    setAiExplanation('');
    setAiError(null);
  }, [artifact?.id]);

  // Handle AI analysis generation - fetch from API
  const handleGenerateAnalysis = async () => {
    if (!artifact?.id) return;

    setIsLoadingAnalysis(true);
    setAiError(null);
    try {
      const response = await fetch(`${API_BASE}/artifacts/${artifact.id}/explain`);
      if (!response.ok) {
        throw new Error('Failed to generate AI explanation');
      }
      const data = await response.json();
      setAiExplanation(data.explanation);
      setShowAiAnalysis(true);
    } catch (err) {
      console.error('Error generating AI explanation:', err);
      setAiError('Failed to generate AI explanation. Make sure the backend is running.');
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  if (!artifact) {
    return (
      <div className="text-center py-8 sm:py-16">
        <p className="text-stone-500 font-sans">No artifact selected</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 sm:px-6 py-2 bg-amber-700 text-white rounded-lg text-sm sm:text-base"
        >
          Return to Gallery
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 sm:gap-2.5 mb-5 sm:mb-8 px-4 sm:px-5 py-2.5 sm:py-3 text-stone-600 
                   hover:text-amber-700 hover:bg-amber-50 rounded-xl 
                   transition-colors font-sans text-sm sm:text-base"
      >
        <ArrowLeft size={20} className="sm:w-6 sm:h-6" />
        <span>Back to Gallery</span>
      </button>

      {/* Main Content - Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
        {/* Left Column - Image with Hotspots */}
        <div className="space-y-3 sm:space-y-4">
          <div className="aspect-[4/3]">
            <HotspotImage
              artifact={artifact}
              image={artifact.image}
              alt={artifact.name}
            />
          </div>

          {/* Quick Facts */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-md border border-stone-200 p-4 sm:p-6">
            <h3 className="font-serif text-lg sm:text-xl font-semibold text-stone-800 mb-3 sm:mb-4">
              Quick Facts
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <Layers size={18} className="text-amber-600 mt-0.5 sm:w-5 sm:h-5" />
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm text-stone-500 font-sans block">Material</span>
                  <span className="text-sm sm:text-base text-stone-700 font-sans truncate block">{artifact.details.material}</span>
                </div>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <Ruler size={18} className="text-amber-600 mt-0.5 sm:w-5 sm:h-5" />
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm text-stone-500 font-sans block">Dimensions</span>
                  <span className="text-sm sm:text-base text-stone-700 font-sans truncate block">{artifact.details.dimensions}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Metadata */}
        <div className="space-y-5 sm:space-y-6 lg:space-y-8">
          {/* Title and Basic Info */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-md border border-stone-200 p-5 sm:p-6 md:p-8">
            <div className="mb-4 sm:mb-5">
              <span className="inline-block px-3 sm:px-4 py-1 sm:py-1.5 bg-amber-50 text-amber-800 
                             rounded-full text-sm sm:text-base font-sans mb-3 sm:mb-4 font-medium">
                {artifact.category}
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-stone-800 mb-2 sm:mb-3">
                {artifact.name}
              </h1>
              <p className="text-base sm:text-lg text-stone-600 font-sans leading-relaxed">
                {artifact.description}
              </p>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 pt-4 sm:pt-5 border-t border-stone-100">
              <MetadataItem
                icon={MapPin}
                label="Origin"
                value={artifact.origin}
              />
              <MetadataItem
                icon={Clock}
                label="Era"
                value={artifact.era}
              />
            </div>
          </div>

          {/* Detailed Information */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-md border border-stone-200 p-5 sm:p-6 md:p-8">
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-stone-800 mb-4 sm:mb-5">
              Detailed Information
            </h2>

            <dl className="space-y-4 sm:space-y-5">
              <DetailItem
                label="Function & Use"
                value={artifact.details.function}
              />
              <DetailItem
                label="Symbolism & Meaning"
                value={artifact.details.symbolism}
              />
            </dl>
          </div>

          {/* AI Analysis Section */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-md border border-stone-200 p-5 sm:p-6 md:p-8">
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <div className="flex items-center gap-2 sm:gap-3">
                <Sparkles size={22} className="text-amber-600 sm:w-7 sm:h-7" />
                <h2 className="font-serif text-xl sm:text-2xl font-semibold text-stone-800">
                  AI Analysis
                </h2>
              </div>
              {showAiAnalysis && (
                <button
                  onClick={handleGenerateAnalysis}
                  className="text-amber-700 hover:text-amber-800 text-sm sm:text-base font-sans 
                             flex items-center gap-1.5"
                >
                  <RefreshCw size={16} className="sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Regenerate</span>
                </button>
              )}
            </div>

            {!showAiAnalysis && !isLoadingAnalysis && (
              <div className="text-center py-8 sm:py-10">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-50 rounded-full flex items-center justify-center 
                               mx-auto mb-4 sm:mb-5">
                  <Zap size={28} className="text-amber-600 sm:w-10 sm:h-10" />
                </div>
                <p className="text-base sm:text-lg text-stone-600 font-sans mb-4 sm:mb-5 px-2 max-w-lg mx-auto">
                  Generate an AI-powered analysis of this artifact's historical
                  significance, cultural context, and unique features.
                </p>
                <button
                  onClick={handleGenerateAnalysis}
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-amber-700 hover:bg-amber-800 text-white 
                             rounded-xl font-sans text-base sm:text-lg font-medium transition-colors
                             flex items-center gap-2 sm:gap-3 mx-auto"
                >
                  <Sparkles size={22} className="sm:w-6 sm:h-6" />
                  <span>Generate AI Explanation</span>
                </button>
              </div>
            )}

            {isLoadingAnalysis && (
              <div className="py-10 sm:py-14 text-center">
                <div className="spinner mx-auto mb-4 sm:mb-5" style={{ width: '48px', height: '48px' }} />
                <p className="text-base sm:text-lg text-stone-500 font-sans">Analyzing artifact...</p>
              </div>
            )}

            {aiError && (
              <div className="py-8 sm:py-10 text-center">
                <AlertCircle size={32} className="mx-auto mb-3 sm:mb-4 text-red-500 sm:w-10 sm:h-10" />
                <p className="text-base sm:text-lg text-red-600 font-sans mb-4 sm:mb-5">{aiError}</p>
                <button
                  onClick={handleGenerateAnalysis}
                  className="px-5 sm:px-6 py-2.5 sm:py-3 bg-amber-700 hover:bg-amber-800 text-white 
                             rounded-xl font-sans text-sm sm:text-base transition-colors inline-flex items-center gap-2 sm:gap-2.5"
                >
                  <RefreshCw size={18} className="sm:w-5 sm:h-5" />
                  Retry
                </button>
              </div>
            )}

            {showAiAnalysis && !isLoadingAnalysis && !aiError && (
              <div className="animate-fadeIn">
                <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <BookOpen size={22} className="text-slate-600 mt-1 flex-shrink-0 sm:w-7 sm:h-7" />
                    <div className="text-base sm:text-lg text-stone-700 font-sans leading-relaxed">
                      {aiExplanation.split(/(?=(?:Overview|Materials and Craftsmanship|Function and Use|Cultural Significance|Special Features))/g).map((section, index) => {
                        const lines = section.trim().split('\n');
                        const title = lines[0];
                        const content = lines.slice(1).join('\n').trim() || lines[0]; // Fallback if no newline

                        // Check if line starts with a known header
                        const isHeader = ['Overview', 'Materials and Craftsmanship', 'Function and Use', 'Cultural Significance', 'Special Features'].some(h => title.startsWith(h));

                        if (isHeader) {
                          // Extract title and content more robustly
                          let headerText = title;
                          let bodyText = content;

                          // If content is empty (was on same line), split it
                          if (content === title) {
                            ['Overview', 'Materials and Craftsmanship', 'Function and Use', 'Cultural Significance', 'Special Features'].forEach(h => {
                              if (title.startsWith(h)) {
                                headerText = h;
                                bodyText = title.substring(h.length).trim();
                              }
                            });
                          }

                          return (
                            <div key={index} className="mb-4 last:mb-0">
                              <h4 className="font-bold text-stone-800 text-sm uppercase tracking-wide mb-1">{headerText}</h4>
                              <p className="text-stone-700">{bodyText}</p>
                            </div>
                          );
                        } else {
                          // Intro or unstructured text
                          return <p key={index} className="mb-4">{section}</p>;
                        }
                      })}
                    </div>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-stone-400 font-sans mt-3 sm:mt-4 text-right">
                  Generated by AI • Academic analysis based on available data
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Similar Artifacts Section */}
      <section className="mt-10 sm:mt-14">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 sm:mb-8 gap-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <Scale size={28} className="text-amber-600 sm:w-8 sm:h-8" />
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-800">
                Similar Artifacts
              </h2>
              <p className="text-stone-500 font-sans text-sm sm:text-base">
                Discover related pieces for comparison
              </p>
            </div>
          </div>
        </div>

        {loadingSimilar && (
          <div className="text-center py-10 sm:py-14 bg-white rounded-xl sm:rounded-2xl border border-stone-200">
            <div className="spinner mx-auto mb-4 sm:mb-5" style={{ width: '40px', height: '40px' }} />
            <p className="text-base sm:text-lg text-stone-500 font-sans">Loading similar artifacts...</p>
          </div>
        )}

        {similarError && !loadingSimilar && (
          <div className="text-center py-10 sm:py-14 bg-white rounded-xl sm:rounded-2xl border border-red-200">
            <AlertCircle size={32} className="mx-auto mb-3 sm:mb-4 text-red-500 sm:w-10 sm:h-10" />
            <p className="text-base sm:text-lg text-red-600 font-sans mb-4 sm:mb-5">{similarError}</p>
            <button
              onClick={loadSimilarArtifacts}
              className="px-5 sm:px-6 py-2.5 sm:py-3 bg-amber-700 hover:bg-amber-800 text-white 
                         rounded-xl font-sans text-sm sm:text-base transition-colors inline-flex items-center gap-2 sm:gap-2.5"
            >
              <RefreshCw size={18} className="sm:w-5 sm:h-5" />
              Retry
            </button>
          </div>
        )}

        {!loadingSimilar && !similarError && similarArtifacts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
            {similarArtifacts.map((similarArtifact, index) => (
              <SimilarArtifactCard
                key={similarArtifact.id}
                artifact={similarArtifact}
                onCompare={() => onCompare(similarArtifact)}
                delay={index * 100}
              />
            ))}
          </div>
        )}

        {!loadingSimilar && !similarError && similarArtifacts.length === 0 && (
          <div className="text-center py-10 sm:py-14 bg-white rounded-xl sm:rounded-2xl border border-stone-200">
            <p className="text-base sm:text-lg text-stone-500 font-sans">No similar artifacts found</p>
          </div>
        )}
      </section>
    </div>
  );
};

// Metadata Item Component
const MetadataItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 sm:gap-4">
    <div className="w-9 h-9 sm:w-11 sm:h-11 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
      <Icon size={18} className="text-amber-600 sm:w-5 sm:h-5" />
    </div>
    <div className="min-w-0">
      <span className="text-xs sm:text-sm text-stone-500 font-sans uppercase tracking-wide block">
        {label}
      </span>
      <span className="text-base sm:text-lg text-stone-800 font-sans font-medium truncate block">{value}</span>
    </div>
  </div>
);

// Detail Item Component
const DetailItem = ({ label, value }) => (
  <div>
    <dt className="text-sm sm:text-base font-medium text-stone-500 font-sans mb-1 sm:mb-1.5">{label}</dt>
    <dd className="text-base sm:text-lg text-stone-700 font-sans leading-relaxed">{value}</dd>
  </div>
);

export default DetailScreen;

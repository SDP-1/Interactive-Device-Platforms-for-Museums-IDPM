import { useState, useEffect, useRef } from 'react';
import {
  MapPin, Clock, Layers, Ruler, Sparkles, ArrowLeft,
  BookOpen, Zap, Scale, RefreshCw, AlertCircle, Expand
} from 'lucide-react';
import SimilarArtifactCard from './SimilarArtifactCard';
import HotspotImage from './HotspotImage';
import EnlargedImageViewer from './EnlargedImageViewer';
import { fetchExplanationStatus } from '../services/api';

const API_BASE = '/api';

const DetailScreen = ({ artifact, onBack, onCompare }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [aiExplanation, setAiExplanation] = useState('');
  const [aiError, setAiError] = useState(null);
  const [curatorVerified, setCuratorVerified] = useState(false);
  const [verifiedBy, setVerifiedBy] = useState(null);
  const [similarArtifacts, setSimilarArtifacts] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [similarError, setSimilarError] = useState(null);
  const [showEnlargedImage, setShowEnlargedImage] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const _pollRef = useRef(null);

  // Poll explanation verification status — auto-show when curator approves
  useEffect(() => {
    if (!artifact?.id) return;

    const pollStatus = async () => {
      const status = await fetchExplanationStatus(artifact.id);
      if (status?.curator_verified && status?.explanation) {
        setAiExplanation(status.explanation);
        setCuratorVerified(true);
        setVerifiedBy(status.verified_by || 'curator');
        setShowAiAnalysis(true);
        setIsLoadingAnalysis(false);
        // Stop polling — content is now live
        if (_pollRef.current) {
          clearInterval(_pollRef.current);
          _pollRef.current = null;
        }
      }
    };

    // Check immediately on mount, then every 10 s
    pollStatus();
    _pollRef.current = setInterval(pollStatus, 10000);

    return () => {
      if (_pollRef.current) {
        clearInterval(_pollRef.current);
        _pollRef.current = null;
      }
    };
  }, [artifact?.id]);

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
      const response = await fetch(`${API_BASE}/artifacts/${artifact.id}/similar?limit=6`);
      if (!response.ok) {
        throw new Error('Failed to fetch similar artifacts');
      }
      const data = await response.json();
      // Transform API data
      const transformedData = data.map(a => ({
        ...a,
        image: a.image ? (Array.isArray(a.image) ? a.image.map(img => `/${img}`) : `/${a.image}`) : null,
        similarityScore: Math.round((a.similarity_score ?? 0) * 100),
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
    setCuratorVerified(false);
    setVerifiedBy(null);
    setActiveImageIndex(0);
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
      setCuratorVerified(data.curator_verified || false);
      setVerifiedBy(data.verified_by || null);
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
          className="mt-8 px-10 py-5 bg-white border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white rounded-2xl text-2xl font-bold shadow-xl shadow-orange-500/10 active:scale-95 transition-all uppercase tracking-widest"
        >
          Return to Gallery
        </button>
      </div>
    );
  }

  // Get current image from array or string
  const getDisplayImage = (img) => {
    if (Array.isArray(img)) return img[activeImageIndex] || img[0];
    return img;
  };

  const displayImage = getDisplayImage(artifact.image);
  const hasMultipleImages = Array.isArray(artifact.image) && artifact.image.length > 1;

  return (
    <div className="animate-fadeIn">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-4 mb-10 sm:mb-12 px-8 sm:px-10 py-5 sm:py-6 text-orange-500 
                   hover:bg-orange-500 hover:text-white rounded-2xl shadow-xl shadow-orange-500/10
                   transition-all font-sans text-2xl sm:text-3xl font-bold border-2 border-orange-500 active:scale-95"
      >
        <ArrowLeft size={32} className="sm:w-10 sm:h-10" />
        <span className="uppercase tracking-widest">Back to Gallery</span>
      </button>

      {/* Main Content - Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
        {/* Left Column - Image with Hotspots */}
        <div className="space-y-3 sm:space-y-4">
          <div className="aspect-[4/3]">
            <HotspotImage
              artifact={artifact}
              image={displayImage}
              alt={artifact.name}
              showHotspots={activeImageIndex === 0}
            />
          </div>

          {/* Thumbnail Switcher - Only if multiple images exist */}
          {hasMultipleImages && (
            <div className="flex gap-4 p-2 overflow-x-auto pb-4 scrollbar-hide">
              {artifact.image.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative flex-shrink-0 w-24 sm:w-32 aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all duration-300 ${activeImageIndex === idx
                      ? 'border-orange-500 ring-2 ring-orange-500/20 scale-105 z-10'
                      : 'border-stone-200 hover:border-stone-400 opacity-70 hover:opacity-100'
                    }`}
                >
                  <img
                    src={img}
                    alt={`${artifact.name} view ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {activeImageIndex === idx && (
                    <div className="absolute inset-0 bg-orange-500/10 pointer-events-none" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* View Enlarged Image Button */}
          <button
            onClick={() => setShowEnlargedImage(true)}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 sm:px-8 sm:py-5
                      bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white
                      rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300
                      font-sans font-semibold text-base sm:text-lg active:scale-95"
          >
            <Expand size={20} className="sm:w-6 sm:h-6" />
            <span>View Enlarged Image</span>
          </button>

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
          {/* Title Header */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-md border border-stone-200 p-5 sm:p-6 md:p-8">
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-stone-800 mb-2 sm:mb-3">
              {artifact.name}
            </h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5">
            {/* 🏺 Physical Attributes */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-md border border-stone-200 p-5 sm:p-6 flex flex-col col-span-full sm:col-span-1 xl:col-span-1">
              <h2 className="font-serif text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2">
                <Layers className="text-amber-600 sm:w-6 sm:h-6" /> Physical Attributes
              </h2>
              <div className="space-y-4 flex-grow">
                <MetadataItem icon={Layers} label="Category" value={artifact.category} />
                <MetadataItem icon={Clock} label="Era" value={artifact.era} />
                <DetailItem label="Primary Materials" value={artifact.details.material} />
              </div>
            </div>

            {/* 🌍 Cultural Context */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-md border border-stone-200 p-5 sm:p-6 flex flex-col col-span-full sm:col-span-1 xl:col-span-1">
              <h2 className="font-serif text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2">
                <MapPin className="text-amber-600 sm:w-6 sm:h-6" /> Cultural Context
              </h2>
              <div className="space-y-4 flex-grow">
                <MetadataItem icon={MapPin} label="Origin" value={artifact.origin} />
                <DetailItem label="Symbolism & Meaning" value={artifact.details.symbolism} />
              </div>
            </div>

            {/* ⚒️ Usage Context */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-md border border-stone-200 p-5 sm:p-6 flex flex-col col-span-full">
              <h2 className="font-serif text-xl font-semibold text-stone-800 mb-4 flex items-center gap-2">
                <BookOpen className="text-amber-600 sm:w-6 sm:h-6" /> Usage Context
              </h2>
              <div className="space-y-4 flex-grow">
                <DetailItem label="Function & Use" value={artifact.details.function} />
              </div>
            </div>
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
                  className="text-orange-500 hover:text-orange-600 text-base sm:text-lg font-bold font-sans 
                             flex items-center gap-2"
                >
                  <RefreshCw size={20} className="sm:w-6 sm:h-6" />
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
                  className="px-8 sm:px-10 py-4 sm:py-5 bg-white border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white 
                             rounded-2xl font-sans text-xl sm:text-2xl font-bold transition-all
                             flex items-center gap-3 sm:gap-4 mx-auto shadow-xl shadow-orange-500/20 active:scale-95"
                >
                  <Sparkles size={28} className="sm:w-8 sm:h-8" />
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
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-white border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white 
                             rounded-xl font-sans text-base sm:text-lg font-bold transition-all inline-flex items-center gap-3 shadow-lg"
                >
                  <RefreshCw size={20} className="sm:w-6 sm:h-6" />
                  Retry
                </button>
              </div>
            )}

            {showAiAnalysis && !isLoadingAnalysis && !aiError && (
              <div className="animate-fadeIn space-y-6 sm:space-y-8">
                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                  {(() => {
                    const sections = aiExplanation.split(/(?=(?:Overview|Materials and Craftsmanship|Function and Use|Cultural Significance|Special Features))/g);

                    return sections.map((section, index) => {
                      const trimmed = section.trim();
                      if (!trimmed) return null;

                      let title = "Analysis";
                      let content = trimmed;
                      let Icon = BookOpen;
                      let bgColor = "bg-slate-50";
                      let textColor = "text-slate-800";
                      let iconColor = "text-slate-600";

                      const headerMap = {
                        'Overview': { label: 'Overview', icon: BookOpen, bg: 'bg-indigo-50', text: 'text-indigo-900', iconC: 'text-indigo-600' },
                        'Materials and Craftsmanship': { label: 'Craftsmanship', icon: Layers, bg: 'bg-amber-50', text: 'text-amber-900', iconC: 'text-amber-600' },
                        'Function and Use': { label: 'Function & Use', icon: Zap, bg: 'bg-emerald-50', text: 'text-emerald-900', iconC: 'text-emerald-600' },
                        'Cultural Significance': { label: 'Significance', icon: Sparkles, bg: 'bg-purple-50', text: 'text-purple-900', iconC: 'text-purple-600' },
                        'Special Features': { label: 'Special Features', icon: Sparkles, bg: 'bg-rose-50', text: 'text-rose-900', iconC: 'text-rose-600' }
                      };

                      for (const [key, config] of Object.entries(headerMap)) {
                        if (trimmed.startsWith(key)) {
                          title = config.label;
                          content = trimmed.substring(key.length).trim();
                          if (content.startsWith(':')) content = content.substring(1).trim();
                          Icon = config.icon;
                          bgColor = config.bg;
                          textColor = config.text;
                          iconColor = config.iconC;
                          break;
                        }
                      }

                      return (
                        <div key={index} className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                          <div className={`${bgColor} px-4 py-3 sm:px-6 sm:py-4 border-b border-black/5 flex items-center gap-3`}>
                            <Icon size={20} className={`${iconColor} group-hover:scale-110 transition-transform`} />
                            <h4 className={`font-sans text-sm sm:text-base font-bold uppercase tracking-wider ${textColor}`}>
                              {title}
                            </h4>
                          </div>
                          <div className="p-5 sm:p-6 md:p-8">
                            <p className="text-lg sm:text-xl text-stone-700 leading-relaxed font-sans">
                              {content}
                            </p>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {curatorVerified && verifiedBy && (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-5 sm:p-6 flex items-start gap-4 shadow-sm">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle size={24} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-green-900">
                        Verified by Museum Curator
                      </p>
                      <p className="text-base text-green-700 mt-1">
                        Content reviewed and approved by <span className="font-semibold">{verifiedBy}</span>
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-stone-100 flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-stone-400 font-sans italic">
                    {curatorVerified ? 'Verified Academic Analysis' : 'AI-Generated Preliminary Analysis'}
                  </span>
                  <div className="flex items-center gap-2 text-amber-600/40">
                    <Sparkles size={14} />
                    <span className="text-[10px] uppercase font-bold tracking-tighter">Basii Intelligence</span>
                  </div>
                </div>
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

      {/* Enlarged Image Viewer Modal */}
      {showEnlargedImage && (
        <EnlargedImageViewer
          image={displayImage}
          alt={artifact.name}
          artifact={artifact}
          onClose={() => setShowEnlargedImage(false)}
        />
      )}
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

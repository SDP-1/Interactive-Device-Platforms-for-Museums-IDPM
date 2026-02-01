import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import Header from '../components/Header';
import { getArtifactById } from '../data/artifacts';
import { apiService } from '../services/api';

function ScenariosPage() {
  const { id } = useParams();
  const location = useLocation();
  const [artifact, setArtifact] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [currentUtterance, setCurrentUtterance] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [currentText, setCurrentText] = useState('');
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    const foundArtifact = location.state?.artifact || getArtifactById(id);
    const scenario = location.state?.scenario;

    if (foundArtifact) {
      setArtifact(foundArtifact);
    }

    if (scenario) {
      setSelectedScenario(scenario);
      generateAnalysis(id, scenario);
    }

    // Load available voices
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    // Cleanup: stop speech when component unmounts
    return () => {
      window.speechSynthesis.cancel();
    };
  }, [id, location]);

  const generateAnalysis = async (artid, scenario) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.generateScenarioAnalysis(artid, scenario.id);

      const resultsData = [
        {
          title: response.answerTopic1 || 'Analysis Topic 1',
          content: response.answerDescription1 || 'No description available.'
        },
        {
          title: response.answerTopic2 || 'Analysis Topic 2',
          content: response.answerDescription2 || 'No description available.'
        },
        {
          title: response.answerTopic3 || 'Analysis Topic 3',
          content: response.answerDescription3 || 'No description available.'
        }
      ].filter(r => r.content !== 'No description available.');

      setAnalysisResults(resultsData);
    } catch (err) {
      setError(err.message || 'Failed to generate analysis. Please try again.');
      console.error('Error generating analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  const regenerateAnalysis = async () => {
    if (selectedScenario) {
      await generateAnalysis(id, selectedScenario);
    }
  };

  const speakText = (text, index) => {
    // If clicking on the same scenario that's already speaking
    if (speakingIndex === index && currentText === text) {
      // If paused, resume it
      if (isPaused && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPaused(false);
        return;
      }
      // If speaking, do nothing (let pause button handle it)
      if (!isPaused && window.speechSynthesis.speaking) {
        return;
      }
    }

    // Clicking on a different scenario - stop current and start new
    // Always stop any ongoing speech first and reset all state
    window.speechSynthesis.cancel();
    setSpeakingIndex(null);
    setIsPaused(false);
    setCurrentUtterance(null);
    setCurrentText('');
    setCharIndex(0);

    // Small delay to ensure clean state reset
    setTimeout(() => {
      // Store the text for resume functionality
      setCurrentText(text);
      setCharIndex(0);

      // Create new speech
      const utterance = new SpeechSynthesisUtterance(text);

      // Select a nice voice (prefer female English voices)
      const preferredVoice = availableVoices.find(voice =>
        (voice.name.includes('Google') || voice.name.includes('Microsoft')) &&
        voice.lang.startsWith('en') &&
        (voice.name.includes('Female') || voice.name.includes('Zira') || voice.name.includes('Samantha'))
      ) || availableVoices.find(voice =>
        voice.lang.startsWith('en') && voice.name.includes('Google')
      ) || availableVoices.find(voice =>
        voice.lang.startsWith('en')
      ) || availableVoices[0];

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.rate = 0.95; // Slightly slower for clarity
      utterance.pitch = 1.05; // Slightly higher for pleasantness
      utterance.volume = 1;

      // Track progress through boundary events
      utterance.onboundary = (event) => {
        setCharIndex(event.charIndex);
      };

      utterance.onend = () => {
        setSpeakingIndex(null);
        setIsPaused(false);
        setCurrentUtterance(null);
        setCurrentText('');
        setCharIndex(0);
      };

      utterance.onerror = (event) => {
        console.error('Speech error:', event);
        setSpeakingIndex(null);
        setIsPaused(false);
        setCurrentUtterance(null);
        setCurrentText('');
        setCharIndex(0);
      };

      setCurrentUtterance(utterance);
      setSpeakingIndex(index);
      setIsPaused(false);
      window.speechSynthesis.speak(utterance);
    }, 50);
  };

  const pauseSpeech = (index) => {
    if (speakingIndex === index && !isPaused && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setSpeakingIndex(null);
    setIsPaused(false);
    setCurrentUtterance(null);
    setCurrentText('');
    setCharIndex(0);
  };

  const getColorClass = (color) => {
    const colorMap = {
      'blue': 'bg-blue-100 border-blue-300',
      'green': 'bg-green-100 border-green-300',
      'purple': 'bg-purple-100 border-purple-300',
      'orange': 'bg-orange-100 border-orange-300',
      'red': 'bg-red-100 border-red-300',
      'teal': 'bg-teal-100 border-teal-300',
      'amber': 'bg-amber-100 border-amber-300',
      'indigo': 'bg-indigo-100 border-indigo-300'
    };
    return colorMap[color] || colorMap['blue'];
  };

  return (
    <div className="min-h-screen bg-beige">
      <Header showDashboard />

      <main className="max-w-full mx-auto px-6 lg:px-12 py-8">
        {/* Big Back Button */}
        <Link
          to={`/artifact/${id}`}
          className="inline-flex items-center text-orange-500 hover:text-orange-600 mb-12 transition-all font-bold group bg-white/50 px-10 py-5 rounded-2xl border-2 border-orange-500 shadow-lg hover:shadow-orange-500/20 active:scale-95"
        >
          <svg className="w-8 h-8 mr-4 transform group-hover:-translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-2xl uppercase tracking-[0.2em]">Back to Artifact</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Artifact & Scenario Info */}
          <div className="lg:col-span-1">
            {artifact && (
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <div className="bg-gradient-to-br from-amber-50 via-white to-gray-50 rounded-xl p-3 mb-4 border border-amber-200 shadow-inner" style={{ minHeight: '192px' }}>
                  <img
                    src={artifact.images[0]}
                    alt={artifact.name}
                    className="w-full max-h-48 object-contain rounded-lg drop-shadow-lg"
                    onError={(e) => {
                      e.target.src = `https://via.placeholder.com/300x200/8B7355/ffffff?text=${encodeURIComponent(artifact.name.substring(0, 15))}`;
                    }}
                  />
                </div>

                <h2 className="text-xl font-bold text-gray-800 mb-2">{artifact.name}</h2>

                <div className="space-y-2 text-sm mb-4">
                  <p className="text-gray-600">
                    <span className="font-semibold">Category:</span><br />
                    {artifact.category}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-semibold">Period:</span><br />
                    {artifact.period}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-semibold">Era:</span><br />
                    {artifact.era}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-semibold">Location:</span><br />
                    {artifact.location}
                  </p>
                </div>
              </div>
            )}

            {selectedScenario && (
              <div className={`rounded-lg shadow-lg p-6 border-2 ${getColorClass(selectedScenario.color)}`}>
                <div className="flex items-center mb-3">
                  <span className="text-4xl mr-3">{selectedScenario.icon}</span>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Selected Scenario</h3>
                    <p className="text-sm text-gray-600">{selectedScenario.name}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mt-3">
                  {selectedScenario.description}
                </p>
              </div>
            )}
          </div>

          {/* Right Content - Analysis Results */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {selectedScenario ? selectedScenario.name : 'Scenario Analysis'}
              </h1>
              <p className="text-gray-600">
                AI-generated structured analysis based on predefined academic frameworks
              </p>
            </div>

            {/* Loading State */}
            {loading && analysisResults.length === 0 && (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600 text-lg">Generating scholarly analysis...</p>
                <p className="text-gray-500 text-sm mt-2">Using fine-tuned AI model with historical context</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                <div className="flex items-center mb-2">
                  <svg className="w-6 h-6 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <h3 className="text-red-800 font-semibold">Analysis Failed</h3>
                </div>
                <p className="text-red-700 mb-4">{error}</p>
                <button
                  onClick={regenerateAnalysis}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Analysis Results */}
            {analysisResults.length > 0 && (
              <>
                <div className="space-y-6 mb-8">
                  {analysisResults.map((result, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-primary to-primary-dark p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="bg-white bg-opacity-20 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold mr-3">
                              {index + 1}
                            </div>
                            <h3 className="text-xl font-bold text-white">{result.title}</h3>
                          </div>

                          {/* Voice Controls */}
                          <div className="flex items-center space-x-2">
                            {speakingIndex === index ? (
                              <>
                                {isPaused ? (
                                  <button
                                    onClick={() => speakText(result.content, index)}
                                    className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all"
                                    title="Resume reading"
                                  >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => pauseSpeech(index)}
                                    className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all animate-pulse"
                                    title="Pause reading"
                                  >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                )}
                                <button
                                  onClick={stopSpeech}
                                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all"
                                  title="Stop reading"
                                >
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => speakText(result.content, index)}
                                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all hover:scale-110"
                                title="Read this scenario aloud"
                              >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="prose prose-sm max-w-none">
                          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                            {result.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={regenerateAnalysis}
                      disabled={loading}
                      className="flex items-center space-x-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg transition-colors disabled:bg-gray-400 shadow-md"
                    >
                      <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                      <span>{loading ? 'Regenerating...' : 'Regenerate Analysis'}</span>
                    </button>

                    <Link
                      to={`/artifact/${id}`}
                      className="flex items-center space-x-2 border-2 border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg transition-colors"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                      <span>Try Different Scenario</span>
                    </Link>

                    <button
                      className="flex items-center space-x-2 border-2 border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg transition-colors"
                      title="Export Analysis"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      <span>Export</span>
                    </button>
                  </div>
                </div>

                {/* Methodology Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Analysis Methodology
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>✓ <strong>Structured Prompting:</strong> Uses predefined academic frameworks for consistency</li>
                    <li>✓ <strong>RAG-Enhanced:</strong> Retrieves relevant artifact metadata from vector database</li>
                    <li>✓ <strong>Fine-Tuned Model:</strong> Specialized GPT-4o-mini trained on Sri Lankan historical data</li>
                    <li>✓ <strong>Multi-Perspective:</strong> Analyzes from 3 distinct scholarly viewpoints</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ScenariosPage;

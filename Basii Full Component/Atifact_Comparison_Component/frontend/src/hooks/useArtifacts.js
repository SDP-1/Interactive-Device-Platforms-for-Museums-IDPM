import { useState, useEffect, useCallback } from 'react';
import { 
  fetchArtifacts, 
  fetchSimilarArtifacts, 
  fetchAiExplanation,
  compareArtifacts,
  checkApiAvailability 
} from '../services/api';
import { 
  ARTIFACTS_DATA, 
  getSimilarArtifacts, 
  getArtifactById,
  filterArtifacts 
} from '../data/artifacts';

// Hook to manage artifacts with API fallback
export const useArtifacts = () => {
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingApi, setUsingApi] = useState(false);

  useEffect(() => {
    const loadArtifacts = async () => {
      setLoading(true);
      try {
        const apiAvailable = await checkApiAvailability();
        
        if (apiAvailable) {
          const apiArtifacts = await fetchArtifacts();
          if (apiArtifacts && apiArtifacts.length > 0) {
            // Transform API data to match expected format
            const transformedArtifacts = apiArtifacts.map(a => ({
              ...a,
              image: a.image ? `/${a.image}` : null,
              details: {
                material: a.materials || 'Unknown',
                function: a.function || 'Unknown',
                dimensions: a.dimensions || 'Unknown',
                symbolism: a.symbolism || 'Unknown'
              },
              similarArtifacts: [],
              aiAnalysis: '',
              comparisonTo: {}
            }));
            setArtifacts(transformedArtifacts);
            setUsingApi(true);
          } else {
            setArtifacts(ARTIFACTS_DATA);
            setUsingApi(false);
          }
        } else {
          setArtifacts(ARTIFACTS_DATA);
          setUsingApi(false);
        }
      } catch (err) {
        console.error('Error loading artifacts:', err);
        setArtifacts(ARTIFACTS_DATA);
        setUsingApi(false);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadArtifacts();
  }, []);

  const filter = useCallback((searchTerm = '', category = '', era = '', origin = '') => {
    return artifacts.filter(artifact => {
      const matchesSearch = !searchTerm || 
        artifact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (artifact.description && artifact.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        artifact.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !category || artifact.category === category;
      const matchesEra = !era || artifact.era === era;
      const matchesOrigin = !origin || artifact.origin === origin;
      
      return matchesSearch && matchesCategory && matchesEra && matchesOrigin;
    });
  }, [artifacts]);

  return { artifacts, loading, error, usingApi, filter };
};

// Hook to get similar artifacts with API fallback
export const useSimilarArtifacts = (artifactId) => {
  const [similarArtifacts, setSimilarArtifacts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!artifactId) return;

    const loadSimilar = async () => {
      setLoading(true);
      try {
        const apiSimilar = await fetchSimilarArtifacts(artifactId);
        if (apiSimilar && apiSimilar.length > 0) {
          // Transform API similar artifacts
          const transformed = apiSimilar.map(a => ({
            ...a,
            image: a.image ? `/${a.image}` : null,
            similarityScore: Math.round((a.similarity_score || 0.8) * 100),
            details: {
              material: a.materials || 'Unknown',
              function: a.function || 'Unknown',
              dimensions: a.dimensions || 'Unknown',
              symbolism: a.symbolism || 'Unknown'
            }
          }));
          setSimilarArtifacts(transformed);
        } else {
          // Fall back to mock data
          setSimilarArtifacts(getSimilarArtifacts(artifactId));
        }
      } catch {
        setSimilarArtifacts(getSimilarArtifacts(artifactId));
      } finally {
        setLoading(false);
      }
    };

    loadSimilar();
  }, [artifactId]);

  return { similarArtifacts, loading };
};

// Hook to get AI explanation with API fallback
export const useAiExplanation = (artifactId, artifact) => {
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generate = useCallback(async () => {
    if (!artifactId) return;

    setLoading(true);
    setGenerated(false);

    try {
      const apiExplanation = await fetchAiExplanation(artifactId);
      if (apiExplanation) {
        setExplanation(apiExplanation);
      } else {
        // Fall back to mock data
        const mockArtifact = getArtifactById(artifactId) || artifact;
        setExplanation(mockArtifact?.aiAnalysis || 'No analysis available for this artifact.');
      }
    } catch {
      const mockArtifact = getArtifactById(artifactId) || artifact;
      setExplanation(mockArtifact?.aiAnalysis || 'No analysis available for this artifact.');
    } finally {
      setLoading(false);
      setGenerated(true);
    }
  }, [artifactId, artifact]);

  const reset = useCallback(() => {
    setExplanation('');
    setGenerated(false);
  }, []);

  return { explanation, loading, generated, generate, reset };
};

// Hook to compare artifacts with API fallback
export const useComparison = (artifact1, artifact2) => {
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateComparison = useCallback(async () => {
    if (!artifact1?.id || !artifact2?.id) return;

    setLoading(true);

    try {
      const apiComparison = await compareArtifacts(artifact1.id, artifact2.id);
      if (apiComparison) {
        setComparison(apiComparison);
      } else {
        // Generate local comparison
        setComparison(null);
      }
    } catch {
      setComparison(null);
    } finally {
      setLoading(false);
    }
  }, [artifact1?.id, artifact2?.id]);

  return { comparison, loading, generateComparison };
};

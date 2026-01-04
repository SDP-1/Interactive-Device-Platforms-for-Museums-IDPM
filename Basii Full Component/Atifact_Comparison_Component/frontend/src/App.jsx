import { useState, useCallback } from 'react';
import Header from './components/Header';
import GalleryScreen from './components/GalleryScreen';
import DetailScreen from './components/DetailScreen';
import ComparisonScreen from './components/ComparisonScreen';

// Screen constants
const SCREENS = {
  GALLERY: 'gallery',
  DETAIL: 'detail',
  COMPARISON: 'comparison'
};

function App() {
  // Screen navigation state
  const [currentScreen, setCurrentScreen] = useState(SCREENS.GALLERY);
  
  // Selected artifacts state
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [comparisonArtifact, setComparisonArtifact] = useState(null);

  // Navigation handlers
  const navigateToGallery = useCallback(() => {
    setCurrentScreen(SCREENS.GALLERY);
    setSelectedArtifact(null);
    setComparisonArtifact(null);
  }, []);

  const navigateToDetail = useCallback((artifact) => {
    setSelectedArtifact(artifact);
    setComparisonArtifact(null);
    setCurrentScreen(SCREENS.DETAIL);
  }, []);

  const navigateToComparison = useCallback((artifact) => {
    setComparisonArtifact(artifact);
    setCurrentScreen(SCREENS.COMPARISON);
  }, []);

  const navigateBackToDetail = useCallback(() => {
    setComparisonArtifact(null);
    setCurrentScreen(SCREENS.DETAIL);
  }, []);

  // Render current screen
  const renderScreen = () => {
    switch (currentScreen) {
      case SCREENS.GALLERY:
        return (
          <GalleryScreen 
            onSelectArtifact={navigateToDetail}
          />
        );
      
      case SCREENS.DETAIL:
        return (
          <DetailScreen 
            artifact={selectedArtifact}
            onBack={navigateToGallery}
            onCompare={navigateToComparison}
          />
        );
      
      case SCREENS.COMPARISON:
        return (
          <ComparisonScreen 
            artifactA={selectedArtifact}
            artifactB={comparisonArtifact}
            onBack={navigateBackToDetail}
            onBackToGallery={navigateToGallery}
          />
        );
      
      default:
        return <GalleryScreen onSelectArtifact={navigateToDetail} />;
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FDFBF7] flex flex-col">
      <Header 
        currentScreen={currentScreen}
        selectedArtifact={selectedArtifact}
        onNavigateHome={navigateToGallery}
        onNavigateToDetail={navigateBackToDetail}
      />
      <main className="flex-1 w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
        <div className="w-full max-w-[1920px] mx-auto">
          {renderScreen()}
        </div>
      </main>
    </div>
  );
}

export default App;

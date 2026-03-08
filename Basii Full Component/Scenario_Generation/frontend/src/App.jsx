import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import ExplorerPage from './pages/ExplorerPage'
import ArtifactDetailPage from './pages/ArtifactDetailPage'
import ScenariosPage from './pages/ScenariosPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ExplorerPage />} />
        <Route path="/artifact/:id" element={<ArtifactDetailPage />} />
        <Route path="/scenarios/:id" element={<ScenariosPage />} />
      </Routes>
    </Router>
  )
}

export default App

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TangoLayout } from './components/TangoLayout';
import { TangoArchivePage } from './pages/TangoArchivePage';
import { SongDetailPage } from './pages/SongDetailPage';
import { CompetitionResultsPage } from './pages/CompetitionResultsPage';
import { TangoChatPage } from './pages/TangoChatPage';
import { TandaLabPage } from './pages/TandaLabPage';
import { OrchestraAnalysisPage } from './pages/OrchestraAnalysisPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<TangoLayout />}>
          <Route path="/" element={<TangoArchivePage />} />
          <Route path="/results" element={<CompetitionResultsPage />} />
          <Route path="/tanda" element={<TandaLabPage />} />
          <Route path="/orchestra" element={<OrchestraAnalysisPage />} />
          <Route path="/chat" element={<TangoChatPage />} />
          <Route path="/song/:id" element={<SongDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

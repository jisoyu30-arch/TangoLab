import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TangoLayout } from './components/TangoLayout';
import { TangoArchivePage } from './pages/TangoArchivePage';
import { SongDetailPage } from './pages/SongDetailPage';
import { CompetitionResultsPage } from './pages/CompetitionResultsPage';
import { TangoChatPage } from './pages/TangoChatPage';
import { TandaLabPage } from './pages/TandaLabPage';
import { OrchestraAnalysisPage } from './pages/OrchestraAnalysisPage';
import { HomePage } from './pages/HomePage';
import { PracticeBoardListPage } from './pages/PracticeBoardListPage';
import { PracticeBoardDetailPage } from './pages/PracticeBoardDetailPage';
import { CompareRoomListPage } from './pages/CompareRoomListPage';
import { CompareRoomDetailPage } from './pages/CompareRoomDetailPage';
import { TrainingPage } from './pages/TrainingPage';
import { ClassDetailPage } from './pages/ClassDetailPage';
import { MyCompetitionsPage } from './pages/MyCompetitionsPage';
import { MyCompetitionDetailPage } from './pages/MyCompetitionDetailPage';
import { TrendsPage } from './pages/TrendsPage';
import { SongQuizPage } from './pages/SongQuizPage';
import { NotesPage } from './pages/NotesPage';
import { AIRecommendPage } from './pages/AIRecommendPage';
import { ChecklistPage } from './pages/ChecklistPage';
import { MundialStoryPage } from './pages/MundialStoryPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<TangoLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/songs" element={<TangoArchivePage />} />
          <Route path="/results" element={<CompetitionResultsPage />} />
          <Route path="/tanda" element={<TandaLabPage />} />
          <Route path="/orchestra" element={<OrchestraAnalysisPage />} />
          <Route path="/trends" element={<TrendsPage />} />
          <Route path="/quiz" element={<SongQuizPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/ai" element={<AIRecommendPage />} />
          <Route path="/checklist" element={<ChecklistPage />} />
          <Route path="/mundial/:year" element={<MundialStoryPage />} />
          <Route path="/mundial" element={<MundialStoryPage />} />
          <Route path="/practice" element={<PracticeBoardListPage />} />
          <Route path="/practice/:id" element={<PracticeBoardDetailPage />} />
          <Route path="/compare" element={<CompareRoomListPage />} />
          <Route path="/compare/:id" element={<CompareRoomDetailPage />} />
          <Route path="/training" element={<TrainingPage />} />
          <Route path="/training/class/:id" element={<ClassDetailPage />} />
          <Route path="/my-competitions" element={<MyCompetitionsPage />} />
          <Route path="/my-competitions/:id" element={<MyCompetitionDetailPage />} />
          <Route path="/chat" element={<TangoChatPage />} />
          <Route path="/song/:id" element={<SongDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

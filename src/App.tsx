import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { TangoLayout } from './components/TangoLayout';
import { HomePage } from './pages/HomePage';

// 코드 스플리팅 — 홈 외 모든 페이지는 지연 로드
const TangoArchivePage = lazy(() => import('./pages/TangoArchivePage').then(m => ({ default: m.TangoArchivePage })));
const SongDetailPage = lazy(() => import('./pages/SongDetailPage').then(m => ({ default: m.SongDetailPage })));
const CompetitionResultsPage = lazy(() => import('./pages/CompetitionResultsPage').then(m => ({ default: m.CompetitionResultsPage })));
const TangoChatPage = lazy(() => import('./pages/TangoChatPage').then(m => ({ default: m.TangoChatPage })));
const TandaLabPage = lazy(() => import('./pages/TandaLabPage').then(m => ({ default: m.TandaLabPage })));
const TandaSimulatorPage = lazy(() => import('./pages/TandaSimulatorPage').then(m => ({ default: m.TandaSimulatorPage })));
const CoupleCommandCenterPage = lazy(() => import('./pages/CoupleCommandCenterPage').then(m => ({ default: m.CoupleCommandCenterPage })));
const VideoCollagePage = lazy(() => import('./pages/VideoCollagePage').then(m => ({ default: m.VideoCollagePage })));
const OrchestraAnalysisPage = lazy(() => import('./pages/OrchestraAnalysisPage').then(m => ({ default: m.OrchestraAnalysisPage })));
const PracticeBoardListPage = lazy(() => import('./pages/PracticeBoardListPage').then(m => ({ default: m.PracticeBoardListPage })));
const PracticeBoardDetailPage = lazy(() => import('./pages/PracticeBoardDetailPage').then(m => ({ default: m.PracticeBoardDetailPage })));
const CompareRoomListPage = lazy(() => import('./pages/CompareRoomListPage').then(m => ({ default: m.CompareRoomListPage })));
const CompareRoomDetailPage = lazy(() => import('./pages/CompareRoomDetailPage').then(m => ({ default: m.CompareRoomDetailPage })));
const TrainingPage = lazy(() => import('./pages/TrainingPage').then(m => ({ default: m.TrainingPage })));
const ClassDetailPage = lazy(() => import('./pages/ClassDetailPage').then(m => ({ default: m.ClassDetailPage })));
const MyCompetitionsPage = lazy(() => import('./pages/MyCompetitionsPage').then(m => ({ default: m.MyCompetitionsPage })));
const MyCompetitionDetailPage = lazy(() => import('./pages/MyCompetitionDetailPage').then(m => ({ default: m.MyCompetitionDetailPage })));
const TrendsPage = lazy(() => import('./pages/TrendsPage').then(m => ({ default: m.TrendsPage })));
const SongQuizPage = lazy(() => import('./pages/SongQuizPage').then(m => ({ default: m.SongQuizPage })));
const NotesPage = lazy(() => import('./pages/NotesPage').then(m => ({ default: m.NotesPage })));
const AIRecommendPage = lazy(() => import('./pages/AIRecommendPage').then(m => ({ default: m.AIRecommendPage })));
const ChecklistPage = lazy(() => import('./pages/ChecklistPage').then(m => ({ default: m.ChecklistPage })));
const MundialStoryPage = lazy(() => import('./pages/MundialStoryPage').then(m => ({ default: m.MundialStoryPage })));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage').then(m => ({ default: m.FavoritesPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const OrchestraComparePage = lazy(() => import('./pages/OrchestraComparePage').then(m => ({ default: m.OrchestraComparePage })));
const JudgesPage = lazy(() => import('./pages/JudgesPage').then(m => ({ default: m.JudgesPage })));
const YearComparePage = lazy(() => import('./pages/YearComparePage').then(m => ({ default: m.YearComparePage })));
const VocalistsPage = lazy(() => import('./pages/VocalistsPage').then(m => ({ default: m.VocalistsPage })));
const ChampionsPage = lazy(() => import('./pages/ChampionsPage').then(m => ({ default: m.ChampionsPage })));
const WeaknessAnalysisPage = lazy(() => import('./pages/WeaknessAnalysisPage').then(m => ({ default: m.WeaknessAnalysisPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const StrategyPage = lazy(() => import('./pages/StrategyPage').then(m => ({ default: m.StrategyPage })));
const SequencesPage = lazy(() => import('./pages/SequencesPage').then(m => ({ default: m.SequencesPage })));

function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="text-tango-brass text-2xl animate-pulse">◈</div>
        <div className="text-[10px] tracking-[0.3em] uppercase text-tango-cream/40 font-sans">Loading</div>
      </div>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<TangoLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/songs" element={<Suspense fallback={<PageLoader />}><TangoArchivePage /></Suspense>} />
          <Route path="/results" element={<Suspense fallback={<PageLoader />}><CompetitionResultsPage /></Suspense>} />
          <Route path="/tanda" element={<Suspense fallback={<PageLoader />}><TandaLabPage /></Suspense>} />
          <Route path="/tanda-simulator" element={<Suspense fallback={<PageLoader />}><TandaSimulatorPage /></Suspense>} />
          <Route path="/command" element={<Suspense fallback={<PageLoader />}><CoupleCommandCenterPage /></Suspense>} />
          <Route path="/collage" element={<Suspense fallback={<PageLoader />}><VideoCollagePage /></Suspense>} />
          <Route path="/orchestra" element={<Suspense fallback={<PageLoader />}><OrchestraAnalysisPage /></Suspense>} />
          <Route path="/trends" element={<Suspense fallback={<PageLoader />}><TrendsPage /></Suspense>} />
          <Route path="/quiz" element={<Suspense fallback={<PageLoader />}><SongQuizPage /></Suspense>} />
          <Route path="/notes" element={<Suspense fallback={<PageLoader />}><NotesPage /></Suspense>} />
          <Route path="/ai" element={<Suspense fallback={<PageLoader />}><AIRecommendPage /></Suspense>} />
          <Route path="/checklist" element={<Suspense fallback={<PageLoader />}><ChecklistPage /></Suspense>} />
          <Route path="/mundial/:year" element={<Suspense fallback={<PageLoader />}><MundialStoryPage /></Suspense>} />
          <Route path="/mundial" element={<Suspense fallback={<PageLoader />}><MundialStoryPage /></Suspense>} />
          <Route path="/favorites" element={<Suspense fallback={<PageLoader />}><FavoritesPage /></Suspense>} />
          <Route path="/compare-orchestra" element={<Suspense fallback={<PageLoader />}><OrchestraComparePage /></Suspense>} />
          <Route path="/judges" element={<Suspense fallback={<PageLoader />}><JudgesPage /></Suspense>} />
          <Route path="/compare-year" element={<Suspense fallback={<PageLoader />}><YearComparePage /></Suspense>} />
          <Route path="/vocalists" element={<Suspense fallback={<PageLoader />}><VocalistsPage /></Suspense>} />
          <Route path="/champions" element={<Suspense fallback={<PageLoader />}><ChampionsPage /></Suspense>} />
          <Route path="/weakness" element={<Suspense fallback={<PageLoader />}><WeaknessAnalysisPage /></Suspense>} />
          <Route path="/settings" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
          <Route path="/strategy" element={<Suspense fallback={<PageLoader />}><StrategyPage /></Suspense>} />
          <Route path="/training/sequences" element={<Suspense fallback={<PageLoader />}><SequencesPage /></Suspense>} />
          <Route path="/practice" element={<Suspense fallback={<PageLoader />}><PracticeBoardListPage /></Suspense>} />
          <Route path="/practice/:id" element={<Suspense fallback={<PageLoader />}><PracticeBoardDetailPage /></Suspense>} />
          <Route path="/compare" element={<Suspense fallback={<PageLoader />}><CompareRoomListPage /></Suspense>} />
          <Route path="/compare/:id" element={<Suspense fallback={<PageLoader />}><CompareRoomDetailPage /></Suspense>} />
          <Route path="/training" element={<Suspense fallback={<PageLoader />}><TrainingPage /></Suspense>} />
          <Route path="/training/class/:id" element={<Suspense fallback={<PageLoader />}><ClassDetailPage /></Suspense>} />
          <Route path="/my-competitions" element={<Suspense fallback={<PageLoader />}><MyCompetitionsPage /></Suspense>} />
          <Route path="/my-competitions/:id" element={<Suspense fallback={<PageLoader />}><MyCompetitionDetailPage /></Suspense>} />
          <Route path="/chat" element={<Suspense fallback={<PageLoader />}><TangoChatPage /></Suspense>} />
          <Route path="/song/:id" element={<Suspense fallback={<PageLoader />}><SongDetailPage /></Suspense>} />
          <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

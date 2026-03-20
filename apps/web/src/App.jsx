import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { AppLayout } from './components/AppLayout';

const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const EventsPage = lazy(() =>
  import('./pages/EventsPage').then((m) => ({ default: m.EventsPage }))
);
const FixturesPage = lazy(() =>
  import('./pages/FixturesPage').then((m) => ({ default: m.FixturesPage }))
);
const PlayersPage = lazy(() =>
  import('./pages/PlayersPage').then((m) => ({ default: m.PlayersPage }))
);
const TeamsPage = lazy(() => import('./pages/TeamsPage').then((m) => ({ default: m.TeamsPage })));
const FdrPage = lazy(() => import('./pages/FdrPage').then((m) => ({ default: m.FdrPage })));

function App() {
  return (
    <AppLayout>
      <Suspense
        fallback={
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        }
      >
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/fixtures" element={<FixturesPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/fdr" element={<FdrPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppLayout>
  );
}

export default App;

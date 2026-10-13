import { lazy, Suspense } from 'react';
import { createHashRouter, Navigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout.jsx';

const Dashboard = lazy(() => import('../pages/Dashboard.jsx'));
const MatrixLab = lazy(() => import('../pages/MatrixLab.jsx'));
const Operations = lazy(() => import('../pages/Operations.jsx'));
const DeterminantInverse = lazy(() => import('../pages/DeterminantInverse.jsx'));
const LinearSystems = lazy(() => import('../pages/LinearSystems.jsx'));
const VisualPlayground = lazy(() => import('../pages/VisualPlayground.jsx'));
const AlgorithmExplorer = lazy(() => import('../pages/AlgorithmExplorer.jsx'));
const AIApplications = lazy(() => import('../pages/AIApplications.jsx'));
const Challenges = lazy(() => import('../pages/Challenges.jsx'));
const Academy = lazy(() => import('../pages/Academy.jsx'));
const Progress = lazy(() => import('../pages/Progress.jsx'));
const Settings = lazy(() => import('../pages/Settings.jsx'));

function Loading() {
  return (
    <div className="stack" aria-busy="true" aria-live="polite" style={{ gap: 16 }}>
      <div className="progress" style={{ width: 160 }}><i style={{ width: '60%' }} /></div>
    </div>
  );
}

const wrap = (El) => <Suspense fallback={<Loading />}><El /></Suspense>;

// Hash routing works on any static host (and inside sandboxed previews) without server rewrites.
export const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: wrap(Dashboard) },
      { path: 'lab', element: wrap(MatrixLab) },
      { path: 'operations', element: wrap(Operations) },
      { path: 'determinant', element: wrap(DeterminantInverse) },
      { path: 'systems', element: wrap(LinearSystems) },
      { path: 'playground', element: wrap(VisualPlayground) },
      { path: 'algorithms', element: wrap(AlgorithmExplorer) },
      { path: 'ai', element: wrap(AIApplications) },
      { path: 'challenges', element: wrap(Challenges) },
      { path: 'academy', element: wrap(Academy) },
      { path: 'academy/:lessonId', element: wrap(Academy) },
      { path: 'progress', element: wrap(Progress) },
      { path: 'settings', element: wrap(Settings) },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

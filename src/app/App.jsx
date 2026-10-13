import { RouterProvider } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { AppProvider, useApp } from '../context/AppContext.jsx';
import { router } from './router.jsx';

function Shell() {
  const { reducedMotion } = useApp();
  return (
    <MotionConfig reducedMotion={reducedMotion ? 'always' : 'never'}>
      <RouterProvider router={router} />
    </MotionConfig>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}

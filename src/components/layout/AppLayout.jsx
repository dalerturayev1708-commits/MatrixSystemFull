import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, Search } from 'lucide-react';
import Sidebar from './Sidebar.jsx';
import Background from './Background.jsx';
import BrandMark from './BrandMark.jsx';
import Toasts from '../common/Toasts.jsx';
import CommandPalette from '../common/CommandPalette.jsx';
import Onboarding from '../common/Onboarding.jsx';
import ThemeToggle from '../common/ThemeToggle.jsx';
import { ROUTES, MOBILE_TABS } from '../../app/routes.js';
import { useApp } from '../../context/AppContext.jsx';

export default function AppLayout() {
  const { t, toggleTheme, reducedMotion } = useApp();
  const [drawer, setDrawer] = useState(false);
  const [palette, setPalette] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((v) => !v); }
      if (e.altKey && e.key.toLowerCase() === 't') { e.preventDefault(); toggleTheme(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleTheme]);

  useEffect(() => { setDrawer(false); window.scrollTo?.(0, 0); }, [location.pathname]);

  return (
    <>
      <a href="#main" className="skip-link">{t('nav.skip')}</a>
      <Background />
      <div className="app-shell">
        <Sidebar onOpenPalette={() => setPalette(true)} />
        <div style={{ minWidth: 0 }}>
          <header className="topbar">
            <button className="btn btn-ghost btn-icon" onClick={() => setDrawer(true)} aria-label={t('nav.menu')}><Menu size={20} /></button>
            <Link to="/" className="brand" aria-label="MATRIXVERSE"><BrandMark size={28} /><span className="brand-name">MATRIX<b>VERSE</b></span></Link>
            <div className="row" style={{ gap: 2 }}>
              <button className="btn btn-ghost btn-icon" onClick={() => setPalette(true)} aria-label={t('nav.search')}><Search size={18} /></button>
              <ThemeToggle compact />
            </div>
          </header>
          <main id="main" className="main" tabIndex={-1}>
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname.split('/').slice(0, 2).join('/')}
                initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
            <footer className="faint xs" style={{ marginTop: 48, textAlign: 'center', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              MATRIXVERSE — {t('app.footer')}
            </footer>
          </main>
        </div>
      </div>

      <AnimatePresence>
        {drawer && (
          <>
            <motion.div className="drawer-backdrop" onClick={() => setDrawer(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div
              className="drawer"
              role="dialog"
              aria-modal="true"
              aria-label={t('nav.menu')}
              initial={reducedMotion ? false : { x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ duration: 0.22 }}
              onKeyDown={(e) => { if (e.key === 'Escape') setDrawer(false); }}
            >
              <Sidebar onNavigate={() => setDrawer(false)} onOpenPalette={() => { setDrawer(false); setPalette(true); }} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <nav className="bottom-nav" aria-label="Quick">
        {MOBILE_TABS.map((path) => {
          const r = ROUTES.find((x) => x.path === path);
          return (
            <NavLink key={path} to={path} end={path === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
              <r.icon size={19} />
              <span>{t(r.key).split(' ')[0]}</span>
            </NavLink>
          );
        })}
      </nav>

      <CommandPalette open={palette} onClose={() => setPalette(false)} />
      <Onboarding />
      <Toasts />
    </>
  );
}

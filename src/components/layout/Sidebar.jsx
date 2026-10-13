import { NavLink, Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { ROUTES } from '../../app/routes.js';
import { useApp } from '../../context/AppContext.jsx';
import { rankFor, nextRank } from '../../data/achievements.js';
import BrandMark from './BrandMark.jsx';
import ThemeToggle from '../common/ThemeToggle.jsx';
import LanguageSwitcher from '../common/LanguageSwitcher.jsx';

export default function Sidebar({ onNavigate, onOpenPalette }) {
  const { t, state } = useApp();
  const groups = ['compute', 'explore', 'learn'];
  const xp = state.progress.xp;
  const nr = nextRank(xp);
  return (
    <aside className="sidebar" aria-label="Main">
      <Link to="/" className="brand" onClick={onNavigate}>
        <BrandMark />
        <span>
          <span className="brand-name">MATRIX<b>VERSE</b></span>
          <div className="brand-tag">{t('app.tagline')}</div>
        </span>
      </Link>
      <button className="btn btn-sm" onClick={onOpenPalette} style={{ justifyContent: 'space-between' }}>
        <span className="row" style={{ gap: 8 }}><Search size={14} /> {t('nav.search')}</span>
        <kbd>Ctrl K</kbd>
      </button>
      <nav className="stack" style={{ gap: 4 }}>
        {groups.map((g) => (
          <div className="nav-group" key={g}>
            <div className="nav-label">{t(`nav.group.${g}`)}</div>
            {ROUTES.filter((r) => r.group === g).map((r) => (
              <NavLink key={r.path} to={r.path} end={r.path === '/'} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} onClick={onNavigate}>
                <r.icon size={17} />
                {t(r.key)}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-foot">
        <div className="xp-mini">
          <div className="row-between"><strong>{t(`rank.${rankFor(xp)}`)}</strong><span className="mono">{xp} XP</span></div>
          <div className="progress" aria-hidden="true"><i style={{ width: `${nr ? Math.round(nr.progress * 100) : 100}%` }} /></div>
        </div>
        <div className="row-between">
          <LanguageSwitcher />
          <ThemeToggle compact />
        </div>
      </div>
    </aside>
  );
}

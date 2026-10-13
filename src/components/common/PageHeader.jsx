import { useLocation } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

export default function PageHeader({ eyebrow, title, subtitle, actions, favoritable = true }) {
  const { state, toggleFavoriteTool, t } = useApp();
  const { pathname } = useLocation();
  const fav = state.favoriteTools.includes(pathname);
  return (
    <header className="page-head">
      <div style={{ minWidth: 0 }}>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <div className="row" style={{ gap: 10 }}>
          <h1>{title}</h1>
          {favoritable && (
            <button
              className="btn btn-ghost btn-icon btn-sm"
              onClick={() => toggleFavoriteTool(pathname)}
              aria-pressed={fav}
              aria-label={fav ? t('common.unfavorite') : t('common.favorite')}
              title={fav ? t('common.unfavorite') : t('common.favorite')}
            >
              <Star size={16} fill={fav ? 'currentColor' : 'none'} color={fav ? 'var(--amber)' : 'currentColor'} />
            </button>
          )}
        </div>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="row">{actions}</div>}
    </header>
  );
}

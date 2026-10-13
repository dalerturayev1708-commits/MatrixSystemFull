import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, BookOpen, Moon, Languages, Dices, CornerDownLeft } from 'lucide-react';
import Modal from './Modal.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { ROUTES } from '../../app/routes.js';
import { LESSONS } from '../../data/lessons.js';
import { LANGUAGES } from '../../data/translations.js';
import { randomMatrix } from '../../math/index.js';

const norm = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ'ʻ‘’]/g, '');

export default function CommandPalette({ open, onClose }) {
  const app = useApp();
  const { t, p, state } = app;
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const listRef = useRef(null);

  useEffect(() => { if (open) { setQ(''); setSel(0); } }, [open]);

  const items = useMemo(() => {
    const tools = ROUTES.map((r) => ({ id: r.path, group: 'cmd.tools', label: t(r.key), icon: r.icon, path: r.path, fav: state.favoriteTools.includes(r.path), run: () => navigate(r.path) }));
    const lessons = LESSONS.map((l, i) => ({ id: 'l' + l.id, group: 'cmd.lessons', label: `${i + 1}. ${p(l.title)}`, icon: BookOpen, run: () => navigate(`/academy/${l.id}`) }));
    const nextLang = LANGUAGES[(LANGUAGES.findIndex((l) => l.code === state.lang) + 1) % LANGUAGES.length];
    const actions = [
      { id: 'theme', group: 'cmd.actions', label: t('cmd.toggleTheme'), icon: Moon, run: app.toggleTheme },
      { id: 'lang', group: 'cmd.actions', label: `${t('cmd.switchLang')} → ${nextLang.label}`, icon: Languages, run: () => app.setLang(nextLang.code) },
      {
        id: 'rand', group: 'cmd.actions', label: t('cmd.newRandom'), icon: Dices,
        run: () => {
          const A = state.matrices.A;
          app.setMatrix('A', randomMatrix(A?.length || 3, A?.[0]?.length || 3));
          navigate('/lab');
        },
      },
    ];
    const all = [...tools, ...lessons, ...actions];
    if (!q.trim()) return all;
    const nq = norm(q.trim());
    return all.filter((it) => norm(it.label).includes(nq));
  }, [q, t, p, state.favoriteTools, state.lang, state.matrices, navigate, app]);

  useEffect(() => { setSel(0); }, [q]);
  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [sel]);

  const run = (it) => { onClose(); it.run(); };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, items.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && items[sel]) { e.preventDefault(); run(items[sel]); }
  };

  let lastGroup = null;
  return (
    <Modal open={open} onClose={onClose} className="palette" hideClose>
      <div className="palette-input">
        <Search size={18} className="faint" />
        <input
          data-autofocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKey}
          placeholder={t('cmd.placeholder')}
          aria-label={t('cmd.placeholder')}
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-list"
          aria-activedescendant={items[sel] ? `pi-${items[sel].id}` : undefined}
        />
        <kbd>Esc</kbd>
      </div>
      <div className="palette-list" id="palette-list" role="listbox" ref={listRef}>
        {!items.length && <div className="empty" style={{ border: 0 }}>{t('cmd.empty')}</div>}
        {items.map((it, i) => {
          const head = it.group !== lastGroup ? <div className="palette-group" key={'g' + it.group}>{t(it.group)}</div> : null;
          lastGroup = it.group;
          const Icon = it.icon;
          return [
            head,
            <div
              key={it.id}
              id={`pi-${it.id}`}
              role="option"
              aria-selected={i === sel}
              className="palette-item"
              onMouseEnter={() => setSel(i)}
              onClick={() => run(it)}
              style={{ cursor: 'pointer' }}
            >
              <Icon size={16} />
              <span>{it.label}</span>
              {it.path ? (
                <button
                  className="btn btn-ghost btn-icon btn-sm star"
                  onClick={(e) => { e.stopPropagation(); app.toggleFavoriteTool(it.path); }}
                  aria-label={it.fav ? t('common.unfavorite') : t('common.favorite')}
                  aria-pressed={it.fav}
                >
                  <Star size={14} fill={it.fav ? 'currentColor' : 'none'} color={it.fav ? 'var(--amber)' : 'currentColor'} />
                </button>
              ) : i === sel ? <CornerDownLeft size={14} className="faint star" /> : null}
            </div>,
          ];
        })}
      </div>
    </Modal>
  );
}

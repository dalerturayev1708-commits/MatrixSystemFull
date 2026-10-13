import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Grid3x3, Calculator, Shapes, Route, Trophy, GraduationCap, ArrowRight, Activity, Star, CalendarDays, Award, Sigma, Equal, BrainCircuit } from 'lucide-react';
import ProgressCard from '../components/common/ProgressCard.jsx';
import MatrixGrid from '../components/matrix/MatrixGrid.jsx';
import Plane from '../components/visualization/Plane.jsx';
import AchievementIcon from '../components/common/AchievementIcon.jsx';
import { useApp } from '../context/AppContext.jsx';
import { multiplyMatrices } from '../math/index.js';
import { LESSONS } from '../data/lessons.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { ROUTES } from '../app/routes.js';
import { todayKey, formatNumber } from '../utils/formatting.js';

const par = (v) => (v < 0 ? `(${formatNumber(v)})` : formatNumber(v));
const PA = [[2, -1, 3], [0, 4, 1]];
const PB = [[1, 2], [3, -1], [-2, 0]];
const PC = multiplyMatrices(PA, PB);

function MultiplyPreview() {
  const { t } = useApp();
  const [cell, setCell] = useState([0, 0]);
  const step = PC.steps.find((s) => s.i === cell[0] && s.j === cell[1]);
  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="matrix-stage" style={{ gap: 10 }}>
        <MatrixGrid matrix={PA} compact highlight={(i) => (i === cell[0] ? 'hl-a' : 'hl-dim')} />
        <span className="op-symbol">×</span>
        <MatrixGrid matrix={PB} compact highlight={(i, j) => (j === cell[1] ? 'hl-b' : 'hl-dim')} />
        <span className="op-symbol">=</span>
        <div onMouseLeave={() => {}}>
          <div className="matrix-wrap">
            <div className="bracket l" />
            <div className="matrix-grid" style={{ gridTemplateColumns: 'repeat(2, auto)' }}>
              {PC.result.map((row, i) => row.map((v, j) => (
                <button
                  key={`${i}${j}`}
                  type="button"
                  className={`mcell compact ${i === cell[0] && j === cell[1] ? 'hl-out' : ''}`}
                  onMouseEnter={() => setCell([i, j])}
                  onFocus={() => setCell([i, j])}
                  onClick={() => setCell([i, j])}
                  aria-label={`c${i + 1}${j + 1} = ${v}`}
                >{v}</button>
              )))}
            </div>
            <div className="bracket r" />
          </div>
        </div>
      </div>
      <div className="calc-line">
        c<sub>{cell[0] + 1}{cell[1] + 1}</sub> = {step.terms.map((x, k) => <span key={k}>{k > 0 && ' + '}<span className="a">{par(x.a)}</span>·<span className="b">{par(x.b)}</span></span>)} = <span className="r">{step.value}</span>
      </div>
      <span className="xs faint">{t('dash.preview')}</span>
    </div>
  );
}

function LiveTransform() {
  const { reducedMotion } = useApp();
  const [a, setA] = useState(0.6);
  const raf = useRef(0);
  useEffect(() => {
    if (reducedMotion) return undefined;
    const t0 = performance.now();
    const tick = (now) => {
      setA(0.6 + Math.sin((now - t0) / 1800) * 0.9);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [reducedMotion]);
  const M = [[Math.cos(a), -Math.sin(a) + 0.5 * Math.sin(a * 0.7)], [Math.sin(a), Math.cos(a)]];
  const det = M[0][0] * M[1][1] - M[0][1] * M[1][0];
  return (
    <div className="stack" style={{ gap: 10 }}>
      <Plane M={M} label="transform preview" />
      <div className="row"><span className="chip mono violet">det = {det.toFixed(3)}</span><span className="chip mono">[{M[0].map((v) => v.toFixed(2)).join(' ')} ; {M[1].map((v) => v.toFixed(2)).join(' ')}]</span></div>
    </div>
  );
}

const QUICK = [
  { to: '/lab', icon: Grid3x3, key: 'nav.lab', tone: '' },
  { to: '/operations', icon: Calculator, key: 'nav.operations', tone: 'violet' },
  { to: '/playground', icon: Shapes, key: 'nav.playground', tone: 'lime' },
  { to: '/algorithms', icon: Route, key: 'nav.algorithms', tone: 'amber' },
  { to: '/challenges', icon: Trophy, key: 'nav.challenges', tone: 'violet' },
  { to: '/academy', icon: GraduationCap, key: 'nav.academy', tone: '' },
];

export default function Dashboard() {
  const { t, p, state, setActiveMatrix } = useApp();
  const navigate = useNavigate();
  const nextLesson = LESSONS.find((l) => !state.progress.lessons[l.id]?.completed) || LESSONS[0];
  const dailyDone = state.progress.challenge.dailyDone === todayKey();
  const unlocked = ACHIEVEMENTS.filter((a) => state.achievements[a.id]).sort((a, b) => state.achievements[b.id].localeCompare(state.achievements[a.id])).slice(0, 4);
  const favTools = state.favoriteTools.map((path) => ROUTES.find((r) => r.path === path)).filter(Boolean);
  const timeAgo = (iso) => {
    const m = Math.round((Date.now() - new Date(iso)) / 60000);
    if (m < 60) return `${m} ${t('common.minutes')}`;
    return new Date(iso).toLocaleDateString();
  };
  const opIcon = { det: Sigma, inverse: Sigma, solve: Equal, leastSquares: Equal };

  return (
    <div className="page">
      <section className="hero">
        <div className="stack" style={{ gap: 6 }}>
          <span className="eyebrow">{t('dash.welcome')}</span>
          <h1>MATRIX<span className="accent">VERSE</span></h1>
          <div className="tag">{t('app.tagline')}</div>
          <p className="sub">{t('dash.heroSub')}</p>
          <div className="row" style={{ marginTop: 18 }}>
            <Link to="/lab" className="btn btn-primary"><Grid3x3 size={16} /> {t('dash.openLab')}</Link>
            <Link to={`/academy/${nextLesson.id}`} className="btn"><GraduationCap size={16} /> {t('dash.startLesson')}: {p(nextLesson.title)}</Link>
          </div>
        </div>
        <div className="panel flat" style={{ background: 'var(--surface-solid)' }}>
          <MultiplyPreview />
        </div>
      </section>

      <section>
        <div className="grid-auto" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' }}>
          {QUICK.map((q) => (
            <Link key={q.to} to={q.to} className={`card-link ${q.tone}`}>
              <div className="ic"><q.icon size={18} /></div>
              <h3>{t(q.key)}</h3>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid-3">
        <section className="panel">
          <div className="panel-head"><h3>{t('dash.progress')}</h3><Link to="/progress" className="btn btn-ghost btn-sm"><ArrowRight size={14} /></Link></div>
          <ProgressCard />
        </section>
        <section className="panel">
          <div className="panel-head"><h3><CalendarDays size={17} /> {t('dash.daily')}</h3></div>
          <div className="stack">
            {dailyDone ? <p className="muted small">{t('dash.dailyDone')}</p> : <p className="muted small">{t('ch.dailyDesc')}</p>}
            <span className="chip amber" style={{ alignSelf: 'flex-start' }}>{t('ch.streak', { n: state.progress.streak.current })}</span>
            <button className="btn btn-violet" onClick={() => navigate('/challenges')} style={{ alignSelf: 'flex-start' }}><Trophy size={15} /> {t('nav.challenges')}</button>
          </div>
        </section>
        <section className="panel">
          <div className="panel-head"><h3>{t('dash.transformPreview')}</h3><Link to="/playground" className="btn btn-ghost btn-sm"><ArrowRight size={14} /></Link></div>
          <LiveTransform />
        </section>
      </div>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head"><h3>{t('dash.recentMatrices')}</h3><Link to="/lab" className="btn btn-ghost btn-sm"><ArrowRight size={14} /></Link></div>
          <div className="grid-2" style={{ gap: 12 }}>
            {Object.entries(state.matrices).slice(0, 4).map(([name, M]) => (
              <button key={name} className="card-link" onClick={() => { setActiveMatrix(name); navigate('/lab'); }} style={{ cursor: 'pointer', overflow: 'hidden' }}>
                <div className="row-between"><strong className="mono">{name}</strong><span className="matrix-dims">{M.length}×{M[0].length}</span></div>
                <MatrixGrid matrix={M.slice(0, 3).map((r) => r.slice(0, 3))} compact />
              </button>
            ))}
          </div>
        </section>
        <div className="stack-lg">
          <section className="panel">
            <div className="panel-head"><h3><Activity size={17} /> {t('dash.recent')}</h3></div>
            {!state.recentOps.length ? <div className="empty">{t('dash.noRecent')}</div> : (
              <div className="stack" style={{ gap: 6 }}>
                {state.recentOps.slice(0, 6).map((o, i) => {
                  const Icon = opIcon[o.type] || Calculator;
                  return (
                    <div key={i} className="row-between small" style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                      <span className="row" style={{ gap: 8 }}><Icon size={14} className="faint" /><span className="mono">{o.label}</span></span>
                      <span className="xs faint">{timeAgo(o.at)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
          <section className="panel">
            <div className="panel-head"><h3><Star size={17} /> {t('dash.favTools')}</h3></div>
            {!favTools.length ? <p className="small muted">{t('dash.noFav')}</p> : (
              <div className="row">{favTools.map((r) => <Link key={r.path} to={r.path} className="btn btn-sm"><r.icon size={14} /> {t(r.key)}</Link>)}</div>
            )}
          </section>
        </div>
      </div>

      <section className="panel">
        <div className="panel-head"><h3><Award size={17} /> {t('dash.achievements')}</h3><Link to="/progress" className="btn btn-ghost btn-sm"><ArrowRight size={14} /></Link></div>
        {!unlocked.length ? <div className="empty">{t('dash.noAch')}</div> : (
          <div className="grid-auto">
            {unlocked.map((a) => (
              <div key={a.id} className="badge"><div className="ic"><AchievementIcon name={a.icon} /></div><div className="stack" style={{ gap: 2 }}><h4>{p(a.name)}</h4><span className="xs muted">{p(a.desc)}</span></div></div>
            ))}
          </div>
        )}
      </section>

      <section className="panel flat row-between">
        <span className="small muted"><BrainCircuit size={15} style={{ verticalAlign: -3 }} /> {t('ai.subtitle')}</span>
        <Link to="/ai" className="btn btn-sm">{t('nav.ai')} <ArrowRight size={14} /></Link>
      </section>
    </div>
  );
}

import { useApp } from '../../context/AppContext.jsx';
import { rankFor, nextRank } from '../../data/achievements.js';
import { LESSONS } from '../../data/lessons.js';

/** XP, rank and lesson progress summary used on the dashboard and progress page. */
export default function ProgressCard() {
  const { t, state } = useApp();
  const xp = state.progress.xp;
  const r = rankFor(xp);
  const nr = nextRank(xp);
  const done = LESSONS.filter((l) => state.progress.lessons[l.id]?.completed).length;
  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="row-between">
        <div className="kpi"><span className="k">{t('pr.rank')}</span><span className="v" style={{ fontSize: 'var(--fs-xl)' }}>{t(`rank.${r}`)}</span></div>
        <div className="kpi" style={{ textAlign: 'right' }}><span className="k">{t('pr.xp')}</span><span className="v">{xp}</span></div>
      </div>
      <div className="stack" style={{ gap: 6 }}>
        <div className="progress"><i style={{ width: `${nr ? Math.round(nr.progress * 100) : 100}%` }} /></div>
        <span className="xs muted">{nr ? t('pr.nextRank', { xp: nr.need, rank: t(`rank.${nr.rank}`) }) : t('rank.5')}</span>
      </div>
      <div className="stack" style={{ gap: 6 }}>
        <div className="row-between small"><span className="muted">{t('pr.lessons')}</span><span className="mono">{done}/{LESSONS.length}</span></div>
        <div className="progress"><i style={{ width: `${(done / LESSONS.length) * 100}%`, background: 'var(--lime)' }} /></div>
      </div>
    </div>
  );
}

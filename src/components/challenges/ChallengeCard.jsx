import { Lock, Play, Trophy } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

export default function ChallengeCard({ level, locked, needXp, best, onStart }) {
  const { t } = useApp();
  return (
    <div className={`card-link ${locked ? 'locked' : ''} ${['', '', 'violet', 'lime', 'amber', 'violet', 'lime'][level.n]}`}>
      <div className="row-between">
        <div className="ic">{locked ? <Lock size={18} /> : <Trophy size={18} />}</div>
        <span className="chip mono">{t('ch.level', { n: level.n })}</span>
      </div>
      <h3>{t(level.key)}</h3>
      <p>{t(level.desc)}</p>
      <div className="row-between" style={{ marginTop: 'auto' }}>
        <span className="xs muted">{best ? t('ch.best', { s: best.score, t: best.total }) : t('ch.questions', { n: level.gens.length })}</span>
        {locked
          ? <span className="xs faint">{t('ch.locked', { xp: needXp })}</span>
          : <button className="btn btn-primary btn-sm" onClick={onStart}><Play size={14} /> {t('ch.start')}</button>}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { Timer, Flame, CalendarDays, ArrowRight, RotateCcw, Trophy, X } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import ChallengeCard from '../components/challenges/ChallengeCard.jsx';
import QuestionView from '../components/challenges/QuestionView.jsx';
import { useApp } from '../context/AppContext.jsx';
import { LEVELS, generateLevel, dailyQuestion, xpForLevel } from '../data/challenges.js';
import { RANK_XP, rankFor } from '../data/achievements.js';
import { todayKey } from '../utils/formatting.js';

const TIME_PER_Q = 30;

function Celebrate() {
  const { reducedMotion } = useApp();
  if (reducedMotion) return null;
  const colors = ['var(--cyan)', 'var(--violet)', 'var(--lime)', 'var(--amber)'];
  return (
    <div className="celebrate" aria-hidden="true">
      {Array.from({ length: 36 }, (_, i) => (
        <i key={i} style={{ left: `${(i * 37) % 100}%`, background: colors[i % 4], animationDelay: `${(i % 9) * 0.06}s` }} />
      ))}
    </div>
  );
}

function Runner({ level, timed, onExit }) {
  const app = useApp();
  const { t, addXP, recordAnswer, recordRun, toast } = app;
  const [seed, setSeed] = useState(() => Date.now());
  const questions = useMemo(() => generateLevel(level.n, seed), [level.n, seed]);
  const [idx, setIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(null);
  const [left, setLeft] = useState(TIME_PER_Q);
  const [timeout, setTimeoutFlag] = useState(false);
  const nextRef = useRef(null);

  // Focus "Next" only after the Enter key that submitted the answer has finished,
  // otherwise the same keypress would activate the button and skip the feedback.
  useEffect(() => {
    if (!answered) return undefined;
    const id = setTimeout(() => nextRef.current?.focus(), 120);
    return () => clearTimeout(id);
  }, [answered]);

  useEffect(() => { setLeft(TIME_PER_Q); setTimeoutFlag(false); }, [idx, seed]);
  useEffect(() => {
    if (!timed || answered || done) return undefined;
    if (left <= 0) { setTimeoutFlag(true); return undefined; }
    const id = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [timed, left, answered, done]);

  const onAnswered = (correct) => {
    setAnswered(true);
    recordAnswer(correct);
    if (correct) {
      setScore((s) => s + 1);
      addXP(xpForLevel(level.n));
    }
  };

  const next = () => {
    if (idx + 1 < questions.length) { setIdx(idx + 1); setAnswered(false); return; }
    const isBest = recordRun(level.n, score, questions.length, timed);
    if (score === questions.length) { addXP(15); toast(t('toast.xp', { xp: 15 }), 'xp'); }
    setDone({ score, total: questions.length, isBest });
  };

  const retry = () => { setSeed(Date.now()); setIdx(0); setScore(0); setDone(null); setAnswered(false); };

  if (done) {
    const xpEarned = done.score * xpForLevel(level.n) + (done.score === done.total ? 15 : 0);
    return (
      <section className="panel stack-lg" style={{ position: 'relative', overflow: 'hidden', textAlign: 'center', alignItems: 'center' }}>
        {done.score > 0 && <Celebrate />}
        <Trophy size={44} color="var(--amber)" />
        <h2>{t(level.key)}</h2>
        <div className="kpi" style={{ alignItems: 'center' }}><span className="v">{done.score} / {done.total}</span><span className="k">{t('ch.score', { s: done.score, t: done.total })}</span></div>
        <div className="row" style={{ justifyContent: 'center' }}>
          <span className="chip lime">{t('ch.xpEarned', { xp: xpEarned })}</span>
          {done.isBest && <span className="chip violet">{t('ch.newBest')}</span>}
        </div>
        <div className="row" style={{ justifyContent: 'center' }}>
          <button className="btn" onClick={onExit}>{t('common.back')}</button>
          <button className="btn btn-primary" onClick={retry}><RotateCcw size={15} /> {t('common.retry')}</button>
        </div>
      </section>
    );
  }

  const q = questions[idx];
  return (
    <section className="panel stack-lg">
      <div className="row-between">
        <div className="stack" style={{ gap: 4 }}>
          <span className="eyebrow">{t('ch.level', { n: level.n })} · {t(level.key)}</span>
          <span className="small muted">{t('ch.question', { n: idx + 1, total: questions.length })}</span>
        </div>
        <div className="row">
          {timed && <span className={`chip mono ${left <= 5 ? 'rose' : 'amber'} timer-ring`}><Timer size={13} /> {Math.max(0, left)}{t('common.seconds')}</span>}
          <span className="chip mono lime">{score} ✓</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onExit} aria-label={t('common.close')}><X size={16} /></button>
        </div>
      </div>
      <div className="progress"><i style={{ width: `${((idx + (answered ? 1 : 0)) / questions.length) * 100}%` }} /></div>
      <QuestionView key={`${seed}-${idx}`} q={q} onAnswered={onAnswered} forceReveal={timeout} />
      {answered && (
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button ref={nextRef} className="btn btn-primary" onClick={next}>{idx + 1 < questions.length ? t('common.next') : t('ch.finish')} <ArrowRight size={15} /></button>
        </div>
      )}
    </section>
  );
}

function Daily() {
  const { t, state, addXP, recordAnswer, markDaily } = useApp();
  const today = todayKey();
  const q = useMemo(() => dailyQuestion(today), [today]);
  const doneToday = state.progress.challenge.dailyDone === today;
  const [open, setOpen] = useState(false);
  return (
    <section className="panel">
      <div className="panel-head">
        <h2><CalendarDays size={18} /> {t('ch.daily')}</h2>
        <span className="chip amber"><Flame size={13} /> {t('ch.streak', { n: state.progress.streak.current })}</span>
      </div>
      {doneToday && !open ? <p className="muted">{t('dash.dailyDone')}</p> : !open ? (
        <div className="row-between">
          <p className="muted">{t('ch.dailyDesc')}</p>
          <button className="btn btn-violet" onClick={() => setOpen(true)}>{t('ch.start')}</button>
        </div>
      ) : (
        <QuestionView
          q={q}
          onAnswered={(correct) => {
            recordAnswer(correct);
            if (!doneToday) { markDaily(); addXP(correct ? 30 : 10); }
          }}
        />
      )}
      <p className="xs faint" style={{ marginTop: 12 }}>{t('ch.streakNote')}</p>
    </section>
  );
}

export default function Challenges() {
  const { t, state } = useApp();
  const [active, setActive] = useState(null);
  const [timed, setTimed] = useState(false);
  const xp = state.progress.xp;

  if (active) {
    return (
      <div className="page">
        <Runner level={active} timed={timed} onExit={() => setActive(null)} />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="08 · CHALLENGES"
        title={t('ch.title')}
        subtitle={t('ch.subtitle')}
        actions={<span className="chip violet">{t('ch.rank')}: {t(`rank.${rankFor(xp)}`)} · {xp} XP</span>}
      />
      <Daily />
      <section className="panel">
        <div className="row-between" style={{ marginBottom: 14 }}>
          <label className="check"><input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} /> <Timer size={15} /> {t('ch.timed')}</label>
          <span className="xs muted">{t('ch.timedHint')}</span>
        </div>
        <div className="grid-3">
          {LEVELS.map((l) => (
            <ChallengeCard
              key={l.n}
              level={l}
              locked={xp < RANK_XP[l.n - 1]}
              needXp={RANK_XP[l.n - 1] - xp}
              best={state.progress.challenge.bests[l.n]}
              onStart={() => setActive(l)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

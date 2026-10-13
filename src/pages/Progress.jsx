import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import PageHeader from '../components/common/PageHeader.jsx';
import ProgressCard from '../components/common/ProgressCard.jsx';
import AchievementIcon from '../components/common/AchievementIcon.jsx';
import { useApp } from '../context/AppContext.jsx';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { LEVELS } from '../data/challenges.js';
import { todayKey } from '../utils/formatting.js';

const tipStyle = { background: 'var(--surface-solid)', border: '1px solid var(--border-strong)', borderRadius: 8, color: 'var(--text)', fontSize: 12 };

export default function Progress() {
  const { t, p, state } = useApp();
  const pr = state.progress;
  const acc = pr.challenge.answered ? Math.round((pr.challenge.correct / pr.challenge.answered) * 100) : 0;

  const xpSeries = useMemo(() => {
    const out = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = todayKey(d);
      out.push({ day: `${d.getDate()}.${d.getMonth() + 1}`, xp: pr.xpLog[k] || 0 });
    }
    return out;
  }, [pr.xpLog]);

  const levelSeries = LEVELS.map((l) => {
    const b = pr.challenge.bests[l.n];
    return { level: `L${l.n}`, score: b ? Math.round((b.score / b.total) * 100) : 0 };
  });

  const kpis = [
    [t('pr.challenges'), pr.challenge.correct],
    [t('pr.accuracy'), `${acc}%`],
    [t('pr.streak'), t('pr.days', { n: pr.streak.current })],
    [t('pr.bestStreak'), t('pr.days', { n: pr.streak.best })],
    [t('pr.ops'), pr.opsCount],
  ];

  return (
    <div className="page">
      <PageHeader eyebrow="10 · PROGRESS" title={t('pr.title')} subtitle={t('pr.subtitle')} />
      <div className="split">
        <section className="panel"><ProgressCard /></section>
        <section className="panel">
          <div className="grid-3" style={{ gap: 16 }}>
            {kpis.map(([k, v]) => <div key={k} className="kpi"><span className="k">{k}</span><span className="v">{v}</span></div>)}
          </div>
        </section>
      </div>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-head"><h3>{t('pr.xpHistory')}</h3></div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <AreaChart data={xpSeries} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="xpFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--cyan)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--cyan)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: 'var(--text-faint)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: 'var(--text-faint)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <RTooltip contentStyle={tipStyle} cursor={{ stroke: 'var(--border-strong)' }} />
                <Area type="monotone" dataKey="xp" stroke="var(--cyan)" strokeWidth={2} fill="url(#xpFill)" dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="panel">
          <div className="panel-head"><h3>{t('pr.byLevel')}</h3></div>
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={levelSeries} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="level" tick={{ fill: 'var(--text-faint)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-faint)', fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                <RTooltip contentStyle={tipStyle} cursor={{ fill: 'var(--surface-2)' }} formatter={(v) => `${v}%`} />
                <Bar dataKey="score" fill="var(--violet)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head"><h2>{t('pr.badges')}</h2><span className="chip">{Object.keys(state.achievements).length} / {ACHIEVEMENTS.length}</span></div>
        <div className="grid-auto">
          {ACHIEVEMENTS.map((a) => {
            const at = state.achievements[a.id];
            return (
              <div key={a.id} className={`badge ${at ? '' : 'locked'}`}>
                <div className="ic"><AchievementIcon name={a.icon} /></div>
                <div className="stack" style={{ gap: 2, minWidth: 0 }}>
                  <h4>{p(a.name)}</h4>
                  <span className="xs muted">{p(a.desc)}</span>
                  <span className="xs faint">{at ? t('pr.unlocked', { date: new Date(at).toLocaleDateString() }) : t('pr.locked')}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

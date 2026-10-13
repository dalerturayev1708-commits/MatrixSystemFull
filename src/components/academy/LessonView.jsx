import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Eye, FlaskConical, ListChecks, Dumbbell, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { LESSONS } from '../../data/lessons.js';
import { generateQuestion } from '../../data/challenges.js';
import MatrixGrid from '../matrix/MatrixGrid.jsx';
import LessonDemo from './LessonDemo.jsx';
import QuestionView from '../challenges/QuestionView.jsx';
import Plane from '../visualization/Plane.jsx';

function Quiz({ lesson, onDone, saved }) {
  const { t, p } = useApp();
  const [picks, setPicks] = useState({});
  const allAnswered = Object.keys(picks).length === lesson.quiz.length;
  const score = lesson.quiz.filter((q, i) => picks[i] === q.answer).length;
  useEffect(() => { if (allAnswered) onDone(score); /* eslint-disable-next-line */ }, [allAnswered]);
  return (
    <div className="stack-lg">
      {lesson.quiz.map((q, i) => {
        const picked = picks[i];
        return (
          <div key={i} className="stack" style={{ gap: 8 }}>
            <strong>{i + 1}. {p(q.q)}</strong>
            <div className="stack" style={{ gap: 6, maxWidth: 520 }}>
              {q.options.map((o, k) => {
                let cls = 'quiz-option';
                if (picked !== undefined) { if (k === q.answer) cls += ' correct'; else if (k === picked) cls += ' wrong'; }
                return <button key={k} className={cls} disabled={picked !== undefined} onClick={() => setPicks({ ...picks, [i]: k })}>{p(o)}</button>;
              })}
            </div>
            {picked !== undefined && (
              <div className={`callout ${picked === q.answer ? 'success' : 'error'} pop`}>
                {picked === q.answer ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                <div><strong>{picked === q.answer ? t('common.correct') : t('common.incorrect')}</strong> {p(q.why)}</div>
              </div>
            )}
          </div>
        );
      })}
      {allAnswered && <span className="chip lime" style={{ alignSelf: 'flex-start' }}>{t('ac.quizScore', { s: score, t: lesson.quiz.length })}</span>}
      {!allAnswered && !saved?.completed && <span className="xs muted">{t('ac.quizPass')}</span>}
    </div>
  );
}

function Practice({ lesson }) {
  const { t } = useApp();
  const [seed, setSeed] = useState(0);
  const qs = useMemo(() => lesson.practice.flatMap((g) => [generateQuestion(g), generateQuestion(g)]).slice(0, 4), [lesson, seed]);
  return (
    <div className="stack-lg">
      {qs.map((q, i) => (
        <div key={`${seed}-${i}`} className="panel flat">
          <QuestionView q={q} autoFocus={false} />
        </div>
      ))}
      <button className="btn" onClick={() => setSeed(seed + 1)} style={{ alignSelf: 'flex-start' }}><RefreshCw size={15} /> {t('ac.newPractice')}</button>
    </div>
  );
}

export default function LessonView({ lessonId }) {
  const { t, p, state, saveLesson, addXP, toast } = useApp();
  const index = LESSONS.findIndex((l) => l.id === lessonId);
  const lesson = LESSONS[index];
  const saved = state.progress.lessons[lessonId];

  useEffect(() => {
    if (lesson && !saved?.started) saveLesson(lessonId, { started: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  if (!lesson) return <div className="empty">{t('common.empty')}</div>;

  const onQuizDone = (score) => {
    const first = !saved?.completed;
    saveLesson(lessonId, { completed: true, quizScore: Math.max(score, saved?.quizScore ?? 0), at: new Date().toISOString() });
    if (first) {
      const xp = 25 + score * 5;
      addXP(xp);
      toast(t('toast.xp', { xp }), 'xp');
    }
  };

  const v = lesson.visual;
  const hl = v?.highlight === 'diag' ? (i, j) => (i === j ? 'hl-a' : '')
    : v?.highlight === 'row0' ? (i) => (i === 0 ? 'hl-a' : '')
      : v?.highlight === 'cell12' ? (i, j) => (i === 0 && j === 1 ? 'hl-pivot' : i === 0 ? 'hl-a' : j === 1 ? 'hl-b' : '') : undefined;
  const prev = LESSONS[index - 1];
  const next = LESSONS[index + 1];

  return (
    <div className="page">
      <div className="row-between">
        <Link to="/academy" className="btn btn-ghost btn-sm"><ArrowLeft size={15} /> {t('ac.backToList')}</Link>
        <span className={`chip ${saved?.completed ? 'lime' : 'amber'}`}>{saved?.completed ? t('ac.completed') : t('ac.inProgress')}</span>
      </div>
      <header className="page-head">
        <div>
          <div className="eyebrow">{t('ac.lesson', { n: index + 1 })} / {LESSONS.length}</div>
          <h1>{p(lesson.title)}</h1>
          <p>{p(lesson.summary)}</p>
        </div>
      </header>

      <div className="split">
        <section className="panel">
          <div className="panel-head"><h2><BookOpen size={18} /> {t('ac.explain')}</h2></div>
          <div className="prose">
            {lesson.body.map((para, i) => <p key={i}>{p(para)}</p>)}
            {lesson.formula && <div className="formula">{lesson.formula}</div>}
          </div>
        </section>
        <section className="panel">
          <div className="panel-head"><h2><Eye size={18} /> {t('ac.visual')}</h2></div>
          {lesson.demo === 'transform' ? <Plane M={v.M} label={v.name} /> : <MatrixGrid matrix={v.M} name={v.name} highlight={hl} augmentAt={v.augmentAt} showIndices hoverInfo />}
        </section>
      </div>

      <section className="panel">
        <div className="panel-head"><h2><FlaskConical size={18} /> {t('ac.demo')}</h2></div>
        <LessonDemo lesson={lesson} />
      </section>

      <div className="split">
        <section className="panel">
          <div className="panel-head"><h2><ListChecks size={18} /> {t('ac.quiz')}</h2></div>
          <Quiz key={lessonId} lesson={lesson} onDone={onQuizDone} saved={saved} />
        </section>
        <section className="panel">
          <div className="panel-head"><h2><Dumbbell size={18} /> {t('ac.practice')}</h2></div>
          <Practice key={lessonId} lesson={lesson} />
        </section>
      </div>

      <div className="row-between">
        {prev ? <Link className="btn" to={`/academy/${prev.id}`}><ArrowLeft size={15} /> {p(prev.title)}</Link> : <span />}
        {next && <Link className="btn btn-primary" to={`/academy/${next.id}`}>{t('ac.nextLesson')}: {p(next.title)} <ArrowRight size={15} /></Link>}
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, CircleDot } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

export default function LessonCard({ lesson, index, progress }) {
  const { t, p } = useApp();
  const status = progress?.completed ? 'completed' : progress?.started ? 'inProgress' : 'notStarted';
  const Icon = status === 'completed' ? CheckCircle2 : status === 'inProgress' ? CircleDot : Circle;
  const tone = ['cyan', 'violet', 'lime', 'amber'][index % 4];
  return (
    <Link to={`/academy/${lesson.id}`} className={`card-link ${tone === 'cyan' ? '' : tone}`}>
      <div className="row-between">
        <span className="chip mono">{t('ac.lesson', { n: index + 1 })}</span>
        <Icon size={18} color={status === 'completed' ? 'var(--success)' : status === 'inProgress' ? 'var(--amber)' : 'var(--text-faint)'} aria-label={t(`ac.${status}`)} />
      </div>
      <h3>{p(lesson.title)}</h3>
      <p>{p(lesson.summary)}</p>
      {progress?.quizScore !== undefined && <span className="xs muted">{t('ac.quizScore', { s: progress.quizScore, t: lesson.quiz.length })}</span>}
    </Link>
  );
}

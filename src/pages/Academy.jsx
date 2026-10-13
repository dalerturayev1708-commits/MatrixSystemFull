import { useParams } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader.jsx';
import LessonCard from '../components/academy/LessonCard.jsx';
import LessonView from '../components/academy/LessonView.jsx';
import { useApp } from '../context/AppContext.jsx';
import { LESSONS } from '../data/lessons.js';

export default function Academy() {
  const { lessonId } = useParams();
  const { t, state } = useApp();
  if (lessonId) return <LessonView key={lessonId} lessonId={lessonId} />;
  const done = LESSONS.filter((l) => state.progress.lessons[l.id]?.completed).length;
  return (
    <div className="page">
      <PageHeader
        eyebrow="09 · ACADEMY"
        title={t('ac.title')}
        subtitle={t('ac.subtitle')}
        actions={<span className="chip lime">{t('dash.lessonsDone', { n: done, total: LESSONS.length })}</span>}
      />
      <div className="progress" aria-hidden="true"><i style={{ width: `${(done / LESSONS.length) * 100}%` }} /></div>
      <div className="grid-auto">
        {LESSONS.map((l, i) => <LessonCard key={l.id} lesson={l} index={i} progress={state.progress.lessons[l.id]} />)}
      </div>
    </div>
  );
}

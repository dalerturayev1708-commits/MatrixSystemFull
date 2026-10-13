import { useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw, ChevronsRight } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

/** Play / pause / step / restart / speed controls for a usePlayback() instance.
 *  Keyboard (when `keyboard` is true and focus is not in a text field):
 *  Space = play/pause, ← / → = step. */
export default function PlaybackControls({ pb, keyboard = true, label }) {
  const { t } = useApp();

  useEffect(() => {
    if (!keyboard) return undefined;
    const onKey = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.querySelector('.modal-backdrop')) return;
      if (e.key === ' ') { e.preventDefault(); pb.toggle(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); pb.next(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); pb.prev(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [keyboard, pb]);

  const disabled = pb.total <= 1;
  return (
    <div className="playback" role="group" aria-label={label || t('common.steps')}>
      <button className="btn btn-icon btn-sm" onClick={pb.restart} disabled={disabled} aria-label={t('play.restart')} title={t('play.restart')}><RotateCcw size={15} /></button>
      <button className="btn btn-icon btn-sm" onClick={pb.prev} disabled={disabled || pb.index === 0} aria-label={t('play.prev')} title={t('play.prev')}><SkipBack size={15} /></button>
      <button className="btn btn-primary btn-sm" onClick={pb.toggle} disabled={disabled} aria-label={pb.playing ? t('play.pause') : t('play.play')} style={{ minWidth: 84 }}>
        {pb.playing ? <Pause size={15} /> : <Play size={15} />} {pb.playing ? t('play.pause') : t('play.play')}
      </button>
      <button className="btn btn-icon btn-sm" onClick={pb.next} disabled={disabled || pb.index >= pb.total - 1} aria-label={t('play.next')} title={t('play.next')}><SkipForward size={15} /></button>
      <button className="btn btn-icon btn-sm" onClick={pb.end} disabled={disabled || pb.index >= pb.total - 1} aria-label={t('play.end')} title={t('play.end')}><ChevronsRight size={15} /></button>
      <span className="counter" aria-live="polite">{t('play.step', { n: pb.total ? pb.index + 1 : 0, total: pb.total })}</span>
      <label className="speed">
        {t('common.speed')}
        <input type="range" className="range" min="0.25" max="4" step="0.25" value={pb.speed} onChange={(e) => pb.setSpeed(+e.target.value)} aria-label={t('play.speed')} />
        <span className="mono">{pb.speed}×</span>
      </label>
    </div>
  );
}

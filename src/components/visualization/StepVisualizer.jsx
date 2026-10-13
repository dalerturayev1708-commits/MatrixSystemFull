import { useApp } from '../../context/AppContext.jsx';
import { usePlayback } from '../../hooks/usePlayback.js';
import PlaybackControls from '../common/PlaybackControls.jsx';

/**
 * Generic step player. `steps` come straight from the math engine, so the
 * picture always matches the real calculation.
 *  render(step, index) → the visual for the current step
 *  describe(step, index) → text for the step (defaults to translated step.text)
 */
export default function StepVisualizer({ steps, render, describe, resetKey, showList = true, keyboard = true, title }) {
  const { tm, state } = useApp();
  const pb = usePlayback(steps.length, { resetKey, initialSpeed: state.prefs.animSpeed });
  const step = steps[pb.index];
  const text = (s, i) => (describe ? describe(s, i) : tm(s?.text));
  if (!steps.length) return null;
  return (
    <div className="stack" style={{ gap: 12 }}>
      {title && <h3>{title}</h3>}
      <PlaybackControls pb={pb} keyboard={keyboard} />
      <div className="step-text" aria-live="polite">{text(step, pb.index)}</div>
      <div style={{ minWidth: 0 }}>{render(step, pb.index, pb)}</div>
      {showList && steps.length > 1 && (
        <details>
          <summary className="label" style={{ cursor: 'pointer', padding: '4px 0' }}>{`${steps.length}`} · {state.lang === 'uz' ? "barcha qadamlar" : 'all steps'}</summary>
          <div className="step-list" style={{ marginTop: 8 }}>
            {steps.map((s, i) => (
              <button key={i} aria-current={i === pb.index} onClick={() => pb.goTo(i)}>
                <span className="n">{i + 1}</span>
                <span>{text(s, i)}</span>
              </button>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

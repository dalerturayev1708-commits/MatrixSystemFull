import { useEffect, useState } from 'react';
import { Lightbulb, CheckCircle2, XCircle, Send } from 'lucide-react';
import MatrixGrid from '../matrix/MatrixGrid.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { checkAnswer, answerText } from '../../data/challenges.js';

/** Renders one generated question, collects an answer and reveals the engine's solution. */
export default function QuestionView({ q, onAnswered, disabled, forceReveal, autoFocus = true }) {
  const { t } = useApp();
  const [value, setValue] = useState('');
  const [grid, setGrid] = useState(() => (q.kind === 'matrix' ? q.answer.map((r) => r.map(() => '')) : null));
  const [showHint, setShowHint] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    setValue('');
    setGrid(q.kind === 'matrix' ? q.answer.map((r) => r.map(() => '')) : null);
    setShowHint(false);
    setResult(null);
  }, [q]);

  useEffect(() => {
    if (forceReveal && result === null) { setResult({ correct: false, timeout: true }); onAnswered?.(false, true); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceReveal]);

  const submit = (choice) => {
    if (result) return;
    const input = q.kind === 'choice' ? choice : q.kind === 'matrix' ? grid : value;
    const correct = checkAnswer(q, input);
    setResult({ correct, picked: choice });
    onAnswered?.(correct, false);
  };

  const canSubmit = q.kind === 'matrix' ? grid?.every((r) => r.every((c) => c.trim() !== '')) : value.trim() !== '';
  const locked = disabled || !!result;

  return (
    <div className="stack-lg">
      <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, lineHeight: 1.4 }}>{t(q.prompt.key, q.prompt.params)}</h3>

      {(q.matrices?.length > 0 || q.grid) && (
        <div className="matrix-stage">
          {q.matrices?.map((m, i) => (
            <MatrixGrid
              key={i}
              matrix={m.M}
              name={m.name}
              compact
              augmentAt={m.augmentAt}
              showIndices={q.gen === 'entry' || q.gen === 'dims' || q.gen === 'rowsCount' || q.gen === 'colsCount'}
            />
          ))}
          {q.grid && <pre className="formula" style={{ lineHeight: 1.6, fontSize: '1rem' }}>{q.grid.join('\n')}</pre>}
        </div>
      )}

      {q.kind === 'choice' ? (
        <div className="stack" style={{ gap: 8, maxWidth: 420 }}>
          {q.options.map((o, i) => {
            let cls = 'quiz-option';
            if (result) { if (i === q.answer) cls += ' correct'; else if (i === result.picked) cls += ' wrong'; }
            return <button key={i} className={cls} disabled={locked} onClick={() => submit(i)}>{t(o)}</button>;
          })}
        </div>
      ) : q.kind === 'matrix' ? (
        <div className="stack" style={{ gap: 8 }}>
          <span className="label">{t('ch.enterMatrix')}</span>
          <div className="matrix-wrap">
            <div className="bracket l" />
            <div className="matrix-grid" style={{ gridTemplateColumns: `repeat(${grid[0].length}, auto)` }}>
              {grid.map((row, i) => row.map((c, j) => (
                <div key={`${i}${j}`} className="mcell">
                  <input
                    value={c}
                    disabled={locked}
                    inputMode="decimal"
                    aria-label={`(${i + 1}, ${j + 1})`}
                    onChange={(e) => setGrid(grid.map((r, ri) => r.map((x, cj) => (ri === i && cj === j ? e.target.value : x))))}
                    onKeyDown={(e) => { if (e.key === 'Enter' && canSubmit) submit(); }}
                  />
                </div>
              )))}
            </div>
            <div className="bracket r" />
          </div>
        </div>
      ) : (
        <label className="field" style={{ maxWidth: 260 }}>
          <span>{t('ch.yourAnswer')}{q.kind === 'dims' ? ' (m × n)' : ''}</span>
          <input
            className="input"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem' }}
            value={value}
            disabled={locked}
            placeholder={q.kind === 'dims' ? '2 × 3' : t('ch.enterNumber')}
            inputMode={q.kind === 'number' ? 'decimal' : 'text'}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && canSubmit) submit(); }}
            autoFocus={autoFocus}
          />
        </label>
      )}

      {!result && (
        <div className="row" style={{ gap: 8 }}>
          {q.kind !== 'choice' && <button className="btn btn-primary" onClick={() => submit()} disabled={!canSubmit || locked}><Send size={15} /> {t('ch.submit')}</button>}
          <button className="btn btn-ghost" onClick={() => setShowHint(true)} disabled={showHint}><Lightbulb size={15} /> {t('common.hint')}</button>
        </div>
      )}
      {showHint && !result && <div className="callout warn"><Lightbulb size={18} /><div>{t(q.hint.key, q.hint.params)}</div></div>}

      {result && (
        <div className={`callout ${result.correct ? 'success' : 'error'} pop`} role="status">
          {result.correct ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          <div className="stack" style={{ gap: 4 }}>
            <strong>{result.timeout ? t('ch.timeUp') : result.correct ? t('common.correct') : t('common.incorrect')}</strong>
            <span>{t('e.generic', { a: answerText(q, t) })}</span>
            {q.work && <span className="mono small">{q.work}</span>}
            <span className="small muted">{t(q.hint.key, q.hint.params)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

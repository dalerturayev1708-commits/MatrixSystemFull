import { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import * as M from '../../math/index.js';
import MatrixEditor from '../matrix/MatrixEditor.jsx';
import MatrixGrid from '../matrix/MatrixGrid.jsx';
import { ResultMessages } from '../common/Messages.jsx';
import {
  ElementwiseVisualizer, MultiplyVisualizer, TransposeVisualizer, EliminationVisualizer, CofactorDetVisualizer,
} from '../visualization/OperationVisualizers.jsx';
import Plane from '../visualization/Plane.jsx';
import { NeuralNetDemo, GraphDemo, ImageDemo, EigenDemo } from './Demos.jsx';
import { formatNumber } from '../../utils/formatting.js';

function useLocal(initial) {
  const [m, setM] = useState(initial);
  return [m, setM];
}

function TypesDemo() {
  const { t } = useApp();
  const [kind, setKind] = useState('identity');
  const ex = {
    identity: M.identityMatrix(4),
    zero: M.zerosMatrix(3, 4),
    diagonal: M.diagonalMatrix([3, -1, 7, 2]),
    upper: [[2, 5, -1, 3], [0, 4, 2, 1], [0, 0, -3, 6], [0, 0, 0, 1]],
    lower: [[2, 0, 0, 0], [5, 4, 0, 0], [-1, 2, -3, 0], [3, 1, 6, 1]],
    symmetric: [[1, 7, 3], [7, 4, -5], [3, -5, 6]],
  };
  const A = ex[kind];
  const hl = (i, j) => {
    if (kind === 'symmetric') return i === j ? 'hl-pivot' : i < j ? 'hl-a' : 'hl-b';
    if (kind === 'upper') return j >= i ? 'hl-a' : '';
    if (kind === 'lower') return j <= i ? 'hl-a' : '';
    return i === j ? 'hl-a' : '';
  };
  return (
    <div className="stack">
      <div className="seg" role="group">
        {['identity', 'zero', 'diagonal', 'upper', 'lower', 'symmetric'].map((k) => (
          <button key={k} aria-pressed={kind === k} onClick={() => setKind(k)}>{t(`lab.prop.${k}`)}</button>
        ))}
      </div>
      <MatrixGrid matrix={A} compact highlight={hl} showIndices />
    </div>
  );
}

function IndexingDemo({ A }) {
  const { state } = useApp();
  const [sel, setSel] = useState([0, 1]);
  return (
    <div className="stack">
      <MatrixGrid matrix={A} name="A" showIndices onCellClick={(i, j) => setSel([i, j])} highlight={(i, j) => (i === sel[0] && j === sel[1] ? 'hl-pivot' : i === sel[0] ? 'hl-a' : j === sel[1] ? 'hl-b' : '')} />
      <div className="row">
        <span className="chip mono violet">a{sel[0] + 1}{sel[1] + 1} = {A[sel[0]][sel[1]]}</span>
        <span className="chip mono">A[{sel[0]}][{sel[1]}] {state.lang === 'uz' ? '(kodda, 0 dan)' : '(in code, 0-based)'}</span>
      </div>
    </div>
  );
}

function SystemDemo({ A0, b0 }) {
  const { state } = useApp();
  const [A, setA] = useState(A0);
  const [b, setB] = useState(b0);
  const res = M.solveLinearSystem(A, b);
  const lines = A.map((row, i) => ({ a: row[0], b: row[1], c: b[i] }));
  const s = (x, y) => [150 + x * 25, 150 - y * 25];
  const seg = ({ a, b: bb, c }) => {
    if (Math.abs(bb) > 1e-9) { const p1 = s(-6, (c - a * -6) / bb); const p2 = s(6, (c - a * 6) / bb); return [p1, p2]; }
    if (Math.abs(a) > 1e-9) { const x = c / a; return [s(x, -6), s(x, 6)]; }
    return null;
  };
  return (
    <div className="split">
      <svg viewBox="0 0 300 300" className="plane" role="img" aria-label="lines">
        <line x1="0" x2="300" y1="150" y2="150" stroke="var(--border-strong)" /><line y1="0" y2="300" x1="150" x2="150" stroke="var(--border-strong)" />
        {lines.map((l, i) => { const sg = seg(l); return sg && <line key={i} x1={sg[0][0]} y1={sg[0][1]} x2={sg[1][0]} y2={sg[1][1]} stroke={i ? 'var(--violet)' : 'var(--cyan)'} strokeWidth="2.5" />; })}
        {res.ok && res.type === 'unique' && <circle cx={s(res.result[0], res.result[1])[0]} cy={s(res.result[0], res.result[1])[1]} r="6" fill="var(--lime)" />}
      </svg>
      <div className="stack">
        {A.map((row, i) => (
          <div className="row mono" key={i} style={{ gap: 6 }}>
            <input className="input num" style={{ width: 56 }} type="number" value={row[0]} onChange={(e) => setA(A.map((r, k) => (k === i ? [+e.target.value, r[1]] : r)))} aria-label={`a${i}1`} /> x +
            <input className="input num" style={{ width: 56 }} type="number" value={row[1]} onChange={(e) => setA(A.map((r, k) => (k === i ? [r[0], +e.target.value] : r)))} aria-label={`a${i}2`} /> y =
            <input className="input num" style={{ width: 56 }} type="number" value={b[i]} onChange={(e) => setB(b.map((v, k) => (k === i ? +e.target.value : v)))} aria-label={`b${i}`} />
          </div>
        ))}
        <ResultMessages res={res} />
        {res.ok && res.result && <span className="chip mono lime" style={{ alignSelf: 'flex-start' }}>x = {formatNumber(res.result[0], state.prefs.decimals)}, y = {formatNumber(res.result[1], state.prefs.decimals)}</span>}
      </div>
    </div>
  );
}

function TransformDemo() {
  const { t } = useApp();
  const [angle, setAngle] = useState(90);
  const [scale, setScale] = useState(1);
  const a = (angle * Math.PI) / 180;
  const R = [[scale * Math.cos(a), -scale * Math.sin(a)], [scale * Math.sin(a), scale * Math.cos(a)]].map((r) => r.map((v) => Math.round(v * 1000) / 1000));
  return (
    <div className="split">
      <Plane M={R} polygons={[{ points: [[0, 0], [0.5, 0], [0.5, 1], [1.5, 1], [1.5, 1.5], [0.5, 1.5], [0.5, 2], [2, 2], [2, 2.5], [0, 2.5]] }]} label="transform" />
      <div className="stack">
        <label className="field"><span>{t('pg.angle')}: {angle}°</span><input type="range" className="range" min="-180" max="180" value={angle} onChange={(e) => setAngle(+e.target.value)} /></label>
        <label className="field"><span>{t('pg.factor')}: {scale}</span><input type="range" className="range" min="0.25" max="2" step="0.05" value={scale} onChange={(e) => setScale(+e.target.value)} /></label>
        <MatrixGrid matrix={R} name="M" compact />
        <span className="chip mono violet" style={{ alignSelf: 'flex-start' }}>det = {formatNumber(M.detValue(R), 3)}</span>
      </div>
    </div>
  );
}

export default function LessonDemo({ lesson }) {
  const { tm } = useApp();
  const d = lesson.demoData || {};
  const [A, setA] = useLocal(d.A || lesson.visual?.M || [[1, 2], [3, 4]]);
  const [B, setB] = useLocal(d.B || [[5, 6], [7, 8]]);
  const [k, setK] = useState(d.k ?? 2);

  const content = useMemo(() => {
    switch (lesson.demo) {
      case 'editor':
      case 'dims':
        return <MatrixEditor name="A" matrix={A} onChange={setA} />;
      case 'indexing':
        return <IndexingDemo A={lesson.visual.M} />;
      case 'types':
        return <TypesDemo />;
      case 'add': {
        const r = M.addMatrices(A, B);
        return (
          <div className="stack-lg">
            <div className="grid-2"><MatrixEditor name="A" matrix={A} onChange={setA} compactToolbar /><MatrixEditor name="B" matrix={B} onChange={setB} compactToolbar /></div>
            {r.ok ? <ElementwiseVisualizer A={A} B={B} result={r.result} steps={r.steps} op="add" resetKey={JSON.stringify([A, B])} /> : <ResultMessages res={r} />}
          </div>
        );
      }
      case 'scalar': {
        const r = M.scalarMultiply(A, k);
        return (
          <div className="stack-lg">
            <div className="row" style={{ alignItems: 'flex-start', gap: 20 }}>
              <label className="field"><span>k = {k}</span><input type="range" className="range" min="-4" max="4" step="0.5" value={k} onChange={(e) => setK(+e.target.value)} style={{ width: 160 }} /></label>
              <MatrixEditor name="A" matrix={A} onChange={setA} compactToolbar />
            </div>
            <ElementwiseVisualizer A={A} result={r.result} steps={r.steps} op="scalarMul" scalar={k} resetKey={JSON.stringify([A, k])} />
          </div>
        );
      }
      case 'multiply': {
        const r = M.multiplyMatrices(A, B);
        return (
          <div className="stack-lg">
            <div className="grid-2"><MatrixEditor name="A" matrix={A} onChange={setA} compactToolbar /><MatrixEditor name="B" matrix={B} onChange={setB} compactToolbar /></div>
            {r.ok ? <MultiplyVisualizer A={A} B={B} result={r.result} steps={r.steps} resetKey={JSON.stringify([A, B])} /> : <ResultMessages res={r} />}
          </div>
        );
      }
      case 'transpose': {
        const r = M.transposeMatrix(A);
        return (
          <div className="stack-lg">
            <MatrixEditor name="A" matrix={A} onChange={setA} compactToolbar />
            <TransposeVisualizer A={A} result={r.result} steps={r.steps} resetKey={JSON.stringify(A)} />
          </div>
        );
      }
      case 'det': {
        const r = M.determinant(A);
        return (
          <div className="stack-lg">
            <MatrixEditor name="A" matrix={A} onChange={setA} compactToolbar />
            <ResultMessages res={r} />
            {r.ok && <div className="kpi"><span className="k">det A</span><span className="v">{formatNumber(r.result)}</span></div>}
            {r.ok && r.method === 'cofactor' && A.length > 2 && <CofactorDetVisualizer A={A} steps={r.steps} resetKey={JSON.stringify(A)} />}
            {r.ok && r.method === 'elimination' && <EliminationVisualizer steps={r.steps} resetKey={JSON.stringify(A)} />}
            {r.ok && A.length === 2 && <div className="step-text">{tm(r.steps[0].text)}</div>}
          </div>
        );
      }
      case 'inverse': {
        const r = M.inverseMatrix(A);
        return (
          <div className="stack-lg">
            <MatrixEditor name="A" matrix={A} onChange={setA} compactToolbar />
            <ResultMessages res={r} />
            {r.ok && <div className="matrix-stage"><MatrixGrid matrix={r.result} name="A⁻¹" compact /><MatrixGrid matrix={r.verification} name="A·A⁻¹" compact /></div>}
            {r.steps?.length > 0 && <EliminationVisualizer steps={r.steps} augmentAt={A.length} resetKey={JSON.stringify(A)} />}
          </div>
        );
      }
      case 'rank': {
        const r = M.matrixRank(A);
        return (
          <div className="stack-lg">
            <MatrixEditor name="A" matrix={A} onChange={setA} compactToolbar />
            <ResultMessages res={r} />
            <EliminationVisualizer steps={r.steps} resetKey={JSON.stringify(A)} />
          </div>
        );
      }
      case 'system':
        return <SystemDemo A0={d.A} b0={d.b} />;
      case 'elimination': {
        const r = M.rref(A, { augmentedCols: 1 });
        return <EliminationVisualizer steps={r.steps} augmentAt={A[0].length - 1} resetKey="elim" />;
      }
      case 'eigen':
        return <EigenDemo initial={d.A} />;
      case 'transform':
        return <TransformDemo />;
      case 'nn':
        return <NeuralNetDemo />;
      case 'image':
        return <ImageDemo />;
      case 'graph':
        return <GraphDemo initial={lesson.visual.M} />;
      default:
        return null;
    }
  }, [lesson, A, B, k, setA, setB, tm, d]);

  return <div style={{ minWidth: 0 }}>{content}</div>;
}

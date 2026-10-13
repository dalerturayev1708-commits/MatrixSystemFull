/**
 * Interactive demonstrations shared by the AI & Graphics page and the Academy.
 * All numbers shown are computed live by the math engine.
 */
import { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import * as M from '../../math/index.js';
import { formatNumber, sub } from '../../utils/formatting.js';
import MatrixGrid from '../matrix/MatrixGrid.jsx';
import Plane, { apply } from '../visualization/Plane.jsx';
import { seededRandom } from '../../algorithms/pathfinding.js';

const f2 = (x) => formatNumber(x, 3);

function NumBox({ value, onChange, label, step = 0.1, width = 64 }) {
  return (
    <input
      className="input num"
      style={{ width }}
      type="number"
      step={step}
      value={value}
      aria-label={label}
      onChange={(e) => { const v = parseFloat(e.target.value); onChange(Number.isFinite(v) ? v : 0); }}
    />
  );
}

function MatrixInputs({ M: Mat, onChange, label, step }) {
  return (
    <div className="stack" style={{ gap: 4 }}>
      {label && <span className="label">{label}</span>}
      <div className="matrix-wrap">
        <div className="bracket l" />
        <div className="matrix-grid" style={{ gridTemplateColumns: `repeat(${Mat[0].length}, auto)` }}>
          {Mat.map((row, i) => row.map((v, j) => (
            <NumBox key={`${i}${j}`} value={v} step={step} label={`${label} ${i + 1},${j + 1}`} onChange={(x) => onChange(Mat.map((r, ri) => r.map((c, cj) => (ri === i && cj === j ? x : c))))} />
          )))}
        </div>
        <div className="bracket r" />
      </div>
    </div>
  );
}

/* ───────────── Neural network ───────────── */
export function NeuralNetDemo() {
  const { t } = useApp();
  const [x, setX] = useState([[1], [0.5]]);
  const [W1, setW1] = useState([[0.8, -0.5], [0.3, 0.9], [-0.6, 0.4]]);
  const [b1, setB1] = useState([[0.1], [-0.2], [0.05]]);
  const [W2, setW2] = useState([[1.2, -0.7, 0.5]]);
  const [b2, setB2] = useState([[0.1]]);
  const [act, setAct] = useState('relu');
  const fn = act === 'relu' ? (z) => Math.max(0, z) : (z) => 1 / (1 + Math.exp(-z));

  const z1 = M.addMatrices(M.multiplyMatrices(W1, x).result, b1).result;
  const h = z1.map((r) => [fn(r[0])]);
  const out = M.addMatrices(M.multiplyMatrices(W2, h).result, b2).result[0][0];

  const layers = [
    { xPos: 50, vals: x.map((r) => r[0]), n: 2, label: 'x' },
    { xPos: 210, vals: h.map((r) => r[0]), n: 3, label: 'h' },
    { xPos: 370, vals: [out], n: 1, label: 'y' },
  ];
  const y0 = (i, n) => (n === 1 ? 140 : n === 2 ? 90 + i * 100 : 40 + i * 100);
  return (
    <div className="stack-lg">
      <p className="small muted">{t('ai.nnExplain')}</p>
      <div className="split">
        <div className="stack">
          <div className="row" style={{ gap: 16, alignItems: 'flex-start' }}>
            <MatrixInputs M={x} onChange={setX} label={t('ai.inputs')} />
            <MatrixInputs M={W1} onChange={setW1} label={t('ai.weights1')} />
            <MatrixInputs M={b1} onChange={setB1} label={t('ai.bias1')} />
          </div>
          <div className="row" style={{ gap: 16, alignItems: 'flex-start' }}>
            <MatrixInputs M={W2} onChange={setW2} label={t('ai.weights2')} />
            <MatrixInputs M={b2} onChange={setB2} label={t('ai.bias2')} />
            <label className="field"><span>{t('ai.activation')}</span>
              <select className="select" value={act} onChange={(e) => setAct(e.target.value)}>
                <option value="relu">{t('ai.relu')}</option>
                <option value="sigmoid">{t('ai.sigmoid')}</option>
              </select>
            </label>
          </div>
        </div>
        <svg viewBox="0 0 420 280" className="plane" style={{ aspectRatio: '3 / 2' }} role="img" aria-label={t('ai.nn')}>
          {layers.slice(0, 2).map((L, li) => L.vals.map((_, i) => layers[li + 1].vals.map((__, j) => {
            const w = li === 0 ? W1[j][i] : W2[0][i];
            return (
              <line key={`${li}${i}${j}`} x1={L.xPos} y1={y0(i, L.n)} x2={layers[li + 1].xPos} y2={y0(j, layers[li + 1].n)}
                stroke={w >= 0 ? 'var(--cyan)' : 'var(--rose)'} strokeOpacity="0.7" strokeWidth={0.6 + Math.min(4, Math.abs(w) * 2.4)} />
            );
          })))}
          {layers.map((L) => L.vals.map((v, i) => (
            <g key={`${L.label}${i}`}>
              <circle cx={L.xPos} cy={y0(i, L.n)} r="22" fill="var(--surface-2)" stroke={L.label === 'y' ? 'var(--lime)' : 'var(--violet)'} strokeWidth="2" />
              <text x={L.xPos} y={y0(i, L.n) + 4} textAnchor="middle" fill="var(--text)" fontSize="11" fontFamily="var(--font-mono)">{f2(v)}</text>
              <text x={L.xPos} y={y0(i, L.n) - 28} textAnchor="middle" fill="var(--text-muted)" fontSize="10" fontFamily="var(--font-mono)">{L.label}{L.n > 1 ? sub(i + 1) : ''}</text>
            </g>
          )))}
        </svg>
      </div>
      <div className="formula" style={{ whiteSpace: 'normal' }}>
        {z1.map((r, j) => (
          <div key={j}>
            z{sub(j + 1)} = {W1[j].map((w, i) => `${f2(w)}·${f2(x[i][0])}`).join(' + ')} + {f2(b1[j][0])} = {f2(r[0])} → h{sub(j + 1)} = {act === 'relu' ? 'ReLU' : 'σ'}({f2(r[0])}) = {f2(h[j][0])}
          </div>
        ))}
        <div style={{ color: 'var(--lime)' }}>y = {W2[0].map((w, i) => `${f2(w)}·${f2(h[i][0])}`).join(' + ')} + {f2(b2[0][0])} = {f2(out)}</div>
      </div>
    </div>
  );
}

/* ───────────── Graph adjacency ───────────── */
export function GraphDemo({ initial }) {
  const { t } = useApp();
  const n0 = initial || [[0, 1, 1, 0, 0], [1, 0, 1, 1, 0], [1, 1, 0, 1, 0], [0, 1, 1, 0, 1], [0, 0, 0, 1, 0]];
  const [A, setA] = useState(n0);
  const [k, setK] = useState(2);
  const [sel, setSel] = useState([0, 3]);
  const n = A.length;
  const Ak = M.matrixPower(A, k).result;
  const pos = (i) => [150 + 105 * Math.cos((2 * Math.PI * i) / n - Math.PI / 2), 135 + 105 * Math.sin((2 * Math.PI * i) / n - Math.PI / 2)];
  const toggle = (i, j) => {
    if (i === j) return;
    setA(A.map((r, ri) => r.map((v, cj) => ((ri === i && cj === j) || (ri === j && cj === i) ? 1 - v : v))));
    setSel([i, j]);
  };
  return (
    <div className="stack-lg">
      <p className="small muted">{t('ai.graphExplain')}</p>
      <div className="grid-3" style={{ alignItems: 'start' }}>
        <svg viewBox="0 0 300 270" className="plane" style={{ aspectRatio: '10 / 9' }} role="img" aria-label={t('ai.graph')}>
          {A.map((row, i) => row.map((v, j) => (v && i < j ? (
            <line key={`${i}${j}`} x1={pos(i)[0]} y1={pos(i)[1]} x2={pos(j)[0]} y2={pos(j)[1]} stroke={(sel[0] === i && sel[1] === j) || (sel[0] === j && sel[1] === i) ? 'var(--amber)' : 'var(--border-strong)'} strokeWidth="2.5" />
          ) : null)))}
          {A.map((_, i) => (
            <g key={i}>
              <circle cx={pos(i)[0]} cy={pos(i)[1]} r="17" fill={sel.includes(i) ? 'var(--violet)' : 'var(--surface-2)'} stroke="var(--violet)" strokeWidth="2" />
              <text x={pos(i)[0]} y={pos(i)[1] + 5} textAnchor="middle" fill={sel.includes(i) ? '#fff' : 'var(--text)'} fontSize="13" fontWeight="700" fontFamily="var(--font-mono)">{i + 1}</text>
            </g>
          ))}
        </svg>
        <div className="stack">
          <span className="label">A ({t('ai.toggleEdge')})</span>
          <MatrixGrid matrix={A} compact showIndices onCellClick={toggle} highlight={(i, j) => (i === sel[0] && j === sel[1] ? 'hl-pivot' : A[i][j] ? 'hl-a' : '')} />
        </div>
        <div className="stack">
          <label className="field"><span>{t('ai.walks', { k })}</span>
            <input type="range" className="range" min="1" max="5" value={k} onChange={(e) => setK(+e.target.value)} />
          </label>
          <MatrixGrid matrix={Ak} name={`A${['', '', '²', '³', '⁴', '⁵'][k] || ''}`} compact showIndices onCellClick={(i, j) => setSel([i, j])} highlight={(i, j) => (i === sel[0] && j === sel[1] ? 'hl-out' : '')} />
          <span className="chip mono lime" style={{ alignSelf: 'flex-start' }}>(A{k > 1 ? `^${k}` : ''}){sub(sel[0] + 1)}{sub(sel[1] + 1)} = {Ak[sel[0]][sel[1]]}</span>
        </div>
      </div>
    </div>
  );
}

/* ───────────── Linear regression ───────────── */
export function RegressionDemo() {
  const { t } = useApp();
  const xs = [0, 1, 2, 3, 4, 5];
  const [ys, setYs] = useState([1.2, 1.9, 3.2, 3.8, 5.1, 5.7]);
  const X = xs.map((x) => [1, x]);
  const ls = M.leastSquares(X, ys);
  const [c, m] = ls.ok ? ls.result : [0, 0];
  const sx = (x) => 30 + x * 50;
  const sy = (y) => 230 - y * 30;
  return (
    <div className="stack-lg">
      <p className="small muted">{t('ai.regExplain')}</p>
      <div className="split">
        <svg viewBox="0 0 300 250" className="plane" style={{ aspectRatio: '6 / 5' }} role="img" aria-label={t('ai.regression')}>
          {[0, 2, 4, 6].map((y) => <g key={y}><line x1="30" x2="290" y1={sy(y)} y2={sy(y)} stroke="var(--border)" /><text x="8" y={sy(y) + 4} fontSize="10" fill="var(--text-faint)" fontFamily="var(--font-mono)">{y}</text></g>)}
          {xs.map((x) => <text key={x} x={sx(x)} y="246" fontSize="10" textAnchor="middle" fill="var(--text-faint)" fontFamily="var(--font-mono)">{x}</text>)}
          <line x1={sx(0)} y1={sy(c)} x2={sx(5.2)} y2={sy(c + m * 5.2)} stroke="var(--lime)" strokeWidth="2.5" />
          {xs.map((x, i) => (
            <g key={i}>
              <line x1={sx(x)} x2={sx(x)} y1={sy(ys[i])} y2={sy(c + m * x)} stroke="var(--rose)" strokeDasharray="3 3" />
              <circle cx={sx(x)} cy={sy(ys[i])} r="5" fill="var(--cyan)" />
            </g>
          ))}
        </svg>
        <div className="stack">
          {ys.map((y, i) => (
            <label key={i} className="row small" style={{ gap: 8 }}>
              <span className="mono" style={{ width: 54 }}>x={xs[i]}</span>
              <input type="range" className="range" min="0" max="7" step="0.1" value={y} onChange={(e) => setYs(ys.map((v, k) => (k === i ? +e.target.value : v)))} aria-label={`y${i}`} />
              <span className="mono" style={{ width: 34 }}>{y.toFixed(1)}</span>
            </label>
          ))}
          <div className="row">
            <span className="chip mono lime">{t('ai.slope')} = {f2(m)}</span>
            <span className="chip mono cyan">{t('ai.intercept')} = {f2(c)}</span>
            {ls.ok && <span className="chip mono">‖r‖ = {f2(ls.residualNorm)}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────── 3D graphics ───────────── */
export function Graphics3D() {
  const { t } = useApp();
  const [ax, setAx] = useState(25);
  const [ay, setAy] = useState(35);
  const rad = (d) => (d * Math.PI) / 180;
  const Rx = [[1, 0, 0], [0, Math.cos(rad(ax)), -Math.sin(rad(ax))], [0, Math.sin(rad(ax)), Math.cos(rad(ax))]];
  const Ry = [[Math.cos(rad(ay)), 0, Math.sin(rad(ay))], [0, 1, 0], [-Math.sin(rad(ay)), 0, Math.cos(rad(ay))]];
  const R = M.multiplyMatrices(Ry, Rx).result;
  const verts = [];
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) verts.push([x, y, z]);
  const edges = [];
  verts.forEach((a, i) => verts.forEach((b, j) => { if (i < j && a.filter((v, k) => v !== b[k]).length === 1) edges.push([i, j]); }));
  const proj = verts.map((v) => {
    const [x, y, z] = M.matVec(R, v);
    const s = 260 / (z + 5);
    return [150 + x * s, 130 - y * s, z];
  });
  return (
    <div className="stack-lg">
      <p className="small muted">{t('ai.g3dExplain')}</p>
      <div className="split">
        <svg viewBox="0 0 300 260" className="plane" style={{ aspectRatio: '15 / 13' }} role="img" aria-label={t('ai.g3d')}>
          {edges.map(([i, j], k) => <line key={k} x1={proj[i][0]} y1={proj[i][1]} x2={proj[j][0]} y2={proj[j][1]} stroke={(proj[i][2] + proj[j][2]) / 2 > 0 ? 'var(--text-faint)' : 'var(--cyan)'} strokeWidth="2" />)}
          {proj.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="4" fill="var(--violet)" />)}
        </svg>
        <div className="stack">
          <label className="field"><span>{t('ai.rotX')}: {ax}°</span><input type="range" className="range" min="-180" max="180" value={ax} onChange={(e) => setAx(+e.target.value)} /></label>
          <label className="field"><span>{t('ai.rotY')}: {ay}°</span><input type="range" className="range" min="-180" max="180" value={ay} onChange={(e) => setAy(+e.target.value)} /></label>
          <MatrixGrid matrix={R.map((r) => r.map((v) => Math.round(v * 1000) / 1000))} name="R = R_y·R_x" compact />
          <span className="xs muted">det R = {f2(M.detValue(R))}</span>
        </div>
      </div>
    </div>
  );
}

/* ───────────── PCA ───────────── */
export function PCADemo() {
  const { t } = useApp();
  const [angle, setAngle] = useState(30);
  const [spread, setSpread] = useState(3);
  const pts = useMemo(() => {
    const rng = seededRandom(7);
    const a = (angle * Math.PI) / 180;
    return Array.from({ length: 40 }, () => {
      const g = () => (rng() + rng() + rng() - 1.5);
      const u = g() * spread;
      const v = g() * 0.8;
      return [u * Math.cos(a) - v * Math.sin(a), u * Math.sin(a) + v * Math.cos(a)];
    });
  }, [angle, spread]);
  const mean = [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];
  const Xc = pts.map((p) => [p[0] - mean[0], p[1] - mean[1]]);
  const C = M.scalarMultiply(M.multiplyMatrices(M.transposeMatrix(Xc).result, Xc).result, 1 / (pts.length - 1)).result;
  const e = M.eigen(C);
  const comps = e.ok ? e.result.flatMap((g) => g.vectors.map((v) => ({ v, l: g.value }))) : [];
  const s = (p) => [150 + p[0] * 22, 125 - p[1] * 22];
  return (
    <div className="stack-lg">
      <p className="small muted">{t('ai.pcaExplain')}</p>
      <div className="split">
        <svg viewBox="0 0 300 250" className="plane" style={{ aspectRatio: '6 / 5' }} role="img" aria-label={t('ai.pca')}>
          <line x1="0" x2="300" y1="125" y2="125" stroke="var(--border)" /><line y1="0" y2="250" x1="150" x2="150" stroke="var(--border)" />
          {pts.map((p, i) => <circle key={i} cx={s(p)[0]} cy={s(p)[1]} r="3" fill="var(--cyan)" opacity="0.8" />)}
          {comps.map(({ v, l }, i) => {
            const n = Math.hypot(v[0], v[1]) || 1;
            const len = 2 * Math.sqrt(Math.max(l, 0));
            const a = s([mean[0] - (v[0] / n) * len, mean[1] - (v[1] / n) * len]);
            const b = s([mean[0] + (v[0] / n) * len, mean[1] + (v[1] / n) * len]);
            return <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={i === 0 ? 'var(--lime)' : 'var(--violet)'} strokeWidth="3" strokeLinecap="round" />;
          })}
        </svg>
        <div className="stack">
          <label className="field"><span>{t('pg.angle')}: {angle}°</span><input type="range" className="range" min="-90" max="90" value={angle} onChange={(ev) => setAngle(+ev.target.value)} /></label>
          <label className="field"><span>{t('pg.factor')}: {spread}</span><input type="range" className="range" min="0.5" max="5" step="0.1" value={spread} onChange={(ev) => setSpread(+ev.target.value)} /></label>
          <MatrixGrid matrix={C.map((r) => r.map((v) => Math.round(v * 1000) / 1000))} name="Cov" compact />
          <div className="row">{comps.map(({ l }, i) => <span key={i} className={`chip mono ${i === 0 ? 'lime' : 'violet'}`}>λ{sub(i + 1)} = {f2(l)}</span>)}</div>
        </div>
      </div>
    </div>
  );
}

/* ───────────── Image as matrix ───────────── */
const IMG = M.createMatrix(8, 8, (i, j) => Math.min(255, Math.round(((i + j) / 14) * 200 + ((i - 3.5) ** 2 + (j - 3.5) ** 2 < 6 ? 55 : 0))));
export function ImageDemo() {
  const { state } = useApp();
  const [op, setOp] = useState('original');
  const uz = state.lang === 'uz';
  const ops = {
    original: [uz ? 'Asl' : 'Original', IMG, 'A'],
    brighten: [uz ? 'Yoritish +60' : 'Brighten +60', IMG.map((r) => r.map((v) => Math.min(255, v + 60))), 'min(255, A + 60)'],
    invert: [uz ? 'Invertlash' : 'Invert', IMG.map((r) => r.map((v) => 255 - v)), '255 − A'],
    transpose: [uz ? 'Transponirlash' : 'Transpose', M.transposeMatrix(IMG).result, 'Aᵀ'],
    contrast: [uz ? 'Kontrast ×1.5' : 'Contrast ×1.5', IMG.map((r) => r.map((v) => Math.max(0, Math.min(255, Math.round((v - 128) * 1.5 + 128))))), 'clamp(1.5(A − 128) + 128)'],
  };
  const [, img, formula] = ops[op];
  return (
    <div className="stack-lg">
      <div className="seg" role="group">
        {Object.entries(ops).map(([k, [label]]) => <button key={k} aria-pressed={op === k} onClick={() => setOp(k)}>{label}</button>)}
      </div>
      <div className="row" style={{ gap: 20, alignItems: 'flex-start' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 22px)', gap: 1, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }} role="img" aria-label={formula}>
          {img.flat().map((v, i) => <div key={i} style={{ width: 22, height: 22, background: `rgb(${v},${v},${v})` }} />)}
        </div>
        <div className="stack" style={{ gap: 6, minWidth: 0 }}>
          <span className="chip mono violet" style={{ alignSelf: 'flex-start' }}>{formula}</span>
          <MatrixGrid matrix={img} compact />
        </div>
      </div>
    </div>
  );
}

/* ───────────── Eigen demo (2×2) ───────────── */
export function EigenDemo({ initial = [[4, 1], [2, 3]] }) {
  const { t, tm } = useApp();
  const [A, setA] = useState(initial);
  const e = M.eigen(A);
  const vectors = [];
  if (e.ok && e.real) {
    e.result.forEach((g, gi) => g.vectors.forEach((v) => {
      const n = Math.hypot(v[0], v[1]) || 1;
      const u = [v[0] / n, v[1] / n];
      vectors.push({ p: u, label: `v${sub(gi + 1)}`, color: gi ? 'var(--violet)' : 'var(--cyan)' });
      vectors.push({ p: apply(A, u), label: `Av${sub(gi + 1)}`, color: 'var(--amber)' });
    }));
  }
  return (
    <div className="split">
      <Plane M={[[1, 0], [0, 1]]} showBasis={false} showSquare={false} vectors={vectors} label="eigen" />
      <div className="stack">
        <MatrixInputs M={A} onChange={setA} label="A" step={0.5} />
        {e.ok ? (
          <>
            <p className="small">{tm(e.explanation)}</p>
            {e.real ? e.result.map((g, i) => <span key={i} className="chip mono cyan" style={{ alignSelf: 'flex-start' }}>λ{sub(i + 1)} = {f2(g.value)}, v = ({g.vectors[0]?.map(f2).join(', ')})</span>)
              : <span className="chip violet mono">{t('ops.complex')}: {e.complex.map((c) => `${f2(c.re)} ± ${f2(Math.abs(c.im))}i`)[0]}</span>}
          </>
        ) : <p className="small" style={{ color: 'var(--rose)' }}>{tm(e.error)}</p>}
        <p className="xs muted">Av = λv: {state2text(t)}</p>
      </div>
    </div>
  );
}
const state2text = (t) => t('ops.eigSupported');

export { MatrixInputs, NumBox };

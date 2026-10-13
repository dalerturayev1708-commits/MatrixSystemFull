import { useEffect, useRef, useState } from 'react';
import { Play, ArrowLeftRight } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import Plane, { apply } from '../components/visualization/Plane.jsx';
import MatrixGrid from '../components/matrix/MatrixGrid.jsx';
import { Callout } from '../components/common/Messages.jsx';
import { useApp } from '../context/AppContext.jsx';
import { multiplyMatrices } from '../math/index.js';
import { formatNumber, parseNumber } from '../utils/formatting.js';

const I2 = [[1, 0], [0, 1]];
const det2 = (M) => M[0][0] * M[1][1] - M[0][1] * M[1][0];
const r3 = (x) => Math.round(x * 1000) / 1000;

export function presetMatrix(kind, { angle = 45, factor = 2 } = {}) {
  const a = (angle * Math.PI) / 180;
  switch (kind) {
    case 'scale': return [[factor, 0], [0, factor]];
    case 'rotate': return [[r3(Math.cos(a)), r3(-Math.sin(a))], [r3(Math.sin(a)), r3(Math.cos(a))]];
    case 'reflectX': return [[1, 0], [0, -1]];
    case 'reflectY': return [[-1, 0], [0, 1]];
    case 'shear': return [[1, factor / 2], [0, 1]];
    case 'collapse': return [[1, 2], [0.5, 1]];
    default: return I2;
  }
}

// Original pixel-art: a small rocket, 9×11, drawn in grid units centred at the origin.
const ROCKET = [
  '....c....',
  '...ccc...',
  '...cwc...',
  '..ccccc..',
  '..cwwwc..',
  '..ccccc..',
  '..ccccc..',
  '.vccccc v'.replace(' ', '.'),
  'vv.c.c.vv',
  'v..a.a..v',
  '...a.a...',
];
const PALETTE = { c: 'var(--cyan)', w: 'var(--text)', v: 'var(--violet)', a: 'var(--amber)' };
function rocketPixels() {
  const s = 0.42;
  const px = [];
  ROCKET.forEach((row, r) => [...row].forEach((ch, c) => {
    if (PALETTE[ch]) px.push({ x: (c - 4.5) * s, y: (5.5 - r) * s - s, s, color: PALETTE[ch] });
  }));
  return px;
}
const PIXELS = rocketPixels();
const F_SHAPE = [{ points: [[0, 0], [0.5, 0], [0.5, 1], [1.5, 1], [1.5, 1.5], [0.5, 1.5], [0.5, 2], [2, 2], [2, 2.5], [0, 2.5]] }];

function Mat2Input({ M, onChange, label }) {
  const [drafts, setDrafts] = useState(M.flat().map(String));
  useEffect(() => { setDrafts(M.flat().map((v) => String(r3(v)))); }, [M]);
  return (
    <div className="stack" style={{ gap: 6 }}>
      {label && <span className="label">{label}</span>}
      <div className="matrix-wrap">
        <div className="bracket l" />
        <div className="mat2">
          {drafts.map((v, k) => (
            <input
              key={k}
              className={`input ${Number.isFinite(parseNumber(v)) ? '' : 'invalid'}`}
              value={v}
              inputMode="decimal"
              aria-label={`${label || 'M'} ${['a', 'b', 'c', 'd'][k]}`}
              onChange={(e) => {
                const next = drafts.slice();
                next[k] = e.target.value;
                setDrafts(next);
                const nums = next.map(parseNumber);
                if (nums.every(Number.isFinite)) onChange([[nums[0], nums[1]], [nums[2], nums[3]]]);
              }}
            />
          ))}
        </div>
        <div className="bracket r" />
      </div>
    </div>
  );
}

function useAnimatedMatrix(target, reduced) {
  const [shown, setShown] = useState(target);
  const raf = useRef(0);
  const animate = () => {
    cancelAnimationFrame(raf.current);
    if (reduced) { setShown(target); return; }
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / 1100);
      const e = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2;
      setShown(target.map((row, i) => row.map((v, j) => I2[i][j] + (v - I2[i][j]) * e)));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };
  useEffect(() => { setShown(target); return () => cancelAnimationFrame(raf.current); }, [target]);
  return [shown, animate];
}

function DetExplain({ M }) {
  const { t } = useApp();
  const d = det2(M);
  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="row">
        <span className="chip mono violet">{t('pg.det', { v: r3(d) })}</span>
        <span className="chip mono">î → ({r3(M[0][0])}, {r3(M[1][0])})</span>
        <span className="chip mono">ĵ → ({r3(M[0][1])}, {r3(M[1][1])})</span>
      </div>
      {Math.abs(d) < 1e-9 ? <Callout type="warn">{t('pg.detZero')}</Callout> : <Callout type="info">{t('pg.detArea', { v: r3(Math.abs(d)) })} {d < 0 ? t('pg.detNeg') : ''}</Callout>}
      <p className="small muted">{t('pg.basis', { a: r3(M[0][0]), b: r3(M[0][1]), c: r3(M[1][0]), d: r3(M[1][1]) })}</p>
    </div>
  );
}

export default function VisualPlayground() {
  const { t, reducedMotion, bump, state } = useApp();
  const [mode, setMode] = useState('grid');
  const [M, setM] = useState([[1, 1], [0, 1]]);
  const [angle, setAngle] = useState(45);
  const [factor, setFactor] = useState(2);
  const [preset, setPreset] = useState('shear');
  const [v, setV] = useState([2, 1]);
  const [M1, setM1] = useState(presetMatrix('rotate', { angle: 90 }));
  const [M2, setM2] = useState([[1, 0], [0, -1]]);
  const [showGrid, setShowGrid] = useState(true);
  const [shown, animate] = useAnimatedMatrix(M, reducedMotion);
  const counted = useRef(false);

  const change = (next) => {
    setM(next);
    if (!counted.current) { counted.current = true; bump('playgroundUses'); }
  };
  const choosePreset = (k, opts = {}) => { setPreset(k); change(presetMatrix(k, { angle, factor, ...opts })); };

  const Av = apply(M, v);
  const P21 = multiplyMatrices(M2, M1).result;
  const P12 = multiplyMatrices(M1, M2).result;
  const d = state.prefs.decimals;

  const controls = (
    <div className="stack-lg">
      <div className="stack" style={{ gap: 8 }}>
        <span className="label">{t('pg.presets')}</span>
        <div className="seg" role="group" aria-label={t('pg.presets')}>
          {['identity', 'scale', 'rotate', 'reflectX', 'reflectY', 'shear', 'collapse'].map((k) => (
            <button key={k} aria-pressed={preset === k} onClick={() => choosePreset(k)}>{t(`pg.p.${k}`)}</button>
          ))}
        </div>
        {preset === 'rotate' && (
          <label className="field"><span>{t('pg.angle')}: {angle}°</span>
            <input type="range" className="range" min="-180" max="180" value={angle} onChange={(e) => { setAngle(+e.target.value); change(presetMatrix('rotate', { angle: +e.target.value })); }} />
          </label>
        )}
        {(preset === 'scale' || preset === 'shear') && (
          <label className="field"><span>{t('pg.factor')}: {factor}</span>
            <input type="range" className="range" min="-3" max="3" step="0.1" value={factor} onChange={(e) => { setFactor(+e.target.value); change(presetMatrix(preset, { factor: +e.target.value })); }} />
          </label>
        )}
      </div>
      <div className="row" style={{ gap: 16, alignItems: 'flex-end' }}>
        <Mat2Input M={M} onChange={(m) => { setPreset(null); change(m); }} label="A" />
        <button className="btn" onClick={animate}><Play size={15} /> {t('pg.animate')}</button>
        <label className="check"><input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} /> {t('pg.showGrid')}</label>
      </div>
    </div>
  );

  return (
    <div className="page">
      <PageHeader eyebrow="05 · PLAYGROUND" title={t('pg.title')} subtitle={t('pg.subtitle')} />
      <div className="seg" role="tablist" style={{ alignSelf: 'flex-start' }}>
        {['grid', 'image', 'custom'].map((k) => <button key={k} role="tab" aria-selected={mode === k} onClick={() => setMode(k)}>{t(`pg.${k}`)}</button>)}
      </div>

      {mode === 'grid' && (
        <div className="split">
          <section className="panel">
            <div className="plane-wrap">
              <div><div className="plane-label">{t('pg.original')}</div><Plane M={I2} showGrid={showGrid} vectors={[{ p: v, label: 'v', color: 'var(--amber)' }]} label={t('pg.original')} /></div>
              <div><div className="plane-label">{t('pg.transformed')}</div><Plane M={shown} showGrid={showGrid} vectors={[{ p: apply(shown, v), label: 'Av', color: 'var(--amber)' }]} label={t('pg.transformed')} /></div>
            </div>
          </section>
          <section className="panel stack-lg">
            {controls}
            <div className="row" style={{ gap: 10, alignItems: 'flex-end' }}>
              <label className="field"><span>{t('pg.vector')} x</span><input className="input num" type="number" value={v[0]} onChange={(e) => setV([+e.target.value, v[1]])} /></label>
              <label className="field"><span>y</span><input className="input num" type="number" value={v[1]} onChange={(e) => setV([v[0], +e.target.value])} /></label>
              <span className="chip mono amber">A·v = ({formatNumber(Av[0], d)}, {formatNumber(Av[1], d)})</span>
            </div>
            <DetExplain M={M} />
          </section>
        </div>
      )}

      {mode === 'image' && (
        <div className="split">
          <section className="panel">
            <div className="plane-wrap">
              <div><div className="plane-label">{t('pg.original')}</div><Plane M={I2} pixels={PIXELS} showSquare={false} showGrid={showGrid} label={t('pg.original')} /></div>
              <div><div className="plane-label">{t('pg.transformed')}</div><Plane M={shown} pixels={PIXELS} showSquare={false} showGrid={showGrid} label={t('pg.transformed')} /></div>
            </div>
          </section>
          <section className="panel stack-lg">
            {controls}
            <Callout type="info">{t('pg.imageExplain')}</Callout>
            <DetExplain M={M} />
          </section>
        </div>
      )}

      {mode === 'custom' && (
        <div className="stack-lg">
          <section className="panel">
            <div className="row" style={{ gap: 24, alignItems: 'flex-end' }}>
              <Mat2Input M={M1} onChange={(m) => { setM1(m); bump('playgroundUses'); }} label={t('pg.m1')} />
              <Mat2Input M={M2} onChange={setM2} label={t('pg.m2')} />
              <button className="btn" onClick={() => { setM1(M2); setM2(M1); }}><ArrowLeftRight size={15} /> {t('pg.swap')}</button>
            </div>
            <p className="small muted" style={{ marginTop: 12 }}>{t('pg.customExplain')}</p>
          </section>
          <div className="grid-3">
            <section className="panel"><div className="plane-label">{t('pg.m1')}</div><Plane M={M1} polygons={F_SHAPE} showSquare={false} label="M1" /></section>
            <section className="panel">
              <div className="plane-label">M₂·M₁</div>
              <Plane M={P21} polygons={F_SHAPE} showSquare={false} label="M2 M1" />
              <div style={{ marginTop: 10 }}><MatrixGrid matrix={P21} name="M₂M₁" compact /></div>
            </section>
            <section className="panel">
              <div className="plane-label">M₁·M₂</div>
              <Plane M={P12} polygons={F_SHAPE.map((p) => ({ ...p, fill: 'var(--amber-soft)', stroke: 'var(--amber)' }))} showSquare={false} label="M1 M2" />
              <div style={{ marginTop: 10 }}><MatrixGrid matrix={P12} name="M₁M₂" compact /></div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

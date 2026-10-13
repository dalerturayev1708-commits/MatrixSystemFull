import { useMemo, useState, useCallback } from 'react';
import { Play, Shuffle, Eraser, Dices, Trash2, Grid3x3 } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import AlgorithmCanvas from '../components/visualization/AlgorithmCanvas.jsx';
import PlaybackControls from '../components/common/PlaybackControls.jsx';
import { Callout } from '../components/common/Messages.jsx';
import { useApp } from '../context/AppContext.jsx';
import { usePlayback } from '../hooks/usePlayback.js';
import { bfs } from '../algorithms/bfs.js';
import { dfs } from '../algorithms/dfs.js';
import { dijkstra } from '../algorithms/dijkstra.js';
import { floodFill } from '../algorithms/floodFill.js';
import { SORTERS } from '../algorithms/sorting.js';
import { linearSearch, binarySearch } from '../algorithms/search.js';
import { createGrid, key, randomWalls } from '../algorithms/pathfinding.js';

const ROWS = 13;
const COLS = 21;
const cellName = ([r, c]) => `(${r + 1},${c + 1})`;

function PathfindingLab({ algo }) {
  const { t, tm, bump, state } = useApp();
  const [walls, setWalls] = useState(() => {
    const g = createGrid(ROWS, COLS);
    for (let r = 2; r < 11; r++) g[r][7] = 1;
    for (let r = 0; r < 9; r++) g[r][13] = 1;
    return g;
  });
  const [weights, setWeights] = useState(() => createGrid(ROWS, COLS, 1).map((row, r) => row.map((_, c) => (c >= 9 && c <= 11 && r >= 3 && r <= 9 ? 9 : 1))));
  const [start, setStart] = useState([6, 2]);
  const [target, setTarget] = useState([6, 18]);
  const [tool, setTool] = useState('wall');
  const [paintValue, setPaintValue] = useState(1);
  const [run, setRun] = useState(null);
  const [showMatrix, setShowMatrix] = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const [compare, setCompare] = useState(null);

  const execute = (which = algo) => {
    if (which === 'bfs') return bfs(walls, start, target);
    if (which === 'dfs') return dfs(walls, start, target);
    return dijkstra(walls, weights, start, target);
  };

  const doRun = () => {
    const r = execute();
    setRun({ ...r, algo, id: Date.now() });
    setCompare(null);
    bump('algoRuns');
  };

  const total = run?.ok ? run.steps.length : 0;
  const pb = usePlayback(total + (run?.found ? 1 : 0), { resetKey: run?.id, autoPlay: true, baseMs: 220, initialSpeed: state.prefs.animSpeed });

  const view = useMemo(() => {
    if (!run?.ok) return null;
    const idx = Math.min(pb.index, run.steps.length - 1);
    const visited = new Set(run.visitedOrder.slice(0, idx + 1).map(key));
    const step = run.steps[idx];
    const frontierCells = (step.queue || step.stack || step.pq?.map((p) => p.cell) || []);
    const showPath = run.found && pb.index >= run.steps.length;
    const order = new Map(run.visitedOrder.slice(0, idx + 1).map((c, i) => [key(c), i + 1]));
    return {
      visited,
      frontier: new Set(frontierCells.map(key)),
      path: new Set(showPath ? run.path.map(key) : []),
      current: showPath ? null : key(step.current),
      order,
      step,
      idx,
      showPath,
    };
  }, [run, pb.index]);

  const clearRun = () => { setRun(null); setCompare(null); };

  const onPaint = useCallback(([r, c], phase) => {
    if (run) clearRun();
    const isEnd = (p) => p[0] === r && p[1] === c;
    if (tool === 'start') { if (walls[r][c] !== 1 && !isEnd(target)) setStart([r, c]); return; }
    if (tool === 'target') { if (walls[r][c] !== 1 && !isEnd(start)) setTarget([r, c]); return; }
    if (isEnd(start) || isEnd(target)) return;
    if (tool === 'weight') {
      if (phase !== 'down') return;
      setWeights((w) => w.map((row, i) => row.map((v, j) => (i === r && j === c ? (v === 1 ? 5 : v === 5 ? 9 : 1) : v))));
      return;
    }
    let value = tool === 'erase' ? 0 : 1;
    if (tool === 'wall' && phase === 'down') { value = walls[r][c] === 1 ? 0 : 1; setPaintValue(value); }
    else if (tool === 'wall') value = paintValue;
    setWalls((g) => (g[r][c] === value ? g : g.map((row, i) => (i === r ? row.map((v, j) => (j === c ? value : v)) : row))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool, start, target, walls, paintValue, run]);

  const why = () => {
    if (!view) return '';
    if (view.showPath) {
      const d = algo === 'dijkstra' ? run.totalCost : run.pathLength;
      return t(algo === 'bfs' ? 'alg.why.bfsFound' : algo === 'dfs' ? 'alg.why.dfsFound' : 'alg.why.dijFound', { d });
    }
    const s = view.step;
    const added = s.added?.length ? s.added.map((a) => cellName(a.cell)).join(', ') : t('alg.none');
    if (algo === 'bfs') return s.reason === 'found' ? t('alg.why.bfsFound', { d: s.distance }) : t('alg.why.bfs', { cell: cellName(s.current), d: s.distance, added });
    if (algo === 'dfs') return s.reason === 'found' ? t('alg.why.dfsFound') : s.reason === 'deadEnd' ? t('alg.why.dfsDead', { cell: cellName(s.current) }) : t('alg.why.dfs', { cell: cellName(s.current), added });
    const updates = s.updates?.length ? s.updates.map((u) => `${cellName(u.cell)} ${u.old === Infinity ? '∞' : u.old}→${u.next}`).join(', ') : t('alg.none');
    return s.reason === 'found' ? t('alg.why.dijFound', { d: s.distance }) : t('alg.why.dij', { cell: cellName(s.current), d: s.distance, updates });
  };

  const runCompare = () => {
    const a = bfs(walls, start, target);
    const b = dfs(walls, start, target);
    setCompare({ bfs: a, dfs: b });
  };

  const frontierList = () => {
    if (!view) return [];
    const s = view.step;
    if (algo === 'dijkstra') return (s.pq || []).map((p) => `${cellName(p.cell)}:${p.d}`);
    return (s.queue || s.stack || []).slice(algo === 'dfs' ? -12 : 0, algo === 'dfs' ? undefined : 12).map(cellName);
  };
  const fl = frontierList();

  return (
    <div className="split split-wide">
      <section className="panel stack">
        <div className="row-between">
          <div className="seg" role="group" aria-label={t('alg.tool')}>
            {['wall', 'erase', 'start', 'target', ...(algo === 'dijkstra' ? ['weight'] : [])].map((k) => (
              <button key={k} aria-pressed={tool === k} onClick={() => setTool(k)}>{t(`alg.tool.${k}`)}</button>
            ))}
          </div>
          <div className="row" style={{ gap: 4 }}>
            <button className="btn btn-sm" onClick={() => { clearRun(); setWalls(randomWalls(ROWS, COLS, 0.28, Math.random, [start, target])); }}><Dices size={14} /> {t('alg.randomMaze')}</button>
            <button className="btn btn-sm" onClick={() => { clearRun(); setWalls(createGrid(ROWS, COLS)); setWeights(createGrid(ROWS, COLS, 1)); }}><Trash2 size={14} /> {t('alg.clearWalls')}</button>
          </div>
        </div>
        <AlgorithmCanvas walls={walls} weights={algo === 'dijkstra' ? weights : null} start={start} target={target} view={view} onPaint={onPaint} showMatrix={showMatrix} showOrder={showOrder} ariaLabel={t(`alg.${algo}`)} />
        <div className="legend">
          <span><i style={{ background: 'var(--cyan)' }} />S</span>
          <span><i style={{ background: 'var(--rose)' }} />T</span>
          <span><i style={{ background: 'color-mix(in srgb, var(--violet) 32%, var(--surface-2))' }} />{t('alg.legend.visited')}</span>
          <span><i style={{ background: 'color-mix(in srgb, var(--cyan) 22%, var(--surface-2))' }} />{t('alg.legend.frontier')}</span>
          <span><i style={{ background: 'var(--amber)' }} />{t('alg.legend.current')}</span>
          <span><i style={{ background: 'var(--lime)' }} />{t('alg.legend.path')}</span>
        </div>
        <div className="row" style={{ gap: 14 }}>
          <label className="check"><input type="checkbox" checked={showMatrix} onChange={(e) => setShowMatrix(e.target.checked)} /> <Grid3x3 size={14} /> {t('alg.showMatrix')}</label>
          <label className="check"><input type="checkbox" checked={showOrder} onChange={(e) => setShowOrder(e.target.checked)} /> #</label>
        </div>
        {showMatrix && <p className="xs muted">{t('alg.matrixView')}</p>}
        {algo === 'dijkstra' && <p className="xs muted">{t('alg.weightHint')}</p>}
      </section>

      <section className="panel stack-lg">
        <div className="row-between">
          <h3>{t(`alg.${algo}`)}</h3>
          <div className="row" style={{ gap: 6 }}>
            {run && <button className="btn btn-sm" onClick={clearRun}><Eraser size={14} /> {t('alg.clearRun')}</button>}
            <button className="btn btn-primary" onClick={doRun}><Play size={15} /> {t('alg.run')}</button>
          </div>
        </div>
        <Callout type="info">{t(`alg.${algo === 'dijkstra' ? 'dij' : algo}Note`)}</Callout>
        {run && !run.ok && <Callout type="error">{tm(run.error)}</Callout>}
        {run?.ok && (
          <>
            <PlaybackControls pb={pb} />
            <div className="step-text" aria-live="polite" style={{ fontFamily: 'var(--font-body)' }}>{why()}</div>
            <div className="grid-2" style={{ gap: 10 }}>
              <div className="kpi"><span className="k">{t('alg.visited')}</span><span className="v">{view?.visited.size ?? 0}</span></div>
              <div className="kpi">
                <span className="k">{algo === 'dijkstra' ? t('alg.cost') : t('alg.pathLen')}</span>
                <span className="v">{view?.showPath ? (algo === 'dijkstra' ? run.totalCost : run.pathLength) : '—'}</span>
              </div>
            </div>
            {!run.found && pb.index >= run.steps.length - 1 && <Callout type="warn">{t('alg.notFound')}</Callout>}
            <div className="stack" style={{ gap: 6 }}>
              <span className="label">{algo === 'bfs' ? t('alg.queue') : algo === 'dfs' ? t('alg.stack') : t('alg.pq')}</span>
              <div className="queue-view">
                {(algo === 'dfs' ? [...fl].reverse() : fl).map((c, i) => <span key={i} className="chip mono cyan">{c}</span>)}
                {!fl.length && <span className="xs faint">∅</span>}
              </div>
            </div>
          </>
        )}
        {algo !== 'dijkstra' && (
          <div className="stack">
            <button className="btn" onClick={runCompare}>{t('alg.compare')}</button>
            {compare && (
              <table className="table">
                <thead><tr><th /><th>{t('alg.visited')}</th><th>{t('alg.pathLen')}</th></tr></thead>
                <tbody>
                  {['bfs', 'dfs'].map((k) => (
                    <tr key={k}><td><strong>{k.toUpperCase()}</strong></td><td className="mono">{compare[k].visitedOrder.length}</td><td className="mono">{compare[k].found ? compare[k].pathLength : '—'}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

const FLOOD_COLORS = ['var(--surface-3)', 'var(--cyan)', 'var(--violet)', 'var(--lime)', 'var(--amber)'];
function makeRegions() {
  const g = createGrid(12, 18);
  const seeds = Array.from({ length: 9 }, () => [Math.floor(Math.random() * 12), Math.floor(Math.random() * 18), Math.floor(Math.random() * 3)]);
  return g.map((row, r) => row.map((_, c) => {
    let best = 0;
    let bd = Infinity;
    seeds.forEach(([sr, sc, col]) => { const d = Math.abs(sr - r) + Math.abs(sc - c); if (d < bd) { bd = d; best = col; } });
    return best;
  }));
}

function FloodFillLab() {
  const { t, bump, state } = useApp();
  const [colors, setColors] = useState(makeRegions);
  const [paint, setPaint] = useState(3);
  const [run, setRun] = useState(null);
  const pb = usePlayback(run ? run.order.length : 0, { resetKey: run?.id, autoPlay: true, baseMs: 90, initialSpeed: state.prefs.animSpeed });

  const shown = useMemo(() => {
    if (!run) return colors;
    const filled = new Set(run.order.slice(0, pb.index + 1).map(key));
    return run.before.map((row, r) => row.map((v, c) => (filled.has(`${r},${c}`) ? run.color : v)));
  }, [run, pb.index, colors]);

  const onPaint = ([r, c], phase) => {
    if (phase !== 'down') return;
    const base = shown;
    const res = floodFill(base, [r, c], paint);
    setColors(res.result);
    setRun({ ...res, before: base, color: paint, id: Date.now(), at: [r, c] });
    bump('algoRuns');
  };

  return (
    <div className="split">
      <section className="panel stack">
        <AlgorithmCanvas walls={createGrid(12, 18)} colors={shown} colorMap={FLOOD_COLORS} onPaint={onPaint} view={run ? { current: run.order[pb.index] ? key(run.order[pb.index]) : null } : null} ariaLabel={t('alg.flood')} />
      </section>
      <section className="panel stack-lg">
        <Callout type="info">{t('alg.floodNote')}</Callout>
        <div className="row">
          <span className="label">{t('alg.color')}</span>
          {FLOOD_COLORS.map((c, i) => (
            <button key={i} className={`btn btn-icon btn-sm ${paint === i ? 'on' : ''}`} onClick={() => setPaint(i)} aria-label={`${t('alg.color')} ${i + 1}`} aria-pressed={paint === i}>
              <span style={{ width: 16, height: 16, borderRadius: 4, background: c, display: 'block' }} />
            </button>
          ))}
          <button className="btn btn-sm" onClick={() => { setRun(null); setColors(makeRegions()); }}><Shuffle size={14} /> {t('common.new')}</button>
        </div>
        {run && (
          <>
            <PlaybackControls pb={pb} />
            <div className="kpi"><span className="k">{t('alg.filled')}</span><span className="v">{Math.min(pb.index + 1, run.order.length)} / {run.order.length}</span></div>
          </>
        )}
      </section>
    </div>
  );
}

const randArray = (n) => Array.from({ length: n }, () => 5 + Math.floor(Math.random() * 95));

function SortingLab() {
  const { t, bump, state } = useApp();
  const [size, setSize] = useState(16);
  const [arr, setArr] = useState(() => randArray(16));
  const [algo, setAlgo] = useState('bubble');
  const [run, setRun] = useState(null);
  const pb = usePlayback(run ? run.steps.length : 0, { resetKey: run?.id, autoPlay: true, baseMs: 260, initialSpeed: state.prefs.animSpeed });
  const step = run?.steps[pb.index];
  const shownArr = step ? step.array : arr;
  const sorted = new Set(step?.sorted || []);
  const counts = useMemo(() => {
    if (!run) return { c: 0, s: 0 };
    let c = 0;
    let s = 0;
    for (let i = 0; i <= pb.index; i++) {
      const st = run.steps[i];
      if (st.type === 'compare') c++;
      if (st.type === 'swap' || st.type === 'write') s++;
    }
    return { c, s };
  }, [run, pb.index]);
  const max = Math.max(...shownArr, 1);

  return (
    <div className="stack-lg">
      <section className="panel stack">
        <div className="row-between">
          <div className="seg" role="group" aria-label={t('alg.algorithm')}>
            {Object.keys(SORTERS).map((k) => <button key={k} aria-pressed={algo === k} onClick={() => { setAlgo(k); setRun(null); }}>{k[0].toUpperCase() + k.slice(1)}</button>)}
          </div>
          <div className="row" style={{ gap: 8 }}>
            <label className="row small muted" style={{ gap: 6 }}>{t('alg.size')}
              <input type="range" className="range" style={{ width: 110 }} min="5" max="40" value={size} onChange={(e) => { setSize(+e.target.value); setArr(randArray(+e.target.value)); setRun(null); }} />
              <span className="mono">{size}</span>
            </label>
            <button className="btn btn-sm" onClick={() => { setArr(randArray(size)); setRun(null); }}><Shuffle size={14} /> {t('alg.shuffle')}</button>
            <button className="btn btn-primary btn-sm" onClick={() => { setRun({ ...SORTERS[algo](arr), id: Date.now() }); bump('algoRuns'); }}><Play size={14} /> {t('alg.run')}</button>
          </div>
        </div>
        <div className="bars" role="img" aria-label={shownArr.join(', ')}>
          {shownArr.map((v, i) => {
            let cls = 'bar';
            if (step?.indices.includes(i)) cls += step.type === 'compare' ? ' compare' : step.type === 'sorted' ? ' sorted' : ' swap';
            else if (sorted.has(i)) cls += ' sorted';
            else if (step?.range && i >= step.range[0] && i <= step.range[1]) cls += ' range';
            return <div key={i} className={cls} style={{ height: `${(v / max) * 100}%` }}>{size <= 24 && <span>{v}</span>}</div>;
          })}
        </div>
        <div className="legend">
          <span><i style={{ background: 'var(--amber)' }} />compare</span>
          <span><i style={{ background: 'var(--rose)' }} />swap / write</span>
          <span><i style={{ background: 'var(--lime)' }} />sorted</span>
          {algo === 'merge' && <span><i style={{ background: 'var(--violet)' }} />merge range</span>}
        </div>
        {run && <PlaybackControls pb={pb} />}
        {run && (
          <div className="row" style={{ gap: 24 }}>
            <div className="kpi"><span className="k">{t('alg.comparisons')}</span><span className="v">{counts.c}</span></div>
            <div className="kpi"><span className="k">{t('alg.swaps')}</span><span className="v">{counts.s}</span></div>
          </div>
        )}
      </section>
    </div>
  );
}

function SearchLab() {
  const { t, state } = useApp();
  const [arr, setArr] = useState(() => [...new Set(randArray(18))].sort((a, b) => a - b).slice(0, 16));
  const [target, setTarget] = useState(() => arr[Math.floor(arr.length * 0.7)]);
  const [kind, setKind] = useState('binary');
  const res = useMemo(() => (kind === 'binary' ? binarySearch(arr, target) : linearSearch(arr, target)), [arr, target, kind]);
  const pb = usePlayback(res.steps.length, { resetKey: `${kind}${target}${arr.join()}`, baseMs: 800, initialSpeed: state.prefs.animSpeed });
  const s = res.steps[pb.index];
  const done = pb.index >= res.steps.length - 1;

  return (
    <section className="panel stack-lg">
      <div className="row-between">
        <div className="seg" role="group">
          <button aria-pressed={kind === 'binary'} onClick={() => setKind('binary')}>{t('alg.binary')}</button>
          <button aria-pressed={kind === 'linear'} onClick={() => setKind('linear')}>{t('alg.linear')}</button>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <label className="row small muted" style={{ gap: 6 }}>{t('alg.target')}<input className="input num" type="number" value={target} onChange={(e) => setTarget(+e.target.value)} /></label>
          <button className="btn btn-sm" onClick={() => setArr([...new Set(randArray(18))].sort((a, b) => a - b).slice(0, 16))}><Shuffle size={14} /> {t('common.new')}</button>
        </div>
      </div>
      {kind === 'binary' && <Callout type="info">{t('alg.sortedReq')}</Callout>}
      <div className="search-strip">
        {arr.map((v, i) => {
          let cls = 'cell';
          if (s) {
            if (kind === 'binary') {
              if (i < s.lo || i > s.hi) cls += ' out';
              if (i === s.mid) cls += s.cmp === 'hit' ? ' hit' : ' mid';
            } else {
              if (i < s.index) cls += ' checked';
              if (i === s.index) cls += s.hit ? ' hit' : ' mid';
              if (i > s.index) cls += ' out';
            }
          }
          return <div key={i} className={cls}>{v}<small>{i}</small></div>;
        })}
      </div>
      <PlaybackControls pb={pb} />
      <div className="row" style={{ gap: 24 }}>
        <div className="kpi"><span className="k">{t('alg.comparisons')}</span><span className="v">{res.steps.length ? pb.index + 1 : 0}</span></div>
        {done && <span className={`chip ${res.index >= 0 ? 'lime' : 'rose'}`}>{res.index >= 0 ? t('alg.foundAt', { i: res.index }) : t('alg.notInArray')}</span>}
      </div>
      {kind === 'binary' && s && <div className="step-text">lo={s.lo}, hi={s.hi}, mid={s.mid} → a[mid]={s.value} {s.cmp === 'hit' ? '= target' : s.cmp === 'right' ? '< target → lo = mid + 1' : '> target → hi = mid − 1'}</div>}
    </section>
  );
}

export default function AlgorithmExplorer() {
  const { t } = useApp();
  const [tab, setTab] = useState('bfs');
  return (
    <div className="page">
      <PageHeader eyebrow="06 · ALGORITHMS" title={t('alg.title')} subtitle={t('alg.subtitle')} />
      <div className="seg" role="tablist" style={{ alignSelf: 'flex-start' }}>
        {['bfs', 'dfs', 'dijkstra', 'flood', 'sort', 'search'].map((k) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{t(`alg.${k}`)}</button>)}
      </div>
      {['bfs', 'dfs', 'dijkstra'].includes(tab) && <PathfindingLab key={tab} algo={tab} />}
      {tab === 'flood' && <FloodFillLab />}
      {tab === 'sort' && <SortingLab />}
      {tab === 'search' && <SearchLab />}
    </div>
  );
}

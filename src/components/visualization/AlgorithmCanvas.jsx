import { memo, useRef } from 'react';
import { key } from '../../algorithms/pathfinding.js';

/**
 * Interactive grid for graph algorithms. Pure rendering + pointer painting;
 * the parent owns grid state and the algorithm result.
 *  view: { visited:Set, frontier:Set, path:Set, current:'r,c', order:Map(key→n) }
 */
function AlgorithmCanvas({ walls, weights, start, target, view, onPaint, showMatrix, showOrder, colors, colorMap, ariaLabel }) {
  const painting = useRef(false);
  const rows = walls.length;
  const cols = walls[0].length;

  const cellAt = (e) => {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const r = el?.closest?.('[data-r]');
    if (!r) return null;
    return [+r.dataset.r, +r.dataset.c];
  };
  const down = (e) => {
    const c = cellAt(e);
    if (!c) return;
    painting.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    onPaint?.(c, 'down');
  };
  const move = (e) => {
    if (!painting.current) return;
    const c = cellAt(e);
    if (c) onPaint?.(c, 'drag');
  };
  const up = () => { painting.current = false; };

  return (
    <div
      className="algo-grid"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      role="grid"
      aria-label={ariaLabel}
    >
      {walls.map((row, r) => row.map((w, c) => {
        const k = `${r},${c}`;
        let cls = 'acell';
        let content = null;
        const isStart = start && start[0] === r && start[1] === c;
        const isTarget = target && target[0] === r && target[1] === c;
        if (colors) {
          return (
            <button
              type="button"
              key={k}
              data-r={r}
              data-c={c}
              className="acell"
              style={{ background: colorMap[colors[r][c]], borderColor: view?.current === k ? 'var(--text)' : 'transparent', transform: view?.current === k ? 'scale(0.86)' : undefined }}
              aria-label={`${r + 1},${c + 1}`}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPaint?.([r, c], 'down'); } }}
            />
          );
        }
        if (w === 1) cls += ' wall';
        else if (view) {
          if (view.path.has(k)) cls += ' path';
          else if (view.current === k) cls += ' current';
          else if (view.frontier.has(k)) cls += ' frontier';
          else if (view.visited.has(k)) cls += ' visited';
        }
        const wt = weights?.[r]?.[c] ?? 1;
        if (w !== 1 && wt > 1) cls += wt >= 9 ? ' w9' : ' w5';
        if (isStart) { cls += ' start'; content = 'S'; }
        else if (isTarget) { cls += ' target'; content = 'T'; }
        else if (showMatrix) content = w === 1 ? '1' : '0';
        else if (showOrder && view?.order?.has(k)) content = view.order.get(k);
        else if (w !== 1 && wt > 1) content = <span className="w">{wt}</span>;
        return (
          <div key={k} data-r={r} data-c={c} className={cls} role="gridcell" aria-label={`${r + 1},${c + 1}${w === 1 ? ' wall' : ''}`}>
            {content}
          </div>
        );
      }))}
    </div>
  );
}

export default memo(AlgorithmCanvas);
export { key };

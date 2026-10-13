/**
 * SVG coordinate plane that draws everything through a 2×2 matrix M.
 * World coordinates span [-R, R] on both axes; y points up.
 */
const R = 5;
const S = 300; // viewBox size

export const apply = (M, [x, y]) => [M[0][0] * x + M[0][1] * y, M[1][0] * x + M[1][1] * y];
const toScreen = ([x, y]) => [((x + R) / (2 * R)) * S, ((R - y) / (2 * R)) * S];
const pt = (p) => toScreen(p).map((v) => v.toFixed(2)).join(',');

export default function Plane({ M = [[1, 0], [0, 1]], showGrid = true, showBasis = true, showSquare = true, polygons = [], vectors = [], label, pixels }) {
  const lines = [];
  if (showGrid) {
    for (let k = -R * 2; k <= R * 2; k++) {
      const a1 = apply(M, [k, -R * 3]);
      const a2 = apply(M, [k, R * 3]);
      const b1 = apply(M, [-R * 3, k]);
      const b2 = apply(M, [R * 3, k]);
      const axis = k === 0;
      lines.push(<line key={`v${k}`} x1={toScreen(a1)[0]} y1={toScreen(a1)[1]} x2={toScreen(a2)[0]} y2={toScreen(a2)[1]} stroke={axis ? 'var(--text-muted)' : 'var(--border-strong)'} strokeWidth={axis ? 1.4 : 0.7} />);
      lines.push(<line key={`h${k}`} x1={toScreen(b1)[0]} y1={toScreen(b1)[1]} x2={toScreen(b2)[0]} y2={toScreen(b2)[1]} stroke={axis ? 'var(--text-muted)' : 'var(--border-strong)'} strokeWidth={axis ? 1.4 : 0.7} />);
    }
  }
  const sq = [[0, 0], [1, 0], [1, 1], [0, 1]].map((p) => apply(M, p));
  const arrow = (to, color, key, text) => {
    const [x1, y1] = toScreen([0, 0]);
    const [x2, y2] = toScreen(to);
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const len = Math.hypot(x2 - x1, y2 - y1);
    const h = Math.min(9, len * 0.5);
    const p1 = [x2 - h * Math.cos(ang - 0.45), y2 - h * Math.sin(ang - 0.45)];
    const p2 = [x2 - h * Math.cos(ang + 0.45), y2 - h * Math.sin(ang + 0.45)];
    return (
      <g key={key}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="2.4" strokeLinecap="round" />
        {len > 2 && <polygon points={`${x2},${y2} ${p1.join(',')} ${p2.join(',')}`} fill={color} />}
        {text && <text x={x2 + 6} y={y2 - 6} fill={color} fontSize="11" fontFamily="var(--font-mono)" fontWeight="600">{text}</text>}
      </g>
    );
  };
  return (
    <svg className="plane" viewBox={`0 0 ${S} ${S}`} role="img" aria-label={label}>
      <rect x="0" y="0" width={S} height={S} fill="var(--surface-solid)" />
      {lines}
      {pixels && pixels.map((px, i) => {
        const corners = [[px.x, px.y], [px.x + px.s, px.y], [px.x + px.s, px.y + px.s], [px.x, px.y + px.s]].map((p) => apply(M, p));
        return <polygon key={i} points={corners.map(pt).join(' ')} fill={px.color} stroke={px.color} strokeWidth="0.4" />;
      })}
      {showSquare && <polygon points={sq.map(pt).join(' ')} fill="var(--lime-soft)" stroke="var(--lime)" strokeWidth="1.2" />}
      {polygons.map((p, i) => (
        <polygon key={i} points={p.points.map((q) => pt(apply(M, q))).join(' ')} fill={p.fill || 'var(--violet-soft)'} stroke={p.stroke || 'var(--violet)'} strokeWidth="1.5" />
      ))}
      {showBasis && arrow(apply(M, [1, 0]), 'var(--cyan)', 'i', 'î')}
      {showBasis && arrow(apply(M, [0, 1]), 'var(--violet)', 'j', 'ĵ')}
      {vectors.map((v, i) => arrow(v.p, v.color || 'var(--amber)', `v${i}`, v.label))}
    </svg>
  );
}

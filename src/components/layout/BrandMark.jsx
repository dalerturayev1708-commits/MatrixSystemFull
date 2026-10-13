/** The MATRIXVERSE mark: a 3×3 grid whose main diagonal is lit — the identity matrix. */
export default function BrandMark({ size = 34 }) {
  const cells = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const diag = i === j;
      cells.push(
        <rect
          key={`${i}${j}`}
          x={5 + j * 9}
          y={5 + i * 9}
          width="7"
          height="7"
          rx="1.6"
          fill={diag ? (i === 1 ? 'var(--violet)' : 'var(--cyan)') : 'var(--surface-3)'}
        />,
      );
    }
  }
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 37 37" aria-hidden="true">
      <rect x="0.5" y="0.5" width="36" height="36" rx="9" fill="var(--surface-solid)" stroke="var(--border-strong)" />
      {cells}
    </svg>
  );
}

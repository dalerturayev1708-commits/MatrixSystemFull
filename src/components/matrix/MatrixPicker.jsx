import { useApp } from '../../context/AppContext.jsx';

/** Select one of the user's named matrices. */
export default function MatrixPicker({ value, onChange, label, id }) {
  const { state } = useApp();
  const names = Object.keys(state.matrices);
  return (
    <label className="field" htmlFor={id}>
      {label && <span>{label}</span>}
      <select id={id} className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        {names.map((n) => {
          const M = state.matrices[n];
          return <option key={n} value={n}>{n} ({M.length}×{M[0].length})</option>;
        })}
      </select>
    </label>
  );
}

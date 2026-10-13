import { memo } from 'react';

/** A single display cell. Clickable cells render as buttons for keyboard access. */
function MatrixCell({ text, className = '', onClick, onHover, ariaLabel }) {
  const common = {
    className: `mcell ${className}`,
    onMouseEnter: onHover ? () => onHover(true) : undefined,
    onMouseLeave: onHover ? () => onHover(false) : undefined,
    onFocus: onHover ? () => onHover(true) : undefined,
    onBlur: onHover ? () => onHover(false) : undefined,
    'aria-label': ariaLabel,
    role: 'cell',
  };
  if (onClick) {
    return <button type="button" {...common} onClick={onClick} style={{ cursor: 'pointer' }}>{text}</button>;
  }
  return <div {...common} tabIndex={onHover ? 0 : undefined}>{text}</div>;
}

export default memo(MatrixCell);

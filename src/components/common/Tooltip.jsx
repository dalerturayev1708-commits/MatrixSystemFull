import { useId, useState } from 'react';

/** Lightweight tooltip shown on hover and keyboard focus. */
export default function Tooltip({ content, children, as: Tag = 'span', className = '' }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <Tag
      className={`tip ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      aria-describedby={open ? id : undefined}
    >
      {children}
      {open && <span role="tooltip" id={id} className="tip-bubble">{content}</span>}
    </Tag>
  );
}

/** A math symbol with an explanation tooltip, focusable for keyboard users. */
export function Sym({ children, tip }) {
  return (
    <Tooltip content={tip}>
      <span className="sym" tabIndex={0}>{children}</span>
    </Tooltip>
  );
}

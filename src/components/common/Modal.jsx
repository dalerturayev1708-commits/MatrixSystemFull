import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

/** Accessible modal: focus trap, Escape to close, restores focus on close. */
export default function Modal({ open, onClose, title, children, footer, wide, className = '', labelledBy, hideClose }) {
  const ref = useRef(null);
  const { t, reducedMotion } = useApp();

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement;
    const node = ref.current;
    const focusables = () => node?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') || [];
    const first = [...focusables()].find((el) => !el.disabled && el.getAttribute('data-autofocus') !== 'false');
    (node?.querySelector('[data-autofocus]') || first || node)?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose?.(); }
      if (e.key === 'Tab') {
        const list = [...focusables()].filter((el) => !el.disabled && el.offsetParent !== null);
        if (!list.length) return;
        const a = list[0];
        const b = list[list.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); b.focus(); }
        else if (!e.shiftKey && document.activeElement === b) { e.preventDefault(); a.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [open, onClose]);

  if (!open) return null;
  const id = labelledBy || 'modal-title';
  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <motion.div
        ref={ref}
        className={`modal ${wide ? 'wide' : ''} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? id : undefined}
        tabIndex={-1}
        initial={reducedMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18 }}
      >
        {(title || !hideClose) && (
          <div className="modal-head">
            {title ? <h2 id={id}>{title}</h2> : <span />}
            {!hideClose && <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label={t('common.close')}><X size={18} /></button>}
          </div>
        )}
        {children}
        {footer && <div className="modal-foot">{footer}</div>}
      </motion.div>
    </div>,
    document.body,
  );
}

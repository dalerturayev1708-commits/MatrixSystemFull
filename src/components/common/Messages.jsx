import { AlertTriangle, Info, XCircle, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

/** Renders engine output messages: error, warnings and explanation. */
export function ResultMessages({ res }) {
  const { tm, t } = useApp();
  if (!res) return null;
  return (
    <div className="stack" style={{ gap: 8 }}>
      {res.error && (
        <div className="callout error" role="alert">
          <XCircle size={18} />
          <div><strong>{t('common.error')}. </strong>{tm(res.error)}</div>
        </div>
      )}
      {res.warnings?.map((w, i) => (
        <div className="callout warn" key={i}><AlertTriangle size={18} /><div>{tm(w)}</div></div>
      ))}
      {res.explanation && (
        <div className="callout info"><Info size={18} /><div>{tm(res.explanation)}</div></div>
      )}
    </div>
  );
}

export function Callout({ type = 'info', children }) {
  const Icon = { info: Info, warn: AlertTriangle, error: XCircle, success: CheckCircle2 }[type];
  return <div className={`callout ${type}`}><Icon size={18} /><div>{children}</div></div>;
}

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, Award, X, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

const ICONS = { success: CheckCircle2, error: AlertTriangle, info: Info, achievement: Award, xp: Sparkles };

export default function Toasts() {
  const { toasts, dismissToast, t, reducedMotion } = useApp();
  return (
    <div className="toasts" role="status" aria-live="polite">
      <AnimatePresence>
        {toasts.map((x) => {
          const Icon = ICONS[x.type] || Info;
          return (
            <motion.div
              key={x.id}
              className={`toast ${x.type}`}
              initial={reducedMotion ? false : { opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.2 }}
            >
              <Icon size={18} />
              <span>{x.text}</span>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => dismissToast(x.id)} aria-label={t('common.close')}><X size={14} /></button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

import { Moon, Sun } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

export default function ThemeToggle({ compact }) {
  const { state, toggleTheme, t } = useApp();
  const dark = state.theme === 'dark';
  return (
    <button className={`btn btn-ghost ${compact ? 'btn-icon' : 'btn-sm'}`} onClick={toggleTheme} aria-label={t('theme.toggle')} title={t('theme.toggle')}>
      {dark ? <Sun size={16} /> : <Moon size={16} />}
      {!compact && <span>{dark ? t('theme.light') : t('theme.dark')}</span>}
    </button>
  );
}

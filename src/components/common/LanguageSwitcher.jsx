import { LANGUAGES } from '../../data/translations.js';
import { useApp } from '../../context/AppContext.jsx';

export default function LanguageSwitcher() {
  const { state, setLang, t } = useApp();
  return (
    <div className="seg" role="group" aria-label={t('lang.label')}>
      {LANGUAGES.map((l) => (
        <button key={l.code} aria-pressed={state.lang === l.code} onClick={() => setLang(l.code)} title={l.label}>
          {l.short}
        </button>
      ))}
    </div>
  );
}

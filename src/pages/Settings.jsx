import { useRef, useState } from 'react';
import { Download, Upload, Trash2, Sparkles, Keyboard } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import ThemeToggle from '../components/common/ThemeToggle.jsx';
import LanguageSwitcher from '../components/common/LanguageSwitcher.jsx';
import Modal from '../components/common/Modal.jsx';
import { useApp } from '../context/AppContext.jsx';
import { downloadText } from '../utils/formatting.js';

export default function Settings() {
  const app = useApp();
  const { t, state, setPref, resetAll, importAll, toast, setOnboarded, schemaVersion } = app;
  const [confirm, setConfirm] = useState(false);
  const fileRef = useRef(null);

  const onImport = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const ok = importAll(JSON.parse(await file.text()));
      toast(ok ? t('set.importDone') : t('set.importBad'), ok ? 'success' : 'error');
    } catch {
      toast(t('set.importBad'), 'error');
    }
  };

  const shortcuts = [
    ['Ctrl/⌘ + K', 'set.sc.palette'],
    ['← ↑ → ↓', 'set.sc.nav'],
    ['Tab / Enter', 'set.sc.next'],
    ['Space', 'set.sc.play'],
    ['← / →', 'set.sc.step'],
    ['Alt + T', 'set.sc.theme'],
    ['Esc', 'set.sc.esc'],
  ];

  return (
    <div className="page">
      <PageHeader eyebrow="11 · SETTINGS" title={t('set.title')} subtitle={t('set.subtitle')} favoritable={false} />
      <div className="grid-2">
        <section className="panel stack-lg">
          <h2>{t('set.appearance')}</h2>
          <div className="row-between"><span>{t('set.theme')}</span><ThemeToggle /></div>
          <div className="row-between"><span>{t('lang.label')}</span><LanguageSwitcher /></div>
          <label className="row-between check"><span>{t('set.motion')}<br /><span className="xs muted">{t('set.motionHint')}</span></span><input type="checkbox" checked={state.prefs.reducedMotion} onChange={(e) => setPref('reducedMotion', e.target.checked)} /></label>
          <label className="row-between check"><span>{t('set.particles')}</span><input type="checkbox" checked={state.prefs.particles} onChange={(e) => setPref('particles', e.target.checked)} /></label>
          <label className="row-between"><span>{t('set.decimals')}</span>
            <select className="select" value={state.prefs.decimals} onChange={(e) => setPref('decimals', +e.target.value)}>
              {[2, 3, 4, 6].map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
          <label className="row-between"><span>{t('set.animSpeed')}</span>
            <select className="select" value={state.prefs.animSpeed} onChange={(e) => setPref('animSpeed', +e.target.value)}>
              {[0.5, 1, 1.5, 2, 3].map((d) => <option key={d} value={d}>{d}×</option>)}
            </select>
          </label>
          <button className="btn" onClick={() => setOnboarded(false)} style={{ alignSelf: 'flex-start' }}><Sparkles size={15} /> {t('set.onboarding')}</button>
        </section>

        <div className="stack-lg">
          <section className="panel stack-lg">
            <h2>{t('set.data')}</h2>
            <p className="small muted">{t('set.dataHint', { v: schemaVersion })}</p>
            <div className="row">
              <button className="btn" onClick={() => downloadText('matrixverse-backup.json', JSON.stringify(state, null, 2), 'application/json')}><Download size={15} /> {t('set.export')}</button>
              <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={onImport} />
              <button className="btn" onClick={() => fileRef.current?.click()}><Upload size={15} /> {t('set.importData')}</button>
              <button className="btn btn-danger" onClick={() => setConfirm(true)}><Trash2 size={15} /> {t('set.reset')}</button>
            </div>
          </section>
          <section className="panel">
            <div className="panel-head"><h2><Keyboard size={18} /> {t('set.shortcuts')}</h2></div>
            <table className="table">
              <tbody>{shortcuts.map(([k, d]) => <tr key={d}><td style={{ width: 150 }}><kbd>{k}</kbd></td><td>{t(d)}</td></tr>)}</tbody>
            </table>
          </section>
        </div>
      </div>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title={t('set.reset')}
        footer={<><button className="btn" onClick={() => setConfirm(false)} data-autofocus>{t('common.cancel')}</button><button className="btn btn-danger" onClick={() => { resetAll(); setConfirm(false); toast(t('set.resetDone'), 'success'); }}>{t('set.reset')}</button></>}
      >
        <p>{t('set.resetConfirm')}</p>
      </Modal>
    </div>
  );
}

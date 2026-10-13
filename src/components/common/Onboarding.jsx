import { useState } from 'react';
import { Grid3x3, Play, Trophy, Sparkles } from 'lucide-react';
import Modal from './Modal.jsx';
import { useApp } from '../../context/AppContext.jsx';
import BrandMark from '../layout/BrandMark.jsx';

const SLIDES = [
  { icon: Sparkles, title: 'onb.title1', body: 'onb.body1' },
  { icon: Grid3x3, title: 'onb.title2', body: 'onb.body2' },
  { icon: Play, title: 'onb.title3', body: 'onb.body3' },
  { icon: Trophy, title: 'onb.title4', body: 'onb.body4' },
];

export default function Onboarding() {
  const { state, setOnboarded, t } = useApp();
  const [i, setI] = useState(0);
  const open = !state.onboarded;
  const close = () => { setOnboarded(true); setI(0); };
  const s = SLIDES[i];
  const Icon = s.icon;
  return (
    <Modal
      open={open}
      onClose={close}
      title={t(s.title)}
      labelledBy="onb-title"
      footer={(
        <>
          <button className="btn btn-ghost" onClick={close}>{t('onb.skip')}</button>
          {i > 0 && <button className="btn" onClick={() => setI(i - 1)}>{t('common.back')}</button>}
          {i < SLIDES.length - 1
            ? <button className="btn btn-primary" onClick={() => setI(i + 1)} data-autofocus>{t('common.next')}</button>
            : <button className="btn btn-primary" onClick={close} data-autofocus>{t('onb.finish')}</button>}
        </>
      )}
    >
      <div className="stack" style={{ gap: 16 }}>
        <div className="row" style={{ gap: 14 }}>
          {i === 0 ? <BrandMark size={52} /> : <div className="card-link" style={{ padding: 12, transform: 'none' }}><div className="ic"><Icon size={20} /></div></div>}
          <p className="muted" style={{ flex: 1, minWidth: 200 }}>{t(s.body)}</p>
        </div>
        <div className="row" aria-hidden="true" style={{ gap: 6 }}>
          {SLIDES.map((_, k) => <span key={k} style={{ width: k === i ? 22 : 8, height: 8, borderRadius: 8, background: k === i ? 'var(--cyan)' : 'var(--surface-3)', transition: 'width 200ms' }} />)}
        </div>
      </div>
    </Modal>
  );
}

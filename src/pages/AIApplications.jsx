import { BrainCircuit, Share2, TrendingUp, Box, ScanLine, Layers, Table2, Image as ImageIcon } from 'lucide-react';
import PageHeader from '../components/common/PageHeader.jsx';
import MatrixGrid from '../components/matrix/MatrixGrid.jsx';
import { NeuralNetDemo, GraphDemo, RegressionDemo, Graphics3D, PCADemo, ImageDemo } from '../components/academy/Demos.jsx';
import { useApp } from '../context/AppContext.jsx';

function Section({ icon: Icon, title, children }) {
  return (
    <section className="panel">
      <div className="panel-head"><h2><Icon size={19} /> {title}</h2></div>
      {children}
    </section>
  );
}

export default function AIApplications() {
  const { t, state } = useApp();
  const uz = state.lang === 'uz';
  const data = [[17, 4.5, 92], [16, 3.0, 78], [18, 5.5, 95], [17, 2.0, 64]];
  return (
    <div className="page">
      <PageHeader eyebrow="07 · APPLICATIONS" title={t('ai.title')} subtitle={t('ai.subtitle')} />

      <Section icon={Layers} title={t('ai.terms')}>
        <div className="grid-3">
          {[['ai.termMatrix', 'cyan'], ['ai.termArray', 'violet'], ['ai.termTensor', 'lime']].map(([k, c]) => (
            <div key={k} className="panel flat tight"><span className={`chip ${c}`} style={{ marginBottom: 8 }}>{t(k).split(':')[0]}</span><p className="small">{t(k).split(':').slice(1).join(':').trim()}</p></div>
          ))}
        </div>
      </Section>

      <Section icon={BrainCircuit} title={t('ai.nn')}><NeuralNetDemo /></Section>

      <Section icon={Table2} title={t('ai.data')}>
        <p className="small muted" style={{ marginBottom: 12 }}>{t('ai.dataExplain')}</p>
        <div className="row" style={{ gap: 24, alignItems: 'flex-start' }}>
          <div className="scroll-x">
            <table className="table" style={{ width: 'auto' }}>
              <thead><tr><th>#</th><th>{uz ? 'Yosh' : 'Age'}</th><th>{uz ? "O'qish (soat)" : 'Study (h)'}</th><th>{uz ? 'Ball' : 'Score'}</th></tr></thead>
              <tbody>{data.map((r, i) => <tr key={i}><td className="mono">{i + 1}</td>{r.map((v, j) => <td key={j} className="mono">{v}</td>)}</tr>)}</tbody>
            </table>
          </div>
          <MatrixGrid matrix={data} name="X" compact />
          <span className="chip mono">X: 4 × 3</span>
        </div>
      </Section>

      <Section icon={ImageIcon} title={uz ? 'Rasm — piksel matritsasi' : 'Images as pixel matrices'}><ImageDemo /></Section>
      <Section icon={Share2} title={t('ai.graph')}><GraphDemo /></Section>
      <Section icon={TrendingUp} title={t('ai.regression')}><RegressionDemo /></Section>
      <Section icon={Box} title={t('ai.g3d')}><Graphics3D /></Section>
      <Section icon={ScanLine} title={t('ai.pca')}><PCADemo /></Section>
    </div>
  );
}

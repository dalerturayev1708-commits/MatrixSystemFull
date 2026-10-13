import {
  LayoutDashboard, Grid3x3, Calculator, Sigma, Equal, Shapes, Route, BrainCircuit, Trophy, GraduationCap, BarChart3, Settings,
} from 'lucide-react';

export const ROUTES = [
  { path: '/', key: 'nav.dashboard', icon: LayoutDashboard, group: 'compute' },
  { path: '/lab', key: 'nav.lab', icon: Grid3x3, group: 'compute' },
  { path: '/operations', key: 'nav.operations', icon: Calculator, group: 'compute' },
  { path: '/determinant', key: 'nav.detinv', icon: Sigma, group: 'compute' },
  { path: '/systems', key: 'nav.systems', icon: Equal, group: 'compute' },
  { path: '/playground', key: 'nav.playground', icon: Shapes, group: 'explore' },
  { path: '/algorithms', key: 'nav.algorithms', icon: Route, group: 'explore' },
  { path: '/ai', key: 'nav.ai', icon: BrainCircuit, group: 'explore' },
  { path: '/challenges', key: 'nav.challenges', icon: Trophy, group: 'learn' },
  { path: '/academy', key: 'nav.academy', icon: GraduationCap, group: 'learn' },
  { path: '/progress', key: 'nav.progress', icon: BarChart3, group: 'learn' },
  { path: '/settings', key: 'nav.settings', icon: Settings, group: 'learn' },
];

export const MOBILE_TABS = ['/', '/lab', '/operations', '/challenges', '/academy'];

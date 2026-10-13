import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { loadState, saveState, defaultState, migrate, clearState, SCHEMA_VERSION } from '../utils/storage.js';
import { translate, translateMsg, pick } from '../utils/i18n.js';
import { todayKey, daysBetween } from '../utils/formatting.js';
import { ACHIEVEMENTS } from '../data/achievements.js';

const AppContext = createContext(null);

const NAME_RE = /^[A-Za-z_][A-Za-z0-9_]{0,11}$/;

function useSystemReducedMotion() {
  const [v, setV] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return undefined;
    const on = () => setV(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return v;
}

export function AppProvider({ children }) {
  const [state, setState] = useState(loadState);
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);
  const sysReduced = useSystemReducedMotion();
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => { saveState(state); }, [state]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = state.theme;
    root.lang = state.lang;
  }, [state.theme, state.lang]);

  const reducedMotion = state.prefs.reducedMotion || sysReduced;
  useEffect(() => { document.documentElement.dataset.motion = reducedMotion ? 'reduced' : 'full'; }, [reducedMotion]);

  const t = useCallback((key, params) => translate(state.lang, key, params, state.prefs.decimals), [state.lang, state.prefs.decimals]);
  const tm = useCallback((m) => translateMsg(state.lang, m, state.prefs.decimals), [state.lang, state.prefs.decimals]);
  const p = useCallback((obj) => pick(state.lang, obj), [state.lang]);

  const toast = useCallback((text, type = 'info') => {
    const id = ++toastId.current;
    setToasts((ts) => [...ts.slice(-3), { id, text, type }]);
    setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), 3800);
  }, []);
  const dismissToast = useCallback((id) => setToasts((ts) => ts.filter((x) => x.id !== id)), []);

  // Achievement detection: runs after every state change, unlocks new badges once.
  useEffect(() => {
    const fresh = ACHIEVEMENTS.filter((a) => !state.achievements[a.id] && a.test(state));
    if (!fresh.length) return;
    const now = new Date().toISOString();
    setState((s) => ({ ...s, achievements: { ...s.achievements, ...Object.fromEntries(fresh.map((a) => [a.id, now])) } }));
    fresh.forEach((a) => toast(translate(state.lang, 'ach.unlocked', { name: pick(state.lang, a.name) }), 'achievement'));
  }, [state, toast]);

  const update = useCallback((fn) => setState((s) => fn(s)), []);

  const touchStreak = (s) => {
    const today = todayKey();
    const st = s.progress.streak;
    if (st.last === today) return st;
    const gap = st.last ? daysBetween(st.last, today) : null;
    const current = gap === 1 ? st.current + 1 : 1;
    return { current, best: Math.max(st.best, current), last: today };
  };

  const actions = useMemo(() => ({
    setTheme: (theme) => update((s) => ({ ...s, theme })),
    toggleTheme: () => update((s) => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' })),
    setLang: (lang) => update((s) => ({ ...s, lang })),
    setPref: (k, v) => update((s) => ({ ...s, prefs: { ...s.prefs, [k]: v } })),
    setOnboarded: (v) => update((s) => ({ ...s, onboarded: v })),

    setMatrix: (name, M) => update((s) => ({ ...s, matrices: { ...s.matrices, [name]: M } })),
    setActiveMatrix: (name) => update((s) => ({ ...s, activeMatrix: name })),
    addMatrix: (M, preferred) => {
      const cur = stateRef.current.matrices;
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let name = preferred && NAME_RE.test(preferred) && !cur[preferred] ? preferred : [...letters].find((l) => !cur[l]);
      let i = Object.keys(cur).length + 1;
      while (!name || cur[name]) name = `M${i++}`;
      update((s) => ({ ...s, matrices: { ...s.matrices, [name]: M }, activeMatrix: name }));
      return name;
    },
    renameMatrix: (from, to) => {
      if (!NAME_RE.test(to)) return 'lab.nameInvalid';
      if (from === to) return null;
      if (stateRef.current.matrices[to]) return 'lab.nameTaken';
      update((s) => {
        const entries = Object.entries(s.matrices).map(([k, v]) => [k === from ? to : k, v]);
        return { ...s, matrices: Object.fromEntries(entries), activeMatrix: s.activeMatrix === from ? to : s.activeMatrix };
      });
      return null;
    },
    deleteMatrix: (name) => update((s) => {
      const { [name]: _, ...rest } = s.matrices;
      const keys = Object.keys(rest);
      if (!keys.length) return s;
      return { ...s, matrices: rest, activeMatrix: s.activeMatrix === name ? keys[0] : s.activeMatrix };
    }),
    addFavorite: (name, M) => update((s) => ({ ...s, favorites: [{ id: Date.now() + Math.random(), name, matrix: M, at: new Date().toISOString() }, ...s.favorites].slice(0, 40) })),
    removeFavorite: (id) => update((s) => ({ ...s, favorites: s.favorites.filter((f) => f.id !== id) })),
    toggleFavoriteTool: (path) => update((s) => ({
      ...s,
      favoriteTools: s.favoriteTools.includes(path) ? s.favoriteTools.filter((x) => x !== path) : [...s.favoriteTools, path],
    })),

    logOp: (op) => update((s) => ({
      ...s,
      recentOps: [{ ...op, at: new Date().toISOString() }, ...s.recentOps].slice(0, 30),
      progress: { ...s.progress, opsCount: s.progress.opsCount + 1, streak: touchStreak(s) },
    })),
    addXP: (n) => update((s) => {
      const day = todayKey();
      return {
        ...s,
        progress: { ...s.progress, xp: s.progress.xp + n, xpLog: { ...s.progress.xpLog, [day]: (s.progress.xpLog[day] || 0) + n }, streak: touchStreak(s) },
      };
    }),
    bump: (key) => update((s) => ({ ...s, progress: { ...s.progress, [key]: (s.progress[key] || 0) + 1 } })),
    saveLesson: (id, patch) => update((s) => ({
      ...s,
      progress: { ...s.progress, lessons: { ...s.progress.lessons, [id]: { ...s.progress.lessons[id], ...patch } }, streak: touchStreak(s) },
    })),
    recordAnswer: (correct) => update((s) => ({
      ...s,
      progress: { ...s.progress, challenge: { ...s.progress.challenge, answered: s.progress.challenge.answered + 1, correct: s.progress.challenge.correct + (correct ? 1 : 0) } },
    })),
    recordRun: (level, score, total, timed) => {
      const prevBest = stateRef.current.progress.challenge.bests[level];
      const newBest = !prevBest || score > prevBest.score;
      update((s) => {
        const prev = s.progress.challenge.bests[level];
        const better = !prev || score > prev.score;
        const bests = better ? { ...s.progress.challenge.bests, [level]: { score, total, at: new Date().toISOString() } } : s.progress.challenge.bests;
        return { ...s, progress: { ...s.progress, challenge: { ...s.progress.challenge, bests, timedRuns: s.progress.challenge.timedRuns + (timed ? 1 : 0) } } };
      });
      return newBest;
    },
    markDaily: () => update((s) => ({ ...s, progress: { ...s.progress, challenge: { ...s.progress.challenge, dailyDone: todayKey() } } })),

    resetAll: () => { clearState(); setState(defaultState()); },
    importAll: (data) => {
      if (!data || typeof data !== 'object' || !('version' in data) || !data.progress) return false;
      setState(migrate(data));
      return true;
    },
  }), [update]);

  const value = useMemo(() => ({ state, ...actions, t, tm, p, toast, toasts, dismissToast, reducedMotion, schemaVersion: SCHEMA_VERSION }), [state, actions, t, tm, p, toast, toasts, dismissToast, reducedMotion]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

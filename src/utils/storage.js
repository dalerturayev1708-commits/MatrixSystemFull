/**
 * Versioned localStorage persistence. The whole app state lives under one key.
 * When the schema changes, bump SCHEMA_VERSION and add a step to MIGRATIONS so
 * existing users keep their data. Storage failures (private mode, quota) are
 * swallowed — the app keeps working in memory.
 */
export const STORAGE_KEY = 'matrixverse:state';
export const SCHEMA_VERSION = 2;

export function defaultState() {
  return {
    version: SCHEMA_VERSION,
    theme: 'dark',
    lang: 'uz',
    prefs: { reducedMotion: false, particles: true, decimals: 4, animSpeed: 1 },
    onboarded: false,
    matrices: {
      A: [[2, -1, 0], [1, 3, 2], [0, 1, 4]],
      B: [[1, 2, 0], [0, 1, -1], [3, 0, 2]],
      C: [[4, 7], [2, 6]],
    },
    activeMatrix: 'A',
    favorites: [],
    favoriteTools: ['/lab', '/operations', '/algorithms'],
    recentOps: [],
    progress: {
      xp: 0,
      xpLog: {},
      lessons: {},
      challenge: { answered: 0, correct: 0, bests: {}, dailyDone: null, timedRuns: 0 },
      streak: { current: 0, best: 0, last: null },
      opsCount: 0,
      algoRuns: 0,
      playgroundUses: 0,
    },
    achievements: {},
  };
}

/** Migrations transform version N → N+1. */
const MIGRATIONS = {
  // v1 stored progress.xp only and had no xpLog / algoRuns.
  1: (s) => ({
    ...s,
    version: 2,
    progress: { ...defaultState().progress, ...s.progress, xpLog: s.progress?.xpLog || {}, algoRuns: s.progress?.algoRuns || 0 },
  }),
};

export function migrate(raw) {
  if (!raw || typeof raw !== 'object') return defaultState();
  let s = raw;
  let v = Number(s.version) || 1;
  while (v < SCHEMA_VERSION) {
    const step = MIGRATIONS[v];
    if (!step) return defaultState();
    s = step(s);
    v = s.version;
  }
  const d = defaultState();
  return {
    ...d,
    ...s,
    prefs: { ...d.prefs, ...s.prefs },
    progress: { ...d.progress, ...s.progress, challenge: { ...d.progress.challenge, ...s.progress?.challenge }, streak: { ...d.progress.streak, ...s.progress?.streak } },
    matrices: s.matrices && Object.keys(s.matrices).length ? s.matrices : d.matrices,
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    return migrate(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

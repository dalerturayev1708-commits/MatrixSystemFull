/** Ranks and achievements. Conditions are pure functions of the saved state. */
import { LESSONS } from './lessons.js';

export const RANK_XP = [0, 60, 180, 350, 600, 900];

export function rankFor(xp) {
  let r = 0;
  RANK_XP.forEach((t, i) => { if (xp >= t) r = i; });
  return r;
}

export function nextRank(xp) {
  const r = rankFor(xp);
  if (r >= RANK_XP.length - 1) return null;
  return { rank: r + 1, need: RANK_XP[r + 1] - xp, progress: (xp - RANK_XP[r]) / (RANK_XP[r + 1] - RANK_XP[r]) };
}

const done = (s) => Object.values(s.progress.lessons).filter((l) => l.completed).length;
const opsOf = (s, type) => s.recentOps.some((o) => o.type === type);

export const ACHIEVEMENTS = [
  { id: 'first_op', icon: 'Zap', name: { en: 'First Calculation', uz: 'Birinchi hisob' }, desc: { en: 'Run your first matrix operation.', uz: 'Birinchi matritsa amalini bajaring.' }, test: (s) => s.progress.opsCount >= 1 },
  { id: 'ops_25', icon: 'Cpu', name: { en: 'Number Cruncher', uz: 'Son maydalagich' }, desc: { en: 'Run 25 operations.', uz: '25 ta amal bajaring.' }, test: (s) => s.progress.opsCount >= 25 },
  { id: 'inverse', icon: 'RotateCcw', name: { en: 'Undo Button', uz: 'Bekor qilish tugmasi' }, desc: { en: 'Compute an inverse matrix.', uz: 'Teskari matritsani hisoblang.' }, test: (s) => opsOf(s, 'inverse') },
  { id: 'first_lesson', icon: 'BookOpen', name: { en: 'First Lesson', uz: 'Birinchi dars' }, desc: { en: 'Complete a lesson.', uz: 'Bitta darsni tugating.' }, test: (s) => done(s) >= 1 },
  { id: 'lessons_6', icon: 'GraduationCap', name: { en: 'Scholar', uz: 'Olim' }, desc: { en: 'Complete 6 lessons.', uz: '6 ta darsni tugating.' }, test: (s) => done(s) >= 6 },
  { id: 'lessons_all', icon: 'Library', name: { en: 'Full Curriculum', uz: "To'liq kurs" }, desc: { en: 'Complete all 18 lessons.', uz: 'Barcha 18 ta darsni tugating.' }, test: (s) => done(s) >= LESSONS.length },
  { id: 'first_correct', icon: 'Target', name: { en: 'On Target', uz: 'Nishonga' }, desc: { en: 'Answer a challenge question correctly.', uz: "Sinov savoliga to'g'ri javob bering." }, test: (s) => s.progress.challenge.correct >= 1 },
  { id: 'perfect', icon: 'Award', name: { en: 'Flawless', uz: 'Benuqson' }, desc: { en: 'Score 100% on any challenge level.', uz: "Istalgan darajada 100% natija oling." }, test: (s) => Object.values(s.progress.challenge.bests).some((b) => b.score === b.total && b.total > 0) },
  { id: 'level6', icon: 'Crown', name: { en: 'Legend', uz: 'Afsona' }, desc: { en: 'Finish a Level 6 run.', uz: '6-daraja sinovini yakunlang.' }, test: (s) => !!s.progress.challenge.bests[6] },
  { id: 'timed', icon: 'Timer', name: { en: 'Against the Clock', uz: 'Vaqtga qarshi' }, desc: { en: 'Finish a countdown run.', uz: 'Vaqtli sinovni yakunlang.' }, test: (s) => s.progress.challenge.timedRuns >= 1 },
  { id: 'streak3', icon: 'Flame', name: { en: 'Three in a Row', uz: 'Ketma-ket uch' }, desc: { en: 'Learn on 3 days in a row.', uz: "3 kun ketma-ket o'rganing." }, test: (s) => s.progress.streak.best >= 3 },
  { id: 'streak7', icon: 'CalendarCheck', name: { en: 'Weekly Rhythm', uz: 'Haftalik ritm' }, desc: { en: 'Learn on 7 days in a row.', uz: "7 kun ketma-ket o'rganing." }, test: (s) => s.progress.streak.best >= 7 },
  { id: 'algo5', icon: 'Route', name: { en: 'Pathfinder', uz: "Yo'l topuvchi" }, desc: { en: 'Run 5 algorithm visualizations.', uz: '5 ta algoritm vizualizatsiyasini ishga tushiring.' }, test: (s) => s.progress.algoRuns >= 5 },
  { id: 'playground', icon: 'Shapes', name: { en: 'Space Bender', uz: 'Fazo egovchi' }, desc: { en: 'Transform space in the Visual Playground.', uz: "Vizual maydonda fazoni o'zgartiring." }, test: (s) => s.progress.playgroundUses >= 1 },
  { id: 'favorite', icon: 'Star', name: { en: 'Collector', uz: 'Kolleksioner' }, desc: { en: 'Save a favorite matrix.', uz: 'Sevimli matritsani saqlang.' }, test: (s) => s.favorites.length >= 1 },
  { id: 'xp500', icon: 'Sparkles', name: { en: 'Grid Veteran', uz: 'Panjara faxriysi' }, desc: { en: 'Earn 500 XP.', uz: '500 XP to‘plang.' }, test: (s) => s.progress.xp >= 500 },
];

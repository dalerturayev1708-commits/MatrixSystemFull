import { describe, it, expect } from 'vitest';
import { LESSONS } from '../data/lessons.js';
import { GENERATORS, LEVELS, generateLevel, dailyQuestion, checkAnswer, answerText, parseDims } from '../data/challenges.js';
import { seededRandom } from '../algorithms/pathfinding.js';
import { DICTIONARIES } from '../data/translations.js';
import { migrate, defaultState, SCHEMA_VERSION } from '../utils/storage.js';
import { parseNumber, parseMatrixText, formatNumber } from '../utils/formatting.js';

const label = (o) => (typeof o === 'string' ? o : o.en);

describe('lessons', () => {
  it('has 18 lessons with bilingual content and valid quizzes', () => {
    expect(LESSONS).toHaveLength(18);
    LESSONS.forEach((l) => {
      expect(l.title.en && l.title.uz).toBeTruthy();
      expect(l.body.length).toBeGreaterThanOrEqual(2);
      l.body.forEach((p) => expect(p.en && p.uz).toBeTruthy());
      expect(l.quiz.length).toBeGreaterThanOrEqual(3);
      l.quiz.forEach((q) => {
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
        expect(new Set(q.options.map(label)).size).toBe(q.options.length);
      });
      l.practice.forEach((g) => expect(GENERATORS[g]).toBeTypeOf('function'));
    });
  });
  it('engine-computed quiz answers are the expected values', () => {
    const det = LESSONS.find((l) => l.id === 'determinants').quiz[0];
    expect(det.options[det.answer]).toBe('2');
    const mul = LESSONS.find((l) => l.id === 'matrix-multiplication').quiz[1];
    expect(mul.options[mul.answer]).toBe('20');
    const walks = LESSONS.find((l) => l.id === 'graphs-algorithms').quiz[1];
    expect(walks.options[walks.answer]).toBe('2');
    const idx = LESSONS.find((l) => l.id === 'indexing').quiz[0];
    expect(idx.options[idx.answer]).toBe('5');
  });
});

describe('challenge generators', () => {
  it('every generator yields a question its own answer text passes', () => {
    const rng = seededRandom(42);
    const t = (k) => ({ 'common.yes': 'Yes', 'common.no': 'No' }[k] || k);
    for (let round = 0; round < 25; round++) {
      Object.keys(GENERATORS).forEach((g) => {
        const q = { gen: g, ...GENERATORS[g](rng) };
        let input;
        if (q.kind === 'choice') input = q.answer;
        else if (q.kind === 'matrix') input = q.answer.map((r) => r.map(String));
        else input = answerText(q, t);
        expect(checkAnswer(q, input), `${g} ${JSON.stringify(q.answer)}`).toBe(true);
      });
    }
  });
  it('rejects wrong answers', () => {
    const q = { kind: 'number', answer: 14 };
    expect(checkAnswer(q, '13')).toBe(false);
    expect(checkAnswer(q, 'abc')).toBe(false);
    expect(checkAnswer({ kind: 'dims', answer: [2, 3] }, '3x2')).toBe(false);
    expect(checkAnswer({ kind: 'dims', answer: [2, 3] }, '2 × 3')).toBe(true);
    expect(checkAnswer({ kind: 'number', answer: 0.6 }, '3/5')).toBe(true);
  });
  it('levels are reproducible from a seed and daily is stable per day', () => {
    LEVELS.forEach((l) => {
      expect(JSON.stringify(generateLevel(l.n, 99))).toBe(JSON.stringify(generateLevel(l.n, 99)));
    });
    expect(JSON.stringify(dailyQuestion('2026-10-12'))).toBe(JSON.stringify(dailyQuestion('2026-10-12')));
    expect(parseDims('4*5')).toEqual([4, 5]);
  });
});

describe('translations and storage', () => {
  it('uz has every en key', () => {
    const missing = Object.keys(DICTIONARIES.en).filter((k) => !(k in DICTIONARIES.uz));
    expect(missing).toEqual([]);
  });
  it('migrates old schema versions and fills defaults', () => {
    const old = { version: 1, theme: 'light', progress: { xp: 120, lessons: {} }, matrices: { A: [[1]] } };
    const s = migrate(old);
    expect(s.version).toBe(SCHEMA_VERSION);
    expect(s.progress.xp).toBe(120);
    expect(s.progress.xpLog).toEqual({});
    expect(s.theme).toBe('light');
    expect(migrate(null)).toEqual(defaultState());
  });
  it('parses numbers and pasted tables', () => {
    expect(parseNumber('3/4')).toBe(0.75);
    expect(parseNumber('−2')).toBe(-2);
    expect(Number.isNaN(parseNumber('2x'))).toBe(true);
    expect(parseMatrixText('1\t2\n3\t4')).toEqual([[1, 2], [3, 4]]);
    expect(parseMatrixText('1,2\n3')).toBeNull();
    expect(formatNumber(-0.00000001)).toBe('0');
    expect(formatNumber(2.5)).toBe('2.5');
  });
});

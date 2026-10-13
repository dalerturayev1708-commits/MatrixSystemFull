# MATRIXVERSE

**Enter the Grid. Master the Logic.**

An interactive matrix laboratory, algorithm visualizer and gamified learning platform. React + Vite, vanilla CSS, no backend.

## Run

```bash
npm install
npm run dev      # development server
npm test         # 62 unit tests (Vitest)
npm run build    # production build → dist/
npm run preview  # serve the build
```

Routing uses hash URLs (`#/lab`), so `dist/` works on any static host without server rewrites.

## Pages

| Page | What it does |
|---|---|
| Dashboard | Hero with live A×B preview, quick actions, progress, daily challenge, live transformation, recent matrices and activity, achievements |
| Matrix Lab | Named matrices up to 20×20, keyboard navigation (arrows, Tab, Enter), paste from spreadsheets, generators, rename, favorites, JSON/CSV import/export, properties |
| Operations | 16 operations with requirements, validation, results and synchronized step playback |
| Determinant & Inverse | Cofactor expansion vs elimination, Gauss–Jordan inverse with verification, cofactor/adjugate, minor of any element |
| Linear Equations | Ax = b with unique / none / infinite classification, general solution, least squares |
| Visual Playground | 2×2 grid transformations, pixel-art image transforms, composition M₂M₁ vs M₁M₂ |
| Algorithm Explorer | BFS, DFS, Dijkstra (weighted), flood fill, 4 sorts, linear/binary search — step by step |
| AI & Graphics | Tiny neural network, adjacency matrices and walks, regression, 3D rotation, PCA, images as matrices |
| Challenges | 6 levels + daily question, generated questions, hints, explanations, optional countdown, no-penalty streaks |
| Academy | 18 bilingual lessons: explanation, visual, interactive demo, quiz, generated practice |
| Progress | XP, ranks, accuracy, streaks, charts, 16 achievements |
| Settings | Theme, language, reduced motion, decimals, playback speed, backup/import, reset |

## Architecture

```
src/
  math/        pure matrix engine — returns { ok, result, steps, explanation, warnings, error }
  algorithms/  BFS, DFS, Dijkstra, flood fill, sorting, searching (pure, step-recording)
  data/        translations (uz, en), lessons, challenge generators, achievements
  utils/       storage (versioned), formatting, i18n
  context/     app state + persistence + toasts + achievement detection
  hooks/       usePlayback
  components/  layout, matrix, visualization, challenges, academy, common
  pages/       the 12 pages
  tests/       math, algorithms, content/storage
```

### Correctness rules

- The UI never computes math itself. Visualizers replay the engine's own step records, so animations always match the result.
- Engine messages are `{ key, params }` and translated in the UI — the engine has no hard-coded language.
- Floating point: relative tolerance for pivots and singularity; near-integers are snapped (`1.9999999999 → 2`).
- Singular matrices, incompatible dimensions and unsupported cases return an explicit error, never a guessed result.
- Eigenvalues are supported for 1×1, triangular, real symmetric (Jacobi, any size) and general 2×2 (complex eigenvalues reported, complex eigenvectors not computed). Other cases are refused honestly.
- Every challenge and practice question is generated and answered by the engine; a test checks each generator against its own key.

## Storage

Everything lives in `localStorage` under `matrixverse:state`, versioned (`SCHEMA_VERSION`) with migrations in `utils/storage.js`. No account, no server.

## Adding Russian

Add a `ru` dictionary with the same keys to `src/data/translations.js`, uncomment it in `LANGUAGES`, and add `ru` fields to lesson texts in `src/data/lessons.js`. Missing keys fall back to English.

## Keyboard

`Ctrl/⌘ + K` command palette · arrows / Tab / Enter move between cells · `Space` play/pause steps · `← →` step · `Alt + T` theme · `Esc` close dialogs

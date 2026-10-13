/**
 * Learning Academy curriculum (18 lessons, Uzbek + English).
 * Numeric quiz answers are computed by the math engine at load time, so the
 * key always matches the engine. `practice` names generators from challenges.js.
 */
import * as M from '../math/index.js';

const L = (en, uz) => ({ en, uz });
const f = (x) => String(+x.toFixed(4)).replace('-', '−');

/** Multiple choice with an engine-computed correct value and distractors. */
function mcNum(q, value, distractors, why) {
  const opts = [value, ...new Set(distractors.filter((d) => f(d) !== f(value)))].slice(0, 4);
  // deterministic shuffle by value so the answer is not always first
  const order = opts.map((v, i) => [v, (i * 7 + Math.abs(Math.round(value * 13))) % 5]).sort((a, b) => a[1] - b[1]).map((x) => x[0]);
  return { q, options: order.map(f), answer: order.indexOf(value), why };
}
const mc = (q, options, answer, why) => ({ q, options, answer, why });

const A1 = [[4, 7, 1], [2, 9, 5]];
const S5A = [[1, -2], [3, 0]];
const S5B = [[4, 1], [-1, 6]];
const S7A = [[1, 2], [3, 4]];
const S7B = [[0, 1], [5, -2]];
const D9 = [[3, 1], [4, 2]];
const R11 = [[1, 2, 3], [2, 4, 6], [1, 0, 1]];

export const LESSONS = [
  {
    id: 'what-is-a-matrix',
    title: L('What is a matrix?', 'Matritsa nima?'),
    summary: L('A rectangular grid of numbers with rules for combining them.', "Birlashtirish qoidalariga ega to'rtburchak sonlar jadvali."),
    body: [
      L('A matrix is a rectangular arrangement of numbers in rows and columns. Each number is called an entry or element.', "Matritsa — satr va ustunlarga joylashtirilgan sonlarning to'rtburchak jadvali. Har bir son element deb ataladi."),
      L('Matrices store structured data compactly: a spreadsheet, a game board, the pixels of an image, or the coefficients of a system of equations.', "Matritsalar tuzilgan ma'lumotni ixcham saqlaydi: jadval, o'yin maydoni, rasm piksellari yoki tenglamalar sistemasi koeffitsientlari."),
      L('What makes a matrix more than a table is algebra: matrices can be added, multiplied and inverted, and each operation has a precise meaning.', "Matritsani oddiy jadvaldan ajratadigan narsa — algebra: matritsalarni qo'shish, ko'paytirish va teskarisini topish mumkin, har bir amalning aniq ma'nosi bor."),
    ],
    formula: 'A = [ a₁₁ a₁₂ a₁₃ ; a₂₁ a₂₂ a₂₃ ]',
    visual: { M: A1, name: 'A' },
    demo: 'editor',
    quiz: [
      mc(L('A matrix with 2 rows and 3 columns is described as…', '2 satr va 3 ustunli matritsa qanday ataladi?'), ['2 × 3', '3 × 2', '6', '5'], 0, L('Dimensions are always rows × columns.', "O'lcham har doim satrlar × ustunlar.")),
      mcNum(L('How many entries does a 4 × 5 matrix have?', '4 × 5 matritsada nechta element bor?'), 20, [9, 45, 25], L('4 rows × 5 entries in each row = 20.', '4 satr × har satrda 5 ta element = 20.')),
      mc(L('Which of these is NOT a valid matrix?', 'Qaysi biri matritsa EMAS?'), ['[ 7 ]', '[ 1 2 ; 3 ]', '[ 1 ; 2 ]', '[ 0 0 ]'], 1, L('Every row must have the same number of entries. [1 2 ; 3] has rows of length 2 and 1.', "Har bir satrda elementlar soni bir xil bo'lishi kerak. [1 2 ; 3] da satrlar uzunligi 2 va 1.")),
    ],
    practice: ['dims', 'entry'],
  },
  {
    id: 'rows-columns-dimensions',
    title: L('Rows, columns and dimensions', "Satrlar, ustunlar va o'lcham"),
    summary: L('m × n: rows first, then columns.', 'm × n: avval satrlar, keyin ustunlar.'),
    body: [
      L('Rows run horizontally (left to right). Columns run vertically (top to bottom).', "Satrlar gorizontal (chapdan o'ngga), ustunlar vertikal (yuqoridan pastga) yo'nalgan."),
      L('A matrix with m rows and n columns has dimensions m × n, read “m by n”. A 3 × 2 matrix and a 2 × 3 matrix are different shapes.', "m satr va n ustunli matritsaning o'lchami m × n (“m ga n”). 3 × 2 va 2 × 3 matritsalar turli shakllar."),
      L('Special shapes: a 1 × n matrix is a row vector, an m × 1 matrix is a column vector, and an n × n matrix is square.', "Maxsus shakllar: 1 × n — satr vektor, m × 1 — ustun vektor, n × n — kvadrat matritsa."),
    ],
    visual: { M: [[1, 2], [3, 4], [5, 6]], name: 'B', highlight: 'row0' },
    demo: 'dims',
    quiz: [
      mc(L('What are the dimensions of [1 2 ; 3 4 ; 5 6]?', '[1 2 ; 3 4 ; 5 6] ning o‘lchami qanday?'), ['3 × 2', '2 × 3', '6 × 1', '3 × 3'], 0, L('Three rows, two columns.', 'Uchta satr, ikkita ustun.')),
      mc(L('Rows run…', 'Satrlar qaysi yo‘nalishda?'), [L('horizontally', 'gorizontal'), L('vertically', 'vertikal'), L('diagonally', 'diagonal')], 0, L('Rows are horizontal lines of entries.', 'Satrlar — elementlarning gorizontal chiziqlari.')),
      mc(L('A 1 × 4 matrix is called a…', '1 × 4 matritsa qanday ataladi?'), [L('row vector', 'satr vektor'), L('column vector', 'ustun vektor'), L('square matrix', 'kvadrat matritsa')], 0, L('One row → row vector.', 'Bitta satr → satr vektor.')),
    ],
    practice: ['dims', 'rowsCount', 'colsCount'],
  },
  {
    id: 'indexing',
    title: L('Matrix indexing', 'Matritsa indekslari'),
    summary: L('aᵢⱼ: row i, column j — always in that order.', 'aᵢⱼ: i-satr, j-ustun — doim shu tartibda.'),
    body: [
      L('The entry in row i and column j of matrix A is written aᵢⱼ (or A[i][j]). The first index is always the row.', "A matritsaning i-satr va j-ustundagi elementi aᵢⱼ (yoki A[i][j]) deb yoziladi. Birinchi indeks har doim satr."),
      L('Mathematics counts from 1, so the top-left entry is a₁₁. Many programming languages count from 0, so the same entry is A[0][0] in code.', "Matematikada sanoq 1 dan boshlanadi, shuning uchun chap yuqori element a₁₁. Ko'p dasturlash tillarida sanoq 0 dan, kodda bu A[0][0]."),
      L('Rows and columns are different dimensions: a₂₃ and a₃₂ are generally different entries.', "Satr va ustun — turli o'lchovlar: a₂₃ va a₃₂ odatda turli elementlar."),
    ],
    visual: { M: A1, name: 'A', highlight: 'cell12' },
    demo: 'indexing',
    quiz: [
      mcNum(L('For A = [4 7 1 ; 2 9 5], what is a₂₃?', 'A = [4 7 1 ; 2 9 5] uchun a₂₃ nechaga teng?'), A1[1][2], [A1[2 - 1][1], A1[0][2], 9], L('Row 2 is (2, 9, 5); its third entry is 5.', '2-satr (2, 9, 5); uchinchi elementi 5.')),
      mcNum(L('For the same A, what is a₁₂?', 'Shu A uchun a₁₂ nechaga teng?'), A1[0][1], [A1[1][0], 4, 9], L('Row 1, column 2 → 7.', '1-satr, 2-ustun → 7.')),
      mc(L('In aᵢⱼ, the index i refers to…', 'aᵢⱼ da i indeksi nimani bildiradi?'), [L('the row', 'satrni'), L('the column', 'ustunni'), L('the value', 'qiymatni')], 0, L('Row first, column second.', 'Avval satr, keyin ustun.')),
    ],
    practice: ['entry'],
  },
  {
    id: 'types-of-matrices',
    title: L('Types of matrices', 'Matritsa turlari'),
    summary: L('Square, identity, zero, diagonal, triangular, symmetric.', 'Kvadrat, birlik, nol, diagonal, uchburchak, simmetrik.'),
    body: [
      L('Square: same number of rows and columns. The main diagonal runs from a₁₁ to aₙₙ.', "Kvadrat: satr va ustunlar soni teng. Bosh diagonal a₁₁ dan aₙₙ gacha."),
      L('Identity I: 1 on the main diagonal, 0 elsewhere. It behaves like the number 1: AI = IA = A. Zero matrix: every entry is 0.', "Birlik I: bosh diagonalda 1, qolgan joyda 0. U 1 soni kabi ishlaydi: AI = IA = A. Nol matritsa: barcha elementlar 0."),
      L('Diagonal: only diagonal entries may be non-zero. Upper triangular: zeros below the diagonal; lower triangular: zeros above. Symmetric: A = Aᵀ, so aᵢⱼ = aⱼᵢ.', "Diagonal: faqat diagonal elementlari nol bo'lmasligi mumkin. Yuqori uchburchak: diagonal ostida nollar; quyi uchburchak: diagonal ustida nollar. Simmetrik: A = Aᵀ, ya'ni aᵢⱼ = aⱼᵢ."),
    ],
    visual: { M: M.identityMatrix(3), name: 'I₃', highlight: 'diag' },
    demo: 'types',
    quiz: [
      mcNum(L('What is the trace (diagonal sum) of the 4 × 4 identity?', '4 × 4 birlik matritsaning izi (diagonal yig‘indisi) nechaga teng?'), M.traceMatrix(M.identityMatrix(4)).result, [1, 0, 16], L('Four 1s on the diagonal.', 'Diagonalda to‘rtta 1.')),
      mc(L('An upper triangular matrix has zeros…', 'Yuqori uchburchak matritsada nollar qayerda?'), [L('below the main diagonal', 'bosh diagonal ostida'), L('above the main diagonal', 'bosh diagonal ustida'), L('on the diagonal', 'diagonalda')], 0, L('Only the upper part (including the diagonal) may be non-zero.', "Faqat yuqori qism (diagonal bilan) nol bo'lmasligi mumkin.")),
      mc(L('A symmetric matrix satisfies…', 'Simmetrik matritsa qaysi shartni qanoatlantiradi?'), ['A = Aᵀ', 'A = −A', 'A = I', 'det A = 0'], 0, L('Mirror image across the diagonal: aᵢⱼ = aⱼᵢ.', "Diagonalga nisbatan ko'zgu: aᵢⱼ = aⱼᵢ.")),
    ],
    practice: ['trace', 'entry'],
  },
  {
    id: 'addition-subtraction',
    title: L('Addition and subtraction', "Qo'shish va ayirish"),
    summary: L('Entry by entry — only for matching dimensions.', "Elementma-element — faqat bir xil o'lchamlar uchun."),
    body: [
      L('To add two matrices, add matching entries: (A + B)ᵢⱼ = aᵢⱼ + bᵢⱼ. Subtraction works the same way.', "Ikki matritsani qo'shish uchun mos elementlar qo'shiladi: (A + B)ᵢⱼ = aᵢⱼ + bᵢⱼ. Ayirish ham xuddi shunday."),
      L('Both matrices must have exactly the same dimensions. A 2 × 3 matrix cannot be added to a 3 × 2 matrix — there is no matching entry for each position.', "Ikkala matritsa aynan bir xil o'lchamda bo'lishi kerak. 2 × 3 ni 3 × 2 ga qo'shib bo'lmaydi — har bir joy uchun mos element yo'q."),
      L('Addition is commutative (A + B = B + A) and associative. The zero matrix is the identity for addition.', "Qo'shish o'rin almashtirish (A + B = B + A) va guruhlash xossalariga ega. Nol matritsa qo'shish uchun neytral element."),
    ],
    visual: { M: S5A, name: 'A' },
    demo: 'add',
    demoData: { A: S5A, B: S5B },
    quiz: [
      mcNum(L('A = [1 −2 ; 3 0], B = [4 1 ; −1 6]. What is (A + B)₁₂?', 'A = [1 −2 ; 3 0], B = [4 1 ; −1 6]. (A + B)₁₂ nechaga teng?'), M.addMatrices(S5A, S5B).result[0][1], [-3, 3, 1], L('−2 + 1 = −1.', '−2 + 1 = −1.')),
      mc(L('Can a 2 × 3 matrix be added to a 3 × 2 matrix?', '2 × 3 matritsani 3 × 2 ga qo‘shish mumkinmi?'), [L('No', "Yo'q"), L('Yes', 'Ha')], 0, L('Dimensions must match exactly.', "O'lchamlar aynan mos bo'lishi kerak.")),
      mc(L('A − A equals…', 'A − A nimaga teng?'), [L('the zero matrix', 'nol matritsa'), 'I', 'A', '2A'], 0, L('Every entry minus itself is 0.', 'Har bir element o‘zidan ayirilsa 0.')),
    ],
    practice: ['addCell', 'subCell', 'addFull'],
  },
  {
    id: 'scalar-multiplication',
    title: L('Scalar multiplication', "Skalyarga ko'paytirish"),
    summary: L('Multiply every entry by the same number.', "Har bir elementni bir xil songa ko'paytirish."),
    body: [
      L('A scalar is a single number. kA multiplies every entry of A by k: (kA)ᵢⱼ = k·aᵢⱼ.', "Skalyar — bitta son. kA da A ning har bir elementi k ga ko'paytiriladi: (kA)ᵢⱼ = k·aᵢⱼ."),
      L('Geometrically, scaling by k stretches (k > 1), shrinks (0 < k < 1) or flips (k < 0) every vector the matrix produces.', "Geometrik jihatdan k ga ko'paytirish cho'zadi (k > 1), qisqartiradi (0 < k < 1) yoki teskari aylantiradi (k < 0)."),
      L('It distributes over addition: k(A + B) = kA + kB, and (−1)A = −A.', "U qo'shishga nisbatan taqsimlanadi: k(A + B) = kA + kB, va (−1)A = −A."),
    ],
    visual: { M: [[1, -2], [0, 4]], name: 'A' },
    demo: 'scalar',
    demoData: { A: [[1, -2], [0, 4]], k: 3 },
    quiz: [
      mcNum(L('What is entry (1, 2) of 3·[1 −2 ; 0 4]?', '3·[1 −2 ; 0 4] ning (1, 2) elementi nechaga teng?'), M.scalarMultiply([[1, -2], [0, 4]], 3).result[0][1], [-2, 6, 1], L('3 × (−2) = −6.', '3 × (−2) = −6.')),
      mc(L('(−1)·A is the same as…', '(−1)·A nimaga teng?'), ['−A', 'Aᵀ', 'A⁻¹', 'I'], 0, L('Every entry changes sign.', 'Har bir elementning ishorasi o‘zgaradi.')),
      mc(L('Is k(A + B) = kA + kB always true?', 'k(A + B) = kA + kB har doim to‘g‘rimi?'), [L('Yes', 'Ha'), L('No', "Yo'q")], 0, L('Distributivity holds entry by entry.', 'Taqsimlash elementma-element bajariladi.')),
    ],
    practice: ['scalarCell'],
  },
  {
    id: 'matrix-multiplication',
    title: L('Matrix multiplication', "Matritsalarni ko'paytirish"),
    summary: L('Row · column dot products; inner dimensions must match.', "Satr · ustun skalyar ko'paytmalari; ichki o'lchamlar teng bo'lishi shart."),
    body: [
      L('For A (m × n) and B (n × p), the product AB is m × p. Entry (i, j) is the dot product of row i of A with column j of B: Σₖ aᵢₖ bₖⱼ.', "A (m × n) va B (n × p) uchun AB ko'paytma m × p bo'ladi. (i, j) element — A ning i-satri va B ning j-ustunining skalyar ko'paytmasi: Σₖ aᵢₖ bₖⱼ."),
      L('The inner numbers must match: (m × n)(n × p). Otherwise the product is undefined.', "Ichki sonlar teng bo'lishi kerak: (m × n)(n × p). Aks holda ko'paytma aniqlanmagan."),
      L('Order matters: in general AB ≠ BA. Multiplication represents doing one transformation after another.', "Tartib muhim: odatda AB ≠ BA. Ko'paytma bir o'zgartirishdan keyin ikkinchisini bajarishni ifodalaydi."),
    ],
    visual: { M: S7A, name: 'A', highlight: 'row0' },
    demo: 'multiply',
    demoData: { A: S7A, B: S7B },
    quiz: [
      mc(L('A is 2 × 3 and B is 3 × 4. AB is…', 'A — 2 × 3, B — 3 × 4. AB qanday?'), ['2 × 4', '3 × 3', '4 × 2', L('undefined', 'aniqlanmagan')], 0, L('Outer numbers give the shape: 2 × 4.', 'Tashqi sonlar shaklni beradi: 2 × 4.')),
      mcNum(L('A = [1 2 ; 3 4], B = [0 1 ; 5 −2]. What is (AB)₂₁?', 'A = [1 2 ; 3 4], B = [0 1 ; 5 −2]. (AB)₂₁ nechaga teng?'), M.multiplyMatrices(S7A, S7B).result[1][0], [3, 10, 15], L('Row 2 of A · column 1 of B = 3·0 + 4·5 = 20.', 'A ning 2-satri · B ning 1-ustuni = 3·0 + 4·5 = 20.')),
      mc(L('For square matrices, is AB always equal to BA?', 'Kvadrat matritsalar uchun AB har doim BA ga tengmi?'), [L('No', "Yo'q"), L('Yes', 'Ha')], 0, L('Matrix multiplication is not commutative.', "Matritsa ko'paytmasi o'rin almashtirish xossasiga ega emas.")),
    ],
    practice: ['productDims', 'mulCell', 'mulFull'],
  },
  {
    id: 'transpose',
    title: L('Transpose', 'Transponirlash'),
    summary: L('Rows become columns: (Aᵀ)ᵢⱼ = aⱼᵢ.', 'Satrlar ustunlarga aylanadi: (Aᵀ)ᵢⱼ = aⱼᵢ.'),
    body: [
      L('The transpose Aᵀ flips a matrix over its main diagonal: row i of A becomes column i of Aᵀ.', "Transponirlangan Aᵀ matritsani bosh diagonal bo'ylab aks ettiradi: A ning i-satri Aᵀ ning i-ustuniga aylanadi."),
      L('An m × n matrix becomes n × m. Transposing twice returns the original: (Aᵀ)ᵀ = A.', "m × n matritsa n × m ga aylanadi. Ikki marta transponirlash asl matritsani qaytaradi: (Aᵀ)ᵀ = A."),
      L('For products the order reverses: (AB)ᵀ = BᵀAᵀ.', "Ko'paytmada tartib teskari bo'ladi: (AB)ᵀ = BᵀAᵀ."),
    ],
    visual: { M: [[1, 2, 3], [4, 5, 6]], name: 'A', highlight: 'row0' },
    demo: 'transpose',
    demoData: { A: [[1, 2, 3], [4, 5, 6]] },
    quiz: [
      mc(L('A is 2 × 5. Aᵀ is…', 'A — 2 × 5. Aᵀ qanday?'), ['5 × 2', '2 × 5', '10 × 1', '5 × 5'], 0, L('Dimensions swap.', 'O‘lchamlar o‘rin almashadi.')),
      mc(L('(AB)ᵀ equals…', '(AB)ᵀ nimaga teng?'), ['BᵀAᵀ', 'AᵀBᵀ', 'AB', 'BA'], 0, L('The order reverses.', 'Tartib teskari bo‘ladi.')),
      mcNum(L('If A = [1 2 3 ; 4 5 6], what is (Aᵀ)₃₂?', 'A = [1 2 3 ; 4 5 6] bo‘lsa, (Aᵀ)₃₂ nechaga teng?'), M.transposeMatrix([[1, 2, 3], [4, 5, 6]]).result[2][1], [3, 5, 2], L('(Aᵀ)₃₂ = a₂₃ = 6.', '(Aᵀ)₃₂ = a₂₃ = 6.')),
    ],
    practice: ['transposeCell', 'transposeDims'],
  },
  {
    id: 'determinants',
    title: L('Determinants', 'Determinantlar'),
    summary: L('One number that measures area scaling and invertibility.', "Yuza o'zgarishi va teskarilanuvchanlikni o'lchaydigan bitta son."),
    body: [
      L('Every square matrix has a determinant det(A). For 2 × 2: det [a b ; c d] = ad − bc.', "Har bir kvadrat matritsaning determinanti det(A) bor. 2 × 2 uchun: det [a b ; c d] = ad − bc."),
      L('For larger matrices, use cofactor expansion along a row, or reduce to triangular form and multiply the diagonal (tracking sign flips from row swaps).', "Kattaroq matritsalar uchun satr bo'yicha yoyish yoki uchburchak shaklga keltirib, diagonalni ko'paytirish (satr almashinuvidagi ishora o'zgarishini hisobga olib)."),
      L('Geometrically |det A| is the area (2D) or volume (3D) scale factor. det A = 0 means the transformation squashes space flat, so A has no inverse.', "Geometrik jihatdan |det A| — yuza (2D) yoki hajm (3D) koeffitsienti. det A = 0 bo'lsa, fazo yassilanadi va A ning teskarisi bo'lmaydi."),
    ],
    formula: 'det [a b ; c d] = ad − bc',
    visual: { M: D9, name: 'A' },
    demo: 'det',
    demoData: { A: [[2, -3, 1], [2, 0, -1], [1, 4, 5]] },
    quiz: [
      mcNum(L('det [3 1 ; 4 2] = ?', 'det [3 1 ; 4 2] = ?'), M.determinant(D9).result, [10, -2, 6], L('3·2 − 1·4 = 2.', '3·2 − 1·4 = 2.')),
      mcNum(L('det(I₅) = ?', 'det(I₅) = ?'), M.determinant(M.identityMatrix(5)).result, [5, 0, 25], L('The identity does not change area.', "Birlik matritsa yuzani o'zgartirmaydi.")),
      mc(L('Swapping two rows changes the determinant by…', "Ikki satrni almashtirish determinantni qanday o'zgartiradi?"), [L('flipping its sign', 'ishorasini teskari qiladi'), L('nothing', "o'zgartirmaydi"), L('making it 0', "0 qiladi")], 0, L('Each row swap multiplies det by −1.', 'Har bir almashinuv det ni −1 ga ko‘paytiradi.')),
    ],
    practice: ['det2', 'det3', 'area'],
  },
  {
    id: 'inverse-matrices',
    title: L('Inverse matrices', 'Teskari matritsalar'),
    summary: L('A⁻¹ undoes A — it exists exactly when det A ≠ 0.', "A⁻¹ A ning ta'sirini bekor qiladi — faqat det A ≠ 0 bo'lganda mavjud."),
    body: [
      L('The inverse of a square matrix A is the matrix A⁻¹ with A·A⁻¹ = A⁻¹·A = I.', "Kvadrat A matritsaning teskarisi — A·A⁻¹ = A⁻¹·A = I shartini qanoatlantiruvchi A⁻¹."),
      L('It exists if and only if det A ≠ 0. For 2 × 2: A⁻¹ = (1/det A)·[d −b ; −c a].', "U faqat det A ≠ 0 bo'lgandagina mavjud. 2 × 2 uchun: A⁻¹ = (1/det A)·[d −b ; −c a]."),
      L('In general, row-reduce [A | I]: when the left side becomes I, the right side is A⁻¹. If a pivot is missing, A is singular.', "Umuman olganda [A | I] ni soddalashtiramiz: chap tomon I bo'lganda, o'ng tomon A⁻¹. Tayanch yetishmasa, A xos (singulyar)."),
    ],
    formula: 'A⁻¹ = adj(A) / det(A)',
    visual: { M: [[4, 7], [2, 6]], name: 'A' },
    demo: 'inverse',
    demoData: { A: [[4, 7], [2, 6]] },
    quiz: [
      mc(L('A square matrix has an inverse exactly when…', 'Kvadrat matritsa qachon teskarilanuvchi?'), ['det A ≠ 0', 'det A = 0', 'A = Aᵀ', L('A has no zeros', "A da nol yo'q")], 0, L('Non-zero determinant ⇔ invertible.', "Nol bo'lmagan determinant ⇔ teskarilanuvchi.")),
      mcNum(L('What is entry (2, 2) of [2 0 ; 0 4]⁻¹?', '[2 0 ; 0 4]⁻¹ ning (2, 2) elementi nechaga teng?'), M.inverseMatrix([[2, 0], [0, 4]]).result[1][1], [4, 0.5, 2], L('Diagonal inverse: 1/4 = 0.25.', 'Diagonal teskari: 1/4 = 0,25.')),
      mc(L('A·A⁻¹ equals…', 'A·A⁻¹ nimaga teng?'), ['I', 'A', '0', 'Aᵀ'], 0, L('That is the definition.', "Bu ta'rifning o'zi.")),
    ],
    practice: ['singular', 'inverseCell', 'detInverse'],
  },
  {
    id: 'rank-independence',
    title: L('Rank and linear independence', 'Rang va chiziqli erklilik'),
    summary: L('How many truly different directions the rows carry.', "Satrlar nechta haqiqatan turli yo'nalishga ega."),
    body: [
      L('Vectors are linearly independent if none of them is a combination of the others.', "Vektorlar chiziqli erkli, agar ularning hech biri boshqalarining kombinatsiyasi bo'lmasa."),
      L('The rank of a matrix is the number of linearly independent rows (equivalently, columns). Elimination reveals it: rank = number of pivots.', "Matritsaning rangi — chiziqli erkli satrlar (yoki ustunlar) soni. Yo'qotish usuli buni ko'rsatadi: rang = tayanchlar soni."),
      L('An m × n matrix has rank at most min(m, n). A square matrix is invertible exactly when it has full rank.', "m × n matritsaning rangi ko'pi bilan min(m, n). Kvadrat matritsa faqat to'liq rangda teskarilanuvchi."),
    ],
    visual: { M: R11, name: 'A' },
    demo: 'rank',
    demoData: { A: R11 },
    quiz: [
      mcNum(L('rank [1 2 ; 2 4] = ?', 'rank [1 2 ; 2 4] = ?'), M.matrixRank([[1, 2], [2, 4]]).result, [2, 0, 4], L('Row 2 = 2 × row 1, so only one independent row.', '2-satr = 2 × 1-satr, demak bitta erkli satr.')),
      mcNum(L('rank of [1 2 3 ; 2 4 6 ; 1 0 1] = ?', '[1 2 3 ; 2 4 6 ; 1 0 1] ning rangi = ?'), M.matrixRank(R11).result, [3, 1, 0], L('Row 2 duplicates row 1 (×2); rows 1 and 3 are independent.', '2-satr 1-satrni takrorlaydi (×2); 1 va 3-satrlar erkli.')),
      mcNum(L('The maximum possible rank of a 3 × 5 matrix is…', '3 × 5 matritsaning eng katta mumkin rangi…'), Math.min(3, 5), [5, 15, 8], L('rank ≤ min(rows, columns).', 'rang ≤ min(satrlar, ustunlar).')),
    ],
    practice: ['rank'],
  },
  {
    id: 'linear-systems',
    title: L('Systems of linear equations', 'Chiziqli tenglamalar sistemalari'),
    summary: L('Ax = b: one solution, none, or infinitely many.', "Ax = b: bitta, hech qanday yoki cheksiz ko'p yechim."),
    body: [
      L('A system of linear equations can be written as Ax = b: A holds the coefficients, x the unknowns, b the constants.', "Chiziqli tenglamalar sistemasini Ax = b ko'rinishda yozish mumkin: A — koeffitsientlar, x — noma'lumlar, b — o'ng tomon."),
      L('If A is square with det A ≠ 0 there is exactly one solution, x = A⁻¹b.', "Agar A kvadrat va det A ≠ 0 bo'lsa, aynan bitta yechim bor: x = A⁻¹b."),
      L('Otherwise elimination decides: a row reading 0 = c (c ≠ 0) means no solution; fewer pivots than unknowns with no contradiction means infinitely many, with n − rank free variables.', "Aks holda yo'qotish usuli hal qiladi: 0 = c (c ≠ 0) satri yechim yo'qligini bildiradi; ziddiyatsiz tayanchlar noma'lumlardan kam bo'lsa — cheksiz ko'p yechim, n − rang ta erkin o'zgaruvchi bilan."),
    ],
    formula: '2x + y = 5,  x − y = 1  →  [2 1 ; 1 −1]·[x ; y] = [5 ; 1]',
    visual: { M: [[2, 1, 5], [1, -1, 1]], name: '[A|b]', augmentAt: 2 },
    demo: 'system',
    demoData: { A: [[2, 1], [1, -1]], b: [5, 1] },
    quiz: [
      mcNum(L('Solve 2x + y = 5, x − y = 1. What is x?', '2x + y = 5, x − y = 1 ni yeching. x nechaga teng?'), M.solveLinearSystem([[2, 1], [1, -1]], [5, 1]).result[0], [1, 3, 2.5], L('Add the equations: 3x = 6, so x = 2.', 'Tenglamalarni qo‘shamiz: 3x = 6, x = 2.')),
      mc(L('After elimination a row reads 0 0 | 5. The system has…', "Yo'qotishdan keyin satr 0 0 | 5 bo'ldi. Sistema…"), [L('no solution', "yechimga ega emas"), L('one solution', 'bitta yechimga ega'), L('infinitely many', "cheksiz ko'p yechimga ega")], 0, L('0 = 5 is impossible.', '0 = 5 bo‘lishi mumkin emas.')),
      mcNum(L('4 unknowns, rank 2, consistent. How many free variables?', "4 noma'lum, rang 2, birgalikda. Nechta erkin o'zgaruvchi?"), 4 - 2, [4, 0, 6], L('free = n − rank = 4 − 2.', 'erkin = n − rang = 4 − 2.')),
    ],
    practice: ['solveX'],
  },
  {
    id: 'gaussian-elimination',
    title: L('Gaussian elimination', "Gauss usuli (yo'qotish)"),
    summary: L('Three row operations turn any matrix into echelon form.', "Uchta satr amali istalgan matritsani pog'onali shaklga keltiradi."),
    body: [
      L('Elementary row operations: swap two rows; multiply a row by a non-zero number; add a multiple of one row to another. None of them changes the solution set.', "Elementar satr amallari: ikki satrni almashtirish; satrni nol bo'lmagan songa ko'paytirish; bir satrga boshqasining karralisini qo'shish. Ulardan hech biri yechimlar to'plamini o'zgartirmaydi."),
      L('Gaussian elimination picks a pivot in each column and creates zeros below it, giving row echelon form (REF). Back-substitution then finds the unknowns.', "Gauss usuli har bir ustunda tayanch tanlab, uning ostida nollar hosil qiladi — pog'onali shakl (REF). So'ng teskari o'rniga qo'yish orqali noma'lumlar topiladi."),
      L('Gauss–Jordan continues: every pivot becomes 1 and is cleared above too, giving reduced row echelon form (RREF), where the solution can be read directly.', "Gauss–Jordan davom ettiradi: har bir tayanch 1 ga aylanadi va yuqorisi ham tozalanadi — keltirilgan pog'onali shakl (RREF), bunda yechim to'g'ridan-to'g'ri o'qiladi."),
    ],
    visual: { M: [[2, 1, -1, 8], [-3, -1, 2, -11], [-2, 1, 2, -3]], name: '[A|b]', augmentAt: 3 },
    demo: 'elimination',
    demoData: { A: [[2, 1, -1, 8], [-3, -1, 2, -11], [-2, 1, 2, -3]] },
    quiz: [
      mc(L('Which is NOT an elementary row operation?', 'Qaysi biri elementar satr amali EMAS?'), [L('Multiply a row by 0', "Satrni 0 ga ko'paytirish"), L('Swap two rows', 'Ikki satrni almashtirish'), L('Add 3 × row 1 to row 2', "2-satrga 3 × 1-satrni qo'shish")], 0, L('Multiplying by 0 destroys information — it is not reversible.', "0 ga ko'paytirish ma'lumotni yo'qotadi — uni qaytarib bo'lmaydi.")),
      mc(L('In row echelon form, entries below each pivot are…', "Pog'onali shaklda har bir tayanch ostidagi elementlar…"), ['0', '1', L('anything', 'istalgan'), L('negative', 'manfiy')], 0, L('That is what elimination creates.', "Yo'qotish aynan shuni hosil qiladi.")),
      mcNum(L('Solving [2 1 −1 | 8 ; −3 −1 2 | −11 ; −2 1 2 | −3] gives y = ?', '[2 1 −1 | 8 ; −3 −1 2 | −11 ; −2 1 2 | −3] dan y = ?'), M.solveLinearSystem([[2, 1, -1], [-3, -1, 2], [-2, 1, 2]], [8, -11, -3]).result[1], [2, -1, 1], L('The unique solution is (2, 3, −1).', 'Yagona yechim (2, 3, −1).')),
    ],
    practice: ['solveX', 'rank'],
  },
  {
    id: 'eigen',
    title: L('Eigenvalues and eigenvectors', 'Xos qiymatlar va xos vektorlar'),
    summary: L('Directions a matrix only stretches: Av = λv.', "Matritsa faqat cho'zadigan yo'nalishlar: Av = λv."),
    body: [
      L('A non-zero vector v is an eigenvector of A if Av = λv: A only scales it by the number λ, the eigenvalue.', "Nol bo'lmagan v vektor A ning xos vektori, agar Av = λv bo'lsa: A uni faqat λ soniga (xos qiymatga) cho'zadi."),
      L('Eigenvalues solve det(A − λI) = 0. For 2 × 2 this is λ² − tr(A)λ + det(A) = 0. Triangular matrices have their eigenvalues on the diagonal.', "Xos qiymatlar det(A − λI) = 0 ning yechimlari. 2 × 2 uchun: λ² − tr(A)λ + det(A) = 0. Uchburchak matritsalarda xos qiymatlar diagonalda."),
      L('Some real matrices (like rotations) have complex eigenvalues — no real direction is preserved. Real symmetric matrices always have real eigenvalues.', "Ba'zi haqiqiy matritsalar (masalan, burish) kompleks xos qiymatlarga ega — hech bir haqiqiy yo'nalish saqlanmaydi. Haqiqiy simmetrik matritsalar doim haqiqiy xos qiymatlarga ega."),
    ],
    formula: 'det(A − λI) = 0',
    visual: { M: [[4, 1], [2, 3]], name: 'A' },
    demo: 'eigen',
    demoData: { A: [[4, 1], [2, 3]] },
    quiz: [
      mcNum(L('What is the largest eigenvalue of [4 1 ; 2 3]?', '[4 1 ; 2 3] ning eng katta xos qiymati?'), M.eigen([[4, 1], [2, 3]]).result[0].value, [4, 3, 7], L('λ² − 7λ + 10 = 0 → λ = 5 or 2.', 'λ² − 7λ + 10 = 0 → λ = 5 yoki 2.')),
      mc(L('The eigenvalues of [2 7 ; 0 5] are…', '[2 7 ; 0 5] ning xos qiymatlari…'), ['2 and 5', '7 and 0', '2 and 7', '9'], 0, L('Triangular: read the diagonal.', "Uchburchak: diagonalni o'qing.")),
      mc(L('Av = λv means A…', 'Av = λv nimani bildiradi?'), [L('only scales v', "v ni faqat cho'zadi"), L('rotates v', 'v ni buradi'), L('deletes v', "v ni o'chiradi")], 0, L('The direction is preserved (or reversed if λ < 0).', "Yo'nalish saqlanadi (λ < 0 bo'lsa teskari).")),
    ],
    practice: ['trace', 'det2'],
  },
  {
    id: 'computer-graphics',
    title: L('Matrices in computer graphics', 'Kompyuter grafikasida matritsalar'),
    summary: L('Rotate, scale and project every vertex with one product.', "Har bir uchni bitta ko'paytma bilan burish, masshtablash va proyeksiyalash."),
    body: [
      L('Every point of a shape is a vector. Multiplying by a 2 × 2 matrix moves all of them at once: scaling, rotation, reflection, shear.', "Shaklning har bir nuqtasi — vektor. 2 × 2 matritsaga ko'paytirish ularning hammasini birdan siljitadi: masshtab, burish, aks ettirish, siljitish."),
      L('Rotation by θ: [cos θ −sin θ ; sin θ cos θ]. Its determinant is 1, so area is preserved. A reflection has determinant −1.', "θ burchakka burish: [cos θ −sin θ ; sin θ cos θ]. Determinanti 1, demak yuza saqlanadi. Aks ettirishning determinanti −1."),
      L('3D engines use 4 × 4 matrices (homogeneous coordinates) so translation can be a matrix product too, then project onto the 2D screen.', "3D dvigatellar 4 × 4 matritsalardan (bir jinsli koordinatalar) foydalanadi, shunda siljitish ham ko'paytma bo'ladi, so'ng 2D ekranga proyeksiyalanadi."),
    ],
    visual: { M: [[0, -1], [1, 0]], name: 'R₉₀' },
    demo: 'transform',
    quiz: [
      mc(L('Which matrix rotates the plane by 90° counter-clockwise?', "Qaysi matritsa tekislikni soat strelkasiga qarshi 90° buradi?"), ['[0 −1 ; 1 0]', '[0 1 ; 1 0]', '[1 0 ; 0 −1]', '[2 0 ; 0 2]'], 0, L('î → (0, 1) and ĵ → (−1, 0).', 'î → (0, 1) va ĵ → (−1, 0).')),
      mcNum(L('det of any rotation matrix = ?', 'Istalgan burish matritsasining det = ?'), M.detValue([[Math.cos(0.7), -Math.sin(0.7)], [Math.sin(0.7), Math.cos(0.7)]]), [0, -1, 2], L('cos²θ + sin²θ = 1.', 'cos²θ + sin²θ = 1.')),
      mcNum(L('det [1 0 ; 0 −1] (reflection) = ?', 'det [1 0 ; 0 −1] (aks) = ?'), M.detValue([[1, 0], [0, -1]]), [1, 0, 2], L('Reflections flip orientation.', "Aks ettirish yo'nalishni teskari qiladi.")),
    ],
    practice: ['area', 'powerCell'],
  },
  {
    id: 'machine-learning',
    title: L('Matrices in machine learning', "Mashinaviy o'qitishda matritsalar"),
    summary: L('A neural-network layer is W·x + b.', 'Neyron tarmoq qatlami — W·x + b.'),
    body: [
      L('A dataset is a matrix: each row is an example, each column a feature. Model parameters are stored in weight matrices.', "Ma'lumotlar to'plami — matritsa: har satr misol, har ustun belgi. Model parametrlari og'irlik matritsalarida saqlanadi."),
      L('A dense layer computes h = activation(W·x + b): a matrix-vector product, a bias vector added, then a non-linear function such as ReLU(z) = max(0, z).', "Zich qatlam h = faollashtirish(W·x + b) ni hisoblaydi: matritsa-vektor ko'paytmasi, siljish vektori qo'shiladi, so'ng ReLU(z) = max(0, z) kabi nochiziqli funksiya."),
      L('Training adjusts W and b to reduce error. GPUs exist largely because they multiply matrices extremely fast.', "O'qitish xatoni kamaytirish uchun W va b ni o'zgartiradi. GPU lar asosan matritsalarni juda tez ko'paytirgani uchun mavjud."),
    ],
    formula: 'h = ReLU(W·x + b)',
    visual: { M: [[0.5, -1], [1, 0.5], [-0.3, 0.8]], name: 'W' },
    demo: 'nn',
    quiz: [
      mc(L('W is 3 × 2 and x is 2 × 1. W·x is…', "W — 3 × 2, x — 2 × 1. W·x qanday?"), ['3 × 1', '2 × 1', '3 × 2', L('undefined', 'aniqlanmagan')], 0, L('(3 × 2)(2 × 1) = 3 × 1.', '(3 × 2)(2 × 1) = 3 × 1.')),
      mcNum(L('ReLU(−2) = ?', 'ReLU(−2) = ?'), Math.max(0, -2), [-2, 2, 1], L('ReLU keeps positives, zeroes negatives.', 'ReLU musbatlarni saqlaydi, manfiylarni nolga aylantiradi.')),
      mcNum(L('W = [1 2], x = [3 ; 4], b = 1. W·x + b = ?', 'W = [1 2], x = [3 ; 4], b = 1. W·x + b = ?'), M.multiplyMatrices([[1, 2]], [[3], [4]]).result[0][0] + 1, [11, 10, 21], L('1·3 + 2·4 + 1 = 12.', '1·3 + 2·4 + 1 = 12.')),
    ],
    practice: ['mulCell', 'productDims'],
  },
  {
    id: 'image-processing',
    title: L('Matrices in image processing', 'Rasmga ishlov berishda matritsalar'),
    summary: L('A grayscale image is a matrix of brightness values.', "Kulrang rasm — yorqinlik qiymatlari matritsasi."),
    body: [
      L('A grayscale image with h × w pixels is an h × w matrix of brightness values, often 0 (black) to 255 (white). A colour image stacks three such matrices (red, green, blue).', "h × w pikselli kulrang rasm — h × w matritsa, odatda 0 (qora) dan 255 (oq) gacha. Rangli rasm uchta shunday matritsadan iborat (qizil, yashil, ko'k)."),
      L('Simple edits are matrix operations on pixel values: brighten by adding a constant, invert with 255 − A, flip across the diagonal with the transpose.', "Oddiy tahrirlar piksel qiymatlari ustidagi matritsa amallari: o'zgarmas qo'shib yoritish, 255 − A bilan inversiya, transponirlash bilan diagonal bo'ylab aks ettirish."),
      L('Blurring and edge detection use convolution: each output pixel is a weighted sum of its neighbours, with weights in a small kernel matrix. That is not ordinary matrix multiplication.', "Xiralashtirish va chegaralarni aniqlash konvolyutsiyadan foydalanadi: har bir natija piksel qo'shnilarining og'irlikli yig'indisi, og'irliklar kichik yadro matritsasida. Bu oddiy matritsa ko'paytmasi emas."),
    ],
    visual: { M: [[0, 64, 128], [64, 128, 192], [128, 192, 255]], name: 'img' },
    demo: 'image',
    quiz: [
      mcNum(L('How many values does a 28 × 28 grayscale image have?', '28 × 28 kulrang rasmda nechta qiymat bor?'), 28 * 28, [56, 2352, 28], L('28 × 28 = 784 pixels, one value each.', '28 × 28 = 784 piksel, har biriga bitta qiymat.')),
      mcNum(L('Inverting a pixel with value 200 (255 − A) gives…', '200 qiymatli pikselni invertlash (255 − A) natijasi…'), 255 - 200, [200, -200, 455], L('255 − 200 = 55.', '255 − 200 = 55.')),
      mc(L('A blur filter combines each pixel with its neighbours using…', "Xiralashtirish filtri har pikselni qo'shnilari bilan nima yordamida birlashtiradi?"), [L('a convolution kernel', 'konvolyutsiya yadrosi'), L('the transpose', 'transponirlash'), L('the determinant', 'determinant')], 0, L('Convolution slides a small weight matrix over the image.', 'Konvolyutsiya kichik og‘irlik matritsasini rasm bo‘ylab suradi.')),
    ],
    practice: ['addCell', 'scalarCell'],
  },
  {
    id: 'graphs-algorithms',
    title: L('Matrices in algorithms and graph theory', 'Algoritmlar va graflar nazariyasida matritsalar'),
    summary: L('Adjacency matrices, walks, and grids as graphs.', "Qo'shnilik matritsalari, yo'llar va graf sifatidagi to'rlar."),
    body: [
      L('A graph with n nodes can be stored as an n × n adjacency matrix: aᵢⱼ = 1 when there is an edge from i to j. Undirected graphs give symmetric matrices.', "n tugunli grafni n × n qo'shnilik matritsasi sifatida saqlash mumkin: i dan j ga qirra bo'lsa aᵢⱼ = 1. Yo'naltirilmagan graflar simmetrik matritsa beradi."),
      L('Powers count walks: (Aᵏ)ᵢⱼ is the number of walks of length k from i to j. Row sums give out-degrees.', "Darajalar yo'llarni sanaydi: (Aᵏ)ᵢⱼ — i dan j ga k uzunlikdagi yo'llar soni. Satr yig'indilari chiqish darajalarini beradi."),
      L('A maze is a grid matrix (0 = open, 1 = wall). BFS explores it ring by ring and finds the shortest path; DFS dives deep first.', "Labirint — to'r matritsa (0 = ochiq, 1 = devor). BFS uni halqama-halqa o'rganib, eng qisqa yo'lni topadi; DFS avval chuqurga boradi."),
    ],
    visual: { M: [[0, 1, 1, 0], [1, 0, 1, 1], [1, 1, 0, 1], [0, 1, 1, 0]], name: 'Adj' },
    demo: 'graph',
    quiz: [
      mc(L('The adjacency matrix of an undirected graph is always…', "Yo'naltirilmagan grafning qo'shnilik matritsasi doim…"), [L('symmetric', 'simmetrik'), L('invertible', 'teskarilanuvchi'), L('diagonal', 'diagonal')], 0, L('Edge i–j means both aᵢⱼ and aⱼᵢ are 1.', 'i–j qirra aᵢⱼ va aⱼᵢ ikkalasi 1 ekanini bildiradi.')),
      mcNum(L('For the 4-node graph shown, how many walks of length 2 go from node 1 to node 4?', "Ko'rsatilgan 4 tugunli grafda 1-tugundan 4-tugunga 2 uzunlikdagi nechta yo'l bor?"), M.matrixPower([[0, 1, 1, 0], [1, 0, 1, 1], [1, 1, 0, 1], [0, 1, 1, 0]], 2).result[0][3], [1, 0, 4], L('(A²)₁₄ = 2: 1→2→4 and 1→3→4.', '(A²)₁₄ = 2: 1→2→4 va 1→3→4.')),
      mc(L('Which algorithm guarantees the fewest moves in an unweighted maze?', "Og'irliksiz labirintda eng kam qadamni qaysi algoritm kafolatlaydi?"), ['BFS', 'DFS', L('Linear search', 'Chiziqli qidiruv')], 0, L('BFS explores in order of distance.', "BFS masofa tartibida o'rganadi.")),
    ],
    practice: ['bfsLen', 'powerCell'],
  },
];

export const lessonIndex = (id) => LESSONS.findIndex((l) => l.id === id);

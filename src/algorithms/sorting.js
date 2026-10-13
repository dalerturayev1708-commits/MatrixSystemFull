/**
 * Sorting algorithms that record every comparison and write so the UI can
 * replay them exactly. Each step: { type, indices, array, sorted }.
 *   type: 'compare' | 'swap' | 'write' | 'sorted'
 * The input array is never mutated.
 */
function recorder(input) {
  const arr = input.slice();
  const steps = [];
  const sorted = new Set();
  const push = (type, indices, extra = {}) => steps.push({ type, indices, array: arr.slice(), sorted: [...sorted], ...extra });
  return { arr, steps, sorted, push };
}

export function bubbleSort(input) {
  const { arr, steps, sorted, push } = recorder(input);
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {
      push('compare', [j, j + 1]);
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        swapped = true;
        push('swap', [j, j + 1]);
      }
    }
    sorted.add(n - 1 - i);
    push('sorted', [n - 1 - i]);
    if (!swapped) break;
  }
  for (let i = 0; i < n; i++) sorted.add(i);
  push('sorted', []);
  return { result: arr, steps };
}

export function selectionSort(input) {
  const { arr, steps, sorted, push } = recorder(input);
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    let min = i;
    for (let j = i + 1; j < n; j++) {
      push('compare', [min, j]);
      if (arr[j] < arr[min]) min = j;
    }
    if (min !== i) {
      [arr[i], arr[min]] = [arr[min], arr[i]];
      push('swap', [i, min]);
    }
    sorted.add(i);
    push('sorted', [i]);
  }
  for (let i = 0; i < n; i++) sorted.add(i);
  push('sorted', []);
  return { result: arr, steps };
}

export function insertionSort(input) {
  const { arr, steps, sorted, push } = recorder(input);
  for (let i = 1; i < arr.length; i++) {
    const v = arr[i];
    let j = i - 1;
    push('compare', [j, i]);
    while (j >= 0 && arr[j] > v) {
      arr[j + 1] = arr[j];
      push('write', [j + 1]);
      j--;
      if (j >= 0) push('compare', [j, j + 1]);
    }
    arr[j + 1] = v;
    push('write', [j + 1]);
  }
  for (let i = 0; i < arr.length; i++) sorted.add(i);
  push('sorted', []);
  return { result: arr, steps };
}

export function mergeSort(input) {
  const { arr, steps, sorted, push } = recorder(input);
  function merge(lo, mid, hi) {
    const left = arr.slice(lo, mid + 1);
    const right = arr.slice(mid + 1, hi + 1);
    let i = 0;
    let j = 0;
    let k = lo;
    while (i < left.length && j < right.length) {
      push('compare', [lo + i, mid + 1 + j], { range: [lo, hi] });
      if (left[i] <= right[j]) arr[k++] = left[i++];
      else arr[k++] = right[j++];
      push('write', [k - 1], { range: [lo, hi] });
    }
    while (i < left.length) { arr[k++] = left[i++]; push('write', [k - 1], { range: [lo, hi] }); }
    while (j < right.length) { arr[k++] = right[j++]; push('write', [k - 1], { range: [lo, hi] }); }
  }
  function sort(lo, hi) {
    if (lo >= hi) return;
    const mid = (lo + hi) >> 1;
    sort(lo, mid);
    sort(mid + 1, hi);
    merge(lo, mid, hi);
  }
  sort(0, arr.length - 1);
  for (let i = 0; i < arr.length; i++) sorted.add(i);
  push('sorted', []);
  return { result: arr, steps };
}

export const SORTERS = { bubble: bubbleSort, selection: selectionSort, insertion: insertionSort, merge: mergeSort };

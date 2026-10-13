/** Linear and binary search with recorded steps. */
export function linearSearch(arr, target) {
  const steps = [];
  for (let i = 0; i < arr.length; i++) {
    const hit = arr[i] === target;
    steps.push({ index: i, value: arr[i], hit });
    if (hit) return { index: i, steps, comparisons: i + 1 };
  }
  return { index: -1, steps, comparisons: arr.length };
}

/** Binary search — REQUIRES the array to be sorted ascending. */
export function binarySearch(arr, target) {
  for (let i = 1; i < arr.length; i++) {
    if (arr[i - 1] > arr[i]) return { index: -1, steps: [], comparisons: 0, error: 'err.notSorted' };
  }
  const steps = [];
  let lo = 0;
  let hi = arr.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const cmp = arr[mid] === target ? 'hit' : arr[mid] < target ? 'right' : 'left';
    steps.push({ lo, hi, mid, value: arr[mid], cmp });
    if (cmp === 'hit') return { index: mid, steps, comparisons: steps.length };
    if (cmp === 'right') lo = mid + 1;
    else hi = mid - 1;
  }
  return { index: -1, steps, comparisons: steps.length };
}

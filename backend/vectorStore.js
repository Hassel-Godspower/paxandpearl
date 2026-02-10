export function similarity(a, b) {
  const A = new Set(a.toLowerCase().split(" "));
  const B = new Set(b.toLowerCase().split(" "));

  let match = 0;
  A.forEach(w => B.has(w) && match++);

  return match / Math.max(A.size, 1);
}

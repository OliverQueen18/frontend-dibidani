/** Select only similar pixels connected to a seed, never isolated areas of the product. */
export function connectedBackground(data: Uint8ClampedArray, width: number, height: number,
                                    seeds: number[], tolerance: number): Uint8ClampedArray {
  const count = width * height;
  const selected = new Uint8ClampedArray(count);
  if (!count || !seeds.length) return selected;
  const reference = seeds[0] * 4;
  const limit = tolerance * tolerance * 3;
  const seen = new Uint8Array(count);
  const queue = new Int32Array(count);
  let head = 0, tail = 0;
  const visit = (p: number) => {
    if (p < 0 || p >= count || seen[p]) return;
    seen[p] = 1;
    const i = p * 4;
    const distance = (data[i] - data[reference]) ** 2 + (data[i + 1] - data[reference + 1]) ** 2
      + (data[i + 2] - data[reference + 2]) ** 2;
    if (data[i + 3] !== 0 && distance > limit) return;
    selected[p] = 255;
    queue[tail++] = p;
  };
  seeds.forEach(visit);
  while (head < tail) {
    const p = queue[head++], x = p % width;
    if (x > 0) visit(p - 1);
    if (x + 1 < width) visit(p + 1);
    visit(p - width);
    visit(p + width);
  }
  return selected;
}

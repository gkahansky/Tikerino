/**
 * Seeded PRNG - the exact reference from tikerino-engine-grading-spec-v1.md section 2.1.
 *
 * Any other PRNG is forbidden: replay must be bit-for-bit identical across client,
 * server, CI, and the future React Native port. Nothing in this file may be
 * "improved" - a change here silently invalidates every stored golden hash and
 * every audit record that references generatorVersion 1.x.
 */

/** FNV-1a, 32-bit, over the UTF-8 bytes of the seed string. */
export function fnv1a32(seed: string): number {
  const bytes = new TextEncoder().encode(seed);
  let h = 2166136261;
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i]!;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export interface Prng {
  /** Uniform in [0, 1). */
  next(): number;
  /** Uniform in [min, max). */
  uniform(min: number, max: number): number;
  /** Standard normal, Box-Muller off this same stream. */
  normal(): number;
  /** True with probability p. Always consumes exactly one draw. */
  bool(p: number): boolean;
}

/**
 * mulberry32, verbatim from the spec:
 *
 *   next(): h = (h + 0x6D2B79F5) >>> 0
 *           t = h
 *           t = Math.imul(t ^ (t >>> 15), t | 1)
 *           t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
 *           return ((t ^ (t >>> 14)) >>> 0) / 4294967296
 */
export function mulberry32(state: number): Prng {
  let h = state >>> 0;

  const next = (): number => {
    h = (h + 0x6d2b79f5) >>> 0;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    uniform: (min: number, max: number): number => min + (max - min) * next(),
    /**
     * Box-Muller from the same stream, per spec section 2.3.
     *
     * Resolution of an ambiguity the spec leaves open: Box-Muller produces a PAIR
     * of normals. We return z0 and DISCARD z1, consuming exactly two uniforms per
     * normal. Caching z1 for the next call would make a normal's value depend on
     * how many normals were drawn before it, which makes the stream position
     * fragile under any future refactor. Two draws per normal, always.
     */
    normal: (): number => {
      let u1 = next();
      // log(0) is -Infinity; redraw rather than bias the tail.
      while (u1 <= 0) u1 = next();
      const u2 = next();
      return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    },
    bool: (p: number): boolean => next() < p,
  };
}

/** Seed a stream straight from the pack's seed string. */
export function prngFromSeed(seed: string): Prng {
  return mulberry32(fnv1a32(seed));
}

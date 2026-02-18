import * as THREE from "three";

// ═══════════════════════════════════════════════════════════════════════════
// MATH UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

export const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
export const remap  = (v, a, b) => clamp((v - a) / (b - a));
export const lerp   = (a, b, t) => a + (b - a) * t;

export const smootherstep = t => t * t * t * (t * (t * 6 - 15) + 10);
export const outExpo      = t => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const outElastic   = t => {
  if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
};
export const outBack = t => {
  const c = 1.70158;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};

export const spring = (current, target, velocity, stiffness = 0.08, damping = 0.7) => {
  const force = (target - current) * stiffness;
  const newVel = (velocity + force) * damping;
  return { value: current + newVel, velocity: newVel };
};

// Random point on a sphere
export const randOnSphere = (r, rng = Math.random) => {
  const th = rng() * Math.PI * 2;
  const ph = Math.acos(2 * rng() - 1);
  return new THREE.Vector3(
    r * Math.sin(ph) * Math.cos(th),
    r * Math.cos(ph),
    r * Math.sin(ph) * Math.sin(th)
  );
};

// Deterministic pseudo-random number generator
export const prng = (seed = 42) => {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
};

// Orbital position: maps (radius, inclination, ascending node, angle) → Vector3
export const orbitPos = (radius, inc, asc, angle) => {
  const x0 = Math.cos(angle) * radius;
  const z0 = Math.sin(angle) * radius;
  const y1 = -z0 * Math.sin(inc);
  const z1 =  z0 * Math.cos(inc);
  return new THREE.Vector3(
    x0 * Math.cos(asc) - z1 * Math.sin(asc),
    y1,
    x0 * Math.sin(asc) + z1 * Math.cos(asc)
  );
};

// Convenience: position of a satellite data-object at time t
export const satPos = (s, t) => orbitPos(s.r, s.inc, s.asc, s.phase + s.speed * t);

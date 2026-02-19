// ═══════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM — Colors, Fonts, Phases, Labels
// ═══════════════════════════════════════════════════════════════════════════

export const EARTH_RADIUS = 2.2;
export const CAM_DIST = 8.5;
export const SAT_POOL = 200;
export const DEBRIS_N = 1400;
export const SCROLL_IDLE_MS = 200;

export const PHASES = { P0: 0, P1: 0.2, P2: 0.4, P3: 0.6, P4: 0.8 };
export const FOV_MAP = [50, 62, 36, 30, 44];

export const C = {
  bg: "#010812",
  text: "#e8edf5",
  textDim: "rgba(160,190,255,0.4)",
  textMicro: "rgba(160,190,255,0.25)",
  dim06: "rgba(255,255,255,0.06)",
  blue: "#4a90e2",
  cyan: "#00ffc8",
  orange: "#ff8800",
  red: "#ff3030",
  redDeep: "#ff6020",
  satNormal: "#a0c8ff",
  satActive: "#00ffc8",
  satDim: "#162038",
  debris: "#ff5518",
  debrisCool: "#ff8833",
};

export const ACCENT = ["#4a90e2", "#ff8800", "#00ffc8", "#ff3030", "#ff6020"];
export const STATUS_LABEL = ["NOMINAL", "WARNING", "MONITORING", "CRITICAL", "CASCADE"];

export const F = {
  display: "'Instrument Serif', Georgia, serif",
  mono: "'JetBrains Mono', 'Courier New', monospace",
  sans: "'Inter', -apple-system, sans-serif",
};

// Orbit definitions — colored, visible, beautiful
export const ORBIT_DEFS = [
  { r: 1.22, inc: 0.20,  asc: 0.0, color: "#2266ff", width: 1.2 },
  { r: 1.30, inc: -0.35, asc: 0.8, color: "#3388ee", width: 1.0 },
  { r: 1.36, inc: 0.50,  asc: 1.6, color: "#4499dd", width: 1.1 },
  { r: 1.42, inc: -0.15, asc: 2.4, color: "#55aacc", width: 0.9 },
  { r: 1.48, inc: 0.65,  asc: 3.2, color: "#44bbdd", width: 1.0 },
  { r: 1.54, inc: -0.45, asc: 4.0, color: "#33ccee", width: 0.8 },
  { r: 1.60, inc: 0.30,  asc: 4.8, color: "#22ddff", width: 1.1 },
  { r: 1.66, inc: -0.55, asc: 5.5, color: "#55ccff", width: 0.9 },
  { r: 1.72, inc: 0.40,  asc: 0.5, color: "#6699ff", width: 1.0 },
  { r: 1.78, inc: -0.25, asc: 1.2, color: "#7788ee", width: 0.8 },
  { r: 1.84, inc: 0.55,  asc: 2.0, color: "#8877dd", width: 0.9 },
  { r: 1.90, inc: -0.40, asc: 2.8, color: "#9966cc", width: 0.7 },
];

// Atmosphere layers
export const ATMO = [
  { name: "Troposphere",  r: 0.808, color: "#4488cc", op: 0.155,  rim: 2.0 },
  { name: "Stratosphere", r: 0.905, color: "#5599dd", op: 0.095, rim: 2.4 },
  { name: "Mesosphere",   r: 1.025, color: "#6688cc", op: 0.100, rim: 2.8 },
  { name: "Thermosphere", r: 1.105, color: "#4477bb", op: 0.120, rim: 3.4 },
  { name: "Exosphere",    r: 1.205, color: "#3366aa", op: 0.140, rim: 4.2 },
];

export const CHAPTERS = [
  {
    tag: "PHASE 00",
    title: "Normal\nOrbit",
    body: "4 satellites trace clean paths above Earth. The orbital shell is peaceful, organized — a marvel of human engineering stretching across low Earth orbit.",
    accent: "#4a90e2",
  },
  {
    tag: "PHASE 01",
    title: "Orbital\nCongestion",
    body: "Over 9,000 active satellites now share orbital space. The shell grows dense — a crowded highway with no traffic control, no lanes, no margin for error.",
    accent: "#ff8800",
  },
  {
    tag: "PHASE 02",
    title: "Active\nSatellites",
    body: "Among thousands of objects, only a fraction remain operational. These critical assets — communications, navigation, weather — sustain modern civilization.",
    accent: "#00ffc8",
  },
  {
    tag: "PHASE 03",
    title: "Collision\nRisk",
    body: "ASTRAL detects two objects on converging trajectories. At 7.8 km/s, even centimeter-scale debris carries the energy of a hand grenade.",
    accent: "#ff3030",
  },
  {
    tag: "PHASE 04",
    title: "Kessler\nSyndrome",
    body: "Two satellites collide and disintegrate. Fiery debris spreads across the orbital shell. One collision becomes a thousand. This is physics.",
    accent: "#ff6020",
  },
];

export const METRICS = [
  { label: "TRACKED OBJECTS",  vals: ["8,900", "9,400+", "9,400+", "9,403",     "9,403+"]   },
  { label: "COLLISION ALERTS", vals: ["0",     "0",      "12",     "1 CRITICAL", "CASCADE"]  },
  { label: "ORBITAL BANDS",    vals: ["CLEAR", "DENSE",  "DENSE",  "COMPROMISED","UNUSABLE"] },
];

// Global CSS injected once
export const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@200;300;400;500&family=JetBrains+Mono:wght@300;400;500;600;700&display=swap');
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:auto;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;scrollbar-width:none;-ms-overflow-style:none}
body{background:#010812;overflow-x:hidden;cursor:none;font-family:'Inter',-apple-system,sans-serif}
@media(hover:hover){*{cursor:none!important}}
@media(hover:none){*{cursor:auto!important}}
#astral-scroll-space{height:500vh;position:relative}
::selection{background:rgba(74,144,226,.25);color:#e8edf5}
::-webkit-scrollbar{width:0;display:none}
@keyframes statusPulse{0%,100%{opacity:1;box-shadow:0 0 10px currentColor}50%{opacity:.35;box-shadow:0 0 4px currentColor}}
@keyframes scrollDot{0%{transform:translateY(0);opacity:1}70%,100%{transform:translateY(14px);opacity:0}}
`;

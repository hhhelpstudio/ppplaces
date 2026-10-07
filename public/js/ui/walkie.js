// Walkie: ppplaces' guide (PRD Section 1.3). A friendly walking shoe drawn
// as inline SVG, in the five poses the PRD scopes for v1. Not a chatbot,
// just a small illustrated presence for empty states, nudges and moments
// that would otherwise be a bare status string.

import { escapeHtml } from "../core/dom.js";

/** @typedef {"idle" | "happy" | "thinking" | "confused" | "celebrating"} WalkiePose */

const INK = "#2B211B";
const CORAL = "#FF8A5B";
const CORAL_DARK = "#E4653A";
const TOE = "#FFB08C";
const SOLE = "#FFF7EE";
const SAGE = "#7FB6A2";
const HONEY = "#F4C95D";
const BLUSH = "#F49A8C";

/** Eyes, mouth and extras per pose. Coordinates are in the 120x104 viewBox. */
const FACES = {
  idle: {
    eyes: eyeRound(40, 50, 0, 0) + eyeRound(55, 50, 0, 0),
    mouth: `<path d="M43 59q4.5 4 9 0" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`,
    extra: "",
  },
  happy: {
    eyes: eyeArc(40, 51) + eyeArc(55, 51),
    mouth: `<path d="M42 58q5.5 7 11 0z" fill="${INK}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`,
    extra: "",
  },
  thinking: {
    eyes: eyeRound(40, 50, 1.6, -1.8) + eyeRound(55, 50, 1.6, -1.8),
    mouth: `<path d="M44 60h7" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`,
    extra: `<g fill="${INK}"><circle cx="78" cy="22" r="2.6"/><circle cx="87" cy="16" r="3.3"/><circle cx="98" cy="9" r="4.2"/></g>`,
  },
  confused: {
    eyes: eyeRound(40, 50, 0, 0) + eyeRound(55, 51, 0, 0.6, 4.3),
    mouth: `<path d="M41 61q2.5-3 5 0t5 0t5 0" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
    extra: `<path d="M84 14q0-7 7-7t7 6q0 4-5 6.5-2 1-2 4" fill="none" stroke="${INK}" stroke-width="3.2" stroke-linecap="round"/><circle cx="91" cy="29.5" r="2.2" fill="${INK}"/>`,
  },
  celebrating: {
    eyes: eyeArc(40, 51) + eyeArc(55, 51),
    mouth: `<path d="M41 57.5q6.5 9 13 0z" fill="${INK}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M45 60.5q2.5 2 5 0" fill="${CORAL_DARK}"/>`,
    extra:
      sparkle(14, 22, 6, HONEY) + sparkle(98, 14, 7, HONEY) + sparkle(108, 40, 4.5, SAGE) + sparkle(8, 50, 4, CORAL),
  },
};

/** Round eye with an offset pupil and a catchlight. */
function eyeRound(/** @type {number} */ cx, /** @type {number} */ cy, /** @type {number} */ dx, /** @type {number} */ dy, r = 6) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#FFFFFF" stroke="${INK}" stroke-width="2"/>` +
    `<circle cx="${cx + dx}" cy="${cy + dy}" r="${r * 0.52}" fill="${INK}"/>` +
    `<circle cx="${cx + dx + 1}" cy="${cy + dy - 1.2}" r="${r * 0.18}" fill="#FFFFFF"/>`;
}

/** Closed, smiling eye. */
function eyeArc(/** @type {number} */ cx, /** @type {number} */ cy) {
  return `<path d="M${cx - 5.5} ${cy + 1.5}q5.5-7 11 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
}

/** Four-point sparkle. */
function sparkle(/** @type {number} */ x, /** @type {number} */ y, /** @type {number} */ r, /** @type {string} */ fill) {
  const k = r * 0.28;
  return `<path d="M${x} ${y - r}Q${x + k} ${y - k} ${x + r} ${y}Q${x + k} ${y + k} ${x} ${y + r}Q${x - k} ${y + k} ${x - r} ${y}Q${x - k} ${y - k} ${x} ${y - r}z" fill="${fill}" class="pp-walkie-sparkle"/>`;
}

const LABELS = {
  idle: "Walkie, the ppplaces guide",
  happy: "Walkie, smiling",
  thinking: "Walkie, thinking",
  confused: "Walkie, looking puzzled",
  celebrating: "Walkie, celebrating",
};

/**
 * Walkie as an SVG string.
 * @param {WalkiePose} [pose]
 * @param {{ size?: number, decorative?: boolean, className?: string }} [options]
 */
export function walkie(pose = "idle", { size = 72, decorative = true, className = "" } = {}) {
  const face = FACES[pose];
  const a11y = decorative ? 'aria-hidden="true"' : `role="img" aria-label="${LABELS[pose]}"`;
  const tilt = pose === "celebrating" ? ' transform="rotate(-6 62 70)"' : "";
  return `<svg class="pp-walkie pp-walkie--${pose} ${className}" width="${size}" height="${Math.round(size * 0.867)}" viewBox="0 0 120 104" ${a11y}>
  <ellipse cx="62" cy="98" rx="40" ry="3.6" fill="${INK}" opacity="0.12"/>
  <g class="pp-walkie-body"${tilt}>
    <path d="M58 31c1-8 8-12 14-8 3 2 3 6 1 10l-7 6z" fill="${CORAL}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M18 80c-2-19 2-41 16-49 7-4 19-4 25 0l6 4c6 10 16 18 30 23 11 4 17 11 17 22z" fill="${CORAL}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M94 58c11 4 18 11 18 22H95c0-8-.5-15-1-22z" fill="${TOE}"/>
    <path d="M94 58c11 4 18 11 18 22" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M35 33c6-5 17-5 23 0-6 3.5-17 3.5-23 0z" fill="${CORAL_DARK}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M22 70c16 5 38 5 58-4" fill="none" stroke="${SAGE}" stroke-width="5" stroke-linecap="round"/>
    <g stroke="${SOLE}" stroke-width="3" stroke-linecap="round"><path d="M67 41l6-4.5"/><path d="M73 47.5l7-4"/><path d="M80 53l7-3"/></g>
    <ellipse cx="32.5" cy="58" rx="4" ry="2.6" fill="${BLUSH}" opacity="0.75"/>
    <ellipse cx="62.5" cy="58" rx="4" ry="2.6" fill="${BLUSH}" opacity="0.75"/>
    ${face.eyes}
    ${face.mouth}
    <path d="M14 79h91c6 0 10 3 10 7.5S111 93 105 93H21c-6 0-10-3-10-7s3-7 3-7z" fill="${SOLE}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M24 87h10M42 87h10M60 87h10M78 87h10" stroke="${INK}" stroke-width="2" stroke-linecap="round" opacity="0.28"/>
  </g>
  ${face.extra}
</svg>`;
}

/**
 * Walkie with a speech bubble. `message` is plain text (escaped here).
 * @param {WalkiePose} pose
 * @param {string} message
 * @param {{ size?: number, live?: boolean }} [options]
 */
export function walkieSays(pose, message, { size = 64, live = false } = {}) {
  return `<div class="pp-walkie-say"${live ? ' role="status"' : ""}>
    ${walkie(pose, { size })}
    <p class="pp-walkie-bubble">${escapeHtml(message)}</p>
  </div>`;
}

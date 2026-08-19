// Rounded-stroke, 2px-weight line icons (PRD Section 2.4: "no sharp/thin
// line icons"), hand-built as inline SVG so there's no external icon-font
// or CDN dependency to load — consistent with the rest of this codebase's
// zero-build-step, vanilla approach.
const PATHS = {
  coffee: '<path d="M4 9h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Z"/><path d="M16 10h1.5a2.5 2.5 0 1 1 0 5H16"/><path d="M8 3v2M11 3v2"/>',
  bowl: '<path d="M3 11h18a9 9 0 0 1-18 0Z"/><path d="M12 11V4"/><path d="M12 4a2 2 0 0 1 2 2"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-.5-1.5-.5-2.5c0-1 .8-1.5 2-1.5h2a3 3 0 0 0 3-3c0-5-3.8-9-8.5-9Z"/><circle cx="7.5" cy="10.5" r="1"/><circle cx="11" cy="7.5" r="1"/><circle cx="15" cy="8" r="1"/>',
  tree: '<path d="M12 2 7 9h3l-4 6h4l-3 5h10l-3-5h4l-4-6h3Z"/><path d="M12 22v-4"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/>',
  bag: '<path d="M6 8h12l-1 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  star: '<path d="m12 3 2.6 5.4 5.9.9-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.3l5.9-.9L12 3Z"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4Z"/>',
  check: '<path d="M5 13l4 4L19 7"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  "chevron-up": '<path d="m6 15 6-6 6 6"/>',
  "chevron-down": '<path d="m6 9 6 6 6-6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/>',
  "map-pin": '<path d="M12 22s7-7.4 7-12a7 7 0 1 0-14 0c0 4.6 7 12 7 12Z"/><circle cx="12" cy="10" r="2.5"/>',
  phone: '<path d="M4 4h4l2 5-2.5 1.5a12 12 0 0 0 6 6L15 14l5 2v4a2 2 0 0 1-2 2C9.6 22 2 14.4 2 6a2 2 0 0 1 2-2Z"/>',
  link: '<path d="M9 15 15 9"/><path d="M11 6l1-1a4 4 0 0 1 6 6l-1 1"/><path d="M13 18l-1 1a4 4 0 0 1-6-6l1-1"/>',
  "arrow-left": '<path d="M19 12H5M11 18l-6-6 6-6"/>',
  "more-horizontal": '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
  pencil: '<path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z"/><path d="M13.5 6.5l3 3"/>',
  trash: '<path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-8 0v13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7"/><path d="M10 11v6M14 11v6"/>',
};

export function icon(name, { size = 18, className = "" } = {}) {
  const body = PATHS[name];
  if (!body) throw new Error(`Unknown icon: ${name}`);
  return `<svg class="pp-icon ${className}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

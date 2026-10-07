/**
 * Typed `getElementById` that throws instead of returning null, so a renamed
 * id fails loudly at the call site instead of as a later "cannot read
 * property of null".
 * @template {HTMLElement} [T=HTMLElement]
 * @param {string} id
 * @returns {T}
 */
export function qs(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return /** @type {T} */ (el);
}

/** @param {string | null | undefined} str */
export function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

// Locks page scroll behind any open bottom sheet. Without this, a tall
// sheet (e.g. the detail modal's own scrolling body) let a two-finger or
// trackpad scroll bleed through and move the page underneath it too. A
// counter (not a boolean) so it can't prematurely unlock if a second sheet
// were ever opened before the first closes. Both functions are idempotent
// (checked against the element's current hidden state) since the
// trip-options sheet gets re-opened on itself when swapping between its
// menu/rename/confirm views without an intervening close.
let openSheetCount = 0;
/** @type {Element | null} */
let lastFocused = null;

/** @param {string} id */
export function openSheet(id) {
  const el = qs(id);
  if (el.hidden) {
    openSheetCount++;
    document.body.style.overflow = "hidden";
    lastFocused = document.activeElement;
  }
  el.hidden = false;
  // Move focus into the sheet so keyboard and screen-reader users land in it.
  const first = el.querySelector("button, a[href], input, [tabindex]");
  if (first instanceof HTMLElement) first.focus({ preventScroll: true });
}

/** @param {string} id */
export function closeSheet(id) {
  const el = qs(id);
  if (!el.hidden) {
    openSheetCount = Math.max(0, openSheetCount - 1);
    if (openSheetCount === 0) document.body.style.overflow = "";
    if (lastFocused instanceof HTMLElement) lastFocused.focus({ preventScroll: true });
  }
  el.hidden = true;
}

/**
 * Wires the shared sheet dismiss behaviours: tap on the backdrop, and Escape.
 * @param {string} id
 * @param {() => void} onClose
 */
export function bindSheetDismiss(id, onClose) {
  const el = qs(id);
  el.addEventListener("click", (e) => {
    if (e.target === el) onClose();
  });
  el.addEventListener("keydown", (e) => {
    if (e.key === "Escape") onClose();
  });
}

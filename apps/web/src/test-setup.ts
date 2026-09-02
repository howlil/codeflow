import '@testing-library/jest-dom/vitest';

if (globalThis.PointerEvent === undefined) {
  globalThis.PointerEvent = MouseEvent as typeof PointerEvent;
}

if (HTMLElement.prototype.hasPointerCapture === undefined) {
  HTMLElement.prototype.hasPointerCapture = () => false;
}
if (HTMLElement.prototype.setPointerCapture === undefined) {
  HTMLElement.prototype.setPointerCapture = () => undefined;
}
if (HTMLElement.prototype.releasePointerCapture === undefined) {
  HTMLElement.prototype.releasePointerCapture = () => undefined;
}
if (HTMLElement.prototype.scrollIntoView === undefined) {
  HTMLElement.prototype.scrollIntoView = () => undefined;
}

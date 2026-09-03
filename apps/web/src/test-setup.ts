import '@testing-library/jest-dom/vitest';

class MockPointerEvent extends MouseEvent {
  readonly pointerId: number;
  readonly pointerType: string;
  readonly isPrimary: boolean;

  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init);
    this.pointerId = init.pointerId ?? 1;
    this.pointerType = init.pointerType ?? 'mouse';
    this.isPrimary = init.isPrimary ?? true;
  }
}

Object.defineProperty(globalThis, 'PointerEvent', {
  configurable: true,
  writable: true,
  value: MockPointerEvent,
});
Object.defineProperty(window, 'PointerEvent', {
  configurable: true,
  writable: true,
  value: MockPointerEvent,
});

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

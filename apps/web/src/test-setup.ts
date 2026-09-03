import '@testing-library/jest-dom/vitest';

if (globalThis.PointerEvent === undefined) {
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

  globalThis.PointerEvent = MockPointerEvent as unknown as typeof PointerEvent;
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

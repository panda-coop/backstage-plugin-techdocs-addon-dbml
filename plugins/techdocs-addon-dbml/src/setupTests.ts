import '@testing-library/jest-dom';

// jsdom does not implement scrollIntoView/scroll, which the TechDocs reader
// calls.
Element.prototype.scrollIntoView = jest.fn();
window.scroll = jest.fn();

// jsdom lacks the observers and measurement APIs React Flow relies on; the
// mocks follow https://reactflow.dev/learn/advanced-use/testing
class ResizeObserverMock {
  callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }
  observe(target: Element) {
    this.callback(
      [
        {
          target,
          contentRect: target.getBoundingClientRect(),
        } as ResizeObserverEntry,
      ],
      this as unknown as ResizeObserver,
    );
  }
  unobserve() {}
  disconnect() {}
}

class DOMMatrixReadOnlyMock {
  m22: number;
  constructor(transform?: string) {
    const scale = transform?.match(/scale\(([1-9.]+)\)/)?.[1];
    this.m22 = scale !== undefined ? +scale : 1;
  }
}

global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
(global as Record<string, unknown>).DOMMatrixReadOnly = DOMMatrixReadOnlyMock;

Object.defineProperties(global.HTMLElement.prototype, {
  offsetHeight: {
    get() {
      return parseFloat(this.style.height) || 1;
    },
  },
  offsetWidth: {
    get() {
      return parseFloat(this.style.width) || 1;
    },
  },
});

(global.SVGElement.prototype as unknown as { getBBox: () => unknown }).getBBox =
  () => ({ x: 0, y: 0, width: 0, height: 0 });

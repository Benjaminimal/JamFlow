import "@testing-library/jest-dom";

// @ts-expect-error ResizeObserver does not exist in JSDOM test environment but is needed by shadcn Slider
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

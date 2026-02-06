import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

class MockIntersectionObserver implements IntersectionObserver {
   readonly root: Element | Document | null = null;
   readonly rootMargin = '0px';
   readonly thresholds = [0];

   disconnect(): void {}
   observe(): void {}
   takeRecords(): IntersectionObserverEntry[] {
      return [];
   }
   unobserve(): void {}
}

if (!('IntersectionObserver' in globalThis)) {
   globalThis.IntersectionObserver = MockIntersectionObserver;
}

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
   cleanup();
});

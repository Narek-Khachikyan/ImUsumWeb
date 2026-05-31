import type { ReactNode } from 'react';
import { expect, afterEach, vi } from 'vitest';
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

vi.mock('framer-motion', async () => {
   const React = await vi.importActual<typeof import('react')>('react');
   const motionOnlyProps = new Set([
      'animate',
      'exit',
      'initial',
      'layout',
      'transition',
      'variants',
      'viewport',
      'whileHover',
      'whileInView',
      'whileTap',
   ]);
   const motion = new Proxy(
      {},
      {
         get: (_target, tag: string) =>
            React.forwardRef<HTMLElement, Record<string, unknown> & { children?: ReactNode }>(
               ({ children, ...props }, ref) => {
                  const domProps = Object.fromEntries(
                     Object.entries(props).filter(([key]) => !motionOnlyProps.has(key))
                  );
                  return React.createElement(tag, { ...domProps, ref }, children);
               }
            ),
      }
   );

   return {
      motion,
      AnimatePresence: ({ children }: { children?: ReactNode }) =>
         React.createElement(React.Fragment, null, children),
   };
});

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
   cleanup();
});

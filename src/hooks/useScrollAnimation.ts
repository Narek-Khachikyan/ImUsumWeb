import { useScroll, useTransform, MotionValue } from 'framer-motion';
import { useRef } from 'react';

interface UseParallaxOptions {
  offset?: [string, string];
  inputRange?: [number, number];
  outputRange?: [number, number];
}

export const useParallax = (options: UseParallaxOptions = {}) => {
  const {
    offset = ['start end', 'end start'],
    inputRange = [0, 1],
    outputRange = [0, -100],
  } = options;

  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: offset as ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, inputRange, outputRange);

  return { ref, y, scrollYProgress };
};

export const useScrollOpacity = (
  threshold: [number, number] = [0, 0.3]
): { ref: React.RefObject<HTMLDivElement | null>; opacity: MotionValue<number> } => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'center center'],
  });

  const opacity = useTransform(scrollYProgress, threshold, [0, 1]);

  return { ref, opacity };
};

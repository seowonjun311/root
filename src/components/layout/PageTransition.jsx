import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigationDirection } from '@/lib/NavigationContext';
import { useAnimationState } from '@/lib/AnimationStateContext';

// Push: slide in from right / out to left (native iOS/Android forward)
// Pop:  slide in from left  / out to right (native back)
const variants = {
  push: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit:    { x: '-30%' },
  },
  pop: {
    initial: { x: '-30%' },
    animate: { x: 0 },
    exit:    { x: '100%' },
  },
};

const transition = { type: 'tween', duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] };

export default function PageTransition({ children }) {
  const direction = useNavigationDirection();
  const { startAnimation, endAnimation } = useAnimationState();
  const v = variants[direction];

  // Block back-button during transition
  useEffect(() => {
    startAnimation();
    return () => {
      endAnimation();
    };
  }, [startAnimation, endAnimation]);

  return (
    <motion.div
      initial={v.initial}
      animate={v.animate}
      exit={v.exit}
      transition={transition}
      style={{ willChange: 'transform', position: 'absolute', inset: 0, overflow: 'hidden auto' }}
    >
      {children}
    </motion.div>
  );
}
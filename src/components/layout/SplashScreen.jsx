import React from 'react';
import { motion } from 'framer-motion';

export default function SplashScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-[999] bg-gradient-to-b from-amber-50 to-amber-100/80 flex flex-col items-center justify-center"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Logo/Icon */}
      <motion.div
        className="mb-8"
        animate={{ scale: [0.8, 1.1, 1] }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      >
        <div className="text-6xl">🦊</div>
      </motion.div>

      {/* Brand Text */}
      <motion.div
        className="text-center"
        animate={{ opacity: [0, 1] }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <h1 className="text-2xl font-bold text-amber-900 mb-2">Root</h1>
        <p className="text-sm text-amber-700">여정을 시작하세요</p>
      </motion.div>

      {/* Loading indicator */}
      <motion.div
        className="mt-12 flex gap-1"
        animate={{ opacity: [0.5, 1] }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-amber-600"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{
              duration: 1.2,
              delay: i * 0.15,
              repeat: Infinity,
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
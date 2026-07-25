import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * True when the user has asked the OS to reduce motion.
 *
 * PRODUCT.md commits to full prefers-reduced-motion support, so every animated
 * primitive in this folder reads this and jumps straight to its end state
 * rather than animating. Treat it as a requirement, not a nicety.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (alive) setReduced(v);
      })
      .catch(() => {
        /* unsupported — assume motion is fine */
      });

    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  return reduced;
}

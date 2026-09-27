'use client';

import { useRef, type ComponentPropsWithoutRef, type PointerEvent } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'motion/react';
import clsx from 'clsx';

type Props = ComponentPropsWithoutRef<'div'> & { tilt?: number };

/**
 * Card with a cursor-tracked border spotlight and a small spring tilt.
 * Spotlight position is written straight to the element's style (no re-render);
 * tilt goes through springs so it settles instead of snapping.
 */
export function SpotCard({ tilt = 4, className, children, ...rest }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, { stiffness: 180, damping: 18 });
  const rotateY = useSpring(ry, { stiffness: 180, damping: 18 });

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    const el = ref.current!;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty('--x', `${x * 100}%`);
    el.style.setProperty('--y', `${y * 100}%`);
    el.style.setProperty('--spot', '1');
    if (!reduce && tilt) {
      rx.set((0.5 - y) * tilt);
      ry.set((x - 0.5) * tilt);
    }
  };
  const onLeave = () => {
    ref.current?.style.setProperty('--spot', '0');
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      className={clsx('spot rounded-xl border border-line bg-surface', className)}
      {...(rest as object)}
    >
      {children}
    </motion.div>
  );
}

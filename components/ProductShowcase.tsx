'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from 'framer-motion'

/**
 * 2.5D product effect — a transparent WebP tilted with CSS perspective.
 * Desktop: subtle rotateX/rotateY + scale + shadow tracking the cursor, with a
 * spring-eased return to centre. Touch/coarse-pointer or reduced-motion: a slow
 * float only (no cursor tracking). Entrance animation runs on mount (refresh).
 */
export default function ProductShowcase() {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(hover: none), (max-width: 767px)')
    const apply = () => setIsTouch(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  const interactive = !isTouch && !reduce

  // normalized pointer position (-0.5 … 0.5)
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const spring = { stiffness: 140, damping: 18, mass: 0.4 }
  const sx = useSpring(px, spring)
  const sy = useSpring(py, spring)

  const rotateY = useTransform(sx, [-0.5, 0.5], [11, -11])
  const rotateX = useTransform(sy, [-0.5, 0.5], [-8, 8])
  const shadowX = useTransform(sx, [-0.5, 0.5], [42, -42])
  const shadowScale = useTransform(sy, [-0.5, 0.5], [0.92, 1.08])
  const shadowOpacity = useTransform(sy, [-0.5, 0.5], [0.34, 0.52])

  function onMove(e: React.MouseEvent) {
    if (!interactive || !ref.current) return
    const r = ref.current.getBoundingClientRect()
    px.set((e.clientX - r.left) / r.width - 0.5)
    py.set((e.clientY - r.top) / r.height - 0.5)
  }
  function onLeave() {
    px.set(0) // springs ease smoothly back to centre
    py.set(0)
  }

  const float = !reduce ? { y: [0, -14, 0] } : undefined

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative grid h-full w-full place-items-center [perspective:1100px]"
    >
      {/* ground shadow */}
      <motion.div
        aria-hidden
        style={{ x: interactive ? shadowX : 0, scale: interactive ? shadowScale : 1, opacity: interactive ? shadowOpacity : 0.4 }}
        className="absolute bottom-3 h-8 w-[70%] rounded-[50%] bg-black blur-2xl"
      />

      {/* tilt + entrance layer */}
      <motion.div
        initial={{ opacity: 0, y: 26, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 16, delay: 0.35 }}
        whileHover={interactive ? { scale: 1.04 } : undefined}
        style={{ rotateX, rotateY, transformPerspective: 1000 }}
        className="relative will-change-transform [transform-style:preserve-3d]"
      >
        {/* float layer (independent of tilt) */}
        <motion.div
          animate={float}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Image
            src="/airpods-max.webp"
            alt="Apple AirPods Max headphones"
            width={1100}
            height={929}
            priority
            draggable={false}
            sizes="(max-width: 640px) 50vw, 520px"
            className="pointer-events-none h-auto w-full max-w-[200px] select-none brightness-[1.22] contrast-[1.12] saturate-[1.05] drop-shadow-[0_28px_40px_rgba(0,0,0,0.65)] sm:max-w-[520px]"
          />
        </motion.div>
      </motion.div>
    </div>
  )
}

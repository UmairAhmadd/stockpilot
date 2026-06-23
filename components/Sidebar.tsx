'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import Icon, { type IconName } from './Icon'
import { fadeLeft } from '@/lib/motion'
import { navItems } from '@/lib/mockData'

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <>
      {/* mobile top bar */}
      <div className="flex items-center justify-between border-b border-line bg-canvas/80 px-4 py-3 backdrop-blur lg:hidden">
        <Brand />
        <button
          onClick={() => setOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-xl border border-line text-ink"
          aria-label="Toggle navigation"
          aria-expanded={open}
        >
          <Icon name="menu" />
        </button>
      </div>

      {/* drawer backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-ink/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 flex w-[244px] flex-col bg-canvas px-4 py-6',
          'transition-transform duration-300 lg:static lg:translate-x-0',
          open ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
        ].join(' ')}
      >
        <motion.div
          variants={fadeLeft}
          initial="hidden"
          animate="show"
          className="flex flex-1 flex-col"
        >
        <div className="hidden px-2 lg:block">
          <Brand />
        </div>

        <nav className="scroll-thin mt-8 flex-1 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                onClick={() => setOpen(false)}
                className={[
                  'group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[15px] font-medium transition-colors',
                  active
                    ? 'bg-card text-ink shadow-card'
                    : 'text-muted hover:bg-card/60 hover:text-ink',
                ].join(' ')}
              >
                <span
                  className={[
                    'grid h-8 w-8 place-items-center rounded-xl transition-colors',
                    active
                      ? 'bg-lime text-ink'
                      : 'bg-transparent text-muted group-hover:text-ink',
                  ].join(' ')}
                >
                  <Icon name={item.icon as IconName} size={18} />
                </span>
                {item.label}
              </Link>
            )
          })}
        </nav>

</motion.div>
      </aside>
    </>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-ink">
        <Icon name="box" size={18} className="text-lime" />
      </div>
      <span className="font-display text-lg font-bold tracking-tight">
        StockPilot
      </span>
    </div>
  )
}

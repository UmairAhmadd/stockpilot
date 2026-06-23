'use client'

import { motion } from 'framer-motion'
import Icon from './Icon'
import { fadeDown } from '@/lib/motion'

export default function Header({ title = 'Dashboard' }: { title?: string }) {
  return (
    <motion.header
      variants={fadeDown}
      initial="hidden"
      animate="show"
      className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p className="text-sm font-medium text-muted">Welcome back, Umair</p>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-[28px]">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <label className="flex h-10 items-center gap-2 rounded-2xl bg-card px-3 shadow-card">
          <Icon name="search" size={17} className="text-muted" />
          <input
            type="text"
            placeholder="Search products, SKUs…"
            className="w-36 bg-transparent text-sm outline-none placeholder:text-muted sm:w-48"
          />
        </label>
        <button
          className="relative grid h-10 w-10 place-items-center rounded-2xl bg-card text-ink shadow-card"
          aria-label="Notifications"
        >
          <Icon name="bell" size={18} />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-lime-deep ring-2 ring-card" />
        </button>

        <div className="flex items-center gap-2 rounded-2xl bg-card px-2.5 py-1.5 shadow-card">
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink text-[11px] font-semibold text-lime">
            UA
          </div>
          <div className="hidden min-w-0 pr-0.5 sm:block">
            <p className="truncate text-[13px] font-semibold leading-tight">Umair Ahmad</p>
            <p className="truncate text-[11px] text-muted leading-tight">Store Manager</p>
          </div>
        </div>
      </div>
    </motion.header>
  )
}

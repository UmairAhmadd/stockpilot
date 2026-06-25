'use client'

import { motion } from 'framer-motion'
import Icon from './Icon'
import NotificationBell from './NotificationBell'
import { fadeDown } from '@/lib/motion'

export default function Header({ title = 'Dashboard' }: { title?: string }) {
  return (
    <motion.header
      variants={fadeDown}
      initial="hidden"
      animate="show"
      className="mb-4 flex flex-col gap-3"
    >
      {/* Row 1: title + controls (search hidden on mobile) */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted">Welcome back, Umair</p>
          <h1 className="truncate font-display text-2xl font-bold tracking-tight sm:text-[28px]">
            {title}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* Search bar — inline on sm+, hidden on mobile (shown below) */}
          <label className="hidden h-10 items-center gap-2 rounded-2xl bg-card px-3 shadow-card sm:flex">
            <Icon name="search" size={17} className="text-muted" />
            <input
              type="text"
              placeholder="Search products, SKUs…"
              className="w-36 bg-transparent text-sm outline-none placeholder:text-muted sm:w-48"
            />
          </label>

          <NotificationBell />

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
      </div>

      {/* Row 2: full-width search — mobile only */}
      <label className="flex h-11 items-center gap-2 rounded-2xl bg-card px-3 shadow-card sm:hidden">
        <Icon name="search" size={17} className="text-muted" />
        <input
          type="text"
          placeholder="Search products, SKUs…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
        />
      </label>
    </motion.header>
  )
}

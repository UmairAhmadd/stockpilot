'use client'

import { motion } from 'framer-motion'
import Icon from './Icon'
import { inventoryValueByCategory as mockInventoryValueByCategory } from '@/lib/mockData'
import type { InventoryValueData } from '@/lib/types'

interface Props {
  data?: InventoryValueData[]
}

export default function InventoryValueByCategory({ data }: Props) {
  const inventoryValueByCategory = data ?? mockInventoryValueByCategory
  const max = Math.max(...inventoryValueByCategory.map((c) => c.value))

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 1.4 }}
      className="flex flex-col rounded-3xl bg-panel p-6 shadow-panel"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold tracking-tight text-white">
          Inventory Value by Category
        </h2>
        <button
          className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-white transition-colors hover:bg-lime hover:text-ink"
          aria-label="Expand chart"
        >
          <Icon name="arrowUpRight" size={16} />
        </button>
      </div>

      <div className="mt-7 flex flex-1 flex-col justify-center gap-4">
        {inventoryValueByCategory.map((c) => (
          <div key={c.name} className="grid grid-cols-[88px_1fr] items-center gap-3">
            <p className="truncate text-sm text-white/70">{c.name}</p>
            <div className="relative h-7 overflow-hidden rounded-lg bg-white/[0.06]">
              <div
                className="flex h-full items-center justify-end rounded-lg bg-gradient-to-r from-lime-deep to-lime pr-2.5 transition-[width] duration-700 ease-out"
                style={{ width: `${(c.value / max) * 100}%` }}
              >
                <span className="text-xs font-semibold text-ink tnum">
                  {Math.round(c.value / 1000)}K
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  )
}

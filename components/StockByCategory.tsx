'use client'

import { motion } from 'framer-motion'
import Icon from './Icon'
import { stockByCategory as mockStockByCategory } from '@/lib/mockData'
import type { StockByCategoryData } from '@/lib/types'

interface Props {
  data?: StockByCategoryData[]
}

export default function StockByCategory({ data }: Props) {
  const stockByCategory = data ?? mockStockByCategory

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 1.3 }}
      className="flex flex-col rounded-3xl bg-lime px-4 py-5 shadow-card sm:p-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold tracking-tight text-ink">
          Stock by Category
        </h2>
        <button
          className="grid h-9 w-9 place-items-center rounded-full border border-ink/15 text-ink transition-colors hover:bg-ink hover:text-lime"
          aria-label="Expand chart"
        >
          <Icon name="arrowUpRight" size={16} />
        </button>
      </div>

      <div className="mt-5 flex flex-1 items-end gap-1 sm:mt-8 sm:gap-5">
        {stockByCategory.map((c) => (
          <div key={c.name} className="flex min-w-0 flex-1 flex-col items-center gap-2 sm:gap-3">
            <div className="flex h-32 w-full items-end justify-center sm:h-44">
              <div
                className="w-full max-w-[68px] rounded-t-xl bg-ink/85 transition-[height] duration-700 ease-out"
                style={{ height: `${c.percent}%` }}
                role="img"
                aria-label={`${c.name}: ${c.percent}% of stock`}
              />
            </div>
            <div className="w-full text-center">
              <p className="truncate text-[10px] font-semibold leading-tight text-ink sm:text-[13px]">
                {c.name}
              </p>
              <p className="text-[11px] font-medium text-ink/55 tnum sm:text-xs">
                {c.percent}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  )
}

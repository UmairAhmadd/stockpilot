'use client'

import { motion } from 'framer-motion'
import Icon from './Icon'
import ProductShowcase from './ProductShowcase'
import { riseScale } from '@/lib/motion'
import { topProduct as mockTopProduct } from '@/lib/mockData'
import type { TopProductData } from '@/lib/types'

const CATEGORY_LABELS: Record<string, string> = {
  Audio: 'Audio Devices',
}

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})
const number = new Intl.NumberFormat('en-US')

interface Props {
  product?: TopProductData | null
}

export default function TopSellingProduct({ product }: Props) {
  const p: TopProductData = product ?? {
    name: mockTopProduct.name,
    sku: mockTopProduct.sku,
    brand: mockTopProduct.brand,
    category: mockTopProduct.category,
    unitsSold: mockTopProduct.unitsSold,
    revenue: mockTopProduct.revenue,
    remainingStock: mockTopProduct.remainingStock,
    growthPct: mockTopProduct.growthPct,
  }

  const stats = [
    { label: 'Units Sold', value: number.format(p.unitsSold), icon: 'cart' as const },
    { label: 'Revenue', value: currency.format(p.revenue), icon: 'dollar' as const },
    { label: 'Stock Left', value: number.format(p.remainingStock), icon: 'inventory' as const },
  ]

  return (
    <motion.section
      variants={riseScale}
      initial="hidden"
      animate="show"
      className="relative overflow-hidden rounded-3xl bg-panel shadow-panel"
    >
      {/* ambient lime field behind the product */}
      <div className="pointer-events-none absolute -left-24 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-lime/10 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-lime/5 blur-3xl" />

      {/* badge — absolute so the image owns the full left half */}
      <div className="absolute left-5 top-5 z-10 flex items-center gap-2 sm:left-7 sm:top-7">
        <span className="rounded-full bg-lime px-3 py-1 text-xs font-bold uppercase tracking-wider text-ink">
          Top Seller
        </span>
        <span className="font-mono text-xs text-white/40">{p.sku}</span>
      </div>

      <div className="relative grid items-center gap-4 p-4 sm:grid-cols-2 sm:gap-5 sm:p-5">
        {/* ── stage (50%) ── */}
        <div className="relative flex min-h-[210px] items-center justify-center pt-5 sm:min-h-[270px] sm:pt-2">
          <ProductShowcase />
        </div>

        {/* ── details (50%) ── */}
        <div className="flex min-w-0 flex-col justify-center">
          <p className="text-sm font-medium text-lime">{p.brand} · {CATEGORY_LABELS[p.category] ?? p.category}</p>
          <h2 className="mt-1 font-display text-[clamp(1.5rem,2.6vw,2.25rem)] font-bold leading-tight tracking-tight text-white">
            {p.name}
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/55">
            Your best-performing SKU this quarter — leading both volume and margin
            across the Electronics category.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className="min-w-0 rounded-2xl border border-white/[0.07] bg-white/[0.04] p-3.5"
              >
                <div className="flex items-center gap-1.5 text-white/45">
                  <Icon name={s.icon} size={15} />
                  <span className="truncate text-xs font-medium">{s.label}</span>
                </div>
                <p className="mt-1.5 whitespace-nowrap font-display text-[clamp(0.95rem,1.5vw,1.35rem)] font-bold tracking-tight text-white tnum">
                  {s.value}
                </p>
              </div>
            ))}

            {/* growth — brand-accent emphasis */}
            <div className="min-w-0 rounded-2xl bg-lime p-3.5 text-ink">
              <div className="flex items-center gap-1.5 opacity-70">
                <Icon name="trendUp" size={15} />
                <span className="text-xs font-semibold">Growth</span>
              </div>
              <p className="mt-1.5 whitespace-nowrap font-display text-[clamp(0.95rem,1.5vw,1.35rem)] font-bold tracking-tight tnum">
                +{p.growthPct}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  )
}

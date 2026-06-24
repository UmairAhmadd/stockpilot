'use client'

import { motion, MotionConfig } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import StatCard from '@/components/StatCard'
import StockByCategory from '@/components/StockByCategory'
import InventoryValueByCategory from '@/components/InventoryValueByCategory'
import TopSellingProduct from '@/components/TopSellingProduct'
import { group } from '@/lib/motion'
import type { Metric, TopProductData, StockByCategoryData, InventoryValueData } from '@/lib/types'

interface Props {
  metrics: Metric[]
  topProduct: TopProductData | null
  stockByCategory: StockByCategoryData[]
  inventoryValueByCategory: InventoryValueData[]
}

function pick(metrics: Metric[], ids: string[]) {
  return ids
    .map((id) => metrics.find((m) => m.id === id))
    .filter((m): m is Metric => Boolean(m))
}

export default function DashboardClient({ metrics, topProduct, stockByCategory, inventoryValueByCategory }: Props) {
  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen bg-canvas lg:flex">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-[1200px]">
          <Header />
          <section className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
            <TopSellingProduct product={topProduct} />
            <motion.div
              aria-label="Headline metrics"
              variants={group(0.4)}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 gap-2 sm:gap-4"
            >
              {pick(metrics, ['value', 'items', 'low', 'out']).map((m) => (
                <StatCard key={m.id} metric={m} compact />
              ))}
            </motion.div>
          </section>
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <StockByCategory data={stockByCategory} />
            <InventoryValueByCategory data={inventoryValueByCategory} />
          </div>
          <footer className="mt-8 pb-2 text-center text-xs text-muted">
            StockPilot · {new Date().getFullYear()}
          </footer>
        </div>
      </main>
    </div>
    </MotionConfig>
  )
}

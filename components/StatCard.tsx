'use client'

import { motion } from 'framer-motion'
import Icon, { type IconName } from './Icon'
import { fadeUp } from '@/lib/motion'
import type { Metric } from '@/lib/types'

export default function StatCard({
  metric,
  compact = false,
}: {
  metric: Metric
  compact?: boolean
}) {
  return (
    <motion.div
      variants={fadeUp}
      className={[
        'group relative flex min-w-0 flex-col overflow-hidden rounded-3xl bg-card shadow-card transition-shadow hover:shadow-panel',
        compact ? 'p-4' : 'p-5',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-muted sm:text-[15px]">{metric.label}</p>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-lime text-ink">
          <Icon name={metric.icon as IconName} size={17} />
        </span>
      </div>

      <p
        className={[
          'mt-auto whitespace-nowrap font-display font-bold leading-none tracking-tight tnum',
          compact
            ? 'pt-3 text-[clamp(1.35rem,1.8vw,1.75rem)]'
            : 'pt-5 text-[clamp(1.6rem,2.3vw,2.125rem)]',
        ].join(' ')}
      >
        {metric.value}
      </p>
      <p className="mt-2 text-sm text-muted">{metric.caption}</p>

      {/* faint lime wash from corner, echoing the reference cards */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-lime-soft/30 blur-2xl" />
    </motion.div>
  )
}

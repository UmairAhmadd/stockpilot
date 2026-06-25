'use client'

import { useEffect, useRef, useState } from 'react'
import Icon from './Icon'

interface NotificationItem {
  productId: string
  productName: string
  sku: string
  quantity: number
  lowStockAt: number
  severity: 'out' | 'low'
}

interface NotificationsData {
  items: NotificationItem[]
  outOfStockCount: number
  lowStockCount: number
  totalCount: number
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<NotificationsData | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // Fetch on mount so the dot is accurate immediately
  useEffect(() => {
    fetch('/api/notifications/low-stock')
      .then((r) => r.json())
      .then((d: NotificationsData) => setData(d))
      .catch(() => setData({ items: [], outOfStockCount: 0, lowStockCount: 0, totalCount: 0 }))
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const hasAlerts = data !== null && data.totalCount > 0

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-11 w-11 place-items-center rounded-2xl bg-card text-ink shadow-card transition-colors hover:bg-canvas"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Icon name="bell" size={18} />
        {/* Dot — amber when alerts exist, lime-deep as loading placeholder */}
        <span
          className={[
            'absolute right-2.5 top-2.5 h-2 w-2 rounded-full ring-2 ring-card transition-colors',
            hasAlerts ? 'bg-amber-500' : 'bg-lime-deep',
            data !== null && !hasAlerts ? 'opacity-0' : 'opacity-100',
          ].join(' ')}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="dialog"
          aria-label="Notifications panel"
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-72 overflow-hidden rounded-2xl bg-card shadow-panel"
          style={{ maxWidth: 'calc(100vw - 24px)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-ink">Notifications</p>
            {hasAlerts && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                {data!.totalCount} alert{data!.totalCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Body */}
          <div className="max-h-64 overflow-y-auto">
            {data === null ? (
              <p className="px-4 py-6 text-center text-sm text-muted">Loading…</p>
            ) : data.items.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full bg-lime/20">
                  <Icon name="bell" size={18} className="text-ink/60" />
                </div>
                <p className="text-sm font-medium text-ink">No low-stock alerts</p>
                <p className="mt-0.5 text-xs text-muted">All products are well stocked</p>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {data.items.map((item) => (
                  <li key={item.productId} className="flex items-start gap-3 px-4 py-3">
                    <span
                      className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${
                        item.severity === 'out'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-amber-100 text-amber-600'
                      }`}
                    >
                      <Icon name="alert" size={13} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">
                        {item.productName}
                        {item.severity === 'out' ? ' is out of stock' : ' stock is low'}
                      </p>
                      <p className="text-xs text-muted">
                        {item.severity === 'out'
                          ? 'No units remaining'
                          : `${item.quantity} units left · threshold ${item.lowStockAt}`}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer summary */}
          {data !== null && data.totalCount > 0 && (
            <div className="border-t border-line bg-canvas/60 px-4 py-2.5">
              <p className="text-xs text-muted">
                {data.lowStockCount > 0 && (
                  <>{data.lowStockCount} product{data.lowStockCount !== 1 ? 's' : ''} need{data.lowStockCount === 1 ? 's' : ''} restocking</>
                )}
                {data.lowStockCount > 0 && data.outOfStockCount > 0 && ' · '}
                {data.outOfStockCount > 0 && (
                  <span className="text-red-500">{data.outOfStockCount} out of stock</span>
                )}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

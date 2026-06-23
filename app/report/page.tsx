import { prisma } from '@/lib/prisma'
import PageLayout from '@/components/PageLayout'

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const number   = new Intl.NumberFormat('en-US')

export default async function ReportPage() {
  let data: Awaited<ReturnType<typeof fetchReportData>> | null = null
  let error = false

  try {
    data = await fetchReportData()
  } catch {
    error = true
  }

  if (error || !data) {
    return (
      <PageLayout title="Report">
        <p className="py-16 text-center text-sm text-red-500">Could not load report data. Check your database connection.</p>
      </PageLayout>
    )
  }

  return (
    <PageLayout title="Report">
      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard label="Total Revenue"    value={currency.format(data.totalRevenue)} />
        <SummaryCard label="Orders Completed" value={number.format(data.completedOrders)} />
        <SummaryCard label="Units Sold"       value={number.format(data.unitsSold)} />
        <SummaryCard label="Inventory Value"  value={currency.format(data.inventoryValue)} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Sales by product */}
        <div className="rounded-3xl bg-card p-6 shadow-card">
          <h2 className="mb-4 font-display text-base font-bold tracking-tight">Top Products by Units Sold</h2>
          {data.topProducts.length === 0 ? (
            <p className="text-sm text-muted">No sales data yet.</p>
          ) : (
            <div className="space-y-3">
              {data.topProducts.map((p) => (
                <div key={p.productId} className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-sm font-medium">{p.name}</span>
                  <span className="shrink-0 rounded-full bg-lime/25 px-2.5 py-0.5 text-xs font-semibold tabular-nums">
                    {number.format(p.unitsSold)} units
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inventory by category */}
        <div className="rounded-3xl bg-card p-6 shadow-card">
          <h2 className="mb-4 font-display text-base font-bold tracking-tight">Inventory Value by Category</h2>
          {data.valueByCategory.length === 0 ? (
            <p className="text-sm text-muted">No inventory data yet.</p>
          ) : (
            <div className="space-y-3">
              {data.valueByCategory.map((c) => {
                const pct = data!.inventoryValue > 0 ? (c.value / data!.inventoryValue) * 100 : 0
                return (
                  <div key={c.name}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium">{c.name}</span>
                      <span className="text-muted tabular-nums">{currency.format(c.value)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-canvas">
                      <div
                        className="h-full rounded-full bg-ink transition-all duration-700"
                        style={{ width: `${pct.toFixed(1)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}

async function fetchReportData() {
  const [salesOrders, inventoryLevels, categories, salesItems] = await Promise.all([
    prisma.salesOrder.findMany({
      where: { status: 'COMPLETED' },
      include: { items: true },
    }),
    prisma.inventoryLevel.findMany({ include: { product: { select: { price: true } } } }),
    prisma.category.findMany({
      include: { products: { include: { inventoryLevel: true } } },
    }),
    prisma.salesOrderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      where: { salesOrder: { status: 'COMPLETED' } },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 8,
    }),
  ])

  const totalRevenue    = salesOrders.reduce((s, o) => s + Number(o.total), 0)
  const completedOrders = salesOrders.length
  const unitsSold       = salesOrders.reduce((s, o) => s + o.items.reduce((si, i) => si + i.quantity, 0), 0)
  const inventoryValue  = inventoryLevels.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0)

  const productIds = salesItems.map((s) => s.productId)
  const products   = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  })
  const topProducts = salesItems.map((s) => ({
    productId: s.productId,
    name: products.find((p) => p.id === s.productId)?.name ?? s.productId,
    unitsSold: s._sum.quantity ?? 0,
  }))

  const valueByCategory = categories
    .map((cat) => ({
      name: cat.name,
      value: cat.products.reduce(
        (s, p) => s + Number(p.price) * (p.inventoryLevel?.quantity ?? 0), 0,
      ),
    }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)

  return { totalRevenue, completedOrders, unitsSold, inventoryValue, topProducts, valueByCategory }
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-card p-5 shadow-card">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-2 font-display text-[clamp(1.1rem,2vw,1.5rem)] font-bold leading-none tracking-tight tabular-nums">
        {value}
      </p>
    </div>
  )
}

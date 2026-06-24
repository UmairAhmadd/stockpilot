import { prisma } from '@/lib/prisma'
import PageLayout from '@/components/PageLayout'

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export default async function SalesOrdersPage() {
  let orders: Awaited<ReturnType<typeof fetchOrders>> = []
  let error = false

  try {
    orders = await fetchOrders()
  } catch {
    error = true
  }

  return (
    <PageLayout title="Sales Orders">
      {error ? (
        <ErrorState />
      ) : orders.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-hidden rounded-3xl bg-card shadow-card">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[580px]">
            <thead>
              <tr className="border-b border-line bg-canvas/60">
                <Th>Order ID</Th>
                <Th>Date</Th>
                <Th>Items</Th>
                <Th>Products</Th>
                <Th align="right">Total</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const productNames = o.items
                  .map((i) => i.product.name)
                  .filter((v, i, a) => a.indexOf(v) === i)
                  .join(', ')
                return (
                  <tr key={o.id} className="border-b border-line last:border-0 hover:bg-canvas/40 transition-colors">
                    <Td>
                      <code className="text-xs text-muted">{o.id.slice(0, 8)}…</code>
                    </Td>
                    <Td>{new Date(o.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</Td>
                    <Td mono align="right">{o._count.items}</Td>
                    <Td>
                      <span className="line-clamp-1 max-w-[220px] text-xs text-muted">{productNames}</span>
                    </Td>
                    <Td align="right" mono>{currency.format(Number(o.total))}</Td>
                    <Td>
                      <StatusBadge status={o.status} />
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </PageLayout>
  )
}

async function fetchOrders() {
  return prisma.salesOrder.findMany({
    include: {
      items: { include: { product: { select: { name: true } } } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

function StatusBadge({ status }: { status: string }) {
  const cls = {
    COMPLETED: 'bg-lime/25 text-ink',
    PENDING:   'bg-amber-100 text-amber-700',
    CANCELLED: 'bg-red-100 text-red-600',
  }[status] ?? 'bg-canvas text-muted'
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{status}</span>
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted text-${align}`}>
      {children}
    </th>
  )
}

function Td({ children, align = 'left', mono = false }: { children: React.ReactNode; align?: 'left' | 'right'; mono?: boolean }) {
  return <td className={`px-5 py-4 text-sm text-${align}${mono ? ' tabular-nums' : ''}`}>{children}</td>
}

function EmptyState() {
  return <p className="py-16 text-center text-sm text-muted">No sales orders yet.</p>
}

function ErrorState() {
  return <p className="py-16 text-center text-sm text-red-500">Could not load orders. Check your database connection.</p>
}

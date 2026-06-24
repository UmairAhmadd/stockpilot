import { prisma } from '@/lib/prisma'
import PageLayout from '@/components/PageLayout'

export default async function StockControlPage() {
  let movements: Awaited<ReturnType<typeof fetchMovements>> = []
  let error = false

  try {
    movements = await fetchMovements()
  } catch {
    error = true
  }

  return (
    <PageLayout title="Stock Control">
      {error ? (
        <ErrorState />
      ) : movements.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-hidden rounded-3xl bg-card shadow-card">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[580px]">
            <thead>
              <tr className="border-b border-line bg-canvas/60">
                <Th>Type</Th>
                <Th>Product</Th>
                <Th>SKU</Th>
                <Th align="right">Quantity</Th>
                <Th>Reason</Th>
                <Th>Date</Th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id} className="border-b border-line last:border-0 hover:bg-canvas/40 transition-colors">
                  <Td>
                    <MovementBadge type={m.type} />
                  </Td>
                  <Td><span className="font-medium text-ink">{m.product.name}</span></Td>
                  <Td><code className="text-xs text-muted">{m.product.sku}</code></Td>
                  <Td align="right" mono>{m.quantity}</Td>
                  <Td><span className="line-clamp-1 max-w-[180px] text-xs text-muted">{m.reason ?? '—'}</span></Td>
                  <Td>{new Date(m.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</Td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </PageLayout>
  )
}

async function fetchMovements() {
  return prisma.stockMovement.findMany({
    include: { product: { select: { name: true, sku: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })
}

function MovementBadge({ type }: { type: string }) {
  const isIn = type === 'PURCHASE' || type === 'RETURN'
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
      isIn ? 'bg-lime/25 text-ink' : 'bg-red-100 text-red-600'
    }`}>
      {isIn ? '↑ IN' : '↓ OUT'}
    </span>
  )
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
  return <p className="py-16 text-center text-sm text-muted">No stock movements recorded yet.</p>
}

function ErrorState() {
  return <p className="py-16 text-center text-sm text-red-500">Could not load stock movements. Check your database connection.</p>
}

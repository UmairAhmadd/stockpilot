import { prisma } from '@/lib/prisma'
import PageLayout from '@/components/PageLayout'

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const pct = (n: number) => `${n.toFixed(1)}%`

export default async function PriceListPage() {
  let products: Awaited<ReturnType<typeof fetchProducts>> = []
  let error = false

  try {
    products = await fetchProducts()
  } catch {
    error = true
  }

  return (
    <PageLayout title="Price List">
      {error ? (
        <ErrorState />
      ) : products.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-hidden rounded-3xl bg-card shadow-card">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-line bg-canvas/60">
                <Th>Product</Th>
                <Th>Category</Th>
                <Th align="right">Cost Price</Th>
                <Th align="right">Sell Price</Th>
                <Th align="right">Margin</Th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const cost   = Number(p.costPrice)
                const price  = Number(p.price)
                const margin = price > 0 ? ((price - cost) / price) * 100 : 0
                const marginVariant = margin >= 40 ? 'high' : margin >= 20 ? 'mid' : 'low'
                return (
                  <tr key={p.id} className="border-b border-line last:border-0 hover:bg-canvas/40 transition-colors">
                    <Td>
                      <span className="font-semibold text-ink">{p.name}</span>
                      <span className="block text-xs text-muted">{p.brand} · {p.sku}</span>
                    </Td>
                    <Td>{p.category.name}</Td>
                    <Td align="right" mono>{currency.format(cost)}</Td>
                    <Td align="right" mono>{currency.format(price)}</Td>
                    <Td align="right">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums ${
                        marginVariant === 'high' ? 'bg-lime/25 text-ink'
                        : marginVariant === 'mid' ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-600'
                      }`}>
                        {pct(margin)}
                      </span>
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

async function fetchProducts() {
  return prisma.product.findMany({
    include: { category: { select: { name: true } } },
    orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
  })
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
  return <p className="py-16 text-center text-sm text-muted">No products found.</p>
}

function ErrorState() {
  return <p className="py-16 text-center text-sm text-red-500">Could not load price list. Check your database connection.</p>
}

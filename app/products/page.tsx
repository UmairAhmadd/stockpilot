import { prisma } from '@/lib/prisma'
import PageLayout from '@/components/PageLayout'

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export default async function ProductsPage() {
  let products: Awaited<ReturnType<typeof fetchProducts>> = []
  let error = false

  try {
    products = await fetchProducts()
  } catch {
    error = true
  }

  return (
    <PageLayout title="Products">
      {error ? (
        <ErrorState />
      ) : products.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-hidden rounded-3xl bg-card shadow-card">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-line bg-canvas/60">
                <Th>Product</Th>
                <Th>SKU</Th>
                <Th>Category</Th>
                <Th>Supplier</Th>
                <Th align="right">Price</Th>
                <Th align="right">Stock</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const qty = p.inventoryLevel?.quantity ?? 0
                const low = p.inventoryLevel?.lowStockAt ?? 10
                const status =
                  qty === 0 ? 'out' : qty <= low ? 'low' : 'ok'
                return (
                  <tr key={p.id} className="border-b border-line last:border-0 hover:bg-canvas/40 transition-colors">
                    <Td>
                      <span className="font-semibold text-ink">{p.name}</span>
                      <span className="block text-xs text-muted">{p.brand}</span>
                    </Td>
                    <Td><code className="text-xs text-muted">{p.sku}</code></Td>
                    <Td>{p.category.name}</Td>
                    <Td>{p.supplier?.name ?? '—'}</Td>
                    <Td align="right" mono>{currency.format(Number(p.price))}</Td>
                    <Td align="right" mono>{qty}</Td>
                    <Td>
                      <Badge variant={status}>
                        {status === 'out' ? 'Out of Stock' : status === 'low' ? 'Low Stock' : 'In Stock'}
                      </Badge>
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageLayout>
  )
}

async function fetchProducts() {
  return prisma.product.findMany({
    include: { category: true, supplier: true, inventoryLevel: true },
    orderBy: { name: 'asc' },
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
  return (
    <td className={`px-5 py-4 text-sm text-${align}${mono ? ' tabular-nums' : ''}`}>
      {children}
    </td>
  )
}

function Badge({ children, variant }: { children: React.ReactNode; variant: 'ok' | 'low' | 'out' }) {
  const cls = {
    ok:  'bg-lime/25 text-ink',
    low: 'bg-amber-100 text-amber-700',
    out: 'bg-red-100 text-red-600',
  }[variant]
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{children}</span>
}

function EmptyState() {
  return <p className="py-16 text-center text-sm text-muted">No products found. Add products to see them here.</p>
}

function ErrorState() {
  return <p className="py-16 text-center text-sm text-red-500">Could not load products. Check your database connection.</p>
}

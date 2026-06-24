import { prisma } from '@/lib/prisma'
import PageLayout from '@/components/PageLayout'

export default async function SuppliersPage() {
  let suppliers: Awaited<ReturnType<typeof fetchSuppliers>> = []
  let error = false

  try {
    suppliers = await fetchSuppliers()
  } catch {
    error = true
  }

  return (
    <PageLayout title="Suppliers">
      {error ? (
        <ErrorState />
      ) : suppliers.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-hidden rounded-3xl bg-card shadow-card">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[580px]">
            <thead>
              <tr className="border-b border-line bg-canvas/60">
                <Th>Supplier</Th>
                <Th>Email</Th>
                <Th>Phone</Th>
                <Th align="right">Products</Th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id} className="border-b border-line last:border-0 hover:bg-canvas/40 transition-colors">
                  <Td>
                    <span className="font-semibold text-ink">{s.name}</span>
                  </Td>
                  <Td>{s.email ?? '—'}</Td>
                  <Td>{s.phone ?? '—'}</Td>
                  <Td align="right">
                    <span className="inline-block rounded-full bg-lime/25 px-2.5 py-0.5 text-xs font-semibold text-ink tabular-nums">
                      {s._count.products}
                    </span>
                  </Td>
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

async function fetchSuppliers() {
  return prisma.supplier.findMany({
    include: { _count: { select: { products: true } } },
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

function Td({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return <td className={`px-5 py-4 text-sm text-${align}`}>{children}</td>
}

function EmptyState() {
  return <p className="py-16 text-center text-sm text-muted">No suppliers found.</p>
}

function ErrorState() {
  return <p className="py-16 text-center text-sm text-red-500">Could not load suppliers. Check your database connection.</p>
}

import { prisma } from '@/lib/prisma'
import PageLayout from '@/components/PageLayout'
import AccountClient from '@/components/AccountClient'

export default async function AccountPage() {
  let props = fallbackProps

  try {
    const [user, productsCount, salesCount, inventoryLevels] = await Promise.all([
      prisma.user.findFirst({ orderBy: { createdAt: 'asc' } }),
      prisma.product.count(),
      prisma.salesOrder.count({ where: { status: 'COMPLETED' } }),
      prisma.inventoryLevel.findMany({ select: { quantity: true, lowStockAt: true } }),
    ])

    const lowStockCount = inventoryLevels.filter((i) => i.quantity <= i.lowStockAt).length

    if (user) {
      props = {
        name: user.name,
        email: user.email,
        role: user.role,
        productsCount,
        salesCount,
        lowStockCount,
        memberSince: new Date(user.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        }),
      }
    }
  } catch {
    // DB unavailable — use fallback
  }

  return (
    <PageLayout title="Account">
      <AccountClient {...props} />
    </PageLayout>
  )
}

const fallbackProps = {
  name: 'Umair Ahmad',
  email: 'umairahmad3921@gmail.com',
  role: 'MANAGER',
  productsCount: 0,
  salesCount: 0,
  lowStockCount: 0,
  memberSince: 'Jun 2026',
}

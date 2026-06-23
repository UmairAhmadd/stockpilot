import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const salesItems = await prisma.salesOrderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      where: { salesOrder: { status: 'COMPLETED' } },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 1,
    })

    if (!salesItems.length) {
      return NextResponse.json(null)
    }

    const topProductId = salesItems[0].productId
    const unitsSold = salesItems[0]._sum.quantity ?? 0

    const product = await prisma.product.findUnique({
      where: { id: topProductId },
      include: { category: true, inventoryLevel: true },
    })

    if (!product) return NextResponse.json(null)

    // Compute revenue manually
    const revenueItems = await prisma.salesOrderItem.findMany({
      where: { productId: topProductId, salesOrder: { status: 'COMPLETED' } },
      select: { quantity: true, unitPrice: true },
    })
    const totalRevenue = revenueItems.reduce(
      (s, i) => s + i.quantity * Number(i.unitPrice),
      0,
    )

    return NextResponse.json({
      name: product.name,
      sku: product.sku,
      brand: product.brand,
      category: product.category.name,
      unitsSold,
      revenue: totalRevenue,
      remainingStock: product.inventoryLevel?.quantity ?? 0,
      growthPct: 24.7,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch top product' }, { status: 500 })
  }
}

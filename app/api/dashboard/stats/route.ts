import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [products, categories, suppliers, inventoryLevels] = await Promise.all([
      prisma.product.findMany({ select: { price: true } }),
      prisma.category.count(),
      prisma.supplier.count(),
      prisma.inventoryLevel.findMany({ include: { product: { select: { price: true } } } }),
    ])

    const totalItems = inventoryLevels.reduce((s, i) => s + i.quantity, 0)
    const inventoryValue = inventoryLevels.reduce(
      (s, i) => s + Number(i.product.price) * i.quantity,
      0,
    )
    const lowStockCount = inventoryLevels.filter(
      (i) => i.quantity > 0 && i.quantity <= i.lowStockAt,
    ).length
    const outOfStockCount = inventoryLevels.filter((i) => i.quantity === 0).length
    const totalProducts = products.length
    const avgProductValue =
      totalProducts > 0
        ? products.reduce((s, p) => s + Number(p.price), 0) / totalProducts
        : 0

    return NextResponse.json({
      inventoryValue,
      totalItems,
      lowStockCount,
      outOfStockCount,
      totalProducts,
      categoryCount: categories,
      supplierCount: suppliers,
      avgProductValue,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}

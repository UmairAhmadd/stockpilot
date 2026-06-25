import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const inventoryLevels = await prisma.inventoryLevel.findMany({
      include: { product: { select: { id: true, name: true, sku: true } } },
    })

    const outOfStock = inventoryLevels
      .filter((i) => i.quantity === 0)
      .map((i) => ({
        productId: i.productId,
        productName: i.product.name,
        sku: i.product.sku,
        quantity: i.quantity,
        lowStockAt: i.lowStockAt,
        severity: 'out' as const,
      }))

    const lowStock = inventoryLevels
      .filter((i) => i.quantity > 0 && i.quantity <= i.lowStockAt)
      .sort((a, b) => a.quantity - b.quantity)
      .map((i) => ({
        productId: i.productId,
        productName: i.product.name,
        sku: i.product.sku,
        quantity: i.quantity,
        lowStockAt: i.lowStockAt,
        severity: 'low' as const,
      }))

    const items = [...outOfStock, ...lowStock].slice(0, 12)

    return NextResponse.json({
      items,
      outOfStockCount: outOfStock.length,
      lowStockCount: lowStock.length,
      totalCount: outOfStock.length + lowStock.length,
    })
  } catch {
    return NextResponse.json(
      { items: [], outOfStockCount: 0, lowStockCount: 0, totalCount: 0 },
      { status: 500 },
    )
  }
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        products: {
          include: { inventoryLevel: true },
        },
      },
    })

    const rows = categories.map((cat) => ({
      name: cat.name,
      quantity: cat.products.reduce((s, p) => s + (p.inventoryLevel?.quantity ?? 0), 0),
    }))

    const total = rows.reduce((s, r) => s + r.quantity, 0)
    const data = rows
      .map((r) => ({ name: r.name, percent: total > 0 ? Math.round((r.quantity / total) * 100) : 0 }))
      .filter((r) => r.percent > 0)
      .sort((a, b) => b.percent - a.percent)

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch stock by category' }, { status: 500 })
  }
}

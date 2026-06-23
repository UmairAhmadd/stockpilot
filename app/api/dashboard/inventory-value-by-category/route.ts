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

    const data = categories
      .map((cat) => ({
        name: cat.name,
        value: cat.products.reduce(
          (s, p) => s + Number(p.price) * (p.inventoryLevel?.quantity ?? 0),
          0,
        ),
      }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value)

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch inventory value by category' }, { status: 500 })
  }
}

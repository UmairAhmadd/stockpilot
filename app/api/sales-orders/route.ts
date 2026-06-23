import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSalesOrderSchema } from '@/lib/validators'
import { withRole } from '@/lib/rbac'

export async function GET() {
  try {
    const orders = await prisma.salesOrder.findMany({
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(orders)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch sales orders' }, { status: 500 })
  }
}

export const POST = withRole('STAFF', async (req) => {
  try {
    const body = await req.json()
    const { items } = createSalesOrderSchema.parse(body)

    // Validate stock
    for (const item of items) {
      const inv = await prisma.inventoryLevel.findUnique({ where: { productId: item.productId } })
      if (!inv || inv.quantity < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for product ${item.productId}` },
          { status: 400 },
        )
      }
    }

    const total = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)

    const order = await prisma.$transaction(async (tx) => {
      const so = await tx.salesOrder.create({
        data: {
          status: 'COMPLETED',
          total,
          items: {
            create: items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
            })),
          },
        },
        include: { items: true },
      })

      for (const item of items) {
        await tx.inventoryLevel.update({
          where: { productId: item.productId },
          data: { quantity: { decrement: item.quantity } },
        })
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'SALE',
            quantity: item.quantity,
            reason: `Sales order ${so.id}`,
          },
        })
      }

      return so
    })

    return NextResponse.json(order, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create sales order' }, { status: 500 })
  }
})

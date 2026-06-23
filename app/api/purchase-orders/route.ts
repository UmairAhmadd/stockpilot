import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createPurchaseOrderSchema } from '@/lib/validators'
import { withRole } from '@/lib/rbac'

export async function GET() {
  try {
    const orders = await prisma.purchaseOrder.findMany({
      include: { supplier: true, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(orders)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch purchase orders' }, { status: 500 })
  }
}

export const POST = withRole('MANAGER', async (req) => {
  try {
    const body = await req.json()
    const { supplierId, items } = createPurchaseOrderSchema.parse(body)

    const total = items.reduce((sum, i) => sum + i.quantity * i.unitCost, 0)

    const order = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          supplierId,
          status: 'RECEIVED',
          total,
          items: {
            create: items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              unitCost: i.unitCost,
            })),
          },
        },
        include: { items: true },
      })

      for (const item of items) {
        await tx.inventoryLevel.update({
          where: { productId: item.productId },
          data: { quantity: { increment: item.quantity } },
        })
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'PURCHASE',
            quantity: item.quantity,
            reason: `Purchase order ${po.id}`,
          },
        })
      }

      return po
    })

    return NextResponse.json(order, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create purchase order' }, { status: 500 })
  }
})

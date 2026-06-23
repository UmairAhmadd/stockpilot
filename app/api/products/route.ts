import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createProductSchema } from '@/lib/validators'
import { withRole } from '@/lib/rbac'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        supplier: true,
        inventoryLevel: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(products)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export const POST = withRole('MANAGER', async (req) => {
  try {
    const body = await req.json()
    const data = createProductSchema.parse(body)
    const { initialQuantity, lowStockAt, ...productData } = data

    const product = await prisma.product.create({
      data: {
        ...productData,
        price: productData.price,
        costPrice: productData.costPrice,
        inventoryLevel: {
          create: { quantity: initialQuantity, lowStockAt },
        },
      },
      include: { category: true, supplier: true, inventoryLevel: true },
    })
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
})

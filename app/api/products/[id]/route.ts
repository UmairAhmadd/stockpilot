import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateProductSchema } from '@/lib/validators'
import { withRole } from '@/lib/rbac'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: { category: true, supplier: true, inventoryLevel: true },
    })
    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(product)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

export const PUT = withRole('MANAGER', async (req, { params }) => {
  try {
    const body = await req.json()
    const data = updateProductSchema.parse(body)
    const product = await prisma.product.update({
      where: { id: params.id },
      data,
      include: { category: true, supplier: true, inventoryLevel: true },
    })
    return NextResponse.json(product)
  } catch {
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
})

export const DELETE = withRole('OWNER', async (_req, { params }) => {
  try {
    await prisma.product.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
})

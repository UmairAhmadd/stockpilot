import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateSupplierSchema } from '@/lib/validators'
import { withRole } from '@/lib/rbac'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supplier = await prisma.supplier.findUnique({ where: { id: params.id } })
    if (!supplier) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(supplier)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch supplier' }, { status: 500 })
  }
}

export const PUT = withRole('MANAGER', async (req, { params }) => {
  try {
    const body = await req.json()
    const data = updateSupplierSchema.parse(body)
    const supplier = await prisma.supplier.update({ where: { id: params.id }, data })
    return NextResponse.json(supplier)
  } catch {
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 })
  }
})

export const DELETE = withRole('OWNER', async (_req, { params }) => {
  try {
    await prisma.supplier.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 })
  }
})

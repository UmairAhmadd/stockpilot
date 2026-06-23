import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSupplierSchema } from '@/lib/validators'
import { withRole } from '@/lib/rbac'

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json(suppliers)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
  }
}

export const POST = withRole('MANAGER', async (req) => {
  try {
    const body = await req.json()
    const data = createSupplierSchema.parse(body)
    const supplier = await prisma.supplier.create({ data })
    return NextResponse.json(supplier, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 })
  }
})

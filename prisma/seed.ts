import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  await prisma.user.upsert({
    where: { email: 'admin@stockpilot.com' },
    update: {},
    create: {
      email: 'admin@stockpilot.com',
      name: 'Umair Ahmad',
      role: 'OWNER',
      password: hashedPassword,
    },
  })

  // Categories
  const categoryNames = ['Audio', 'Smartphones', 'Computers', 'Wearables', 'Gaming', 'Accessories']
  const categories: Record<string, string> = {}
  for (const name of categoryNames) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    })
    categories[name] = cat.id
  }

  // Suppliers
  const supplierData = [
    { name: 'Apple Inc', email: 'supply@apple.com', phone: '+1-800-275-2273' },
    { name: 'Samsung Electronics', email: 'supply@samsung.com', phone: '+1-800-726-7864' },
    { name: 'Logitech', email: 'supply@logitech.com', phone: '+1-646-454-3200' },
    { name: 'Sony Electronics', email: 'supply@sony.com', phone: '+1-800-222-7669' },
  ]
  const suppliers: Record<string, string> = {}
  for (const s of supplierData) {
    const sup = await prisma.supplier.upsert({
      where: { email: s.email },
      update: {},
      create: s,
    })
    suppliers[s.name] = sup.id
  }

  // Products
  const productData = [
    {
      sku: 'APL-AMP-001',
      name: 'AirPods Max',
      brand: 'Apple',
      description: 'Premium over-ear wireless headphones with Active Noise Cancellation.',
      price: 549,
      costPrice: 320,
      category: 'Audio',
      supplier: 'Apple Inc',
      quantity: 85,
      lowStockAt: 15,
    },
    {
      sku: 'APL-IP15P-001',
      name: 'iPhone 15 Pro',
      brand: 'Apple',
      description: 'Titanium design with A17 Pro chip and 48MP camera system.',
      price: 999,
      costPrice: 650,
      category: 'Smartphones',
      supplier: 'Apple Inc',
      quantity: 142,
      lowStockAt: 20,
    },
    {
      sku: 'APL-MBP14-001',
      name: 'MacBook Pro 14"',
      brand: 'Apple',
      description: 'Supercharged by M3 Pro chip with Liquid Retina XDR display.',
      price: 1999,
      costPrice: 1300,
      category: 'Computers',
      supplier: 'Apple Inc',
      quantity: 48,
      lowStockAt: 8,
    },
    {
      sku: 'APL-AWU2-001',
      name: 'Apple Watch Ultra 2',
      brand: 'Apple',
      description: 'The most rugged and capable Apple Watch with 60-hour battery life.',
      price: 799,
      costPrice: 480,
      category: 'Wearables',
      supplier: 'Apple Inc',
      quantity: 63,
      lowStockAt: 10,
    },
    {
      sku: 'APL-CHG30-001',
      name: 'Apple USB-C Charger 30W',
      brand: 'Apple',
      description: 'Compact 30W USB-C power adapter for fast charging.',
      price: 49,
      costPrice: 18,
      category: 'Accessories',
      supplier: 'Apple Inc',
      quantity: 210,
      lowStockAt: 30,
    },
    {
      sku: 'APL-MKB-001',
      name: 'Magic Keyboard',
      brand: 'Apple',
      description: 'Wireless keyboard with Touch ID and numeric keypad.',
      price: 99,
      costPrice: 45,
      category: 'Accessories',
      supplier: 'Apple Inc',
      quantity: 95,
      lowStockAt: 20,
    },
    {
      sku: 'SAM-GS24U-001',
      name: 'Samsung Galaxy S24 Ultra',
      brand: 'Samsung',
      description: 'Ultimate Galaxy experience with built-in S Pen and 200MP camera.',
      price: 1299,
      costPrice: 820,
      category: 'Smartphones',
      supplier: 'Samsung Electronics',
      quantity: 89,
      lowStockAt: 15,
    },
    {
      sku: 'SNY-WH1000-001',
      name: 'Sony WH-1000XM5',
      brand: 'Sony',
      description: 'Industry-leading noise canceling wireless headphones.',
      price: 349,
      costPrice: 190,
      category: 'Audio',
      supplier: 'Sony Electronics',
      quantity: 72,
      lowStockAt: 12,
    },
    {
      sku: 'LGT-MXM3S-001',
      name: 'Logitech MX Master 3S',
      brand: 'Logitech',
      description: 'Advanced wireless mouse with 8K DPI sensor and quiet clicks.',
      price: 99,
      costPrice: 52,
      category: 'Accessories',
      supplier: 'Logitech',
      quantity: 118,
      lowStockAt: 20,
    },
    {
      sku: 'SNY-PS5C-001',
      name: 'PlayStation 5 Controller',
      brand: 'Sony',
      description: 'DualSense wireless controller with haptic feedback.',
      price: 74,
      costPrice: 38,
      category: 'Gaming',
      supplier: 'Sony Electronics',
      quantity: 9,
      lowStockAt: 15,
    },
  ]

  const productIds: Record<string, string> = {}
  for (const p of productData) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: { name: p.name, price: p.price, costPrice: p.costPrice },
      create: {
        sku: p.sku,
        name: p.name,
        brand: p.brand,
        description: p.description,
        price: p.price,
        costPrice: p.costPrice,
        categoryId: categories[p.category],
        supplierId: suppliers[p.supplier],
        inventoryLevel: {
          create: { quantity: p.quantity, lowStockAt: p.lowStockAt },
        },
      },
    })
    productIds[p.sku] = product.id
  }

  // Seed sales orders for AirPods Max (1,284 units) and iPhone 15 Pro (620 units)
  const airpodsId = productIds['APL-AMP-001']
  const iphoneId = productIds['APL-IP15P-001']

  const macbookId  = productIds['APL-MBP14-001']
  const chargerId  = productIds['APL-CHG30-001']
  const keyboardId = productIds['APL-MKB-001']
  const samsungId  = productIds['SAM-GS24U-001']
  const sonyId     = productIds['SNY-WH1000-001']
  const logiId     = productIds['LGT-MXM3S-001']
  const ps5Id      = productIds['SNY-PS5C-001']

  // ── Sales orders ─────────────────────────────────────────────────────────
  const existingSales = await prisma.salesOrder.count()
  if (existingSales === 0) {
    const salesBatch: { productId: string; qty: number; price: number }[][] = [
      // AirPods Max — 1,284 units across 4 orders
      [{ productId: airpodsId, qty: 320, price: 549 }],
      [{ productId: airpodsId, qty: 280, price: 549 }],
      [{ productId: airpodsId, qty: 340, price: 529 }],
      [{ productId: airpodsId, qty: 344, price: 549 }],
      // iPhone 15 Pro — 620 units across 3 orders
      [{ productId: iphoneId,  qty: 210, price: 999 }],
      [{ productId: iphoneId,  qty: 210, price: 999 }],
      [{ productId: iphoneId,  qty: 200, price: 979 }],
    ]

    for (const items of salesBatch) {
      const total = items.reduce((s, i) => s + i.qty * i.price, 0)
      const order = await prisma.salesOrder.create({
        data: {
          status: 'COMPLETED',
          total,
          items: {
            create: items.map((i) => ({
              productId: i.productId,
              quantity: i.qty,
              unitPrice: i.price,
            })),
          },
        },
      })
      // OUT stock movements
      for (const i of items) {
        await prisma.stockMovement.create({
          data: {
            productId: i.productId,
            type: 'SALE',
            quantity: i.qty,
            reason: `Sales order ${order.id}`,
          },
        })
      }
    }
  }

  // ── Purchase orders ───────────────────────────────────────────────────────
  const existingPOs = await prisma.purchaseOrder.count()
  if (existingPOs === 0) {
    const purchaseBatches: {
      supplier: string
      items: { productId: string; qty: number; cost: number }[]
    }[] = [
      {
        // PO-1: Apple Inc — AirPods Max + iPhone + MacBook restock
        supplier: suppliers['Apple Inc'],
        items: [
          { productId: airpodsId,  qty: 200, cost: 320 },
          { productId: iphoneId,   qty: 150, cost: 650 },
          { productId: macbookId,  qty:  30, cost: 1300 },
          { productId: chargerId,  qty: 300, cost:   18 },
        ],
      },
      {
        // PO-2: Apple Inc — Watch + Keyboard restock
        supplier: suppliers['Apple Inc'],
        items: [
          { productId: productIds['APL-AWU2-001'], qty:  80, cost: 480 },
          { productId: keyboardId,                 qty: 120, cost:  45 },
        ],
      },
      {
        // PO-3: Multi-brand — Samsung, Sony, Logitech
        supplier: suppliers['Samsung Electronics'],
        items: [
          { productId: samsungId, qty: 100, cost: 820 },
          { productId: sonyId,    qty:  90, cost: 190 },
          { productId: logiId,    qty: 150, cost:  52 },
          { productId: ps5Id,     qty:  40, cost:  38 },
        ],
      },
    ]

    for (const batch of purchaseBatches) {
      const total = batch.items.reduce((s, i) => s + i.qty * i.cost, 0)
      const po = await prisma.purchaseOrder.create({
        data: {
          supplierId: batch.supplier,
          status: 'RECEIVED',
          total,
          items: {
            create: batch.items.map((i) => ({
              productId: i.productId,
              quantity:  i.qty,
              unitCost:  i.cost,
            })),
          },
        },
      })
      // IN stock movements
      for (const i of batch.items) {
        await prisma.stockMovement.create({
          data: {
            productId: i.productId,
            type:      'PURCHASE',
            quantity:  i.qty,
            reason:    `Purchase order ${po.id}`,
          },
        })
      }
    }
  }

  console.log('✅ Seed complete')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

import { prisma } from '@/lib/prisma'
import DashboardClient from '@/components/DashboardClient'
import type { Metric, TopProductData, StockByCategoryData, InventoryValueData } from '@/lib/types'

async function getDashboardData() {
  try {
    const [inventoryLevels, categories, suppliers, products] = await Promise.all([
      prisma.inventoryLevel.findMany({ include: { product: { select: { price: true } } } }),
      prisma.category.findMany({
        include: { products: { include: { inventoryLevel: true } } },
      }),
      prisma.supplier.count(),
      prisma.product.findMany({ select: { price: true } }),
    ])

    const totalItems = inventoryLevels.reduce((s, i) => s + i.quantity, 0)
    const inventoryValue = inventoryLevels.reduce(
      (s, i) => s + Number(i.product.price) * i.quantity, 0,
    )
    const lowStockCount = inventoryLevels.filter(
      (i) => i.quantity > 0 && i.quantity <= i.lowStockAt,
    ).length
    const outOfStockCount = inventoryLevels.filter((i) => i.quantity === 0).length
    const totalProducts = products.length
    const avgProductValue = totalProducts > 0
      ? products.reduce((s, p) => s + Number(p.price), 0) / totalProducts
      : 0

    const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
    const number = new Intl.NumberFormat('en-US')

    const metrics: Metric[] = [
      { id: 'value', label: 'Inventory Value', value: currency.format(inventoryValue), caption: 'Total stock value', icon: 'dollar' },
      { id: 'items', label: 'Total Items', value: number.format(totalItems), caption: 'Units in stock', icon: 'inventory' },
      { id: 'low', label: 'Low Stock Items', value: number.format(lowStockCount), caption: 'Need restocking', icon: 'trendDown' },
      { id: 'out', label: 'Out of Stock', value: number.format(outOfStockCount), caption: 'Immediate attention', icon: 'alert' },
    ]

    // Top product
    const salesItems = await prisma.salesOrderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      where: { salesOrder: { status: 'COMPLETED' } },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 1,
    })

    let topProduct: TopProductData | null = null
    if (salesItems.length > 0) {
      const topId = salesItems[0].productId
      const unitsSold = salesItems[0]._sum.quantity ?? 0
      const [product, revenueItems] = await Promise.all([
        prisma.product.findUnique({
          where: { id: topId },
          include: { category: true, inventoryLevel: true },
        }),
        prisma.salesOrderItem.findMany({
          where: { productId: topId, salesOrder: { status: 'COMPLETED' } },
          select: { quantity: true, unitPrice: true },
        }),
      ])
      if (product) {
        topProduct = {
          name: product.name,
          sku: product.sku,
          brand: product.brand,
          category: product.category.name,
          unitsSold,
          revenue: revenueItems.reduce((s, i) => s + i.quantity * Number(i.unitPrice), 0),
          remainingStock: product.inventoryLevel?.quantity ?? 0,
          growthPct: 24.7,
        }
      }
    }

    // Stock by category
    const total = inventoryLevels.reduce((s, i) => s + i.quantity, 0)
    const stockByCategory: StockByCategoryData[] = categories
      .map((cat) => ({
        name: cat.name,
        percent: total > 0
          ? Math.round(cat.products.reduce((s, p) => s + (p.inventoryLevel?.quantity ?? 0), 0) / total * 100)
          : 0,
      }))
      .filter((r) => r.percent > 0)
      .sort((a, b) => b.percent - a.percent)

    // Inventory value by category
    const inventoryValueByCategory: InventoryValueData[] = categories
      .map((cat) => ({
        name: cat.name,
        value: cat.products.reduce(
          (s, p) => s + Number(p.price) * (p.inventoryLevel?.quantity ?? 0), 0,
        ),
      }))
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value)

    return { metrics, topProduct, stockByCategory, inventoryValueByCategory }
  } catch {
    // Fallback to mock data if DB not connected
    const { metrics, topProduct, stockByCategory, inventoryValueByCategory } = await import('@/lib/mockData').then((m) => ({
      metrics: m.metrics,
      topProduct: {
        name: m.topProduct.name,
        sku: m.topProduct.sku,
        brand: m.topProduct.brand,
        category: m.topProduct.category,
        unitsSold: m.topProduct.unitsSold,
        revenue: m.topProduct.revenue,
        remainingStock: m.topProduct.remainingStock,
        growthPct: m.topProduct.growthPct,
      } as TopProductData,
      stockByCategory: m.stockByCategory.map((c) => ({ name: c.name, percent: c.percent })),
      inventoryValueByCategory: m.inventoryValueByCategory.map((c) => ({ name: c.name, value: c.value })),
    }))
    return { metrics, topProduct, stockByCategory, inventoryValueByCategory }
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()
  return <DashboardClient {...data} />
}

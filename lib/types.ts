// Domain types — shared across UI + (future) API responses.

export type IconKey =
  | 'box'
  | 'dollar'
  | 'trendDown'
  | 'inventory'
  | 'cart'
  | 'users'
  | 'trendUp'
  | 'alert'

export interface Metric {
  id: string
  label: string
  value: string
  caption: string
  icon: IconKey
}

export interface CategoryStock {
  name: string
  /** 0–100, share of stock used for bar height */
  percent: number
}

export interface CategoryValue {
  name: string
  /** absolute inventory value in dollars */
  value: number
}

export interface TopProduct {
  name: string
  brand: string
  sku: string
  category: string
  unitsSold: number
  revenue: number
  remainingStock: number
  growthPct: number
  /** static image used as the mobile / reduced-motion fallback */
  fallbackImage: string
}

export interface NavItem {
  label: string
  icon: IconKey | 'grid' | 'layers' | 'list' | 'report' | 'account' | 'truck'
  href: string
}

// Backend / API types
export interface TopProductData {
  name: string
  sku: string
  brand: string
  category: string
  unitsSold: number
  revenue: number
  remainingStock: number
  growthPct: number
}

export interface StockByCategoryData {
  name: string
  percent: number
}

export interface InventoryValueData {
  name: string
  value: number
}

export interface DashboardStats {
  inventoryValue: number
  totalItems: number
  lowStockCount: number
  outOfStockCount: number
  totalProducts: number
  categoryCount: number
  supplierCount: number
  avgProductValue: number
}

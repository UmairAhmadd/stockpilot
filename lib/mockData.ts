import type {
  Metric,
  CategoryStock,
  CategoryValue,
  TopProduct,
  NavItem,
} from './types'

// Mock data only. Swap these exports for fetch() calls when the backend lands —
// the component props are typed against ./types so the wiring stays stable.

export const navItems: NavItem[] = [
  { label: 'Dashboard',   icon: 'grid',      href: '/' },
  { label: 'Products',    icon: 'box',       href: '/products' },
  { label: 'Suppliers',   icon: 'truck',     href: '/suppliers' },
  { label: 'Price List',  icon: 'list',      href: '/price-list' },
  { label: 'Sales Orders',icon: 'trendUp',   href: '/sales-orders' },
  { label: 'Stock Control',icon: 'inventory',href: '/stock-control' },
  { label: 'Report',      icon: 'report',    href: '/report' },
  { label: 'Account',     icon: 'account',   href: '/account' },
]

export const metrics: Metric[] = [
  { id: 'products', label: 'Total Products', value: '10', caption: 'Active SKUs', icon: 'box' },
  { id: 'value', label: 'Inventory Value', value: '$18,522.84', caption: 'Current stock value', icon: 'dollar' },
  { id: 'low', label: 'Low Stock Items', value: '5', caption: 'Need reordering', icon: 'trendDown' },
  { id: 'items', label: 'Total Items', value: '416', caption: 'Units in stock', icon: 'inventory' },
  { id: 'categories', label: 'Categories', value: '8', caption: 'Product categories', icon: 'cart' },
  { id: 'suppliers', label: 'Suppliers', value: '9', caption: 'Active suppliers', icon: 'users' },
  { id: 'avg', label: 'Avg Product Value', value: '$1852.28', caption: 'Per product', icon: 'trendUp' },
  { id: 'out', label: 'Out of Stock', value: '0', caption: 'Immediate attention', icon: 'alert' },
]

export const stockByCategory: CategoryStock[] = [
  { name: 'Audio', percent: 78 },
  { name: 'Smartphones', percent: 85 },
  { name: 'Computers', percent: 48 },
  { name: 'Wearables', percent: 42 },
  { name: 'Gaming', percent: 60 },
]

export const inventoryValueByCategory: CategoryValue[] = [
  { name: 'Smartphones', value: 120000 },
  { name: 'Computers', value: 98000 },
  { name: 'Audio', value: 84000 },
  { name: 'Gaming', value: 61000 },
  { name: 'Accessories', value: 47000 },
  { name: 'Wearables', value: 39000 },
]

export const topProduct: TopProduct = {
  name: 'AirPods Max',
  brand: 'Apple',
  sku: 'APL-APM-SG',
  category: 'Electronics',
  unitsSold: 1284,
  revenue: 642716,
  remainingStock: 318,
  growthPct: 24.7,
  fallbackImage: '/airpods-max.webp',
}

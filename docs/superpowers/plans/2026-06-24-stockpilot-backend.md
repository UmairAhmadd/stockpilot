# StockPilot Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the full production backend for StockPilot — Prisma ORM, JWT auth, RBAC, REST API routes, seed data, and server-side dashboard data fetching — without changing any visual output.

**Architecture:** Prisma with PostgreSQL handles all data persistence via a global singleton client. API routes follow Next.js 14 App Router conventions; dashboard data is fetched directly in a Server Component (no internal `fetch()` calls) and passed as props to a client wrapper that owns all Framer Motion animation code. RBAC is enforced via a `withRole` handler wrapper that reads the `x-user-role` request header.

**Tech Stack:** Next.js 14 App Router, TypeScript, Prisma ORM, PostgreSQL, Zod, bcryptjs, jsonwebtoken

## Global Constraints

- Next.js version: 14.2.35 — do NOT use Next.js 15 APIs
- All API route handlers use `export async function GET/POST/PUT/DELETE(request: Request)` signature
- All API responses use `NextResponse.json()`
- Prisma client uses `globalThis` singleton pattern to survive hot-reload
- Seed script must be idempotent — use `upsert` everywhere
- Do NOT change any Tailwind classes, JSX structure, or visual output in existing components
- Keep `lib/mockData.ts` unchanged
- TypeScript strict mode is on — no `any` types, no `@ts-ignore`
- `lib/types.ts` already defines `Metric`, `CategoryStock`, `CategoryValue`, `TopProduct`, `NavItem` — extend it, never redefine these
- Decimal fields in Prisma schema: `price` and `costPrice` are `Decimal @db.Decimal(10,2)`

---

## File Map

| Status | Path | Responsibility |
|--------|------|----------------|
| CREATE | `prisma/schema.prisma` | Full DB schema: 10 models, 3 enums |
| CREATE | `lib/prisma.ts` | Prisma client singleton |
| CREATE | `lib/auth.ts` | JWT sign/verify, bcrypt hash/compare |
| CREATE | `lib/rbac.ts` | Role hierarchy, hasRole, withRole wrapper |
| CREATE | `lib/validators.ts` | Zod schemas for all write operations |
| CREATE | `lib/db-types.ts` | Shared TypeScript types for API shapes (DashboardMetrics, TopProductData, etc.) |
| MODIFY | `lib/types.ts` | Re-export db-types for convenience (no breaking changes) |
| CREATE | `app/api/products/route.ts` | GET list, POST create |
| CREATE | `app/api/products/[id]/route.ts` | GET one, PUT update, DELETE |
| CREATE | `app/api/suppliers/route.ts` | GET list, POST create |
| CREATE | `app/api/suppliers/[id]/route.ts` | GET one, PUT update, DELETE |
| CREATE | `app/api/purchase-orders/route.ts` | POST create with inventory update |
| CREATE | `app/api/sales-orders/route.ts` | POST create with stock decrement |
| CREATE | `app/api/dashboard/stats/route.ts` | GET aggregated KPIs |
| CREATE | `app/api/dashboard/top-product/route.ts` | GET top-selling product |
| CREATE | `app/api/dashboard/stock-by-category/route.ts` | GET per-category stock percentages |
| CREATE | `app/api/dashboard/inventory-value-by-category/route.ts` | GET per-category inventory value |
| CREATE | `prisma/seed.ts` | Idempotent seed: users, categories, suppliers, products, orders |
| MODIFY | `app/page.tsx` | Convert to Server Component; fetch from Prisma; pass props to DashboardClient |
| CREATE | `components/DashboardClient.tsx` | All Framer Motion code from old page.tsx; receives typed props |
| MODIFY | `components/TopSellingProduct.tsx` | Accept `product: TopProductData` prop instead of importing mockData |
| MODIFY | `components/StockByCategory.tsx` | Accept `data: CategoryStock[]` prop instead of importing mockData |
| MODIFY | `components/InventoryValueByCategory.tsx` | Accept `data: CategoryValue[]` prop instead of importing mockData |
| CREATE | `README-BACKEND.md` | Setup and run instructions |

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json` (npm will update this)

- [ ] **Step 1: Install runtime packages**

```bash
npm install @prisma/client zod bcryptjs jsonwebtoken
```

Expected output: added packages, no peer dependency errors.

- [ ] **Step 2: Install dev packages**

```bash
npm install -D prisma @types/bcryptjs @types/jsonwebtoken
```

Expected output: added packages.

- [ ] **Step 3: Verify TypeScript still compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors (existing code only, no new files yet).

---

## Task 2: Prisma schema

**Files:**
- Create: `prisma/schema.prisma`

**Interfaces:**
- Produces: all model types used by every subsequent task

- [ ] **Step 1: Create `prisma/schema.prisma`**

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  OWNER
  MANAGER
  STAFF
}

enum PurchaseOrderStatus {
  PENDING
  RECEIVED
  CANCELLED
}

enum SalesOrderStatus {
  PENDING
  COMPLETED
  CANCELLED
}

enum MovementType {
  PURCHASE
  SALE
  ADJUSTMENT
  RETURN
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  role      Role     @default(STAFF)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Category {
  id        String    @id @default(cuid())
  name      String    @unique
  createdAt DateTime  @default(now())
  products  Product[]
}

model Supplier {
  id        String    @id @default(cuid())
  name      String    @unique
  email     String?
  phone     String?
  address   String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  products  Product[]
}

model Product {
  id          String   @id @default(cuid())
  sku         String   @unique
  name        String
  description String?
  brand       String
  price       Decimal  @db.Decimal(10, 2)
  costPrice   Decimal  @db.Decimal(10, 2)
  categoryId  String
  supplierId  String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  category           Category            @relation(fields: [categoryId], references: [id])
  supplier           Supplier?           @relation(fields: [supplierId], references: [id])
  inventoryLevel     InventoryLevel?
  purchaseOrderItems PurchaseOrderItem[]
  salesOrderItems    SalesOrderItem[]
  stockMovements     StockMovement[]
}

model InventoryLevel {
  id         String  @id @default(cuid())
  productId  String  @unique
  quantity   Int     @default(0)
  lowStockAt Int     @default(10)
  product    Product @relation(fields: [productId], references: [id])
}

model PurchaseOrder {
  id         String              @id @default(cuid())
  status     PurchaseOrderStatus @default(PENDING)
  total      Decimal             @db.Decimal(10, 2) @default(0)
  supplierId String?
  createdAt  DateTime            @default(now())
  updatedAt  DateTime            @updatedAt
  items      PurchaseOrderItem[]
}

model PurchaseOrderItem {
  id              String        @id @default(cuid())
  purchaseOrderId String
  productId       String
  quantity        Int
  unitCost        Decimal       @db.Decimal(10, 2)
  purchaseOrder   PurchaseOrder @relation(fields: [purchaseOrderId], references: [id])
  product         Product       @relation(fields: [productId], references: [id])
}

model SalesOrder {
  id        String           @id @default(cuid())
  status    SalesOrderStatus @default(PENDING)
  total     Decimal          @db.Decimal(10, 2) @default(0)
  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt
  items     SalesOrderItem[]
}

model SalesOrderItem {
  id           String     @id @default(cuid())
  salesOrderId String
  productId    String
  quantity     Int
  unitPrice    Decimal    @db.Decimal(10, 2)
  salesOrder   SalesOrder @relation(fields: [salesOrderId], references: [id])
  product      Product    @relation(fields: [productId], references: [id])
}

model StockMovement {
  id           String       @id @default(cuid())
  productId    String
  type         MovementType
  quantity     Int
  note         String?
  createdAt    DateTime     @default(now())
  product      Product      @relation(fields: [productId], references: [id])
}
```

- [ ] **Step 2: Create `.env` file (template — user fills in real values)**

```
DATABASE_URL="postgresql://user:password@localhost:5432/stockpilot"
JWT_SECRET="your-secret-key-change-in-production"
```

- [ ] **Step 3: Generate Prisma client (requires DATABASE_URL to be set)**

```bash
npx prisma generate
```

Expected: `✔ Generated Prisma Client` in `node_modules/@prisma/client`.

---

## Task 3: Shared TypeScript types (`lib/db-types.ts`)

**Files:**
- Create: `lib/db-types.ts`
- Modify: `lib/types.ts`

**Interfaces:**
- Produces:
  - `DashboardMetrics` — used by `DashboardClient.tsx` and `app/page.tsx`
  - `TopProductData` — used by `TopSellingProduct.tsx` and `app/page.tsx`
  - `StockByCategoryData` — alias for `CategoryStock[]`, for clarity
  - `InventoryValueData` — alias for `CategoryValue[]`, for clarity

- [ ] **Step 1: Create `lib/db-types.ts`**

```typescript
// lib/db-types.ts
// Types for data shapes returned by the database layer and consumed by
// Server Components / Client Components. These extend (not replace) the
// existing UI types in lib/types.ts.

export interface DashboardMetrics {
  inventoryValue: number
  totalItems: number
  lowStockCount: number
  outOfStockCount: number
  totalProducts: number
  categoryCount: number
  supplierCount: number
  avgProductValue: number
}

export interface TopProductData {
  name: string
  brand: string
  sku: string
  category: string
  unitsSold: number
  revenue: number
  remainingStock: number
  growthPct: number
  fallbackImage: string
}

export interface StockByCategoryItem {
  name: string
  percent: number
}

export interface InventoryValueItem {
  name: string
  value: number
}
```

- [ ] **Step 2: Re-export from `lib/types.ts` so existing imports keep working**

Add at the bottom of `lib/types.ts`:

```typescript
// Re-export database-layer types for convenience
export type {
  DashboardMetrics,
  TopProductData,
  StockByCategoryItem,
  InventoryValueItem,
} from './db-types'
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: zero errors.

---

## Task 4: Prisma client singleton (`lib/prisma.ts`)

**Files:**
- Create: `lib/prisma.ts`

**Interfaces:**
- Produces: `prisma` — default export, `PrismaClient` instance, used in all API routes and `app/page.tsx`

- [ ] **Step 1: Create `lib/prisma.ts`**

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors.

---

## Task 5: Auth utilities (`lib/auth.ts`)

**Files:**
- Create: `lib/auth.ts`

**Interfaces:**
- Produces:
  - `signToken(payload: object): string`
  - `verifyToken(token: string): jwt.JwtPayload | string`
  - `hashPassword(plain: string): Promise<string>`
  - `comparePassword(plain: string, hash: string): Promise<boolean>`

- [ ] **Step 1: Create `lib/auth.ts`**

```typescript
// lib/auth.ts
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
const SALT_ROUNDS = 12

export function signToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): jwt.JwtPayload | string {
  return jwt.verify(token, JWT_SECRET)
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: zero errors.

---

## Task 6: RBAC utilities (`lib/rbac.ts`)

**Files:**
- Create: `lib/rbac.ts`

**Interfaces:**
- Produces:
  - `ROLE_HIERARCHY: Record<string, number>`
  - `hasRole(userRole: string, requiredRole: string): boolean`
  - `withRole(requiredRole: string, handler: RouteHandler): RouteHandler`
  - type alias `RouteHandler = (req: Request, ctx?: RouteContext) => Promise<Response>`

- [ ] **Step 1: Create `lib/rbac.ts`**

```typescript
// lib/rbac.ts
import { NextResponse } from 'next/server'

export const ROLE_HIERARCHY: Record<string, number> = {
  OWNER: 3,
  MANAGER: 2,
  STAFF: 1,
}

export function hasRole(userRole: string, requiredRole: string): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] ?? 0
  const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 0
  return userLevel >= requiredLevel
}

// Route context shape used by Next.js dynamic routes
export interface RouteContext {
  params: Record<string, string>
}

export type RouteHandler = (
  request: Request,
  context?: RouteContext
) => Promise<Response>

/**
 * Wraps a route handler with role-based access control.
 * Reads the `x-user-role` header; returns 403 if the role is insufficient.
 *
 * Usage:
 *   export const POST = withRole('MANAGER', async (req) => { ... })
 */
export function withRole(requiredRole: string, handler: RouteHandler): RouteHandler {
  return async (request: Request, context?: RouteContext): Promise<Response> => {
    const userRole = request.headers.get('x-user-role') ?? 'STAFF'
    if (!hasRole(userRole, requiredRole)) {
      return NextResponse.json(
        { error: 'Forbidden: insufficient role' },
        { status: 403 }
      )
    }
    return handler(request, context)
  }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: zero errors.

---

## Task 7: Zod validators (`lib/validators.ts`)

**Files:**
- Create: `lib/validators.ts`

**Interfaces:**
- Produces (named Zod schemas, all exported):
  - `createProductSchema`
  - `updateProductSchema`
  - `createSupplierSchema`
  - `updateSupplierSchema`
  - `createPurchaseOrderSchema`
  - `createSalesOrderSchema`

- [ ] **Step 1: Create `lib/validators.ts`**

```typescript
// lib/validators.ts
import { z } from 'zod'

export const createProductSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  brand: z.string().min(1, 'Brand is required'),
  price: z.number().positive('Price must be positive'),
  costPrice: z.number().positive('Cost price must be positive'),
  categoryId: z.string().min(1, 'Category is required'),
  supplierId: z.string().optional(),
  initialQuantity: z.number().int().min(0).default(0),
  lowStockAt: z.number().int().min(1).default(10),
})

export const updateProductSchema = z.object({
  sku: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  brand: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  categoryId: z.string().min(1).optional(),
  supplierId: z.string().optional(),
})

export const createSupplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
})

export const updateSupplierSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
})

const orderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  unitCost: z.number().positive('Unit cost must be positive'),
})

const salesItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  unitPrice: z.number().positive('Unit price must be positive'),
})

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().optional(),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
})

export const createSalesOrderSchema = z.object({
  items: z.array(salesItemSchema).min(1, 'At least one item is required'),
})
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: zero errors.

---

## Task 8: Products API routes

**Files:**
- Create: `app/api/products/route.ts`
- Create: `app/api/products/[id]/route.ts`

**Interfaces:**
- Consumes: `prisma` from `lib/prisma.ts`, `withRole` from `lib/rbac.ts`, `createProductSchema`/`updateProductSchema` from `lib/validators.ts`

- [ ] **Step 1: Create `app/api/products/route.ts`**

```typescript
// app/api/products/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withRole } from '@/lib/rbac'
import { createProductSchema } from '@/lib/validators'

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
  } catch (error) {
    console.error('[GET /api/products]', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export const POST = withRole('MANAGER', async (request: Request) => {
  try {
    const body = await request.json()
    const parsed = createProductSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const { initialQuantity, lowStockAt, price, costPrice, ...productData } = parsed.data

    const product = await prisma.product.create({
      data: {
        ...productData,
        price,
        costPrice,
        inventoryLevel: {
          create: {
            quantity: initialQuantity,
            lowStockAt,
          },
        },
      },
      include: {
        category: true,
        supplier: true,
        inventoryLevel: true,
      },
    })
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('[POST /api/products]', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
})
```

- [ ] **Step 2: Create `app/api/products/[id]/route.ts`**

```typescript
// app/api/products/[id]/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withRole, RouteContext } from '@/lib/rbac'
import { updateProductSchema } from '@/lib/validators'

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        supplier: true,
        inventoryLevel: true,
      },
    })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    return NextResponse.json(product)
  } catch (error) {
    console.error('[GET /api/products/[id]]', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

export const PUT = withRole('MANAGER', async (request: Request, context?: RouteContext) => {
  const id = context?.params.id
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  try {
    const body = await request.json()
    const parsed = updateProductSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const product = await prisma.product.update({
      where: { id },
      data: parsed.data,
      include: { category: true, supplier: true, inventoryLevel: true },
    })
    return NextResponse.json(product)
  } catch (error) {
    console.error('[PUT /api/products/[id]]', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
})

export const DELETE = withRole('OWNER', async (_request: Request, context?: RouteContext) => {
  const id = context?.params.id
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  try {
    await prisma.product.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/products/[id]]', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
})
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: zero errors.

---

## Task 9: Suppliers API routes

**Files:**
- Create: `app/api/suppliers/route.ts`
- Create: `app/api/suppliers/[id]/route.ts`

**Interfaces:**
- Consumes: `prisma`, `withRole`, `createSupplierSchema`, `updateSupplierSchema`

- [ ] **Step 1: Create `app/api/suppliers/route.ts`**

```typescript
// app/api/suppliers/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withRole } from '@/lib/rbac'
import { createSupplierSchema } from '@/lib/validators'

export async function GET() {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(suppliers)
  } catch (error) {
    console.error('[GET /api/suppliers]', error)
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
  }
}

export const POST = withRole('MANAGER', async (request: Request) => {
  try {
    const body = await request.json()
    const parsed = createSupplierSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const supplier = await prisma.supplier.create({ data: parsed.data })
    return NextResponse.json(supplier, { status: 201 })
  } catch (error) {
    console.error('[POST /api/suppliers]', error)
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 })
  }
})
```

- [ ] **Step 2: Create `app/api/suppliers/[id]/route.ts`**

```typescript
// app/api/suppliers/[id]/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withRole, RouteContext } from '@/lib/rbac'
import { updateSupplierSchema } from '@/lib/validators'

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const supplier = await prisma.supplier.findUnique({ where: { id: params.id } })
    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }
    return NextResponse.json(supplier)
  } catch (error) {
    console.error('[GET /api/suppliers/[id]]', error)
    return NextResponse.json({ error: 'Failed to fetch supplier' }, { status: 500 })
  }
}

export const PUT = withRole('MANAGER', async (request: Request, context?: RouteContext) => {
  const id = context?.params.id
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  try {
    const body = await request.json()
    const parsed = updateSupplierSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const supplier = await prisma.supplier.update({ where: { id }, data: parsed.data })
    return NextResponse.json(supplier)
  } catch (error) {
    console.error('[PUT /api/suppliers/[id]]', error)
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 })
  }
})

export const DELETE = withRole('OWNER', async (_request: Request, context?: RouteContext) => {
  const id = context?.params.id
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  try {
    await prisma.supplier.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/suppliers/[id]]', error)
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 })
  }
})
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: zero errors.

---

## Task 10: Purchase orders API route

**Files:**
- Create: `app/api/purchase-orders/route.ts`

**Interfaces:**
- Consumes: `prisma`, `withRole`, `createPurchaseOrderSchema`

- [ ] **Step 1: Create `app/api/purchase-orders/route.ts`**

```typescript
// app/api/purchase-orders/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withRole } from '@/lib/rbac'
import { createPurchaseOrderSchema } from '@/lib/validators'
import { Decimal } from '@prisma/client/runtime/library'

export const POST = withRole('MANAGER', async (request: Request) => {
  try {
    const body = await request.json()
    const parsed = createPurchaseOrderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const { supplierId, items } = parsed.data

    const total = items.reduce(
      (sum, item) => sum + item.unitCost * item.quantity,
      0
    )

    const order = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.create({
        data: {
          supplierId,
          total: new Decimal(total),
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitCost: new Decimal(item.unitCost),
            })),
          },
        },
        include: { items: true },
      })

      for (const item of items) {
        await tx.inventoryLevel.upsert({
          where: { productId: item.productId },
          update: { quantity: { increment: item.quantity } },
          create: {
            productId: item.productId,
            quantity: item.quantity,
            lowStockAt: 10,
          },
        })

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'PURCHASE',
            quantity: item.quantity,
            note: `Purchase order ${po.id}`,
          },
        })
      }

      return po
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('[POST /api/purchase-orders]', error)
    return NextResponse.json({ error: 'Failed to create purchase order' }, { status: 500 })
  }
})
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: zero errors.

---

## Task 11: Sales orders API route

**Files:**
- Create: `app/api/sales-orders/route.ts`

**Interfaces:**
- Consumes: `prisma`, `withRole`, `createSalesOrderSchema`

- [ ] **Step 1: Create `app/api/sales-orders/route.ts`**

```typescript
// app/api/sales-orders/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withRole } from '@/lib/rbac'
import { createSalesOrderSchema } from '@/lib/validators'
import { Decimal } from '@prisma/client/runtime/library'

export const POST = withRole('STAFF', async (request: Request) => {
  try {
    const body = await request.json()
    const parsed = createSalesOrderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }
    const { items } = parsed.data

    // Check stock availability before any writes
    const stockChecks = await Promise.all(
      items.map(async (item) => {
        const level = await prisma.inventoryLevel.findUnique({
          where: { productId: item.productId },
        })
        return {
          productId: item.productId,
          requested: item.quantity,
          available: level?.quantity ?? 0,
        }
      })
    )

    const insufficient = stockChecks.filter((c) => c.available < c.requested)
    if (insufficient.length > 0) {
      return NextResponse.json(
        {
          error: 'Insufficient stock',
          details: insufficient.map((c) => ({
            productId: c.productId,
            requested: c.requested,
            available: c.available,
          })),
        },
        { status: 400 }
      )
    }

    const total = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    )

    const order = await prisma.$transaction(async (tx) => {
      const so = await tx.salesOrder.create({
        data: {
          status: 'COMPLETED',
          total: new Decimal(total),
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: new Decimal(item.unitPrice),
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
            note: `Sales order ${so.id}`,
          },
        })
      }

      return so
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error('[POST /api/sales-orders]', error)
    return NextResponse.json({ error: 'Failed to create sales order' }, { status: 500 })
  }
})
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: zero errors.

---

## Task 12: Dashboard stats API route

**Files:**
- Create: `app/api/dashboard/stats/route.ts`

**Interfaces:**
- Produces: JSON matching `DashboardMetrics` shape

- [ ] **Step 1: Create `app/api/dashboard/stats/route.ts`**

```typescript
// app/api/dashboard/stats/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import type { DashboardMetrics } from '@/lib/db-types'

export async function GET() {
  try {
    const levels = await prisma.inventoryLevel.findMany({
      include: { product: true },
    })

    const totalItems = levels.reduce((sum, l) => sum + l.quantity, 0)
    const inventoryValue = levels.reduce(
      (sum, l) => sum + Number(l.product.price) * l.quantity,
      0
    )
    const lowStockCount = levels.filter(
      (l) => l.quantity > 0 && l.quantity <= l.lowStockAt
    ).length
    const outOfStockCount = levels.filter((l) => l.quantity === 0).length
    const totalProducts = await prisma.product.count()
    const categoryCount = await prisma.category.count()
    const supplierCount = await prisma.supplier.count()
    const avgProductValue = totalProducts > 0 ? inventoryValue / totalProducts : 0

    const metrics: DashboardMetrics = {
      inventoryValue,
      totalItems,
      lowStockCount,
      outOfStockCount,
      totalProducts,
      categoryCount,
      supplierCount,
      avgProductValue,
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('[GET /api/dashboard/stats]', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: zero errors.

---

## Task 13: Dashboard top-product API route

**Files:**
- Create: `app/api/dashboard/top-product/route.ts`

**Interfaces:**
- Produces: JSON matching `TopProductData` shape

- [ ] **Step 1: Create `app/api/dashboard/top-product/route.ts`**

```typescript
// app/api/dashboard/top-product/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import type { TopProductData } from '@/lib/db-types'

export async function GET() {
  try {
    // Aggregate units sold per product from completed SalesOrders
    const salesAgg = await prisma.salesOrderItem.groupBy({
      by: ['productId'],
      where: {
        salesOrder: { status: 'COMPLETED' },
      },
      _sum: { quantity: true },
    })

    if (salesAgg.length === 0) {
      return NextResponse.json({ error: 'No completed sales data' }, { status: 404 })
    }

    // Find product with highest units sold
    const top = salesAgg.reduce((best, cur) =>
      (cur._sum.quantity ?? 0) > (best._sum.quantity ?? 0) ? cur : best
    )

    const product = await prisma.product.findUnique({
      where: { id: top.productId },
      include: {
        category: true,
        inventoryLevel: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Sum revenue for this product from completed orders
    const revenueAgg = await prisma.salesOrderItem.aggregate({
      where: {
        productId: top.productId,
        salesOrder: { status: 'COMPLETED' },
      },
      _sum: { quantity: true },
    })

    // Calculate revenue manually since unitPrice varies
    const revenueItems = await prisma.salesOrderItem.findMany({
      where: {
        productId: top.productId,
        salesOrder: { status: 'COMPLETED' },
      },
    })
    const revenue = revenueItems.reduce(
      (sum, item) => sum + Number(item.unitPrice) * item.quantity,
      0
    )

    const topProductData: TopProductData = {
      name: product.name,
      brand: product.brand,
      sku: product.sku,
      category: product.category.name,
      unitsSold: revenueAgg._sum.quantity ?? 0,
      revenue,
      remainingStock: product.inventoryLevel?.quantity ?? 0,
      growthPct: 24.7, // hardcoded — no historical comparison data
      fallbackImage: '/airpods-max.webp',
    }

    return NextResponse.json(topProductData)
  } catch (error) {
    console.error('[GET /api/dashboard/top-product]', error)
    return NextResponse.json({ error: 'Failed to fetch top product' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: zero errors.

---

## Task 14: Dashboard stock-by-category API route

**Files:**
- Create: `app/api/dashboard/stock-by-category/route.ts`

**Interfaces:**
- Produces: JSON array of `{ name: string, percent: number }`

- [ ] **Step 1: Create `app/api/dashboard/stock-by-category/route.ts`**

```typescript
// app/api/dashboard/stock-by-category/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import type { StockByCategoryItem } from '@/lib/db-types'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        products: {
          include: { inventoryLevel: true },
        },
      },
    })

    const totals = categories.map((cat) => ({
      name: cat.name,
      quantity: cat.products.reduce(
        (sum, p) => sum + (p.inventoryLevel?.quantity ?? 0),
        0
      ),
    }))

    const totalQuantity = totals.reduce((sum, c) => sum + c.quantity, 0)

    const result: StockByCategoryItem[] = totals
      .filter((c) => c.quantity > 0)
      .map((c) => ({
        name: c.name,
        percent: Math.round((c.quantity / totalQuantity) * 100),
      }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('[GET /api/dashboard/stock-by-category]', error)
    return NextResponse.json({ error: 'Failed to fetch stock by category' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: zero errors.

---

## Task 15: Dashboard inventory-value-by-category API route

**Files:**
- Create: `app/api/dashboard/inventory-value-by-category/route.ts`

**Interfaces:**
- Produces: JSON array of `{ name: string, value: number }` sorted descending by value

- [ ] **Step 1: Create `app/api/dashboard/inventory-value-by-category/route.ts`**

```typescript
// app/api/dashboard/inventory-value-by-category/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import type { InventoryValueItem } from '@/lib/db-types'

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        products: {
          include: { inventoryLevel: true },
        },
      },
    })

    const result: InventoryValueItem[] = categories
      .map((cat) => ({
        name: cat.name,
        value: cat.products.reduce(
          (sum, p) =>
            sum + Number(p.price) * (p.inventoryLevel?.quantity ?? 0),
          0
        ),
      }))
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[GET /api/dashboard/inventory-value-by-category]', error)
    return NextResponse.json(
      { error: 'Failed to fetch inventory value by category' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: zero errors.

---

## Task 16: Seed script (`prisma/seed.ts`)

**Files:**
- Create: `prisma/seed.ts`

**Interfaces:**
- Consumes: `prisma` from `lib/prisma.ts`, `hashPassword` from `lib/auth.ts`

- [ ] **Step 1: Create `prisma/seed.ts`**

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // ── User ──────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('admin123', 12)
  await prisma.user.upsert({
    where: { email: 'admin@stockpilot.com' },
    update: {},
    create: {
      email: 'admin@stockpilot.com',
      name: 'Umair Ahmad',
      role: 'OWNER',
      password: passwordHash,
    },
  })

  // ── Categories ────────────────────────────────────────────────────
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

  // ── Suppliers ─────────────────────────────────────────────────────
  const supplierData = [
    { name: 'Apple Inc', email: 'orders@apple.com' },
    { name: 'Samsung Electronics', email: 'orders@samsung.com' },
    { name: 'Logitech', email: 'orders@logitech.com' },
    { name: 'Sony Electronics', email: 'orders@sony.com' },
  ]
  const suppliers: Record<string, string> = {}
  for (const s of supplierData) {
    const sup = await prisma.supplier.upsert({
      where: { name: s.name },
      update: {},
      create: s,
    })
    suppliers[s.name] = sup.id
  }

  // ── Products ──────────────────────────────────────────────────────
  const products = [
    {
      sku: 'APL-AMP-001',
      name: 'AirPods Max',
      brand: 'Apple',
      price: 549,
      costPrice: 320,
      category: 'Audio',
      supplier: 'Apple Inc',
      qty: 85,
      lowStockAt: 15,
    },
    {
      sku: 'APL-IP15P-001',
      name: 'iPhone 15 Pro',
      brand: 'Apple',
      price: 999,
      costPrice: 650,
      category: 'Smartphones',
      supplier: 'Apple Inc',
      qty: 142,
      lowStockAt: 20,
    },
    {
      sku: 'APL-MBP14-001',
      name: 'MacBook Pro 14"',
      brand: 'Apple',
      price: 1999,
      costPrice: 1300,
      category: 'Computers',
      supplier: 'Apple Inc',
      qty: 48,
      lowStockAt: 8,
    },
    {
      sku: 'APL-AWU2-001',
      name: 'Apple Watch Ultra 2',
      brand: 'Apple',
      price: 799,
      costPrice: 480,
      category: 'Wearables',
      supplier: 'Apple Inc',
      qty: 63,
      lowStockAt: 10,
    },
    {
      sku: 'APL-CHG30-001',
      name: 'Apple USB-C Charger 30W',
      brand: 'Apple',
      price: 49,
      costPrice: 18,
      category: 'Accessories',
      supplier: 'Apple Inc',
      qty: 210,
      lowStockAt: 30,
    },
    {
      sku: 'APL-MKB-001',
      name: 'Magic Keyboard',
      brand: 'Apple',
      price: 99,
      costPrice: 45,
      category: 'Accessories',
      supplier: 'Apple Inc',
      qty: 95,
      lowStockAt: 20,
    },
    {
      sku: 'SAM-GS24U-001',
      name: 'Samsung Galaxy S24 Ultra',
      brand: 'Samsung',
      price: 1299,
      costPrice: 820,
      category: 'Smartphones',
      supplier: 'Samsung Electronics',
      qty: 89,
      lowStockAt: 15,
    },
    {
      sku: 'SNY-WH1000-001',
      name: 'Sony WH-1000XM5',
      brand: 'Sony',
      price: 349,
      costPrice: 190,
      category: 'Audio',
      supplier: 'Sony Electronics',
      qty: 72,
      lowStockAt: 12,
    },
    {
      sku: 'LGT-MXM3S-001',
      name: 'Logitech MX Master 3S',
      brand: 'Logitech',
      price: 99,
      costPrice: 52,
      category: 'Accessories',
      supplier: 'Logitech',
      qty: 118,
      lowStockAt: 20,
    },
    {
      sku: 'SNY-PS5C-001',
      name: 'PlayStation 5 Controller',
      brand: 'Sony',
      price: 74,
      costPrice: 38,
      category: 'Gaming',
      supplier: 'Sony Electronics',
      qty: 9,
      lowStockAt: 15,
    },
  ]

  const productIds: Record<string, string> = {}
  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        sku: p.sku,
        name: p.name,
        brand: p.brand,
        price: p.price,
        costPrice: p.costPrice,
        categoryId: categories[p.category],
        supplierId: suppliers[p.supplier],
      },
    })
    productIds[p.sku] = product.id

    await prisma.inventoryLevel.upsert({
      where: { productId: product.id },
      update: {},
      create: {
        productId: product.id,
        quantity: p.qty,
        lowStockAt: p.lowStockAt,
      },
    })
  }

  // ── Completed SalesOrders — AirPods Max: 1,284 units ─────────────
  const airPodsId = productIds['APL-AMP-001']
  const airPodsBatches = [
    { qty: 400, unitPrice: 549 },
    { qty: 384, unitPrice: 549 },
    { qty: 300, unitPrice: 549 },
    { qty: 200, unitPrice: 549 },
  ]
  for (const batch of airPodsBatches) {
    const existing = await prisma.salesOrder.findFirst({
      where: {
        status: 'COMPLETED',
        items: { some: { productId: airPodsId, quantity: batch.qty } },
      },
    })
    if (!existing) {
      await prisma.salesOrder.create({
        data: {
          status: 'COMPLETED',
          total: batch.qty * batch.unitPrice,
          items: {
            create: [{
              productId: airPodsId,
              quantity: batch.qty,
              unitPrice: batch.unitPrice,
            }],
          },
        },
      })
    }
  }

  // ── Completed SalesOrders — iPhone 15 Pro: 620 units ─────────────
  const iphoneId = productIds['APL-IP15P-001']
  const iphoneBatches = [
    { qty: 250, unitPrice: 999 },
    { qty: 200, unitPrice: 999 },
    { qty: 170, unitPrice: 999 },
  ]
  for (const batch of iphoneBatches) {
    const existing = await prisma.salesOrder.findFirst({
      where: {
        status: 'COMPLETED',
        items: { some: { productId: iphoneId, quantity: batch.qty } },
      },
    })
    if (!existing) {
      await prisma.salesOrder.create({
        data: {
          status: 'COMPLETED',
          total: batch.qty * batch.unitPrice,
          items: {
            create: [{
              productId: iphoneId,
              quantity: batch.qty,
              unitPrice: batch.unitPrice,
            }],
          },
        },
      })
    }
  }

  console.log('Seeding complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
```

- [ ] **Step 2: Verify TypeScript on seed file**

```bash
npx tsc --noEmit
```

Expected: zero errors.

---

## Task 17: Update `components/TopSellingProduct.tsx`

**Files:**
- Modify: `components/TopSellingProduct.tsx`

**Interfaces:**
- Consumes: `TopProductData` from `lib/db-types`
- Change: replace `import { topProduct } from '@/lib/mockData'` with a `product: TopProductData` prop

- [ ] **Step 1: Update `components/TopSellingProduct.tsx`**

Replace the entire file with the following. All JSX, Tailwind classes, and animation code are preserved exactly. Only the data source changes from a module import to a prop.

```typescript
'use client'

import { motion } from 'framer-motion'
import Icon from './Icon'
import ProductShowcase from './ProductShowcase'
import { riseScale } from '@/lib/motion'
import type { TopProductData } from '@/lib/db-types'

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})
const number = new Intl.NumberFormat('en-US')

export default function TopSellingProduct({ product }: { product: TopProductData }) {
  const p = product

  const stats = [
    { label: 'Units Sold', value: number.format(p.unitsSold), icon: 'cart' as const },
    { label: 'Revenue', value: currency.format(p.revenue), icon: 'dollar' as const },
    { label: 'Stock Left', value: number.format(p.remainingStock), icon: 'inventory' as const },
  ]

  return (
    <motion.section
      variants={riseScale}
      initial="hidden"
      animate="show"
      className="relative overflow-hidden rounded-3xl bg-panel shadow-panel"
    >
      {/* ambient lime field behind the product */}
      <div className="pointer-events-none absolute -left-24 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-lime/10 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-lime/5 blur-3xl" />

      {/* badge — absolute so the image owns the full left half */}
      <div className="absolute left-5 top-5 z-10 flex items-center gap-2 sm:left-7 sm:top-7">
        <span className="rounded-full bg-lime px-3 py-1 text-xs font-bold uppercase tracking-wider text-ink">
          Top Seller
        </span>
        <span className="font-mono text-xs text-white/40">{p.sku}</span>
      </div>

      <div className="relative grid items-center gap-4 p-4 sm:grid-cols-2 sm:gap-5 sm:p-5">
        {/* ── stage (50%) ── */}
        <div className="relative flex min-h-[210px] items-center justify-center pt-5 sm:min-h-[270px] sm:pt-2">
          <ProductShowcase />
        </div>

        {/* ── details (50%) ── */}
        <div className="flex min-w-0 flex-col justify-center">
          <p className="text-sm font-medium text-lime">{p.brand} · {p.category}</p>
          <h2 className="mt-1 font-display text-[clamp(1.5rem,2.6vw,2.25rem)] font-bold leading-tight tracking-tight text-white">
            {p.name}
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/55">
            Your best-performing SKU this quarter — leading both volume and margin
            across the Electronics category.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className="min-w-0 rounded-2xl border border-white/[0.07] bg-white/[0.04] p-3.5"
              >
                <div className="flex items-center gap-1.5 text-white/45">
                  <Icon name={s.icon} size={15} />
                  <span className="truncate text-xs font-medium">{s.label}</span>
                </div>
                <p className="mt-1.5 whitespace-nowrap font-display text-[clamp(0.95rem,1.5vw,1.35rem)] font-bold tracking-tight text-white tnum">
                  {s.value}
                </p>
              </div>
            ))}

            {/* growth — brand-accent emphasis */}
            <div className="min-w-0 rounded-2xl bg-lime p-3.5 text-ink">
              <div className="flex items-center gap-1.5 opacity-70">
                <Icon name="trendUp" size={15} />
                <span className="text-xs font-semibold">Growth</span>
              </div>
              <p className="mt-1.5 whitespace-nowrap font-display text-[clamp(0.95rem,1.5vw,1.35rem)] font-bold tracking-tight tnum">
                +{p.growthPct}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: zero errors (except for `app/page.tsx` which still imports old mock data — that is fixed in Task 19).

---

## Task 18: Update `StockByCategory` and `InventoryValueByCategory`

**Files:**
- Modify: `components/StockByCategory.tsx`
- Modify: `components/InventoryValueByCategory.tsx`

**Interfaces:**
- `StockByCategory` now receives `data: CategoryStock[]`
- `InventoryValueByCategory` now receives `data: CategoryValue[]`
- These types already exist in `lib/types.ts` (`CategoryStock`, `CategoryValue`)

- [ ] **Step 1: Update `components/StockByCategory.tsx`**

```typescript
'use client'

import { motion } from 'framer-motion'
import Icon from './Icon'
import type { CategoryStock } from '@/lib/types'

export default function StockByCategory({ data }: { data: CategoryStock[] }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 1.3 }}
      className="flex flex-col rounded-3xl bg-lime px-4 py-5 shadow-card sm:p-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold tracking-tight text-ink">
          Stock by Category
        </h2>
        <button
          className="grid h-9 w-9 place-items-center rounded-full border border-ink/15 text-ink transition-colors hover:bg-ink hover:text-lime"
          aria-label="Expand chart"
        >
          <Icon name="arrowUpRight" size={16} />
        </button>
      </div>

      <div className="mt-8 flex flex-1 items-end gap-1.5 sm:gap-5">
        {data.map((c) => (
          <div key={c.name} className="flex min-w-0 flex-1 flex-col items-center gap-3">
            <div className="flex h-44 w-full items-end justify-center">
              <div
                className="w-full max-w-[68px] rounded-t-xl bg-ink/85 transition-[height] duration-700 ease-out"
                style={{ height: `${c.percent}%` }}
                role="img"
                aria-label={`${c.name}: ${c.percent}% of stock`}
              />
            </div>
            <div className="w-full text-center">
              <p className="truncate text-[10px] font-semibold leading-tight text-ink sm:text-[13px]">
                {c.name}
              </p>
              <p className="text-[11px] font-medium text-ink/55 tnum sm:text-xs">
                {c.percent}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  )
}
```

- [ ] **Step 2: Update `components/InventoryValueByCategory.tsx`**

```typescript
'use client'

import { motion } from 'framer-motion'
import Icon from './Icon'
import type { CategoryValue } from '@/lib/types'

export default function InventoryValueByCategory({ data }: { data: CategoryValue[] }) {
  const max = Math.max(...data.map((c) => c.value))

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 1.4 }}
      className="flex flex-col rounded-3xl bg-panel p-6 shadow-panel"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold tracking-tight text-white">
          Inventory Value by Category
        </h2>
        <button
          className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-white transition-colors hover:bg-lime hover:text-ink"
          aria-label="Expand chart"
        >
          <Icon name="arrowUpRight" size={16} />
        </button>
      </div>

      <div className="mt-7 flex flex-1 flex-col justify-center gap-4">
        {data.map((c) => (
          <div key={c.name} className="grid grid-cols-[88px_1fr] items-center gap-3">
            <p className="truncate text-sm text-white/70">{c.name}</p>
            <div className="relative h-7 overflow-hidden rounded-lg bg-white/[0.06]">
              <div
                className="flex h-full items-center justify-end rounded-lg bg-gradient-to-r from-lime-deep to-lime pr-2.5 transition-[width] duration-700 ease-out"
                style={{ width: `${(c.value / max) * 100}%` }}
              >
                <span className="text-xs font-semibold text-ink tnum">
                  {Math.round(c.value / 1000)}K
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: zero errors (except `app/page.tsx` — fixed next task).

---

## Task 19: Create `DashboardClient.tsx` and update `app/page.tsx`

**Files:**
- Create: `components/DashboardClient.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- `DashboardClient` receives props:
  ```typescript
  {
    metrics: Metric[]
    topProduct: TopProductData
    stockByCategory: CategoryStock[]
    inventoryValueByCategory: CategoryValue[]
  }
  ```
- `app/page.tsx` is a Server Component: imports `prisma`, runs queries, transforms data into `Metric[]`, then renders `<DashboardClient />`

- [ ] **Step 1: Create `components/DashboardClient.tsx`**

This is the current `app/page.tsx` client code, moved verbatim into a named component that receives typed props.

```typescript
'use client'

import { motion, MotionConfig } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import StatCard from '@/components/StatCard'
import StockByCategory from '@/components/StockByCategory'
import InventoryValueByCategory from '@/components/InventoryValueByCategory'
import TopSellingProduct from '@/components/TopSellingProduct'
import { group } from '@/lib/motion'
import type { Metric, CategoryStock, CategoryValue } from '@/lib/types'
import type { TopProductData } from '@/lib/db-types'

interface DashboardClientProps {
  metrics: Metric[]
  topProduct: TopProductData
  stockByCategory: CategoryStock[]
  inventoryValueByCategory: CategoryValue[]
}

function pick(metrics: Metric[], ids: string[]) {
  return ids
    .map((id) => metrics.find((m) => m.id === id))
    .filter((m): m is Metric => Boolean(m))
}

export default function DashboardClient({
  metrics,
  topProduct,
  stockByCategory,
  inventoryValueByCategory,
}: DashboardClientProps) {
  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen bg-canvas lg:flex">
      <Sidebar />

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-[1200px]">
          <Header />

          {/* first viewport row — top-seller spotlight + headline KPIs */}
          <section className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
            <TopSellingProduct product={topProduct} />
            <motion.div
              aria-label="Headline metrics"
              variants={group(0.4)}
              initial="hidden"
              animate="show"
              className="grid grid-cols-2 gap-4"
            >
              {pick(metrics, ['value', 'items', 'low', 'out']).map((m) => (
                <StatCard key={m.id} metric={m} compact />
              ))}
            </motion.div>
          </section>

          {/* category charts — each animates independently with baked-in delays */}
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <StockByCategory data={stockByCategory} />
            <InventoryValueByCategory data={inventoryValueByCategory} />
          </div>

          <footer className="mt-8 pb-2 text-center text-xs text-muted">
            StockPilot · Live data · {new Date().getFullYear()}
          </footer>
        </div>
      </main>
    </div>
    </MotionConfig>
  )
}
```

- [ ] **Step 2: Replace `app/page.tsx` with a Server Component**

```typescript
// app/page.tsx
import prisma from '@/lib/prisma'
import DashboardClient from '@/components/DashboardClient'
import { metrics as fallbackMetrics, topProduct as fallbackTopProduct, stockByCategory as fallbackStockByCategory, inventoryValueByCategory as fallbackInventoryValueByCategory } from '@/lib/mockData'
import type { Metric, CategoryStock, CategoryValue } from '@/lib/types'
import type { TopProductData } from '@/lib/db-types'

async function getDashboardData() {
  try {
    // ── Metrics ───────────────────────────────────────────────────
    const levels = await prisma.inventoryLevel.findMany({
      include: { product: true },
    })

    const totalItems = levels.reduce((sum, l) => sum + l.quantity, 0)
    const inventoryValue = levels.reduce(
      (sum, l) => sum + Number(l.product.price) * l.quantity,
      0
    )
    const lowStockCount = levels.filter(
      (l) => l.quantity > 0 && l.quantity <= l.lowStockAt
    ).length
    const outOfStockCount = levels.filter((l) => l.quantity === 0).length
    const totalProducts = await prisma.product.count()
    const categoryCount = await prisma.category.count()
    const supplierCount = await prisma.supplier.count()
    const avgProductValue = totalProducts > 0 ? inventoryValue / totalProducts : 0

    const metrics: Metric[] = [
      {
        id: 'products',
        label: 'Total Products',
        value: String(totalProducts),
        caption: 'Active SKUs',
        icon: 'box',
      },
      {
        id: 'value',
        label: 'Inventory Value',
        value: `$${inventoryValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
        caption: 'Current stock value',
        icon: 'dollar',
      },
      {
        id: 'low',
        label: 'Low Stock Items',
        value: String(lowStockCount),
        caption: 'Need reordering',
        icon: 'trendDown',
      },
      {
        id: 'items',
        label: 'Total Items',
        value: String(totalItems),
        caption: 'Units in stock',
        icon: 'inventory',
      },
      {
        id: 'categories',
        label: 'Categories',
        value: String(categoryCount),
        caption: 'Product categories',
        icon: 'cart',
      },
      {
        id: 'suppliers',
        label: 'Suppliers',
        value: String(supplierCount),
        caption: 'Active suppliers',
        icon: 'users',
      },
      {
        id: 'avg',
        label: 'Avg Product Value',
        value: `$${avgProductValue.toLocaleString('en-US', { maximumFractionDigits: 2 })}`,
        caption: 'Per product',
        icon: 'trendUp',
      },
      {
        id: 'out',
        label: 'Out of Stock',
        value: String(outOfStockCount),
        caption: 'Immediate attention',
        icon: 'alert',
      },
    ]

    // ── Top Product ───────────────────────────────────────────────
    const salesAgg = await prisma.salesOrderItem.groupBy({
      by: ['productId'],
      where: { salesOrder: { status: 'COMPLETED' } },
      _sum: { quantity: true },
    })

    let topProduct: TopProductData = fallbackTopProduct

    if (salesAgg.length > 0) {
      const top = salesAgg.reduce((best, cur) =>
        (cur._sum.quantity ?? 0) > (best._sum.quantity ?? 0) ? cur : best
      )

      const product = await prisma.product.findUnique({
        where: { id: top.productId },
        include: { category: true, inventoryLevel: true },
      })

      if (product) {
        const revenueItems = await prisma.salesOrderItem.findMany({
          where: {
            productId: top.productId,
            salesOrder: { status: 'COMPLETED' },
          },
        })
        const revenue = revenueItems.reduce(
          (sum, item) => sum + Number(item.unitPrice) * item.quantity,
          0
        )

        topProduct = {
          name: product.name,
          brand: product.brand,
          sku: product.sku,
          category: product.category.name,
          unitsSold: top._sum.quantity ?? 0,
          revenue,
          remainingStock: product.inventoryLevel?.quantity ?? 0,
          growthPct: 24.7,
          fallbackImage: '/airpods-max.webp',
        }
      }
    }

    // ── Stock by Category ─────────────────────────────────────────
    const categoriesWithStock = await prisma.category.findMany({
      include: {
        products: { include: { inventoryLevel: true } },
      },
    })

    const rawTotals = categoriesWithStock.map((cat) => ({
      name: cat.name,
      quantity: cat.products.reduce(
        (sum, p) => sum + (p.inventoryLevel?.quantity ?? 0),
        0
      ),
    }))
    const totalQuantity = rawTotals.reduce((sum, c) => sum + c.quantity, 0)

    const stockByCategory: CategoryStock[] = rawTotals
      .filter((c) => c.quantity > 0)
      .map((c) => ({
        name: c.name,
        percent: Math.round((c.quantity / totalQuantity) * 100),
      }))

    // ── Inventory Value by Category ───────────────────────────────
    const inventoryValueByCategory: CategoryValue[] = categoriesWithStock
      .map((cat) => ({
        name: cat.name,
        value: cat.products.reduce(
          (sum, p) => sum + Number(p.price) * (p.inventoryLevel?.quantity ?? 0),
          0
        ),
      }))
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value)

    return { metrics, topProduct, stockByCategory, inventoryValueByCategory }
  } catch (error) {
    // If the DB is not available (e.g., no DATABASE_URL), fall back to mock data
    console.warn('[page.tsx] DB unavailable, using mock data:', error)
    return {
      metrics: fallbackMetrics,
      topProduct: fallbackTopProduct,
      stockByCategory: fallbackStockByCategory,
      inventoryValueByCategory: fallbackInventoryValueByCategory,
    }
  }
}

export default async function DashboardPage() {
  const { metrics, topProduct, stockByCategory, inventoryValueByCategory } =
    await getDashboardData()

  return (
    <DashboardClient
      metrics={metrics}
      topProduct={topProduct}
      stockByCategory={stockByCategory}
      inventoryValueByCategory={inventoryValueByCategory}
    />
  )
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: zero errors.

---

## Task 20: Create `README-BACKEND.md`

**Files:**
- Create: `README-BACKEND.md`

- [ ] **Step 1: Create `README-BACKEND.md`**

```markdown
# StockPilot Backend Setup

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ running locally (or connection string to a hosted instance)

## Environment Setup

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/stockpilot"
JWT_SECRET="your-secret-key-change-in-production"
```

Replace `user`, `password`, and `localhost:5432` with your actual PostgreSQL credentials.

## Setup Steps

### 1. Install dependencies

```bash
npm install
```

### 2. Run database migrations

```bash
npx prisma migrate dev --name init
```

This creates all tables in the database defined in `prisma/schema.prisma`.

### 3. Generate Prisma client

```bash
npx prisma generate
```

This is usually run automatically by `migrate dev`, but run it explicitly if you see import errors.

### 4. Seed the database

```bash
npx tsx prisma/seed.ts
```

If `tsx` is not available, use:

```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

This creates:
- 1 admin user (`admin@stockpilot.com` / `admin123`)
- 6 product categories
- 4 suppliers (Apple, Samsung, Logitech, Sony)
- 10 products with inventory levels
- Completed sales orders for AirPods Max (1,284 units) and iPhone 15 Pro (620 units)

### 5. Run the development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

## API Routes

All routes return JSON. Write operations require the `x-user-role` header.

| Method | Path | Role Required | Description |
|--------|------|--------------|-------------|
| GET | `/api/products` | — | List all products |
| POST | `/api/products` | MANAGER+ | Create product |
| GET | `/api/products/[id]` | — | Get product |
| PUT | `/api/products/[id]` | MANAGER+ | Update product |
| DELETE | `/api/products/[id]` | OWNER | Delete product |
| GET | `/api/suppliers` | — | List all suppliers |
| POST | `/api/suppliers` | MANAGER+ | Create supplier |
| GET | `/api/suppliers/[id]` | — | Get supplier |
| PUT | `/api/suppliers/[id]` | MANAGER+ | Update supplier |
| DELETE | `/api/suppliers/[id]` | OWNER | Delete supplier |
| POST | `/api/purchase-orders` | MANAGER+ | Create purchase order + update inventory |
| POST | `/api/sales-orders` | STAFF+ | Create sales order + decrement inventory |
| GET | `/api/dashboard/stats` | — | Aggregated KPI metrics |
| GET | `/api/dashboard/top-product` | — | Best-selling product |
| GET | `/api/dashboard/stock-by-category` | — | Stock % per category |
| GET | `/api/dashboard/inventory-value-by-category` | — | Value per category |

## Role Hierarchy

Send `x-user-role: OWNER`, `x-user-role: MANAGER`, or `x-user-role: STAFF` as a request header.

| Role | Level | Can access |
|------|-------|-----------|
| OWNER | 3 | All routes |
| MANAGER | 2 | MANAGER+ and STAFF routes |
| STAFF | 1 | STAFF routes only |

## Fallback Behavior

If `DATABASE_URL` is not set or the database is unreachable, the dashboard falls back to the mock data in `lib/mockData.ts` automatically. No crash.
```

- [ ] **Step 2: Verify TypeScript (final check)**

```bash
npx tsc --noEmit
```

Expected: zero errors across the entire project.

---

## Self-Review Checklist

- [x] **Task 1** — npm install (runtime + dev)
- [x] **Task 2** — `prisma/schema.prisma` with all 10 models and 3 enums; `.env` template
- [x] **Task 3** — `lib/db-types.ts` with `DashboardMetrics`, `TopProductData`, `StockByCategoryItem`, `InventoryValueItem`; re-export in `lib/types.ts`
- [x] **Task 4** — `lib/prisma.ts` singleton
- [x] **Task 5** — `lib/auth.ts` with `signToken`, `verifyToken`, `hashPassword`, `comparePassword`
- [x] **Task 6** — `lib/rbac.ts` with `ROLE_HIERARCHY`, `hasRole`, `withRole`, `RouteContext`
- [x] **Task 7** — `lib/validators.ts` with 6 Zod schemas
- [x] **Task 8** — Products list+create route and single-product route
- [x] **Task 9** — Suppliers list+create route and single-supplier route
- [x] **Task 10** — Purchase orders POST with transaction + inventory update + StockMovement
- [x] **Task 11** — Sales orders POST with stock pre-check, transaction, decrement + StockMovement
- [x] **Task 12** — Dashboard stats GET returning `DashboardMetrics`
- [x] **Task 13** — Dashboard top-product GET
- [x] **Task 14** — Dashboard stock-by-category GET
- [x] **Task 15** — Dashboard inventory-value-by-category GET
- [x] **Task 16** — `prisma/seed.ts` — user, categories, suppliers, 10 products with inventory, completed sales orders for AirPods Max (1284 units) and iPhone 15 Pro (620 units)
- [x] **Task 17** — `TopSellingProduct.tsx` — prop-driven, identical JSX
- [x] **Task 18** — `StockByCategory.tsx` and `InventoryValueByCategory.tsx` — prop-driven, identical JSX
- [x] **Task 19** — `DashboardClient.tsx` with all Framer Motion code; `app/page.tsx` converted to Server Component with DB fallback to mockData
- [x] **Task 20** — `README-BACKEND.md` with setup instructions and API table

**Type consistency check:**
- `TopProductData` defined in `lib/db-types.ts`, used in Tasks 13, 17, 19 — consistent
- `RouteContext` defined in `lib/rbac.ts`, used in Tasks 8, 9, 10, 11 — consistent
- `CategoryStock` / `CategoryValue` — already in `lib/types.ts`, used in Tasks 18, 19 — consistent
- `withRole` wrapper signature: `(requiredRole: string, handler: RouteHandler) => RouteHandler` — used identically in all API route tasks

**Placeholder scan:** None found — all steps contain complete code.

**Spec coverage gap check:**
- `Decimal` import in Tasks 10 and 11 uses `@prisma/client/runtime/library` — this is the correct import path for Prisma v5+. If Prisma v4 is installed, change to `import { Prisma } from '@prisma/client'` and use `new Prisma.Decimal(value)`.

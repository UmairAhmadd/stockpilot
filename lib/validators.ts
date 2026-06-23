import { z } from 'zod'

export const createProductSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  brand: z.string().min(1),
  price: z.number().positive(),
  costPrice: z.number().positive(),
  categoryId: z.string().min(1),
  supplierId: z.string().min(1).optional(),
  initialQuantity: z.number().int().nonnegative().default(0),
  lowStockAt: z.number().int().nonnegative().default(10),
})

export const updateProductSchema = createProductSchema.partial().omit({ sku: true })

export const createSupplierSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
})

export const updateSupplierSchema = createSupplierSchema.partial()

export const purchaseOrderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  unitCost: z.number().positive(),
})

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().min(1),
  items: z.array(purchaseOrderItemSchema).min(1),
})

export const salesOrderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
})

export const createSalesOrderSchema = z.object({
  items: z.array(salesOrderItemSchema).min(1),
})

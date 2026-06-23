# StockPilot Backend Setup

## Prerequisites
- Node.js 18+
- PostgreSQL 14+ running locally or remote

## 1. Environment Variables
Create `.env` in project root:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/stockpilot"
JWT_SECRET="your-super-secret-key-change-in-production"
```

## 2. Database Setup
```bash
npx prisma migrate dev --name init
npx prisma generate
```

## 3. Seed Database
```bash
npm run db:seed
```
This creates: admin user (admin@stockpilot.com / admin123), 6 categories, 4 suppliers, 10 electronics products, and sales history for the top-product chart.

## 4. Run Dev Server
```bash
npm run dev
```

## 5. API Reference

### Products
- GET    /api/products          — list all
- POST   /api/products          — create (header: x-user-role: MANAGER)
- GET    /api/products/:id      — single
- PUT    /api/products/:id      — update (header: x-user-role: MANAGER)
- DELETE /api/products/:id      — delete (header: x-user-role: OWNER)

### Suppliers
- GET    /api/suppliers         — list all
- POST   /api/suppliers         — create (header: x-user-role: MANAGER)
- GET    /api/suppliers/:id     — single
- PUT    /api/suppliers/:id     — update (header: x-user-role: MANAGER)
- DELETE /api/suppliers/:id     — delete (header: x-user-role: OWNER)

### Orders
- GET    /api/purchase-orders   — list all purchase orders
- POST   /api/purchase-orders   — receive stock (header: x-user-role: MANAGER)
- GET    /api/sales-orders      — list all sales orders
- POST   /api/sales-orders      — create sale, auto-decrements stock (header: x-user-role: STAFF)

### Dashboard
- GET    /api/dashboard/stats
- GET    /api/dashboard/top-product
- GET    /api/dashboard/stock-by-category
- GET    /api/dashboard/inventory-value-by-category

## 6. Roles
Pass role in header: `x-user-role: OWNER | MANAGER | STAFF`
- OWNER: full access
- MANAGER: create/update products, suppliers, orders
- STAFF: create sales orders only

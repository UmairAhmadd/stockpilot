# StockPilot

Inventory & sales management dashboard for electronics retailers. Frontend only —
**Next.js (App Router) + TypeScript + Tailwind CSS**. Mock data only; components
are typed against `lib/types.ts` and ready for backend integration.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173 (or the port Next prints)
npm run build    # production build
```

## Structure

| Path | Purpose |
| --- | --- |
| `app/page.tsx` | Dashboard layout |
| `components/` | Sidebar, header, stat cards, charts, Top Seller |
| `components/ProductShowcase.tsx` | 2.5D product effect (Framer Motion + CSS perspective) |
| `lib/mockData.ts`, `lib/types.ts` | Mock data + shared types |
| `public/airpods-max.webp` | Transparent product image (preloaded) |

## Top Selling Product — 2.5D effect

The product render is a lightweight 2.5D effect (no WebGL): a transparent WebP
tilted with CSS `perspective` and driven by **Framer Motion**.

- Slow continuous float + small entrance animation on load.
- Cursor-driven `rotateX`/`rotateY`, gentle scale, and a tracking ground shadow.
- Spring-eased return to centre when the cursor leaves.
- On touch / coarse-pointer / `prefers-reduced-motion`: float only, no tracking.
- The image is preloaded (`next/image` `priority`) so it appears immediately.

### Regenerating the product image

The WebP is rendered from an SVG source via `sharp`:

```bash
node scripts/make-webp.mjs   # writes public/airpods-max.webp (+ .svg)
```

To use a real product photo instead, drop a transparent WebP at
`public/airpods-max.webp` (same path) — no code change needed.

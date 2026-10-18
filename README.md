# Brand Dashboard (Next.js 14 + Tailwind CSS)

Private merchant portal for apparel brands, independent storefront customization, and AI Virtual Try-On management.

## Technology Stack
- Framework: Next.js 14 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS & Vanilla Glassmorphism
- Icons: Lucide React

## Standalone Execution

### 1. Install Dependencies & Configure Environment
```bash
npm install
cp .env.example .env
```

### 2. Development Mode
```bash
npm run dev
# Dashboard runs at http://localhost:3001
```

### 3. Production Build & Start
```bash
npm run build
npm start
```

## Features
- **Overview & KPIs:** Revenue, Try-on conversion metrics, catalog status, quota usage meter
- **Product Management:** Dual publication switches (Storefront vs. Marketplace), try-on eligibility
- **Fabrics & Materials Library:** Fabric composition, stretch, thickness, and care instructions
- **Inventory Control:** Concurrency-safe stock adjustment
- **Storefront Customizer:** Announcement banner, branding theme colors, hero banner
- **Live Storefront Route:** Dedicated boutique website at `/storefront/[slug]`

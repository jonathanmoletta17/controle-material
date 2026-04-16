# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

```bash
npm install
npm run dev        # Start dev server
npm run build      # Build for production
npm run start      # Run production build
npm run check      # Type check with TypeScript
npm run db:push    # Push database migrations (Drizzle)
```

## Project Architecture

This is a **full-stack monorepo** with three main parts:

### Structure
```
├── client/              # React frontend (Vite)
│   └── src/
│       ├── features/    # Feature modules (auth, inventory, reports, etc.)
│       ├── shared/      # Shared UI components & hooks
│       └── main.tsx
├── server/              # Express backend
│   ├── modules/         # Feature modules (auth, inventory, glpi, etc.)
│   ├── index.ts         # App entry point
│   └── routes.ts        # Route registration
├── shared/              # Shared code (types, schemas)
│   └── schema.ts        # Drizzle ORM schema definitions
└── package.json         # Monorepo (no workspaces)
```

### Tech Stack
- **Client**: React 18 + Vite + Tailwind CSS + Radix UI
- **Server**: Express + Passport.js + Drizzle ORM
- **Database**: PostgreSQL (via Drizzle ORM)
- **Auth**: Passport + LDAP integration (ActiveDirectory)
- **Build**: TypeScript + esbuild for server

## Key Design Patterns

### Modules Pattern (Server)
Each feature has a **modules** structure:
- `*.routes.ts` - Express route handlers
- `*.service.ts` - Business logic
- `*.db.ts` - Database queries (if needed)

Example: `server/modules/inventory/` contains routes, services, and DB operations.

### Features Pattern (Client)
Client follows feature-based organization:
- `client/src/features/{feature}/` - Feature folder
- `pages/` - Page components (routed)
- `components/` - Feature-specific components

### Shared Schema
- Database schema defined in `shared/schema.ts` using Drizzle ORM
- TypeScript types auto-generated from schema
- Both client and server import from `@shared/schema`

## User Roles & Permissions

Three user roles currently defined:
- **admin** - Full access (edit, delete, create)
- **patrimonio** - Patrimony management focus
- **visualizador** - Read-only access (no movements/edits)

Role checks are in `client/src/features/auth/auth-context.tsx` and server middleware.

## Authentication

- **LDAP/ActiveDirectory** integration via `activedirectory2` package
- Username passed to LDAP must be **lowercase**
- Session management with `express-session` + PostgreSQL store
- Passport local strategy configured in `server/modules/auth/passport.config.ts`

## Database

- **Drizzle ORM** - TypeScript-first ORM for PostgreSQL
- Schemas in `shared/schema.ts`
- Migrations: Use `npm run db:push` to apply schema changes
- Connection string via `DATABASE_URL` env var

## Important Files & Entry Points

| File | Purpose |
|------|---------|
| `server/index.ts` | Express app setup, middleware, logging |
| `server/routes.ts` | Route registration |
| `client/src/main.tsx` | React entry point |
| `client/src/App.tsx` | Router setup |
| `client/src/features/auth/auth-context.tsx` | User context & role checks |
| `shared/schema.ts` | Database schema (Drizzle) |

## Common Tasks

### Adding a new API endpoint
1. Create `server/modules/{feature}/{name}.routes.ts`
2. Export route handler function
3. Register in `server/routes.ts` with `registerRoutes(app)`

### Adding a new page
1. Create `client/src/features/{feature}/pages/{PageName}.tsx`
2. Add route in `client/src/App.tsx` (uses Wouter)
3. Add navigation link in `client/src/shared/components/app-sidebar.tsx`

### Database changes
1. Update schema in `shared/schema.ts`
2. Run `npm run db:push` to apply changes
3. Types are auto-generated from schema

## Environment Variables

Key variables needed:
- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - development or production
- `LDAP_URL`, `LDAP_USERNAME`, `LDAP_PASSWORD` - LDAP server config (if using LDAP auth)

## Build & Deployment

- **Development**: `npm run dev` runs both client (Vite dev server) and server
- **Production**: `npm run build` compiles TypeScript → `dist/`, then `npm run start` runs the compiled server
- Server serves static client files from `dist/public/`
- Build artifacts in `dist/`

## Notes

- The project uses **ES modules** throughout (no CommonJS)
- TypeScript is strict (`"strict": true` in tsconfig.json)
- Client and server share types from `@shared` alias
- Vite paths alias `@` → `client/src/` and `@shared` → `shared/`

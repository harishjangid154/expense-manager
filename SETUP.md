# Setup Guide - Prisma, Auth & Transaction Import

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install @prisma/client @auth/prisma-adapter next-auth zod idb
npm install -D prisma tsx
```

### 2. Environment Setup

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
```

Generate a secure NextAuth secret:
```bash
openssl rand -base64 32
```

### 3. Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations (creates database)
npx prisma migrate dev --name init

# Seed database with sample data
npx prisma db seed
```

### 4. Configure package.json

Add seed script to `package.json`:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

### 5. Start Development Server

```bash
npm run dev
```

Visit:
- Main app: http://localhost:3000
- Import page: http://localhost:3000/import
- Prisma Studio: `npx prisma studio`

## 📁 Files Created

### Prisma & Database
- `prisma/schema.prisma` - Database schema
- `prisma/seed.ts` - Seed data
- `prisma/README-MIGRATE.md` - Migration guide
- `src/lib/prisma.ts` - Prisma client singleton

### Authentication
- `src/lib/auth.ts` - Auth helpers & NextAuth config
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth API route

### Transactions API
- `src/app/api/transactions/route.ts` - List & create
- `src/app/api/transactions/[id]/route.ts` - Get, update, delete
- `src/app/api/transactions/import/route.ts` - Bulk import
- `src/lib/transactions.ts` - Transaction helpers
- `src/lib/schemas/transaction.ts` - Zod validation schemas

### IndexedDB & Import
- `src/lib/idb.ts` - IndexedDB helpers
- `src/hooks/useImport.ts` - Import hook with retry logic
- `src/components/ImportPanel.tsx` - Import UI
- `src/app/import/page.tsx` - Import page

### Configuration
- `.env.example` - Environment variables template

## 🔧 Features

### 1. Prisma Database
- SQLite for development
- PostgreSQL ready for production
- Models: User, Account, Transaction, Asset, CurrencyRate, Team, TeamMember, ApiKey
- Composite unique index on (userId, clientId) for sync

### 2. NextAuth Authentication
- Email provider configured
- Prisma adapter for session management
- Server-side helpers: `requireUser()`, `getCurrentUser()`

### 3. Transactions API
- **GET /api/transactions** - List with pagination & filters
- **POST /api/transactions** - Create new transaction
- **GET /api/transactions/[id]** - Get single transaction
- **PATCH /api/transactions/[id]** - Update transaction
- **DELETE /api/transactions/[id]** - Soft delete
- **POST /api/transactions/import** - Bulk import/upsert (batches of 200)

### 4. Import System
- Reads pending transactions from IndexedDB
- Bulk import with retry logic (3 attempts with exponential backoff)
- Progress tracking (inserted, updated, skipped, errors)
- Marks transactions as synced after successful import
- UI for managing and monitoring imports

## 📊 Database Schema Highlights

### Transaction Model
```prisma
model Transaction {
  id          String    @id @default(uuid())
  clientId    String?   // Client-generated ID for offline sync
  userId      String
  accountId   String
  amountMinor Int       // Amount in cents/minor units
  currency    String
  category    String
  merchant    String?
  note        String?
  metadata    String?   // JSON string
  createdAt   DateTime  // Client timestamp
  syncedAt    DateTime? // Server timestamp
  isDeleted   Boolean   @default(false)
  
  @@unique([userId, clientId])
  @@index([userId])
  @@index([accountId])
  @@index([userId, createdAt])
}
```

## 🔄 Migration to Production (PostgreSQL)

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. Update `.env`:
   ```env
   DATABASE_URL="postgresql://user:pass@host:5432/dbname"
   ```

3. Run migration:
   ```bash
   npx prisma migrate deploy
   ```

## 🧪 Testing

### Test Import Flow

1. Add test transactions to IndexedDB (use browser DevTools)
2. Visit http://localhost:3000/import
3. Click "Import X Transactions"
4. Monitor progress and results

### API Testing

```bash
# List transactions
curl http://localhost:3000/api/transactions

# Create transaction
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{"accountId":"...","amountMinor":-5000,"currency":"USD","category":"Food","createdAt":"2024-01-01T00:00:00Z"}'

# Bulk import
curl -X POST http://localhost:3000/api/transactions/import \
  -H "Content-Type: application/json" \
  -d '[{"clientId":"tx-1","accountId":"...","amountMinor":-1000,"currency":"USD","category":"Test","createdAt":"2024-01-01T00:00:00Z"}]'
```

## 📝 Notes

- All lint errors about missing modules will resolve after `npm install`
- Auth requires email provider configuration for production
- Import system uses exponential backoff for retries
- Transactions are soft-deleted (isDeleted flag)
- clientId enables offline-first sync with conflict resolution

## 🆘 Troubleshooting

**Prisma Client not found:**
```bash
npx prisma generate
```

**Migration issues:**
```bash
npx prisma migrate reset  # WARNING: Deletes all data
npx prisma migrate dev
```

**Database locked (SQLite):**
```bash
# Close all connections and restart dev server
```

For more details, see `prisma/README-MIGRATE.md`

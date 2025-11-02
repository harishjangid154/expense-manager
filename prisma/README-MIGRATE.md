# Prisma Database Migration Guide

## Initial Setup

1. **Install dependencies:**
```bash
npm install @prisma/client @auth/prisma-adapter next-auth zod idb
npm install -D prisma
```

2. **Set up environment variables:**
Create `.env` file in the root directory:
```env
# Development (SQLite)
DATABASE_URL="file:./dev.db"

# Production (PostgreSQL) - uncomment and update
# DATABASE_URL="postgresql://user:password@localhost:5432/expense_manager?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"
```

3. **Generate Prisma Client:**
```bash
npx prisma generate
```

4. **Create and apply initial migration:**
```bash
npx prisma migrate dev --name init
```

5. **Seed the database (optional):**
```bash
npx prisma db seed
```

## Production Migration (PostgreSQL)

1. Update `prisma/schema.prisma`:
   - Change `provider = "sqlite"` to `provider = "postgresql"`
   - Update `DATABASE_URL` in `.env` to PostgreSQL connection string

2. Run migration:
```bash
npx prisma migrate deploy
```

## Useful Commands

- **View database in Prisma Studio:**
```bash
npx prisma studio
```

- **Reset database (WARNING: deletes all data):**
```bash
npx prisma migrate reset
```

- **Generate Prisma Client after schema changes:**
```bash
npx prisma generate
```

- **Create a new migration:**
```bash
npx prisma migrate dev --name your_migration_name
```

## Package.json Seed Configuration

Add this to your `package.json`:
```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

Or if using ts-node:
```json
"prisma": {
  "seed": "ts-node prisma/seed.ts"
}
```

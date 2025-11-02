# UI Updates - Database Schema Notes

## Overview
The new UI pages and components may require some database schema considerations for full functionality.

## Current Assumptions

The UI components assume the following Prisma schema structure:

### User Model
```prisma
model User {
  id            String         @id @default(uuid())
  email         String         @unique
  name          String?
  phone         String?        // Optional: for SMS notifications
  metadata      String?        @default("{}") // For storing user preferences, recurring prompts
  // ... other fields
}
```

### Transaction Model
```prisma
model Transaction {
  id          String    @id @default(uuid())
  clientId    String?
  userId      String
  accountId   String
  amountMinor Int
  currency    String
  category    String
  merchant    String?
  note        String?
  metadata    String?   @default("{}")
  createdAt   DateTime
  syncedAt    DateTime? @default(now())
  isDeleted   Boolean   @default(false)
  
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  account     Account   @relation(fields: [accountId], references: [id], onDelete: Cascade)

  @@unique([userId, clientId])
  @@index([userId])
  @@index([accountId])
  @@index([userId, createdAt])
  @@index([userId, category])
  @@index([isDeleted])
}
```

## Authentication TODO

The current pages use a temporary workaround to fetch the first user:

```typescript
const user = await prisma.user.findFirst();
```

**Action Required:**
1. Implement proper authentication using NextAuth (already configured in `src/lib/auth.ts`)
2. Update all server component pages to use `getCurrentUser()` or `requireUser()`
3. Replace `prisma.user.findFirst()` with authenticated user lookup

Example:
```typescript
import { requireUser } from '@/lib/auth';

export default async function TransactionsPage() {
  const user = await requireUser();
  
  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id, isDeleted: false },
    // ...
  });
}
```

## Mobile Responsiveness

The UI uses Tailwind's responsive breakpoints:
- `sm:` - 640px and up
- `md:` - 768px and up
- `lg:` - 1024px and up

Key responsive patterns:
- Sidebar hidden on mobile (`hidden md:flex`)
- Mobile navigation slide-over
- Table to card layout transformation
- Touch-friendly button sizes (min 44px)

## API Endpoints Required

The UI expects these API endpoints to exist:

1. `/api/export/transactions?format=csv|xlsx` - Export transactions
2. `/api/transactions` - List/create transactions (already exists)
3. `/api/transactions/[id]` - Get/update/delete transaction (already exists)
4. `/api/transactions/import` - Bulk import (already exists)
5. `/api/webhooks/email` - Email webhook (already exists)

## TypeScript Type Safety

Some pages have implicit `any` types that should be fixed by:
1. Ensuring Prisma client is generated: `npx prisma generate`
2. The types will be inferred from Prisma schema

## Accessibility Features

All interactive components include:
- `aria-label` attributes
- Semantic HTML elements
- Keyboard navigation support
- Focus indicators
- Screen reader friendly text

## Next Steps

1. Run `npx prisma generate` to ensure types are available
2. Implement authentication in pages
3. Test responsive layouts on mobile devices
4. Add missing API endpoints if needed
5. Configure proper error boundaries
6. Add loading states for async operations

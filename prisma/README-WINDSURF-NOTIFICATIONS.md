# Notifications Feature - Database Schema Requirements

## Overview
The email webhook notification system requires some database schema additions to fully support all features.

## Required Schema Changes

### Option 1: Add metadata field to User model (Recommended)

Add a `metadata` JSON field to store recurring prompts and other user-specific data:

```prisma
model User {
  id            String         @id @default(uuid())
  email         String         @unique
  name          String?
  emailVerified DateTime?
  image         String?
  passwordHash  String?
  phone         String?        // Optional: for SMS notifications
  metadata      String?        @default("{}") // For SQLite, use String; for PostgreSQL use Json?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  accounts      Account[]
  transactions  Transaction[]
  assets        Asset[]
  teamMembers   TeamMember[]
  apiKeys       ApiKey[]
  sessions      Session[]

  @@index([email])
}
```

**Note:** SQLite doesn't have a native JSON type, so use `String` and parse/stringify. For PostgreSQL, use `Json?` type.

### Option 2: Create dedicated models (Alternative)

If you prefer separate tables, add these models:

```prisma
model Notification {
  id        String   @id @default(uuid())
  userId    String
  type      String   // "credit_card_payment", "loan_notice", etc.
  title     String
  message   String
  metadata  String?  @default("{}")
  read      Boolean  @default(false)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, read])
  @@index([createdAt])
}

model RecurringPrompt {
  id          String    @id @default(uuid())
  userId      String
  type        String    // "loan", "emi", "subscription"
  lender      String?
  hint        String?
  amount      Int?      // in minor units
  currency    String?
  dismissed   Boolean   @default(false)
  convertedAt DateTime? // When user created recurring expense from this prompt
  createdAt   DateTime  @default(now())
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, dismissed])
}
```

Don't forget to add the relations to the User model:

```prisma
model User {
  // ... existing fields
  notifications     Notification[]
  recurringPrompts  RecurringPrompt[]
}
```

## Migration Steps

### For Option 1 (metadata field):

1. Update your `prisma/schema.prisma` with the User model changes above
2. Run migration:
```bash
npx prisma migrate dev --name add_user_metadata_and_phone
```
3. Generate Prisma client:
```bash
npx prisma generate
```

### For Option 2 (dedicated models):

1. Add the Notification and RecurringPrompt models to `prisma/schema.prisma`
2. Update User model to include the relations
3. Run migration:
```bash
npx prisma migrate dev --name add_notifications_and_prompts
```
4. Generate Prisma client:
```bash
npx prisma generate
```

## Code Updates Required

After adding the schema, update the webhook handler:

### In `src/app/api/webhooks/email/route.ts`:

**For Option 1 (metadata):**
Uncomment the metadata storage code around line 160:

```typescript
const currentMetadata = user.metadata ? JSON.parse(user.metadata) : {};
const recurringPrompts = currentMetadata.recurringPrompts || [];
recurringPrompts.push({
  type: 'loan',
  lender: loanNotice.lender,
  hint: loanNotice.hint,
  detectedAt: new Date().toISOString(),
});
await prisma.user.update({
  where: { id: user.id },
  data: { metadata: JSON.stringify({ ...currentMetadata, recurringPrompts }) },
});
```

**For Option 2 (dedicated models):**
Replace the TODO section with:

```typescript
await prisma.recurringPrompt.create({
  data: {
    userId: user.id,
    type: 'loan',
    lender: loanNotice.lender,
    hint: loanNotice.hint,
  },
});
```

## SMS Notifications

To enable SMS notifications for credit card payments, add the `phone` field to User model:

```prisma
model User {
  // ... existing fields
  phone String? // E.164 format: +1234567890
}
```

Then uncomment the SMS sending code in the webhook handler (around line 150).

## Verification

After migration, verify:

1. User model has new fields
2. Prisma client regenerated
3. Webhook can store recurring prompts
4. No TypeScript errors in webhook handler

## Rollback

If you need to rollback:

```bash
npx prisma migrate reset  # WARNING: Deletes all data
```

Or create a down migration to remove the added fields/tables.

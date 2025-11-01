# Database Schema Design

This document outlines the IndexedDB structure (current) and planned backend database schema for the Expense Manager application.

## Current Implementation: IndexedDB

### Object Stores (Tables)

#### 1. **accounts** (Store)
- **Purpose**: Bank accounts information
- **Key**: `id` (string, primary key)
- **Indexes**:
  - `type` - Account type (savings, current, investment, wallet)
  - `name` - Account name (for search)
- **Size**: Small (~10-50 records typically)
- **Migration Priority**: Medium

#### 2. **assets** (Store)
- **Purpose**: Investment assets (stocks, SIP, crypto, gold, etc.)
- **Key**: `id` (string, primary key)
- **Indexes**:
  - `type` - Asset type (sip, stocks, crypto, gold, property, other)
  - `category` - Asset category
  - `purchaseDate` - For sorting by date
- **Size**: Medium (can grow to 100s of assets)
- **Migration Priority**: High

#### 3. **transactions** (Store)
- **Purpose**: All financial transactions (expenses, earnings)
- **Key**: `id` (string, primary key)
- **Indexes**:
  - `accountId` - Foreign key to accounts
  - `assetId` - Foreign key to assets (nullable)
  - `date` - Transaction date (for date range queries)
  - `type` - Transaction type (expense, earning)
  - `category` - Transaction category
  - `date_accountId` - Composite index (date + accountId)
  - `date_type` - Composite index (date + type)
- **Size**: Large (can grow to 1000s of transactions)
- **Migration Priority**: **CRITICAL** - This will grow the fastest

#### 4. **settings** (Store)
- **Purpose**: User settings and preferences
- **Key**: `key` (string, primary key)
- **Value**: JSON object (UserSettings)
- **Size**: Very small (single record)
- **Migration Priority**: Low

## Backend Database Schema (Planned)

### Table: `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Table: `accounts`
```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
  type VARCHAR(50) NOT NULL, -- savings, current, investment, wallet
  color VARCHAR(7), -- Hex color code
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_user_id (user_id),
  INDEX idx_type (type)
);
```

### Table: `assets`
```sql
CREATE TABLE assets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- sip, stocks, crypto, gold, property, other
  value DECIMAL(15, 2) NOT NULL,
  purchase_date DATE NOT NULL,
  category VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_purchase_date (purchase_date)
);
```

### Table: `transactions`
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL, -- expense, earning
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  original_amount DECIMAL(15, 2),
  original_currency VARCHAR(10),
  category VARCHAR(255) NOT NULL,
  comment TEXT,
  is_investment BOOLEAN DEFAULT FALSE,
  date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_user_id (user_id),
  INDEX idx_account_id (account_id),
  INDEX idx_asset_id (asset_id),
  INDEX idx_date (date),
  INDEX idx_type (type),
  INDEX idx_category (category),
  INDEX idx_date_account (date, account_id),
  INDEX idx_date_type (date, type)
);
```

### Table: `user_settings`
```sql
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  default_currency VARCHAR(10) DEFAULT 'INR',
  exchange_rates JSONB,
  last_rate_update TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Data Storage Strategy

### IndexedDB (Current)
- **What's stored**: All user data (accounts, assets, transactions, settings)
- **Size limits**: 
  - Per origin: ~50% of disk space (but practical limit ~5-10MB per domain)
  - Individual item: No limit
- **Use case**: Offline-first, local storage before backend sync

### Backend Database (Future)
- **What's stored**: All data replicated from IndexedDB
- **Benefits**:
  - Cross-device sync
  - Backup and recovery
  - Analytics and reporting
  - Multi-user support (if needed)

## Migration Strategy

### Phase 1: IndexedDB (✅ Complete)
- Migrate from localStorage to IndexedDB
- Implement efficient indexing
- Handle date serialization properly

### Phase 2: Backend API (Future)
1. Create REST/GraphQL API endpoints:
   - `GET /api/accounts` - List accounts
   - `POST /api/accounts` - Create account
   - `PUT /api/accounts/:id` - Update account
   - `DELETE /api/accounts/:id` - Delete account
   - Same pattern for assets, transactions, settings

2. Implement sync logic:
   - Background sync from IndexedDB to backend
   - Conflict resolution (last-write-wins or manual)
   - Incremental sync (only changed items)

3. Add authentication:
   - User login/registration
   - JWT tokens
   - Secure API endpoints

### Phase 3: Real-time Sync (Future)
- WebSocket connections for real-time updates
- Push notifications for transaction alerts
- Collaborative features (shared budgets, etc.)

## Performance Considerations

### IndexedDB
- Use indexes for queries (don't scan entire store)
- Bulk operations for multiple items
- Date-based queries use date indexes
- Composite indexes for complex queries

### Backend
- Use database indexes for frequently queried fields
- Pagination for large result sets
- Caching for exchange rates and settings
- Batch inserts for bulk operations

## Data Growth Estimates

| Entity | Typical Size | Max Expected | Storage Method |
|--------|-------------|--------------|----------------|
| Accounts | 5-20 | 50 | IndexedDB + Backend |
| Assets | 10-100 | 500 | IndexedDB + Backend |
| Transactions | 100-5000 | 50,000+ | **IndexedDB + Backend** |
| Settings | 1 | 1 | IndexedDB + Backend |

**Transactions are the largest concern** - plan pagination and filtering for UI queries.


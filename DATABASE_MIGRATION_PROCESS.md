# Database Migration Process - MCP Supabase

## Overview
All database migrations are now applied directly through the Supabase MCP (Model Context Protocol) connection to ensure consistency and avoid manual steps.

## Migration Process

1. **Create Migration File**
   - Location: `database/migrations/YYYYMMDDHHMMSS_description.sql`
   - Follow naming convention: timestamp + descriptive name

2. **Apply via MCP**
   - All migrations are automatically applied through MCP connection
   - No manual SQL Editor steps required
   - Migrations are tracked and versioned

3. **Verification**
   - Check Supabase Dashboard for applied migrations
   - Verify security advisor warnings are resolved
   - Test application functionality after migration

## Current Migrations Applied

### 20260106000000_enable_rls_depreciation_profiles.sql
- **Purpose**: Enable Row Level Security on `depreciation_profiles` table
- **Status**: ✅ Applied via MCP on 2026-01-06
- **Fixes**: Supabase Security Advisor warning for RLS disabled in public schema
- **Policies Created**:
  - SELECT: All authenticated users
  - INSERT: Authenticated users
  - UPDATE: Authenticated users  
  - DELETE: Authenticated users
- **SQL Location**: `database/migrations/20260106000000_enable_rls_depreciation_profiles.sql`
- **Applied**: Migration executed successfully through MCP connection

## Future Database Operations

All future database schema changes, RLS policies, constraints, and migrations will be:
1. Created as migration files in `database/migrations/`
2. Applied automatically through MCP Supabase connection
3. Committed to git for version control
4. Documented in this file

## Verification

After applying migrations, use the verification script to confirm:
- `database/migrations/verify_rls_depreciation_profiles.sql` - Checks RLS status and policies

## Application Scripts

For manual application or re-application:
- `database/migrations/apply_rls_depreciation_profiles.sql` - Idempotent application script

## Notes

- MCP connection ensures all database operations are consistent
- No manual SQL Editor steps required
- All changes are tracked and reversible
- Security policies are automatically applied
- Verification scripts available for all migrations

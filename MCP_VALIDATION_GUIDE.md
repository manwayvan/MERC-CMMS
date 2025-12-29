# MCP Connection Validation Guide

## 🎯 Purpose
This guide helps you validate that your MCP (Model Context Protocol) connection to Supabase is working correctly.

## ✅ Quick Validation Test

### Step 1: Run the Validation Script

**Option A: Via MCP (Recommended)**
1. Use your MCP interface to run: `validate_mcp_connection.sql`
2. Review the test results

**Option B: Via Supabase Dashboard**
1. Go to: https://supabase.com/dashboard/project/hmdemsbqiqlqcggwblvl/sql
2. Open: `validate_mcp_connection.sql`
3. Copy and paste the entire script
4. Click "Run"
5. Review the results

### Step 2: Interpret Results

The validation script runs **12 tests**:

#### ✅ Critical Tests (Must Pass)
1. **Basic Connection** - Can connect to database
2. **Schema Access** - Can access public schema
3. **Core Tables** - At least 8 core tables exist
4. **Read Access** - Can query work_order_types
5. **Read Access** - Can query work_orders

#### ⚠️ Important Tests (Should Pass)
6. **Write Access Check** - Tables are accessible
7. **RLS Policies** - Row Level Security is configured
8. **Foreign Keys** - Relationships are set up
9. **Sequences** - ID generation sequences exist
10. **Indexes** - Performance indexes are created

#### 📊 Data Tests (Nice to Have)
11. **Work Order Types** - Default data is present
12. **Device Categories** - Default data is present

## 📋 Expected Results

### ✅ All Tests Pass
If all tests show ✅ PASS:
- **MCP is fully operational**
- Database is properly configured
- You can proceed with application use

### ⚠️ Partial Tests Pass
If some tests show ⚠️ PARTIAL:
- **MCP is working but setup incomplete**
- Run `setup_complete_database.sql` to complete setup
- Re-run validation after setup

### ❌ Tests Fail
If tests show ❌ FAIL:
- **MCP connection may have issues**
- Check MCP configuration
- Verify project ID: `hmdemsbqiqlqcggwblvl`
- Check API keys and permissions

## 🔍 Detailed Test Explanations

### Test 1: Basic Connection
- **What it checks**: Can MCP connect to the database?
- **Expected**: Database name, user, and PostgreSQL version
- **If fails**: MCP connection not established

### Test 2: Schema Access
- **What it checks**: Can MCP access the public schema?
- **Expected**: At least 1 table in public schema
- **If fails**: Permission issues or wrong schema

### Test 3: Core Tables
- **What it checks**: Do essential tables exist?
- **Expected**: 8+ core tables (user_profiles, technicians, customers, locations, assets, work_order_types, work_orders, checklists)
- **If fails**: Run `setup_complete_database.sql`

### Test 4-5: Read Access
- **What it checks**: Can MCP read from tables?
- **Expected**: Can query work_order_types and work_orders
- **If fails**: RLS policies may be blocking access

### Test 6: Write Access Check
- **What it checks**: Are tables accessible for writes?
- **Expected**: Tables exist and are accessible
- **If fails**: Table creation incomplete

### Test 7: RLS Policies
- **What it checks**: Is Row Level Security enabled?
- **Expected**: 5+ tables with RLS enabled
- **If fails**: Run setup script to add RLS policies

### Test 8: Foreign Keys
- **What it checks**: Are relationships configured?
- **Expected**: 5+ foreign key constraints
- **If fails**: Run setup script to add constraints

### Test 9: Sequences
- **What it checks**: Are ID generation sequences created?
- **Expected**: 4 sequences (customers_seq, locations_seq, assets_seq, work_orders_seq)
- **If fails**: Run setup script

### Test 10: Indexes
- **What it checks**: Are performance indexes created?
- **Expected**: 10+ indexes
- **If fails**: Run setup script

### Test 11-12: Default Data
- **What it checks**: Is seed data present?
- **Expected**: 6 work order types, 13+ device categories
- **If fails**: Run setup script (includes seed data)

## 🛠️ Troubleshooting

### Issue: "relation does not exist"
**Solution**: Run `setup_complete_database.sql` to create tables

### Issue: "permission denied"
**Solution**: 
1. Check RLS policies are configured
2. Verify API key has correct permissions
3. Check MCP is using correct project

### Issue: "column does not exist"
**Solution**: Run `setup_complete_database.sql` - it will add missing columns

### Issue: Tests show 0 results
**Solution**: 
1. Verify you're connected to project `hmdemsbqiqlqcggwblvl`
2. Check MCP configuration
3. Run setup script

## 📊 Success Criteria

MCP is **fully validated** when:
- ✅ All 12 tests pass
- ✅ Can query tables via MCP
- ✅ Can read and write data
- ✅ RLS policies are active
- ✅ All core tables exist

## 🚀 Next Steps After Validation

1. **If all tests pass**: 
   - MCP is ready to use
   - Application can connect
   - Proceed with normal operations

2. **If tests partially pass**:
   - Run `setup_complete_database.sql`
   - Re-run validation
   - Fix any remaining issues

3. **If tests fail**:
   - Check MCP configuration
   - Verify project access
   - Contact support if needed

## 📝 Notes

- Validation script is **read-only** - safe to run anytime
- Results show current database state
- Re-run validation after making changes
- Keep validation results for troubleshooting

---

**Ready to validate?** Run `validate_mcp_connection.sql` via MCP or Supabase dashboard!


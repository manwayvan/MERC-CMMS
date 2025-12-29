# How to Run MCP Validation

## ⚠️ Important Note
I don't have direct access to Supabase MCP tools in this environment, so I cannot run the validation script directly. However, here's how **you** can run it:

## 🚀 Step-by-Step Instructions

### Option 1: Run via Your MCP Interface

If you have MCP tools available in your environment:

1. **Open your MCP interface** (wherever you see MCP tools/commands)
2. **Navigate to SQL execution** or command interface
3. **Run the script**:
   ```
   Execute: validate_mcp_connection.sql
   ```
   OR
   ```
   Run SQL file: validate_mcp_connection.sql
   ```

4. **Review the results** - You should see 12 test results

### Option 2: Run via Supabase Dashboard

1. **Go to Supabase SQL Editor**:
   - https://supabase.com/dashboard/project/hmdemsbqiqlqcggwblvl/sql

2. **Open the validation script**:
   - Open `validate_mcp_connection.sql` from your project

3. **Copy and paste** the entire script into the SQL editor

4. **Click "Run"** button

5. **Review results** - Scroll through all test results

### Option 3: Quick Test First

Before running the full validation, test basic connectivity:

1. **Run `quick_mcp_test.sql`** first (simpler, faster)
2. **If that works**, then run the full `validate_mcp_connection.sql`

## 📋 What to Look For

### ✅ Success Indicators
- All tests show "✅ PASS"
- Database name shows: `postgres` or your database name
- Table count > 0
- Work order types count = 6
- RLS count >= 5

### ⚠️ Warning Indicators
- Some tests show "⚠️ PARTIAL"
- Table count < 8
- Missing work order types

### ❌ Failure Indicators
- Tests show "❌ FAIL"
- Table count = 0
- Connection errors

## 🔍 Interpreting Results

### Test Results Format
Each test will show:
- **Test Name**: What's being tested
- **Count/Value**: The actual result
- **Status**: ✅ PASS, ⚠️ PARTIAL, or ❌ FAIL

### Key Tests to Watch

1. **Test 1: Basic Connection**
   - Should show database name and user
   - If fails: MCP not connected

2. **Test 3: Core Tables**
   - Should show 8+ tables
   - If fails: Run `setup_complete_database.sql`

3. **Test 4-5: Read Access**
   - Should show counts (can be 0 if no data)
   - If fails: RLS or permission issues

4. **Test 11: Work Order Types**
   - Should show 6 types
   - If fails: Seed data not inserted

## 🛠️ If Tests Fail

### If "relation does not exist" errors:
→ Run `setup_complete_database.sql`

### If "permission denied" errors:
→ Check RLS policies are configured
→ Verify API key permissions

### If connection fails:
→ Verify MCP is connected to project `hmdemsbqiqlqcggwblvl`
→ Check MCP configuration

## 📊 Expected Full Results

When everything is working, you should see:

```
Test 1: Basic Connection ✅ PASS
Test 2: Schema Access ✅ PASS
Test 3: Core Tables ✅ PASS (8+ tables)
Test 4: Read Access (work_order_types) ✅ PASS
Test 5: Read Access (work_orders) ✅ PASS
Test 6: Write Access Check ✅ PASS
Test 7: RLS Policies ✅ PASS (5+ tables)
Test 8: Foreign Keys ✅ PASS (5+ constraints)
Test 9: Sequences ✅ PASS (4 sequences)
Test 10: Indexes ✅ PASS (10+ indexes)
Test 11: Work Order Types Data ✅ PASS (6 types)
Test 12: Device Categories Data ✅ PASS (13+ categories)
```

## 💡 Quick Alternative

If you want to test MCP quickly, try this simple query:

```sql
SELECT 
    current_database() as db,
    COUNT(*) as tables
FROM information_schema.tables 
WHERE table_schema = 'public';
```

If this returns results, MCP is working!

## 📝 Next Steps

1. **Run the validation** using one of the methods above
2. **Share the results** if you want help interpreting them
3. **Fix any issues** found (I can help create fix scripts)
4. **Re-run validation** after fixes

---

**Need help?** Share your validation results and I can help interpret them and fix any issues!


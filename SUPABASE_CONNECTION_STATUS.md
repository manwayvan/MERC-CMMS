# Supabase Connection Status Check

## ✅ Codebase Configuration Verified

All application files are correctly configured for project **hmdemsbqiqlqcggwblvl**:

### Configuration Files Status:
- ✅ `config.js` - Points to `https://hmdemsbqiqlqcggwblvl.supabase.co`
- ✅ `main.js` - Points to `https://hmdemsbqiqlqcggwblvl.supabase.co`
- ✅ `assets.html` - Points to `https://hmdemsbqiqlqcggwblvl.supabase.co`
- ✅ `auth.js` - Points to `https://hmdemsbqiqlqcggwblvl.supabase.co`
- ✅ `customers.html` - Points to `https://hmdemsbqiqlqcggwblvl.supabase.co`
- ✅ `js/supabase-config.js` - Points to `https://hmdemsbqiqlqcggwblvl.supabase.co`

### API Key:
- Current Key: `sb_publishable_Z9oNxTGDCCz3EZnh6NqySg_QzF6amCN`
- ⚠️ **Verify this is the correct publishable key for project hmdemsbqiqlqcggwblvl**

---

## 🔍 What Needs to be Verified in Supabase Dashboard

Since MCP connection is not currently accessible, please verify the following directly in your Supabase dashboard:

### 1. Project Access
- Go to: https://supabase.com/dashboard/project/hmdemsbqiqlqcggwblvl
- Verify you can access the project dashboard

### 2. Work Orders Tables
Run this query in SQL Editor to check if tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'work_order%'
ORDER BY table_name;
```

**Expected tables:**
- `work_order_types`
- `work_orders`
- `work_order_comments`
- `work_order_attachments`
- `work_order_tasks`
- `work_order_task_attachments`
- `work_order_checklists`
- `work_order_checklist_responses`

### 3. RLS Policies
Check if RLS is enabled and policies exist:

```sql
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename LIKE 'work_order%'
ORDER BY tablename, policyname;
```

**Expected:** Each table should have:
- "Allow authenticated read access" policy
- "Allow authenticated write access" policy

### 4. Sequence
Check if the sequence exists:

```sql
SELECT sequence_name, start_value 
FROM information_schema.sequences 
WHERE sequence_schema = 'public' 
AND sequence_name = 'work_orders_seq';
```

**Expected:** Should return `work_orders_seq` with `start_value = 1`

### 5. Work Order Types Data
Check if default types are inserted:

```sql
SELECT code, label, is_active 
FROM work_order_types 
ORDER BY code;
```

**Expected types:**
- `repair` - Repair
- `pm` - Preventive Maintenance
- `calibration` - Calibration
- `inspection` - Inspection
- `installation` - Installation
- `upgrade` - Upgrade

---

## 🛠️ If Tables Are Missing

If any of the above checks fail, run the fix script:

1. Go to: https://supabase.com/dashboard/project/hmdemsbqiqlqcggwblvl/sql
2. Open `fix_work_orders_connection.sql`
3. Copy entire contents
4. Paste and click "Run"

---

## 🔑 API Key Verification

To verify the API key is correct:

1. Go to: https://supabase.com/dashboard/project/hmdemsbqiqlqcggwblvl/settings/api
2. Check the **Publishable key** (anon public)
3. Compare with the key in `config.js`: `sb_publishable_Z9oNxTGDCCz3EZnh6NqySg_QzF6amCN`
4. If different, update all config files with the correct key

---

## 📝 MCP Connection Note

The Supabase MCP tools are not currently accessible from this environment. To enable direct database access:

1. **MCP Configuration**: Ensure the MCP server is configured with:
   - Project Reference: `hmdemsbqiqlqcggwblvl`
   - Service Role Key (for write operations)
   - Or Anon Key (for read operations with RLS)

2. **MCP Server Status**: Verify the MCP server is running and connected

3. **Restart**: May need to restart Cursor/IDE to reload MCP connections

Once MCP is connected, I can:
- ✅ Directly query tables
- ✅ Apply migrations
- ✅ Verify RLS policies
- ✅ Check data integrity
- ✅ Run fix scripts automatically

---

## ✅ Quick Verification Checklist

- [ ] Can access Supabase dashboard for project `hmdemsbqiqlqcggwblvl`
- [ ] All work order tables exist
- [ ] RLS policies are enabled and configured
- [ ] `work_orders_seq` sequence exists
- [ ] Work order types are populated
- [ ] API key matches between dashboard and config files
- [ ] MCP connection is working (if applicable)

---

## 🚀 Next Steps

1. **Verify tables exist** - Run the table check query above
2. **If missing** - Run `fix_work_orders_connection.sql`
3. **Test connection** - Refresh work orders page and try creating a work order
4. **Check browser console** - Look for any connection errors

If you encounter any issues, share the error messages and I can help troubleshoot!


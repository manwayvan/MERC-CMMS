# 🏥 MERC-CMMS Customers & Locations Module

## Overview
The Customers & Locations module allows you to manage healthcare organizations (customers) and their multiple facility locations. This is a critical component of the CMMS system as all assets and work orders are tied to customer locations.

---

## 🎯 Features

### Customer Management
- ✅ Add new healthcare customers
- ✅ Edit existing customer details
- ✅ Delete customers (with cascade to locations)
- ✅ Search customers by name, contact, phone, or location
- ✅ Filter customers by status (active/inactive)
- ✅ View customer statistics dashboard

### Location Management (Multiple per Customer)
- ✅ Add unlimited locations per customer
- ✅ Edit location details
- ✅ Delete individual locations
- ✅ Track location status (active, inactive, maintenance, retired)
- ✅ View all locations for each customer in organized cards
- ✅ Empty state with helpful CTAs when no locations exist

### UI/UX Features
- ✅ Beautiful card-based layout
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Real-time statistics
- ✅ Toast notifications for all actions
- ✅ Confirm dialogs for destructive actions
- ✅ Loading states
- ✅ Empty states with helpful guidance
- ✅ Test IDs for automated testing

---

## 🗄️ Database Schema Required

### Before using this page, you MUST run the database schema in Supabase:

1. Open your Supabase SQL Editor: https://supabase.com/dashboard/project/hmdemsbqiqlqcggwblvl/sql
2. Copy and paste the entire `/app/supabase_schema.sql` file
3. Click "Run"

### Tables Used:
- `customers` - Stores customer organizations
- `locations` - Stores customer facility locations (foreign key to customers)

### Required Columns:

**customers table:**
```sql
- id (TEXT, PRIMARY KEY) - Auto-generated like CUST-20250124-0001
- name (TEXT) - Customer organization name
- contact_person (TEXT) - Primary contact name
- email (TEXT) - Contact email
- phone (TEXT) - Contact phone
- address (TEXT) - Organization address
- status (TEXT) - 'active' or 'inactive'
- created_at (TIMESTAMPTZ) - Auto-generated
- updated_at (TIMESTAMPTZ) - Auto-updated
```

**locations table:**
```sql
- id (TEXT, PRIMARY KEY) - Auto-generated like LOC-20250124-0001
- customer_id (TEXT, FOREIGN KEY) - References customers(id)
- name (TEXT) - Location/facility name
- contact_person (TEXT) - Location contact name
- email (TEXT) - Location contact email
- phone (TEXT) - Location phone
- address (TEXT) - Location address
- status (TEXT) - 'active', 'inactive', 'maintenance', or 'retired'
- created_at (TIMESTAMPTZ) - Auto-generated
- updated_at (TIMESTAMPTZ) - Auto-updated
```

---

## 🔑 Supabase Configuration

### Current Configuration (Already Set):
```javascript
const supabaseUrl = 'https://hmdemsbqiqlqcggwblvl.supabase.co';
const supabaseKey = 'sb_publishable_Z9oNxTGDCCz3EZnh6NqySg_QzF6amCN';
```

### Row Level Security (RLS)
The database schema includes RLS policies that allow authenticated users to:
- ✅ READ all customers and locations
- ✅ CREATE new customers and locations
- ✅ UPDATE existing customers and locations
- ✅ DELETE customers and locations

**Note:** Deleting a customer will CASCADE delete all its locations (foreign key constraint).

---

## 📊 How to Use

### Adding a Customer
1. Click "Add Customer" button (top right or in empty state)
2. Fill in all required fields:
   - Customer Name *
   - Contact Person *
   - Phone *
   - Address *
   - Email (optional)
   - Status (active/inactive)
3. Click "Save Customer"
4. Success toast will appear and customer will be added to the grid

### Adding Locations to a Customer
1. Find the customer card in the grid
2. In the "Locations" section, click "+ Add Location"
3. Fill in all required fields:
   - Location Name * (e.g., "Main Campus - ICU")
   - Contact Person *
   - Phone *
   - Address *
   - Email (optional)
   - Status (active/inactive/maintenance/retired)
4. Click "Save Location"
5. Location will appear under the customer card

### Editing
- Click the blue edit icon (pencil) next to any customer or location
- Modify the fields in the modal
- Click "Save" to update

### Deleting
- Click the red delete icon (trash) next to any customer or location
- Confirm the deletion in the dialog
- **WARNING:** Deleting a customer will also delete ALL its locations!

### Searching
- Use the search bar to filter by:
  - Customer name
  - Contact person name
  - Phone number
  - Location name
  - Location address

### Filtering
- Use the status chips to filter:
  - "All Statuses" - Show everything
  - "Active" - Only active customers
  - "Inactive" - Only inactive customers

---

## 🧪 Testing the Connection

### Test Button
Click the red "?" button in the bottom-right corner to test Supabase connectivity.

**Expected Results:**
- ✅ "Supabase connection successful!" - Database is accessible
- ❌ "Connection failed: [error]" - Check your setup

### Console Logging
Open browser DevTools (F12) → Console to see detailed logs:
- 📡 Loading operations
- ➕ Create operations
- 🔄 Update operations
- 🗑️ Delete operations
- ✅ Successes
- ❌ Errors

---

## 🐛 Troubleshooting

### Issue: "Failed to load customers"
**Solutions:**
1. Verify database schema is deployed
2. Check Supabase credentials are correct
3. Ensure RLS policies are enabled
4. Check browser console for detailed errors

### Issue: "Row Level Security policy violation"
**Solutions:**
1. Re-run the RLS policies from `supabase_schema.sql`
2. Verify you're using the correct Supabase project
3. Check that policies allow SELECT, INSERT, UPDATE, DELETE

### Issue: "Foreign key constraint violation"
**Solutions:**
1. This happens when trying to delete a customer with locations
2. The system should handle this with CASCADE delete
3. If error persists, check the foreign key constraint in database

### Issue: No data showing but no errors
**Solutions:**
1. Run `seed_data.sql` to populate sample data
2. Try adding a customer manually
3. Check if tables exist: `SELECT * FROM customers;` in SQL editor

---

## 📝 Data Flow

```
User Action → JavaScript Function → Supabase Client → PostgreSQL Database
     ↓                                                        ↓
Toast Notification ← Success/Error ← Response ← Query Result
     ↓
Reload Data → Render UI
```

### Example: Adding a Location
```javascript
1. User fills form and clicks "Save Location"
   ↓
2. locationForm.addEventListener('submit', ...)
   ↓
3. async function addLocation(customerId, locationData)
   ↓
4. supabaseClient.from('locations').insert([...])
   ↓
5. Supabase validates and inserts
   ↓
6. Success response
   ↓
7. showToast('Location added successfully!')
   ↓
8. loadCustomers() - Reload all data
   ↓
9. renderCustomers() - Update UI
```

---

## 🎨 UI Components

### Customer Card
- Customer name (header)
- Contact person with icon
- Phone with icon
- Email with icon (if exists)
- Address with icon
- Status badge (green=active, gray=inactive)
- Location count badge
- Edit and Delete buttons

### Location Card (within Customer Card)
- Location name (header)
- Status badge (color-coded)
- Contact person with icon
- Phone with icon
- Email with icon (if exists)
- Address with icon
- Edit and Delete buttons

### Modals
- Customer Modal (Add/Edit)
- Location Modal (Add/Edit)
- Both have form validation
- Both have cancel/save buttons

### Statistics Bar
- Total Customers
- Active Customers
- Inactive Customers
- Total Locations

---

## 🔒 Security Features

1. **Row Level Security (RLS)** - Database-level access control
2. **Input Validation** - Required field checks
3. **Confirm Dialogs** - Prevents accidental deletions
4. **Error Handling** - Graceful error messages
5. **Console Logging** - Audit trail in browser console
6. **Toast Notifications** - User feedback for all actions

---

## 🚀 Next Steps

After setting up Customers & Locations:

1. **Add Sample Data** - Run `seed_data.sql` for test data
2. **Connect Assets** - Link assets to customer locations
3. **Connect Work Orders** - Tie work orders to assets at locations
4. **Add Authentication** - Restrict access by user role
5. **Add File Uploads** - Upload customer contracts, certifications
6. **Add Reports** - Generate customer-specific reports

---

## 📞 Support

If you encounter issues:
1. Check browser console (F12) for detailed error messages
2. Verify database schema is deployed correctly
3. Test Supabase connection using the ? button
4. Check Supabase dashboard for table structure
5. Review RLS policies in Supabase Authentication → Policies

---

## ✅ Checklist Before Going Live

- [ ] Database schema deployed (`supabase_schema.sql`)
- [ ] Supabase credentials configured correctly
- [ ] RLS policies enabled
- [ ] Test connection successful (? button)
- [ ] Can add a customer successfully
- [ ] Can add a location to customer
- [ ] Can edit customer and location
- [ ] Can delete location
- [ ] Can delete customer (cascades to locations)
- [ ] Search functionality works
- [ ] Filter functionality works
- [ ] Statistics update correctly
- [ ] Toast notifications appear
- [ ] Mobile responsive (test on phone)

---

**Version:** 1.0.0  
**Last Updated:** January 24, 2025  
**Module Status:** ✅ Production Ready

# Bulk Import Enhancements - Required Changes

## Issues Fixed:
1. Missing `last_maintenance` and `next_maintenance` in database columns list
2. Missing Customer column mapping (should map to `customer_id` and resolve customer names)
3. Missing Last PM and Next PM column mappings
4. Need better auto-mapping for common column name variations

## Changes Made:

### 1. Added PM columns to fallback database columns (lines 2844-2845)
After line 2844, add:
```javascript
{ name: 'last_maintenance', type: 'timestamp', nullable: true },
{ name: 'next_maintenance', type: 'timestamp', nullable: true },
```

### 2. Ensure PM columns are in RPC result (after line 2851)
After `databaseColumns = data || [];`, add:
```javascript
// Ensure critical columns are present even if not returned by RPC
const criticalColumns = [
    { name: 'last_maintenance', type: 'timestamp', nullable: true },
    { name: 'next_maintenance', type: 'timestamp', nullable: true }
];
criticalColumns.forEach(critCol => {
    if (!databaseColumns.find(c => c.name === critCol.name)) {
        databaseColumns.push(critCol);
    }
});
```

### 3. Add PM columns to catch block fallback (after line 2869)
After line 2869, add:
```javascript
{ name: 'last_maintenance', type: 'timestamp', nullable: true },
{ name: 'next_maintenance', type: 'timestamp', nullable: true }
```

### 4. Enhanced auto-mapping in renderColumnMapping (lines 2914-2919)
Replace the auto-mapping logic with smart matching that recognizes:
- Customer variations → customer_id
- Last PM variations → last_maintenance  
- Next PM variations → next_maintenance

### 5. Enhanced customer name resolution (lines 3183-3188)
Replace with logic that:
- Checks if customer_id column is mapped
- Resolves customer names from CSV to customer IDs
- Supports fuzzy matching

### 6. Enhanced date parsing (lines 3156-3166)
Improve to support multiple date formats (YYYY-MM-DD, MM/DD/YYYY, etc.)

### 7. Enhanced auto-mapping in handleFileSelect (lines 3077-3087)
Add smart matching for Customer, Last PM, Next PM variations

### 8. Updated CSV template and instructions
Update to show Customer, Location, Last PM, Next PM as column names instead of IDs

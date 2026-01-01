# PM Automation System - Implementation Complete

## Overview
The PM (Preventive Maintenance) Automation System automatically generates work orders for assets based on their PM frequency and last maintenance date, ensuring compliance with maintenance schedules.

## Features

### 1. Automatic Work Order Generation
- **Checks every 6 hours** for assets due for PM
- **7-day look-ahead window** - generates work orders for assets due within 7 days
- **Overdue detection** - automatically flags overdue assets and creates urgent work orders
- **Duplicate prevention** - won't create duplicate work orders if one already exists

### 2. Smart Priority Assignment
- **Critical**: Overdue PMs (past due date)
- **High**: Due within 1 day
- **Medium**: Due within 3 days
- **Low**: Due within 7 days

### 3. PM Frequency Sources
The system uses PM frequency from multiple sources (in priority order):
1. **Equipment Model PM Frequency** (`equipment_models.pm_frequency_id` → `pm_frequencies.days`)
2. **Asset PM Schedule Type** (`assets.pm_schedule_type` with predefined intervals)
3. **Asset Custom Interval** (`assets.pm_interval_days`)

### 4. Automatic PM Date Updates
When a PM work order is completed:
- Updates `last_maintenance` to completion date
- Calculates `next_maintenance` based on PM frequency
- Updates `compliance_status` to 'compliant'
- Creates maintenance history record

## Database Requirements

### Required Work Order Type
The system requires a work order type with code **"PM"**. If it doesn't exist, create it:

```sql
INSERT INTO work_order_types (code, label, description, is_active, sort_order)
VALUES ('PM', 'Preventive Maintenance', 'Automated preventive maintenance work orders', true, 1)
ON CONFLICT (code) DO UPDATE SET label = 'Preventive Maintenance';
```

### Asset Fields Used
- `next_maintenance` - Date when PM is due
- `last_maintenance` - Date of last PM completion
- `auto_generate_wo` - Boolean flag to enable/disable auto-generation (default: true)
- `pm_interval_days` - Custom PM interval in days
- `pm_schedule_type` - Predefined schedule type (daily, weekly, monthly, etc.)
- `status` - Must be 'active' for auto-generation
- `model_id` - Links to equipment_models for PM frequency

### Equipment Model Fields
- `pm_frequency_id` - References `pm_frequencies.id`
- `pm_frequencies.days` - Number of days between PMs

## How It Works

### 1. Initialization
The system automatically initializes when any page loads:
- Checks for due PMs immediately
- Sets up periodic checks (every 6 hours)
- Runs in the background

### 2. PM Check Process
```
1. Query assets where:
   - auto_generate_wo = true
   - status = 'active'
   - next_maintenance <= (today + 7 days)
   - next_maintenance IS NOT NULL

2. Filter out assets that already have open PM work orders

3. For each asset needing PM:
   - Determine PM frequency (from model or asset settings)
   - Calculate priority based on due date
   - Generate work order with appropriate description
   - Update asset.pm_last_generated_at
   - Update compliance_status if overdue
```

### 3. Work Order Completion
When a PM work order is marked as completed:
```
1. Detect completion in handleUpdateWorkOrder()
2. Call PMAutomation.updatePMAfterWorkOrderCompletion()
3. Update asset:
   - last_maintenance = completion date
   - next_maintenance = completion date + PM frequency days
   - compliance_status = 'compliant'
4. Create maintenance history record
```

## Files Modified/Created

### New Files
- `js/pm-automation.js` - Core PM automation system

### Modified Files
- `main.js` - Integrated PM automation into work order completion handler
- `work-orders.html` - Added PM automation script
- `assets.html` - Added PM automation script

## Usage

### Automatic Operation
The system runs automatically - no manual intervention required. It will:
- Check for due PMs on page load
- Run periodic checks every 6 hours
- Generate work orders as needed
- Update PM dates when work orders are completed

### Manual Trigger
You can manually trigger a PM check from the browser console:
```javascript
PMAutomation.manualCheck();
```

### Check Status
View automation status:
```javascript
PMAutomation.getStatus();
// Returns: { isRunning, lastRunTime, isEnabled }
```

### Stop Automation
Stop the automation (if needed):
```javascript
PMAutomation.stop();
```

## Configuration

### Adjust Check Frequency
In `js/pm-automation.js`, modify the interval:
```javascript
// Current: 6 hours
this.checkInterval = setInterval(() => {
    this.checkForDuePMs();
}, 6 * 60 * 60 * 1000); // Change this value

// Example: Check every hour
}, 60 * 60 * 1000);
```

### Adjust Look-Ahead Window
Modify the look-ahead days:
```javascript
// Current: 7 days
lookAheadDate.setDate(lookAheadDate.getDate() + 7); // Change this number
```

## Compliance Tracking

The system automatically updates compliance status:
- **compliant**: PM completed on time
- **needs-attention**: PM due soon (within 7 days)
- **non-compliant**: PM overdue

## Troubleshooting

### Work Orders Not Being Generated
1. Check that assets have `auto_generate_wo = true`
2. Verify `next_maintenance` dates are set
3. Ensure assets have `status = 'active'`
4. Check browser console for errors
5. Verify PM work order type exists (code = 'PM')

### PM Dates Not Updating After Completion
1. Ensure work order type is 'PM' or 'preventive_maintenance'
2. Check that work order status is 'completed'
3. Verify asset has PM frequency configured
4. Check browser console for errors

### Duplicate Work Orders
The system prevents duplicates by checking for existing open PM work orders. If duplicates appear:
1. Check that work order status is correctly set
2. Verify the duplicate check query is working
3. Manually cancel duplicate work orders

## Future Enhancements

Potential improvements:
- Email notifications for overdue PMs
- Dashboard widget showing PM compliance
- PM schedule calendar view
- Bulk PM schedule updates
- PM templates with checklists
- Integration with external scheduling systems

## Testing

To test the system:
1. Create an asset with PM frequency
2. Set `next_maintenance` to today or within 7 days
3. Ensure `auto_generate_wo = true`
4. Wait for automatic check or trigger manually: `PMAutomation.manualCheck()`
5. Verify work order is created
6. Complete the work order
7. Verify asset PM dates are updated

## Support

For issues or questions:
- Check browser console for error messages
- Verify database schema matches requirements
- Ensure Supabase connection is active
- Review asset PM configuration

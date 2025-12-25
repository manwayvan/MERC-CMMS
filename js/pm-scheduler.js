// PM Scheduler - Preventive Maintenance Scheduling

const PM_SCHEDULES = {
    daily: { days: 1, label: 'Daily' },
    weekly: { days: 7, label: 'Weekly' },
    biweekly: { days: 14, label: 'Bi-weekly' },
    monthly: { days: 30, label: 'Monthly' },
    quarterly: { days: 90, label: 'Quarterly (90 days)' },
    semiannually: { days: 180, label: 'Semi-annually (180 days)' },
    annually: { days: 365, label: 'Annually (365 days)' },
    custom: { days: null, label: 'Custom Interval' }
};

// Calculate next PM date
function calculateNextPMDate(lastMaintenanceDate, scheduleType, customDays = null) {
    if (!lastMaintenanceDate) {
        return new Date();
    }

    const lastDate = new Date(lastMaintenanceDate);
    let daysToAdd;

    if (scheduleType === 'custom' && customDays) {
        daysToAdd = parseInt(customDays);
    } else if (PM_SCHEDULES[scheduleType]) {
        daysToAdd = PM_SCHEDULES[scheduleType].days;
    } else {
        daysToAdd = 30; // Default to monthly
    }

    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    return nextDate;
}

// Preview next PM dates
function previewPMDates(startDate, scheduleType, customDays = null, count = 5) {
    const dates = [];
    let currentDate = new Date(startDate);

    for (let i = 0; i < count; i++) {
        currentDate = calculateNextPMDate(currentDate, scheduleType, customDays);
        dates.push(new Date(currentDate));
    }

    return dates;
}

// Set PM schedule for asset
async function setPMSchedule(assetId, scheduleData) {
    try {
        console.log('📅 Setting PM schedule for asset:', assetId);

        const updateData = {
            pm_schedule_type: scheduleData.scheduleType,
            pm_interval_days: scheduleData.customDays || PM_SCHEDULES[scheduleData.scheduleType]?.days,
            auto_generate_wo: scheduleData.autoGenerateWO !== false,
            last_maintenance: scheduleData.lastMaintenance || new Date().toISOString()
        };

        // Calculate next maintenance date
        updateData.next_maintenance = calculateNextPMDate(
            updateData.last_maintenance,
            updateData.pm_schedule_type,
            updateData.pm_interval_days
        ).toISOString();

        const { data, error } = await supabaseClient
            .from('assets')
            .update(updateData)
            .eq('id', assetId)
            .select();

        if (error) throw error;

        console.log('✅ PM schedule set successfully');
        showToast('PM schedule updated successfully!', 'success');
        
        await loadAssets();
        return data[0];
    } catch (error) {
        console.error('❌ Error setting PM schedule:', error);
        showToast(`Failed to set PM schedule: ${error.message}`, 'error');
        throw error;
    }
}

// Update PM after work order completion
async function updatePMAfterCompletion(assetId, completionDate) {
    try {
        // Get current asset data
        const asset = assets.find(a => a.id === assetId);
        if (!asset) throw new Error('Asset not found');

        const updateData = {
            last_maintenance: completionDate,
            compliance_status: 'compliant'
        };

        // Calculate next maintenance
        if (asset.pm_schedule_type) {
            updateData.next_maintenance = calculateNextPMDate(
                completionDate,
                asset.pm_schedule_type,
                asset.pm_interval_days
            ).toISOString();
        }

        const { data, error } = await supabaseClient
            .from('assets')
            .update(updateData)
            .eq('id', assetId)
            .select();

        if (error) throw error;

        console.log('✅ PM dates updated after completion');
        await loadAssets();
        return data[0];
    } catch (error) {
        console.error('❌ Error updating PM after completion:', error);
        throw error;
    }
}

// Get PM schedule info for display
function getPMScheduleInfo(asset) {
    if (!asset.pm_schedule_type) {
        return { text: 'Not Scheduled', color: 'gray' };
    }

    const schedule = PM_SCHEDULES[asset.pm_schedule_type];
    let text = schedule ? schedule.label : 'Custom';
    
    if (asset.pm_schedule_type === 'custom' && asset.pm_interval_days) {
        text = `Every ${asset.pm_interval_days} days`;
    }

    return { text, color: 'blue' };
}
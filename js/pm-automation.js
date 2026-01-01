// PM Automation System - Automatic Work Order Generation
// Generates work orders based on PM frequency and last maintenance date

const PMAutomation = {
    supabaseClient: null,
    isRunning: false,
    lastRunTime: null,
    checkInterval: null,

    init() {
        // Get Supabase client
        if (window.supabaseClient) {
            this.supabaseClient = window.supabaseClient;
        } else if (window.sharedSupabaseClient) {
            this.supabaseClient = window.sharedSupabaseClient;
        } else if (typeof supabase !== 'undefined' && typeof CONFIG !== 'undefined') {
            this.supabaseClient = supabase.createClient(
                CONFIG.SUPABASE_URL,
                CONFIG.SUPABASE_ANON_KEY
            );
        }

        // Run check on initialization
        if (this.supabaseClient) {
            this.checkForDuePMs();
            
            // Set up periodic checks (every 6 hours)
            this.checkInterval = setInterval(() => {
                this.checkForDuePMs();
            }, 6 * 60 * 60 * 1000); // 6 hours in milliseconds
        }
    },

    async checkForDuePMs() {
        if (this.isRunning) {
            console.log('PM automation check already running, skipping...');
            return;
        }

        this.isRunning = true;
        console.log('🔍 Checking for due PMs...');

        try {
            // Get current date
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            // Look ahead window (7 days)
            const lookAheadDate = new Date(today);
            lookAheadDate.setDate(lookAheadDate.getDate() + 7);

            // Fetch assets that need PM work orders
            // Include assets where:
            // 1. next_maintenance is within 7 days OR overdue
            // 2. auto_generate_wo is true
            // 3. status is 'active'
            // 4. No existing open PM work order for this asset
            const { data: assets, error: assetsError } = await this.supabaseClient
                .from('assets')
                .select(`
                    id,
                    name,
                    next_maintenance,
                    last_maintenance,
                    pm_interval_days,
                    pm_schedule_type,
                    auto_generate_wo,
                    status,
                    model_id,
                    equipment_models:model_id (
                        id,
                        name,
                        pm_frequency_id,
                        pm_frequencies:pm_frequency_id (
                            id,
                            name,
                            days
                        )
                    )
                `)
                .eq('auto_generate_wo', true)
                .eq('status', 'active')
                .not('next_maintenance', 'is', null)
                .lte('next_maintenance', lookAheadDate.toISOString());

            if (assetsError) {
                throw assetsError;
            }

            if (!assets || assets.length === 0) {
                console.log('✅ No assets due for PM');
                this.lastRunTime = new Date();
                this.isRunning = false;
                return;
            }

            console.log(`📋 Found ${assets.length} asset(s) due for PM`);

            // Check for existing open PM work orders (check both 'PM' and 'preventive_maintenance' types)
            const assetIds = assets.map(a => a.id);
            const { data: existingWOs, error: woError } = await this.supabaseClient
                .from('work_orders')
                .select('asset_id, status')
                .in('asset_id', assetIds)
                .in('type', ['PM', 'preventive_maintenance'])
                .in('status', ['open', 'in-progress']);

            if (woError) {
                console.error('Error checking existing work orders:', woError);
            }

            const assetsWithOpenWOs = new Set(
                (existingWOs || []).map(wo => wo.asset_id)
            );

            // Filter out assets that already have open PM work orders
            const assetsNeedingPM = assets.filter(asset => 
                !assetsWithOpenWOs.has(asset.id)
            );

            console.log(`📝 Generating work orders for ${assetsNeedingPM.length} asset(s)`);

            // Generate work orders
            let generated = 0;
            let errors = 0;

            for (const asset of assetsNeedingPM) {
                try {
                    await this.generatePMWorkOrder(asset, today);
                    generated++;
                } catch (error) {
                    console.error(`Error generating WO for asset ${asset.id}:`, error);
                    errors++;
                }
            }

            this.lastRunTime = new Date();
            console.log(`✅ PM automation complete: ${generated} work orders generated, ${errors} errors`);

            // Show notification if work orders were generated
            if (generated > 0 && typeof showToast === 'function') {
                showToast(`${generated} PM work order(s) generated automatically`, 'success');
            }

        } catch (error) {
            console.error('❌ Error in PM automation check:', error);
            if (typeof showToast === 'function') {
                showToast('Error checking for due PMs: ' + error.message, 'error');
            }
        } finally {
            this.isRunning = false;
        }
    },

    async generatePMWorkOrder(asset, dueDate) {
        try {
            // Determine PM frequency days
            let pmDays = asset.pm_interval_days;
            
            // If asset has model with PM frequency, use that
            if (asset.equipment_models?.pm_frequencies?.days) {
                pmDays = asset.equipment_models.pm_frequencies.days;
            } else if (asset.pm_schedule_type) {
                // Fall back to schedule type mapping
                const scheduleDays = {
                    'daily': 1,
                    'weekly': 7,
                    'biweekly': 14,
                    'monthly': 30,
                    'quarterly': 90,
                    'semiannually': 180,
                    'annually': 365
                };
                pmDays = scheduleDays[asset.pm_schedule_type] || pmDays || 90;
            }

            // Calculate due date
            const nextMaintenance = new Date(asset.next_maintenance);
            const isOverdue = nextMaintenance < dueDate;
            
            // Set due date to today if overdue, otherwise use next_maintenance date
            const woDueDate = isOverdue ? dueDate : nextMaintenance;

            // Determine priority based on due date
            let priority = 'medium';
            const daysUntilDue = Math.ceil((woDueDate - dueDate) / (1000 * 60 * 60 * 24));
            
            if (isOverdue) {
                priority = 'critical';
            } else if (daysUntilDue <= 1) {
                priority = 'high';
            } else if (daysUntilDue <= 3) {
                priority = 'medium';
            } else {
                priority = 'low';
            }

            // Get PM work order type code (try 'PM' first, then 'preventive_maintenance')
            let workOrderType = 'PM';
            let pmType = null;
            
            const { data: pmTypePM, error: typeErrorPM } = await this.supabaseClient
                .from('work_order_types')
                .select('code')
                .eq('code', 'PM')
                .single();

            if (!typeErrorPM && pmTypePM) {
                workOrderType = 'PM';
                pmType = pmTypePM;
            } else {
                // Try preventive_maintenance
                const { data: pmTypePM2, error: typeErrorPM2 } = await this.supabaseClient
                    .from('work_order_types')
                    .select('code')
                    .eq('code', 'preventive_maintenance')
                    .single();

                if (!typeErrorPM2 && pmTypePM2) {
                    workOrderType = 'preventive_maintenance';
                    pmType = pmTypePM2;
                } else {
                    throw new Error('PM work order type not found. Please create a work order type with code "PM" or "preventive_maintenance"');
                }
            }

            // Create work order description
            const frequencyName = asset.equipment_models?.pm_frequencies?.name || 
                                 `${pmDays} days` || 
                                 'Scheduled';
            
            const description = `Preventive Maintenance - ${asset.name || 'Asset'}\n` +
                              `PM Frequency: ${frequencyName}\n` +
                              `Last PM: ${asset.last_maintenance ? new Date(asset.last_maintenance).toLocaleDateString() : 'Never'}\n` +
                              (isOverdue ? '⚠️ OVERDUE - Immediate attention required' : '');

            // Create work order
            const { data: workOrder, error: woError } = await this.supabaseClient
                .from('work_orders')
                .insert([{
                    asset_id: asset.id,
                    type: workOrderType,
                    priority: priority,
                    status: 'open',
                    due_date: woDueDate.toISOString(),
                    description: description,
                    created_date: new Date().toISOString()
                }])
                .select()
                .single();

            if (woError) {
                throw woError;
            }

            // Update asset's pm_last_generated_at
            await this.supabaseClient
                .from('assets')
                .update({ 
                    pm_last_generated_at: new Date().toISOString(),
                    compliance_status: isOverdue ? 'non-compliant' : 'needs-attention'
                })
                .eq('id', asset.id);

            console.log(`✅ Generated PM work order ${workOrder.id} for asset ${asset.id}`);
            return workOrder;

        } catch (error) {
            console.error(`❌ Error generating PM work order for asset ${asset.id}:`, error);
            throw error;
        }
    },

    async updatePMAfterWorkOrderCompletion(workOrderId, completionDate) {
        try {
            // Get work order details
            const { data: workOrder, error: woError } = await this.supabaseClient
                .from('work_orders')
                .select('asset_id, type, status')
                .eq('id', workOrderId)
                .single();

            if (woError || !workOrder) {
                throw new Error('Work order not found');
            }

            // Only update if it's a PM work order and completed
            if ((workOrder.type !== 'PM' && workOrder.type !== 'preventive_maintenance') || workOrder.status !== 'completed') {
                return;
            }

            // Get asset details
            const { data: asset, error: assetError } = await this.supabaseClient
                .from('assets')
                .select(`
                    id,
                    pm_interval_days,
                    pm_schedule_type,
                    model_id,
                    equipment_models:model_id (
                        pm_frequency_id,
                        pm_frequencies:pm_frequency_id (
                            days
                        )
                    )
                `)
                .eq('id', workOrder.asset_id)
                .single();

            if (assetError || !asset) {
                throw new Error('Asset not found');
            }

            // Determine PM frequency days
            let pmDays = asset.pm_interval_days;
            
            if (asset.equipment_models?.pm_frequencies?.days) {
                pmDays = asset.equipment_models.pm_frequencies.days;
            } else if (asset.pm_schedule_type) {
                const scheduleDays = {
                    'daily': 1,
                    'weekly': 7,
                    'biweekly': 14,
                    'monthly': 30,
                    'quarterly': 90,
                    'semiannually': 180,
                    'annually': 365
                };
                pmDays = scheduleDays[asset.pm_schedule_type] || pmDays || 90;
            }

            // Calculate next maintenance date
            const completion = new Date(completionDate);
            const nextMaintenance = new Date(completion);
            nextMaintenance.setDate(nextMaintenance.getDate() + (pmDays || 90));

            // Update asset
            const { error: updateError } = await this.supabaseClient
                .from('assets')
                .update({
                    last_maintenance: completionDate,
                    next_maintenance: nextMaintenance.toISOString(),
                    compliance_status: 'compliant'
                })
                .eq('id', workOrder.asset_id);

            if (updateError) {
                throw updateError;
            }

            // Create maintenance history record
            await this.supabaseClient
                .from('asset_maintenance_history')
                .insert([{
                    asset_id: workOrder.asset_id,
                    maintenance_date: completionDate,
                    maintenance_type: 'preventive',
                    next_due_date: nextMaintenance.toISOString()
                }]);

            console.log(`✅ Updated PM schedule for asset ${workOrder.asset_id}`);
            
            // Refresh assets if loadAssets function exists
            if (typeof loadAssets === 'function') {
                await loadAssets();
            }

        } catch (error) {
            console.error('❌ Error updating PM after work order completion:', error);
            throw error;
        }
    },

    // Manual trigger for testing
    async manualCheck() {
        console.log('🔄 Manual PM check triggered');
        await this.checkForDuePMs();
    },

    // Get status info
    getStatus() {
        return {
            isRunning: this.isRunning,
            lastRunTime: this.lastRunTime,
            isEnabled: this.checkInterval !== null
        };
    },

    // Stop automation
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
            console.log('⏹️ PM automation stopped');
        }
    }
};

// Expose globally
window.PMAutomation = PMAutomation;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        PMAutomation.init();
    });
} else {
    PMAutomation.init();
}

// Enhanced PM Work Order Auto-Generator
// Runs on page load and can be triggered manually

const PMAutoGenerator = {
    supabaseClient: null,
    isRunning: false,
    lastRunTime: null,

    async init() {
        // Get Supabase client
        if (typeof window.supabase !== 'undefined' && typeof CONFIG !== 'undefined') {
            this.supabaseClient = window.supabase.createClient(
                CONFIG.SUPABASE_URL || 'https://hmdemsbqiqlqcggwblvl.supabase.co',
                CONFIG.SUPABASE_ANON_KEY || 'sb_publishable_Z9oNxTGDCCz3EZnh6NqySg_QzF6amCN'
            );
        } else if (window.sharedSupabaseClient) {
            this.supabaseClient = window.sharedSupabaseClient;
        } else if (typeof supabaseClient !== 'undefined') {
            this.supabaseClient = supabaseClient;
        }

        // Run on page load
        if (this.supabaseClient) {
            // Wait a bit for page to fully load
            setTimeout(() => {
                this.checkAndGenerateWorkOrders();
            }, 2000);
        }
    },

    async checkAndGenerateWorkOrders() {
        if (this.isRunning) {
            console.log('⏸️ PM generator already running, skipping...');
            return;
        }

        this.isRunning = true;
        try {
            console.log('🔍 Checking assets for PM due dates...');
            
            // Load all assets with PM schedules
            const { data: assets, error: assetsError } = await this.supabaseClient
                .from('assets')
                .select('id, name, next_maintenance, auto_generate_wo, pm_schedule_type, pm_interval_days')
                .not('next_maintenance', 'is', null)
                .eq('auto_generate_wo', true)
                .eq('status', 'active');

            if (assetsError) throw assetsError;

            if (!assets || assets.length === 0) {
                console.log('ℹ️ No assets with PM schedules found');
                this.isRunning = false;
                return { generated: 0, overdue: 0 };
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const sevenDaysFromNow = new Date(today);
            sevenDaysFromNow.setDate(today.getDate() + 7);

            let woGeneratedCount = 0;
            let overdueCount = 0;

            for (const asset of assets) {
                if (!asset.next_maintenance) continue;

                const nextMaintenance = new Date(asset.next_maintenance);
                nextMaintenance.setHours(0, 0, 0, 0);
                const daysUntil = Math.ceil((nextMaintenance - today) / (1000 * 60 * 60 * 24));

                // Check if work order already exists for this asset
                const hasOpenWO = await this.hasOpenWorkOrder(asset.id);

                // OVERDUE: Generate urgent work order
                if (daysUntil < 0 && !hasOpenWO) {
                    await this.generateUrgentWorkOrder(asset, Math.abs(daysUntil));
                    woGeneratedCount++;
                    overdueCount++;
                }
                // DUE SOON: Generate preventive work order (7 days advance)
                else if (daysUntil >= 0 && daysUntil <= 7 && !hasOpenWO) {
                    await this.generatePreventiveWorkOrder(asset);
                    woGeneratedCount++;
                }
            }

            this.lastRunTime = new Date();

            if (woGeneratedCount > 0) {
                console.log(`✅ Generated ${woGeneratedCount} work orders (${overdueCount} urgent)`);
                if (typeof showToast === 'function') {
                    showToast(`Auto-generated ${woGeneratedCount} PM work order(s)`, 'info');
                }
            } else {
                console.log('ℹ️ No work orders needed at this time');
            }

            return { generated: woGeneratedCount, overdue: overdueCount };
        } catch (error) {
            console.error('❌ Error checking/generating work orders:', error);
            return { generated: 0, overdue: 0 };
        } finally {
            this.isRunning = false;
        }
    },

    async hasOpenWorkOrder(assetId) {
        try {
            const { data, error } = await this.supabaseClient
                .from('work_orders')
                .select('id')
                .eq('asset_id', assetId)
                .eq('type', 'preventive_maintenance')
                .in('status', ['open', 'in-progress'])
                .limit(1);

            if (error) throw error;

            return data && data.length > 0;
        } catch (error) {
            console.error('Error checking for open work orders:', error);
            return false;
        }
    },

    async generateUrgentWorkOrder(asset, daysOverdue) {
        try {
            const woData = {
                asset_id: asset.id,
                type: 'preventive_maintenance',
                priority: 'critical',
                status: 'open',
                due_date: new Date().toISOString(),
                description: `URGENT: Preventive maintenance OVERDUE by ${daysOverdue} day(s) for ${asset.name || asset.id}. Auto-generated due to missed PM schedule.`,
                estimated_hours: 4
            };

            const { data, error } = await this.supabaseClient
                .from('work_orders')
                .insert([woData])
                .select();

            if (error) throw error;

            // Update asset compliance status
            await this.supabaseClient
                .from('assets')
                .update({ compliance_status: 'non-compliant' })
                .eq('id', asset.id);

            console.log(`🚨 Generated URGENT work order for ${asset.name || asset.id}`);
            return data[0];
        } catch (error) {
            console.error('Error generating urgent work order:', error);
            throw error;
        }
    },

    async generatePreventiveWorkOrder(asset) {
        try {
            const woData = {
                asset_id: asset.id,
                type: 'preventive_maintenance',
                priority: 'medium',
                status: 'open',
                due_date: asset.next_maintenance,
                description: `Scheduled preventive maintenance for ${asset.name || asset.id}. Auto-generated based on PM schedule.`,
                estimated_hours: 4
            };

            const { data, error } = await this.supabaseClient
                .from('work_orders')
                .insert([woData])
                .select();

            if (error) throw error;

            // Update asset status
            await this.supabaseClient
                .from('assets')
                .update({ compliance_status: 'needs-attention' })
                .eq('id', asset.id);

            // Mark that we generated a work order for this asset
            await this.supabaseClient
                .from('assets')
                .update({ pm_last_generated_at: new Date().toISOString() })
                .eq('id', asset.id);

            console.log(`📋 Generated PM work order for ${asset.name || asset.id}`);
            return data[0];
        } catch (error) {
            console.error('Error generating preventive work order:', error);
            throw error;
        }
    }
};

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        PMAutoGenerator.init();
    });
} else {
    PMAutoGenerator.init();
}


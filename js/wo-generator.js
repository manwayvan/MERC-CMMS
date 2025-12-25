// Work Order Generator - Automatic PM Work Order Generation

let generatedWOIds = new Set();

// Check all assets and generate work orders as needed
async function checkAndGenerateWorkOrders() {
    try {
        console.log('🔍 Checking assets for PM due dates...');
        
        const today = new Date();
        const sevenDaysFromNow = new Date(today);
        sevenDaysFromNow.setDate(today.getDate() + 7);

        let woGeneratedCount = 0;
        let overdueCount = 0;

        for (const asset of assets) {
            if (!asset.next_maintenance || !asset.auto_generate_wo) continue;

            const nextMaintenance = new Date(asset.next_maintenance);
            const daysUntil = calculateDaysUntil(asset.next_maintenance);

            // Check if work order already exists for this asset
            const hasOpenWO = await hasOpenWorkOrder(asset.id);

            // OVERDUE: Generate urgent work order
            if (daysUntil < 0 && !hasOpenWO) {
                await generateUrgentWorkOrder(asset);
                woGeneratedCount++;
                overdueCount++;
            }
            // DUE SOON: Generate preventive work order (7 days advance)
            else if (daysUntil >= 0 && daysUntil <= 7 && !hasOpenWO) {
                await generatePreventiveWorkOrder(asset);
                woGeneratedCount++;
            }
        }

        if (woGeneratedCount > 0) {
            console.log(`✅ Generated ${woGeneratedCount} work orders (${overdueCount} urgent)`);
            showToast(`Auto-generated ${woGeneratedCount} work orders`, 'info');
        }

        return { generated: woGeneratedCount, overdue: overdueCount };
    } catch (error) {
        console.error('❌ Error checking/generating work orders:', error);
        return { generated: 0, overdue: 0 };
    }
}

// Check if asset has open work order
async function hasOpenWorkOrder(assetId) {
    try {
        const { data, error } = await supabaseClient
            .from('work_orders')
            .select('id')
            .eq('asset_id', assetId)
            .in('status', ['open', 'in-progress'])
            .limit(1);

        if (error) throw error;

        return data && data.length > 0;
    } catch (error) {
        console.error('Error checking for open work orders:', error);
        return false;
    }
}

// Generate urgent work order for overdue PM
async function generateUrgentWorkOrder(asset) {
    try {
        const daysOverdue = Math.abs(calculateDaysUntil(asset.next_maintenance));
        
        const woData = {
            asset_id: asset.id,
            type: 'preventive_maintenance',
            priority: 'critical',
            status: 'open',
            due_date: new Date().toISOString(),
            description: `URGENT: Preventive maintenance OVERDUE by ${daysOverdue} days for ${asset.name}. Auto-generated due to missed PM schedule.`,
            estimated_hours: 4,
            auto_generated: true
        };

        const { data, error } = await supabaseClient
            .from('work_orders')
            .insert([woData])
            .select();

        if (error) throw error;

        // Update asset compliance status
        await supabaseClient
            .from('assets')
            .update({ compliance_status: 'non-compliant' })
            .eq('id', asset.id);

        console.log(`🚨 Generated URGENT work order for ${asset.name}`);
        return data[0];
    } catch (error) {
        console.error('Error generating urgent work order:', error);
        throw error;
    }
}

// Generate preventive work order (advance notice)
async function generatePreventiveWorkOrder(asset) {
    try {
        const woData = {
            asset_id: asset.id,
            type: 'preventive_maintenance',
            priority: 'medium',
            status: 'open',
            due_date: asset.next_maintenance,
            description: `Scheduled preventive maintenance for ${asset.name}. Auto-generated based on PM schedule.`,
            estimated_hours: 4,
            auto_generated: true
        };

        const { data, error } = await supabaseClient
            .from('work_orders')
            .insert([woData])
            .select();

        if (error) throw error;

        // Update asset status
        await supabaseClient
            .from('assets')
            .update({ compliance_status: 'needs-attention' })
            .eq('id', asset.id);

        console.log(`📋 Generated PM work order for ${asset.name}`);
        return data[0];
    } catch (error) {
        console.error('Error generating preventive work order:', error);
        throw error;
    }
}

// Get work orders for asset
async function getWorkOrdersForAsset(assetId) {
    try {
        const { data, error } = await supabaseClient
            .from('work_orders')
            .select('*')
            .eq('asset_id', assetId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('Error loading work orders:', error);
        return [];
    }
}

// Mark work order as complete and update asset PM dates
async function completeWorkOrder(workOrderId, completionNotes) {
    try {
        // Get work order details
        const { data: wo, error: woError } = await supabaseClient
            .from('work_orders')
            .select('*')
            .eq('id', workOrderId)
            .single();

        if (woError) throw woError;

        // Update work order
        const { error: updateError } = await supabaseClient
            .from('work_orders')
            .update({
                status: 'completed',
                completed_date: new Date().toISOString(),
                completion_notes: completionNotes
            })
            .eq('id', workOrderId);

        if (updateError) throw updateError;

        // Update asset PM dates
        await updatePMAfterCompletion(wo.asset_id, new Date().toISOString());

        console.log('✅ Work order completed and asset PM updated');
        showToast('Work order completed successfully!', 'success');
    } catch (error) {
        console.error('Error completing work order:', error);
        showToast(`Failed to complete work order: ${error.message}`, 'error');
        throw error;
    }
}
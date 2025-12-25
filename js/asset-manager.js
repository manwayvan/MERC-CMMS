// Asset Manager - Core CRUD Operations

let assets = [];
let customers = [];
let locations = [];
let workOrders = [];

// Load all assets from Supabase
async function loadAssets() {
    try {
        console.log('📡 Loading assets from Supabase...');
        
        const { data, error } = await supabaseClient
            .from('assets')
            .select(`
                *,
                customers(id, name, customer_id),
                locations(id, name, customer_id)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        assets = data || [];
        console.log(`✅ Loaded ${assets.length} assets`);
        
        return assets;
    } catch (error) {
        console.error('❌ Error loading assets:', error);
        showToast(`Failed to load assets: ${error.message}`, 'error');
        return [];
    }
}

// Load customers for dropdown
async function loadCustomers() {
    try {
        const { data, error } = await supabaseClient
            .from('customers')
            .select('id, name, customer_id')
            .eq('status', 'active')
            .order('name');

        if (error) throw error;

        customers = data || [];
        return customers;
    } catch (error) {
        console.error('❌ Error loading customers:', error);
        return [];
    }
}

// Load locations for dropdown
async function loadLocations(customerId = null) {
    try {
        let query = supabaseClient
            .from('locations')
            .select('id, name, customer_id')
            .eq('status', 'active')
            .order('name');

        if (customerId) {
            query = query.eq('customer_id', customerId);
        }

        const { data, error } = await query;

        if (error) throw error;

        locations = data || [];
        return locations;
    } catch (error) {
        console.error('❌ Error loading locations:', error);
        return [];
    }
}

// Add new asset
async function addAsset(assetData) {
    try {
        console.log('➕ Adding asset:', assetData.name);

        const { data, error } = await supabaseClient
            .from('assets')
            .insert([assetData])
            .select();

        if (error) throw error;

        console.log('✅ Asset added successfully');
        showToast('Asset added successfully!', 'success');
        
        await loadAssets();
        return data[0];
    } catch (error) {
        console.error('❌ Error adding asset:', error);
        showToast(`Failed to add asset: ${error.message}`, 'error');
        throw error;
    }
}

// Update asset
async function updateAsset(assetId, assetData) {
    try {
        console.log('🔄 Updating asset:', assetId);

        const { data, error } = await supabaseClient
            .from('assets')
            .update(assetData)
            .eq('id', assetId)
            .select();

        if (error) throw error;

        console.log('✅ Asset updated successfully');
        showToast('Asset updated successfully!', 'success');
        
        await loadAssets();
        return data[0];
    } catch (error) {
        console.error('❌ Error updating asset:', error);
        showToast(`Failed to update asset: ${error.message}`, 'error');
        throw error;
    }
}

// Delete asset
async function deleteAsset(assetId) {
    try {
        console.log('🗑️ Deleting asset:', assetId);

        const { error } = await supabaseClient
            .from('assets')
            .delete()
            .eq('id', assetId);

        if (error) throw error;

        console.log('✅ Asset deleted successfully');
        showToast('Asset deleted successfully!', 'success');
        
        await loadAssets();
    } catch (error) {
        console.error('❌ Error deleting asset:', error);
        showToast(`Failed to delete asset: ${error.message}`, 'error');
        throw error;
    }
}

// Search assets
function searchAssets(searchTerm) {
    if (!searchTerm) return assets;

    const term = searchTerm.toLowerCase();
    return assets.filter(asset => 
        asset.name?.toLowerCase().includes(term) ||
        asset.id?.toLowerCase().includes(term) ||
        asset.serial_number?.toLowerCase().includes(term) ||
        asset.manufacturer?.toLowerCase().includes(term) ||
        asset.model?.toLowerCase().includes(term)
    );
}

// Filter assets
function filterAssets(filters) {
    let filtered = [...assets];

    if (filters.category) {
        filtered = filtered.filter(a => a.category === filters.category);
    }

    if (filters.status) {
        filtered = filtered.filter(a => a.status === filters.status);
    }

    if (filters.customer_id) {
        filtered = filtered.filter(a => a.customer_id === filters.customer_id);
    }

    if (filters.location_id) {
        filtered = filtered.filter(a => a.location_id === filters.location_id);
    }

    if (filters.compliance) {
        filtered = filtered.filter(a => {
            const status = getComplianceStatus(a.next_maintenance);
            return status.status === filters.compliance;
        });
    }

    return filtered;
}

// Export assets to CSV
function exportAssetsToCSV() {
    try {
        const headers = [
            'Asset ID', 'Name', 'Category', 'Status', 'Serial Number',
            'Manufacturer', 'Model', 'Customer', 'Location',
            'Purchase Date', 'Purchase Cost', 'Warranty Expiry',
            'Last Maintenance', 'Next Maintenance', 'PM Schedule',
            'Compliance Status'
        ];

        const rows = assets.map(asset => {
            const compliance = getComplianceStatus(asset.next_maintenance);
            return [
                asset.id || '',
                asset.name || '',
                asset.category || '',
                asset.status || '',
                asset.serial_number || '',
                asset.manufacturer || '',
                asset.model || '',
                asset.customers?.name || '',
                asset.locations?.name || '',
                formatDate(asset.purchase_date),
                asset.purchase_cost || '',
                formatDate(asset.warranty_expiry),
                formatDate(asset.last_maintenance),
                formatDate(asset.next_maintenance),
                asset.pm_schedule_type || '',
                compliance.text
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        const timestamp = new Date().toISOString().split('T')[0];
        link.download = `assets_export_${timestamp}.csv`;
        link.click();

        showToast(`Exported ${assets.length} assets successfully!`, 'success');
    } catch (error) {
        console.error('Export error:', error);
        showToast(`Export failed: ${error.message}`, 'error');
    }
}
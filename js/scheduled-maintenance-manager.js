// Scheduled Maintenance Manager - Bulk PM Scheduling
const ScheduledMaintenanceManager = {
    supabaseClient: null,
    filteredAssets: [],
    selectedAssetIds: new Set(),
    customers: [],
    locations: [],
    equipmentTypes: [],

    async init() {
        // Get Supabase client
        if (window.sharedSupabaseClient) {
            this.supabaseClient = window.sharedSupabaseClient;
        } else if (window.supabaseClient) {
            this.supabaseClient = window.supabaseClient;
        } else if (typeof supabase !== 'undefined' && typeof CONFIG !== 'undefined') {
            this.supabaseClient = supabase.createClient(
                CONFIG.SUPABASE_URL,
                CONFIG.SUPABASE_ANON_KEY
            );
        }

        await this.loadReferenceData();
    },

    async loadReferenceData() {
        if (!this.supabaseClient) return;

        try {
            // Load customers
            const { data: customersData } = await this.supabaseClient
                .from('customers')
                .select('id, name')
                .eq('status', 'active')
                .order('name');
            this.customers = customersData || [];

            // Load locations
            const { data: locationsData } = await this.supabaseClient
                .from('locations')
                .select('id, name, customer_id')
                .eq('status', 'active')
                .order('name');
            this.locations = locationsData || [];

            // Load equipment types
            const { data: typesData } = await this.supabaseClient
                .from('equipment_types')
                .select('id, name')
                .is('deleted_at', null)
                .order('name');
            this.equipmentTypes = typesData || [];

            this.populateFilters();
        } catch (error) {
            console.error('Error loading reference data:', error);
        }
    },

    populateFilters() {
        // Populate customer filter
        const customerSelect = document.getElementById('sm-customer-filter');
        if (customerSelect) {
            customerSelect.innerHTML = '<option value="">All Customers</option>';
            this.customers.forEach(customer => {
                const option = document.createElement('option');
                option.value = customer.id;
                option.textContent = customer.name;
                customerSelect.appendChild(option);
            });
            
            // Update locations when customer changes
            customerSelect.addEventListener('change', () => {
                this.updateLocationFilter();
            });
        }

        // Populate location filter (initially all)
        this.updateLocationFilter();

        // Populate equipment type filter
        const typeSelect = document.getElementById('sm-type-filter');
        if (typeSelect) {
            typeSelect.innerHTML = '<option value="">All Types</option>';
            this.equipmentTypes.forEach(type => {
                const option = document.createElement('option');
                option.value = type.id;
                option.textContent = type.name;
                typeSelect.appendChild(option);
            });
        }

        // Update next PM dates when Last PM Date changes
        const lastPMDateInput = document.getElementById('sm-last-pm-date');
        if (lastPMDateInput) {
            lastPMDateInput.addEventListener('change', () => {
                this.renderAssetsList();
            });
        }
    },

    updateLocationFilter() {
        const customerId = document.getElementById('sm-customer-filter')?.value;
        const locationSelect = document.getElementById('sm-location-filter');
        
        if (!locationSelect) return;

        locationSelect.innerHTML = '<option value="">All Locations</option>';
        
        const filteredLocations = customerId 
            ? this.locations.filter(loc => loc.customer_id === customerId)
            : this.locations;
        
        filteredLocations.forEach(location => {
            const option = document.createElement('option');
            option.value = location.id;
            option.textContent = location.name;
            locationSelect.appendChild(option);
        });
    },

    async loadFilteredAssets() {
        if (!this.supabaseClient) {
            this.showToast('Database connection not available', 'error');
            return;
        }

        try {
            const customerId = document.getElementById('sm-customer-filter')?.value;
            const typeId = document.getElementById('sm-type-filter')?.value;
            const status = document.getElementById('sm-status-filter')?.value;
            const locationId = document.getElementById('sm-location-filter')?.value;

            // Build base query
            let query = this.supabaseClient
                .from('assets')
                .select(`
                    id,
                    name,
                    status,
                    last_maintenance,
                    next_maintenance,
                    pm_frequency_id,
                    pm_interval_days,
                    model_id,
                    customer_id,
                    location_id,
                    equipment_models:model_id (
                        id,
                        name,
                        pm_frequency_id,
                        make_id,
                        pm_frequencies:pm_frequency_id (
                            id,
                            name,
                            days
                        ),
                        equipment_makes:make_id (
                            id,
                            name,
                            type_id,
                            equipment_types:type_id (
                                id,
                                name
                            )
                        )
                    )
                `)
                .is('deleted_at', null);

            // Apply filters
            if (customerId) {
                query = query.eq('customer_id', customerId);
            }
            if (locationId) {
                query = query.eq('location_id', locationId);
            }
            if (status) {
                query = query.eq('status', status);
            }

            const { data: assets, error } = await query.order('name');

            // Filter by equipment type in JavaScript (nested query doesn't work well with Supabase)
            let filteredAssets = assets || [];
            if (typeId && filteredAssets.length > 0) {
                // Need to load models with makes and types separately
                const modelIds = [...new Set(filteredAssets.map(a => a.model_id).filter(Boolean))];
                if (modelIds.length > 0) {
                    const { data: models } = await this.supabaseClient
                        .from('equipment_models')
                        .select(`
                            id,
                            make_id,
                            equipment_makes:make_id (
                                id,
                                type_id
                            )
                        `)
                        .in('id', modelIds);
                    
                    const modelsWithType = new Set();
                    if (models) {
                        models.forEach(model => {
                            if (model.equipment_makes?.type_id === typeId) {
                                modelsWithType.add(model.id);
                            }
                        });
                    }
                    
                    filteredAssets = filteredAssets.filter(asset => 
                        !asset.model_id || modelsWithType.has(asset.model_id)
                    );
                } else {
                    filteredAssets = [];
                }
            }

            if (error) throw error;

            this.filteredAssets = filteredAssets;
            this.selectedAssetIds.clear();
            this.renderAssetsList();

            if (this.filteredAssets.length === 0) {
                this.showToast('No assets found matching the filters', 'warning');
            }
        } catch (error) {
            console.error('Error loading filtered assets:', error);
            this.showToast(`Error loading assets: ${error.message}`, 'error');
        }
    },

    renderAssetsList() {
        const tbody = document.getElementById('sm-assets-list');
        const countSpan = document.getElementById('sm-asset-count');
        
        if (!tbody) return;

        if (this.filteredAssets.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-4 py-8 text-center text-slate-500">
                        <p>No assets found. Apply filters to see assets.</p>
                    </td>
                </tr>
            `;
            if (countSpan) countSpan.textContent = '0';
            return;
        }

        const lastPMDate = document.getElementById('sm-last-pm-date')?.value;

        tbody.innerHTML = this.filteredAssets.map(asset => {
            const isSelected = this.selectedAssetIds.has(asset.id);
            const pmFrequency = asset.equipment_models?.pm_frequencies || 
                               (asset.pm_interval_days ? { days: asset.pm_interval_days, name: `${asset.pm_interval_days} days` } : null);
            const pmDays = pmFrequency?.days || 365; // Default to Annual if not set
            const pmName = pmFrequency?.name || 'Annual (Default)';
            const equipmentType = asset.equipment_models?.equipment_makes?.equipment_types?.name || 'N/A';
            
            // Calculate next PM date
            let nextPMDate = 'N/A';
            if (lastPMDate) {
                const lastDate = new Date(lastPMDate);
                const nextDate = new Date(lastDate);
                nextDate.setDate(nextDate.getDate() + pmDays);
                nextPMDate = nextDate.toLocaleDateString();
            }

            const currentLastPM = asset.last_maintenance 
                ? new Date(asset.last_maintenance).toLocaleDateString() 
                : 'Never';

            return `
                <tr class="hover:bg-slate-50">
                    <td class="px-4 py-3">
                        <input type="checkbox" 
                               class="asset-checkbox rounded border-slate-300" 
                               data-asset-id="${asset.id}"
                               ${isSelected ? 'checked' : ''}
                               onchange="ScheduledMaintenanceManager.toggleAssetSelection('${asset.id}', this.checked)">
                    </td>
                    <td class="px-4 py-3 text-sm font-medium text-slate-900">${this.escapeHtml(asset.name)}</td>
                    <td class="px-4 py-3 text-sm text-slate-600">${this.escapeHtml(equipmentType)}</td>
                    <td class="px-4 py-3 text-sm text-slate-600">${this.escapeHtml(pmName)}</td>
                    <td class="px-4 py-3 text-sm text-slate-600">${currentLastPM}</td>
                    <td class="px-4 py-3 text-sm text-slate-600">${nextPMDate}</td>
                </tr>
            `;
        }).join('');

        if (countSpan) {
            countSpan.textContent = this.selectedAssetIds.size || this.filteredAssets.length;
        }
    },

    toggleAssetSelection(assetId, checked) {
        if (checked) {
            this.selectedAssetIds.add(assetId);
        } else {
            this.selectedAssetIds.delete(assetId);
        }
        this.updateAssetCount();
    },

    toggleSelectAll(checkbox) {
        const isChecked = checkbox.checked;
        this.filteredAssets.forEach(asset => {
            if (isChecked) {
                this.selectedAssetIds.add(asset.id);
            } else {
                this.selectedAssetIds.delete(asset.id);
            }
        });
        this.renderAssetsList();
    },

    selectAllAssets() {
        this.filteredAssets.forEach(asset => {
            this.selectedAssetIds.add(asset.id);
        });
        this.renderAssetsList();
    },

    deselectAllAssets() {
        this.selectedAssetIds.clear();
        this.renderAssetsList();
    },

    updateAssetCount() {
        const countSpan = document.getElementById('sm-asset-count');
        if (countSpan) {
            countSpan.textContent = this.selectedAssetIds.size;
        }
    },

    clearFilters() {
        document.getElementById('sm-customer-filter').value = '';
        document.getElementById('sm-type-filter').value = '';
        document.getElementById('sm-status-filter').value = '';
        document.getElementById('sm-location-filter').value = '';
        this.filteredAssets = [];
        this.selectedAssetIds.clear();
        this.renderAssetsList();
    },

    async generateScheduledMaintenance() {
        if (!this.supabaseClient) {
            this.showToast('Database connection not available', 'error');
            return;
        }

        const lastPMDate = document.getElementById('sm-last-pm-date')?.value;
        const generateWO = document.getElementById('sm-generate-wo')?.checked;

        if (!lastPMDate) {
            this.showToast('Please select a Last PM Date', 'error');
            return;
        }

        const selectedAssets = this.filteredAssets.filter(asset => 
            this.selectedAssetIds.has(asset.id)
        );

        if (selectedAssets.length === 0) {
            this.showToast('Please select at least one asset', 'error');
            return;
        }

        try {
            let successCount = 0;
            let woCount = 0;
            let errorCount = 0;

            for (const asset of selectedAssets) {
                try {
                    // Get PM frequency (default to Annual if not set)
                    const pmFrequency = asset.equipment_models?.pm_frequencies || 
                                       (asset.pm_interval_days ? { days: asset.pm_interval_days } : null);
                    const pmDays = pmFrequency?.days || 365; // Default to Annual
                    const pmName = pmFrequency?.name || 'Annual';

                    // Calculate next maintenance date
                    const lastDate = new Date(lastPMDate);
                    const nextDate = new Date(lastDate);
                    nextDate.setDate(nextDate.getDate() + pmDays);

                    // Update asset
                    const updateData = {
                        last_maintenance: lastDate.toISOString(),
                        next_maintenance: nextDate.toISOString(),
                        pm_interval_days: pmDays,
                        pm_schedule_type: pmDays === 365 ? 'annually' : 
                                        pmDays === 180 ? 'semiannually' :
                                        pmDays === 90 ? 'quarterly' :
                                        pmDays === 30 ? 'monthly' :
                                        pmDays === 7 ? 'weekly' :
                                        pmDays === 1 ? 'daily' : 'custom',
                        auto_generate_wo: true
                    };

                    // Update PM frequency if not set
                    if (!asset.pm_frequency_id && pmFrequency?.id) {
                        updateData.pm_frequency_id = pmFrequency.id;
                    }

                    await this.supabaseClient
                        .from('assets')
                        .update(updateData)
                        .eq('id', asset.id);

                    successCount++;

                    // Generate work order if requested
                    if (generateWO) {
                        try {
                            await this.generatePMWorkOrder(asset, lastDate, nextDate, pmDays, pmName);
                            woCount++;
                        } catch (woError) {
                            console.error(`Error generating WO for asset ${asset.id}:`, woError);
                            // Don't fail the whole operation if WO generation fails
                        }
                    }
                } catch (error) {
                    console.error(`Error processing asset ${asset.id}:`, error);
                    errorCount++;
                }
            }

            // Show results
            let message = `Updated ${successCount} asset(s)`;
            if (generateWO) {
                message += ` and generated ${woCount} work order(s)`;
            }
            if (errorCount > 0) {
                message += `. ${errorCount} error(s) occurred`;
            }

            this.showToast(message, errorCount > 0 ? 'warning' : 'success');
            this.closeModal();

            // Refresh if on assets page
            if (typeof loadAssets === 'function') {
                await loadAssets();
            }
        } catch (error) {
            console.error('Error generating scheduled maintenance:', error);
            this.showToast(`Error: ${error.message}`, 'error');
        }
    },

    async generatePMWorkOrder(asset, lastDate, nextDate, pmDays, pmName) {
        // Get PM work order type
        let workOrderType = 'PM';
        const { data: pmType } = await this.supabaseClient
            .from('work_order_types')
            .select('code')
            .eq('code', 'PM')
            .maybeSingle();

        if (!pmType) {
            const { data: pmType2 } = await this.supabaseClient
                .from('work_order_types')
                .select('code')
                .eq('code', 'preventive_maintenance')
                .maybeSingle();
            
            if (pmType2) {
                workOrderType = 'preventive_maintenance';
            }
        }

        // Determine priority
        const today = new Date();
        const daysUntilDue = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));
        let priority = 'medium';
        if (nextDate < today) {
            priority = 'critical';
        } else if (daysUntilDue <= 1) {
            priority = 'high';
        } else if (daysUntilDue <= 3) {
            priority = 'medium';
        } else {
            priority = 'low';
        }

        // Create work order description
        const description = `Scheduled Preventive Maintenance - ${asset.name || 'Asset'}\n` +
                          `PM Frequency: ${pmName} (${pmDays} days)\n` +
                          `Last PM: ${lastDate.toLocaleDateString()}\n` +
                          `Next PM Due: ${nextDate.toLocaleDateString()}`;

        // Generate work order ID
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const dateStr = `${year}${month}${day}`;
        const seqNum = String(Date.now()).slice(-4).padStart(4, '0');
        const workOrderId = `WO-${dateStr}-${seqNum}`;

        // Create work order
        await this.supabaseClient
            .from('work_orders')
            .insert([{
                id: workOrderId,
                asset_id: asset.id,
                type: workOrderType,
                priority: priority,
                status: 'open',
                due_date: nextDate.toISOString(),
                description: description,
                created_date: new Date().toISOString()
            }]);
    },

    openModal() {
        const modal = document.getElementById('scheduled-maintenance-modal');
        if (modal) {
            modal.classList.add('active');
            this.init();
            // Set default date to today
            const dateInput = document.getElementById('sm-last-pm-date');
            if (dateInput && !dateInput.value) {
                const today = new Date().toISOString().split('T')[0];
                dateInput.value = today;
            }
        }
    },

    closeModal() {
        const modal = document.getElementById('scheduled-maintenance-modal');
        if (modal) {
            modal.classList.remove('active');
        }
        this.clearFilters();
        this.filteredAssets = [];
        this.selectedAssetIds.clear();
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    showToast(message, type = 'info') {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else {
            alert(message);
        }
    }
};

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ScheduledMaintenanceManager.init();
    });
} else {
    ScheduledMaintenanceManager.init();
}

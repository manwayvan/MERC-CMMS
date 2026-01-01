// PM Management - Mobile-Friendly Interface for Managing Asset PMs
const PMManagement = {
    supabaseClient: null,
    assets: [],
    filters: {
        status: 'all',
        dueWithin: 30,
        search: ''
    },

    init() {
        if (window.supabaseClient) {
            this.supabaseClient = window.supabaseClient;
        } else if (window.sharedSupabaseClient) {
            this.supabaseClient = window.sharedSupabaseClient;
        }

        if (this.supabaseClient) {
            this.loadAssets();
        }
    },

    async loadAssets() {
        try {
            const { data, error } = await this.supabaseClient
                .from('assets')
                .select(`
                    id,
                    name,
                    status,
                    next_maintenance,
                    last_maintenance,
                    auto_generate_wo,
                    model_id,
                    equipment_models:model_id (
                        name,
                        pm_frequency_id,
                        pm_frequencies:pm_frequency_id (
                            name,
                            days
                        )
                    )
                `)
                .is('deleted_at', null)
                .eq('status', 'active')
                .not('next_maintenance', 'is', null)
                .order('next_maintenance', { ascending: true });

            if (error) throw error;
            this.assets = data || [];
            this.render();
        } catch (error) {
            console.error('Error loading assets for PM management:', error);
        }
    },

    getDaysUntilPM(asset) {
        if (!asset.next_maintenance) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextPM = new Date(asset.next_maintenance);
        nextPM.setHours(0, 0, 0, 0);
        return Math.ceil((nextPM - today) / (1000 * 60 * 60 * 24));
    },

    getPMStatus(asset) {
        const daysUntil = this.getDaysUntilPM(asset);
        if (daysUntil === null) return { status: 'unknown', label: 'No PM Scheduled', color: 'gray' };
        if (daysUntil < 0) return { status: 'overdue', label: `${Math.abs(daysUntil)} days overdue`, color: 'red' };
        if (daysUntil <= 7) return { status: 'due-soon', label: `Due in ${daysUntil} days`, color: 'orange' };
        if (daysUntil <= 30) return { status: 'upcoming', label: `Due in ${daysUntil} days`, color: 'yellow' };
        return { status: 'scheduled', label: `Due in ${daysUntil} days`, color: 'green' };
    },

    render() {
        const container = document.getElementById('pm-management-container');
        if (!container) return;

        const filtered = this.getFilteredAssets();
        
        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <i class="fas fa-calendar-check text-6xl text-gray-300 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-700 mb-2">No PMs Found</h3>
                    <p class="text-gray-500">All assets are up to date or no PM schedules are set.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(asset => {
            const pmStatus = this.getPMStatus(asset);
            const pmFrequency = asset.equipment_models?.pm_frequencies?.name || 'Not Set';
            const pmDays = asset.equipment_models?.pm_frequencies?.days || 'N/A';

            return `
                <div class="bg-white rounded-lg border border-gray-200 p-4 mb-3 shadow-sm hover:shadow-md transition-shadow">
                    <div class="flex items-start justify-between mb-3">
                        <div class="flex-1">
                            <h3 class="font-semibold text-gray-900 text-lg mb-1">${this.escapeHtml(asset.name || 'Unnamed Asset')}</h3>
                            <p class="text-sm text-gray-600">PM: ${pmFrequency} (${pmDays} days)</p>
                        </div>
                        <span class="px-3 py-1 rounded-full text-xs font-semibold bg-${pmStatus.color}-100 text-${pmStatus.color}-800">
                            ${pmStatus.label}
                        </span>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-3 mb-3 text-sm">
                        <div>
                            <span class="text-gray-500">Last PM:</span>
                            <span class="font-medium text-gray-900 ml-1">
                                ${asset.last_maintenance ? new Date(asset.last_maintenance).toLocaleDateString() : 'Never'}
                            </span>
                        </div>
                        <div>
                            <span class="text-gray-500">Next PM:</span>
                            <span class="font-medium text-gray-900 ml-1">
                                ${asset.next_maintenance ? new Date(asset.next_maintenance).toLocaleDateString() : 'Not Set'}
                            </span>
                        </div>
                    </div>

                    <div class="flex gap-2">
                        <button onclick="PMManagement.completePM('${asset.id}')" 
                                class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                            <i class="fas fa-check mr-2"></i>Mark Complete
                        </button>
                        <button onclick="PMManagement.updatePMDate('${asset.id}')" 
                                class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                            <i class="fas fa-calendar-alt mr-2"></i>Update Date
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    getFilteredAssets() {
        let filtered = [...this.assets];

        // Filter by status
        if (this.filters.status !== 'all') {
            filtered = filtered.filter(asset => {
                const status = this.getPMStatus(asset).status;
                return status === this.filters.status;
            });
        }

        // Filter by due within days
        if (this.filters.dueWithin) {
            filtered = filtered.filter(asset => {
                const daysUntil = this.getDaysUntilPM(asset);
                return daysUntil !== null && daysUntil <= this.filters.dueWithin;
            });
        }

        // Filter by search
        if (this.filters.search) {
            const searchLower = this.filters.search.toLowerCase();
            filtered = filtered.filter(asset => 
                asset.name?.toLowerCase().includes(searchLower)
            );
        }

        return filtered;
    },

    async completePM(assetId) {
        if (!confirm('Mark this PM as complete? This will update the last maintenance date and calculate the next PM date.')) {
            return;
        }

        try {
            const asset = this.assets.find(a => a.id === assetId);
            if (!asset) throw new Error('Asset not found');

            const completionDate = new Date().toISOString();
            const pmDays = asset.equipment_models?.pm_frequencies?.days || 90;
            const nextMaintenance = new Date();
            nextMaintenance.setDate(nextMaintenance.getDate() + pmDays);

            const { error } = await this.supabaseClient
                .from('assets')
                .update({
                    last_maintenance: completionDate,
                    next_maintenance: nextMaintenance.toISOString(),
                    compliance_status: 'compliant'
                })
                .eq('id', assetId);

            if (error) throw error;

            // Create maintenance history
            await this.supabaseClient
                .from('asset_maintenance_history')
                .insert({
                    asset_id: assetId,
                    maintenance_date: completionDate,
                    maintenance_type: 'preventive',
                    next_due_date: nextMaintenance.toISOString()
                });

            if (typeof showToast === 'function') {
                showToast('PM marked as complete!', 'success');
            }

            await this.loadAssets();
        } catch (error) {
            console.error('Error completing PM:', error);
            if (typeof showToast === 'function') {
                showToast(`Failed to complete PM: ${error.message}`, 'error');
            }
        }
    },

    async updatePMDate(assetId) {
        const asset = this.assets.find(a => a.id === assetId);
        if (!asset) return;

        const newDate = prompt('Enter new next PM date (YYYY-MM-DD):', 
            asset.next_maintenance ? new Date(asset.next_maintenance).toISOString().split('T')[0] : '');

        if (!newDate) return;

        try {
            const { error } = await this.supabaseClient
                .from('assets')
                .update({ next_maintenance: new Date(newDate).toISOString() })
                .eq('id', assetId);

            if (error) throw error;

            if (typeof showToast === 'function') {
                showToast('PM date updated!', 'success');
            }

            await this.loadAssets();
        } catch (error) {
            console.error('Error updating PM date:', error);
            if (typeof showToast === 'function') {
                showToast(`Failed to update PM date: ${error.message}`, 'error');
            }
        }
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

window.PMManagement = PMManagement;

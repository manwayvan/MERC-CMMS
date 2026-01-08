/**
 * Hierarchy List Manager - Excel-like list view for MMD hierarchy management
 * Provides inline editing and column-based "+" buttons for adding new rows
 */
class HierarchyListManager {
    constructor(supabaseClient) {
        this.supabaseClient = supabaseClient;
        this.hierarchyManager = null;
        this.hierarchy = {
            deviceTypes: [],
            manufacturers: [],
            deviceModels: [],
            pmPrograms: [],
            pmFrequencies: [],
            pmChecklists: [],
            pmChecklistItems: []
        };
        this.editingRow = null;
    }

    async init() {
        if (!this.hierarchyManager && window.ParentChildHierarchyManager) {
            this.hierarchyManager = new ParentChildHierarchyManager(this.supabaseClient);
        }
        await this.loadAllData();
        this.render();
    }

    async loadAllData() {
        try {
            // Load hierarchy
            if (this.hierarchyManager) {
                this.hierarchy = await this.hierarchyManager.loadFullHierarchy();
            }

            // Load PM frequencies
            const { data: frequencies, error: freqError } = await this.supabaseClient
                .from('pm_frequencies')
                .select('*')
                .is('deleted_at', null)
                .eq('is_active', true)
                .order('name');

            if (!freqError) {
                this.hierarchy.pmFrequencies = frequencies || [];
            }
        } catch (error) {
            console.error('Error loading hierarchy data:', error);
            this.showToast('Error loading data: ' + (error.message || 'Unknown error'), 'error');
        }
    }

    render() {
        const container = document.getElementById('hierarchy-list-container');
        if (!container) return;

        // Build flat list of all hierarchy combinations
        const rows = this.buildHierarchyRows();
        
        container.innerHTML = `
            <div class="hierarchy-list-wrapper">
                <div class="hierarchy-list-header">
                    <div class="hierarchy-col hierarchy-col-type">
                        <div class="hierarchy-col-header">
                            <span>Device Type</span>
                            <button type="button" class="hierarchy-add-btn" onclick="hierarchyListManager.addDeviceType()" title="Add Device Type">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                    <div class="hierarchy-col hierarchy-col-make">
                        <div class="hierarchy-col-header">
                            <span>Make</span>
                            <button type="button" class="hierarchy-add-btn" onclick="hierarchyListManager.addManufacturer()" title="Add Manufacturer">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                    <div class="hierarchy-col hierarchy-col-model">
                        <div class="hierarchy-col-header">
                            <span>Model</span>
                            <button type="button" class="hierarchy-add-btn" onclick="hierarchyListManager.addDeviceModel()" title="Add Device Model">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                    <div class="hierarchy-col hierarchy-col-frequency">
                        <div class="hierarchy-col-header">
                            <span>PM Frequency</span>
                            <button type="button" class="hierarchy-add-btn" onclick="hierarchyListManager.addPMFrequency()" title="Add PM Frequency">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                    <div class="hierarchy-col hierarchy-col-checklist">
                        <div class="hierarchy-col-header">
                            <span>Checklist</span>
                            <button type="button" class="hierarchy-add-btn" onclick="hierarchyListManager.addChecklist()" title="Add Checklist">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    </div>
                    <div class="hierarchy-col hierarchy-col-actions">
                        <div class="hierarchy-col-header">
                            <span>Actions</span>
                        </div>
                    </div>
                </div>
                <div class="hierarchy-list-body" id="hierarchy-list-body">
                    ${rows.map((row, idx) => this.renderRow(row, idx)).join('')}
                </div>
            </div>
        `;
    }

    buildHierarchyRows() {
        const rows = [];
        
        // Build rows from PM Programs (which link models to frequencies)
        this.hierarchy.pmPrograms.forEach(pmProgram => {
            const model = pmProgram.device_models;
            if (!model) return;
            
            const manufacturer = model.manufacturers;
            if (!manufacturer) return;
            
            const deviceType = manufacturer.device_types;
            if (!deviceType) return;
            
            const pmFrequency = pmProgram.pm_frequencies;
            const checklist = this.hierarchy.pmChecklists.find(c => c.pm_program_id === pmProgram.id);
            
            rows.push({
                id: pmProgram.id,
                deviceTypeId: deviceType.id,
                deviceTypeName: deviceType.name,
                manufacturerId: manufacturer.id,
                manufacturerName: manufacturer.name,
                modelId: model.id,
                modelName: model.name,
                pmProgramId: pmProgram.id,
                pmFrequencyId: pmFrequency?.id || null,
                pmFrequencyName: pmFrequency?.name || 'Not Set',
                checklistId: checklist?.id || null,
                checklistName: checklist?.name || 'Not Created',
                isActive: pmProgram.is_active
            });
        });
        
        return rows;
    }

    renderRow(row, idx) {
        const isEditing = this.editingRow === row.id;
        
        return `
            <div class="hierarchy-row ${isEditing ? 'editing' : ''}" data-row-id="${row.id}">
                <div class="hierarchy-col hierarchy-col-type">
                    <div class="hierarchy-cell" data-field="deviceType" data-value="${row.deviceTypeId}">
                        ${isEditing ? this.renderTypeSelect(row.deviceTypeId) : `<span>${this.escapeHtml(row.deviceTypeName)}</span>`}
                    </div>
                </div>
                <div class="hierarchy-col hierarchy-col-make">
                    <div class="hierarchy-cell" data-field="manufacturer" data-value="${row.manufacturerId}">
                        ${isEditing ? this.renderManufacturerSelect(row.deviceTypeId, row.manufacturerId) : `<span>${this.escapeHtml(row.manufacturerName)}</span>`}
                    </div>
                </div>
                <div class="hierarchy-col hierarchy-col-model">
                    <div class="hierarchy-cell" data-field="model" data-value="${row.modelId}">
                        ${isEditing ? this.renderModelSelect(row.manufacturerId, row.modelId) : `<span>${this.escapeHtml(row.modelName)}</span>`}
                    </div>
                </div>
                <div class="hierarchy-col hierarchy-col-frequency">
                    <div class="hierarchy-cell" data-field="pmFrequency" data-value="${row.pmFrequencyId}">
                        ${isEditing ? this.renderFrequencySelect(row.pmFrequencyId) : `<span>${this.escapeHtml(row.pmFrequencyName)}</span>`}
                    </div>
                </div>
                <div class="hierarchy-col hierarchy-col-checklist">
                    <div class="hierarchy-cell" data-field="checklist" data-value="${row.checklistId}">
                        ${isEditing ? this.renderChecklistSelect(row.pmProgramId, row.checklistId) : `<span class="${row.checklistId ? 'text-green-600' : 'text-orange-600'}">${this.escapeHtml(row.checklistName)}</span>`}
                    </div>
                </div>
                <div class="hierarchy-col hierarchy-col-actions">
                    <div class="hierarchy-cell">
                        ${isEditing ? `
                            <button type="button" class="hierarchy-action-btn save" onclick="hierarchyListManager.saveRow('${row.id}')" title="Save">
                                <i class="fas fa-check"></i>
                            </button>
                            <button type="button" class="hierarchy-action-btn cancel" onclick="hierarchyListManager.cancelEdit()" title="Cancel">
                                <i class="fas fa-times"></i>
                            </button>
                        ` : `
                            <button type="button" class="hierarchy-action-btn edit" onclick="hierarchyListManager.editRow('${row.id}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button type="button" class="hierarchy-action-btn delete" onclick="hierarchyListManager.deleteRow('${row.id}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    renderTypeSelect(selectedId) {
        const options = this.hierarchy.deviceTypes.map(type => 
            `<option value="${type.id}" ${type.id === selectedId ? 'selected' : ''}>${this.escapeHtml(type.name)}</option>`
        ).join('');
        return `<select class="hierarchy-input">${options}</select>`;
    }

    renderManufacturerSelect(deviceTypeId, selectedId) {
        const manufacturers = deviceTypeId ? 
            this.hierarchy.manufacturers.filter(m => m.device_type_id === deviceTypeId) : 
            [];
        const options = manufacturers.map(mfg => 
            `<option value="${mfg.id}" ${mfg.id === selectedId ? 'selected' : ''}>${this.escapeHtml(mfg.name)}</option>`
        ).join('');
        return `<select class="hierarchy-input" data-parent="deviceType">${options || '<option value="">-- Select --</option>'}</select>`;
    }

    renderModelSelect(manufacturerId, selectedId) {
        const models = manufacturerId ? 
            this.hierarchy.deviceModels.filter(m => m.manufacturer_id === manufacturerId) : 
            [];
        const options = models.map(model => 
            `<option value="${model.id}" ${model.id === selectedId ? 'selected' : ''}>${this.escapeHtml(model.name)}</option>`
        ).join('');
        return `<select class="hierarchy-input" data-parent="manufacturer">${options || '<option value="">-- Select --</option>'}</select>`;
    }

    renderFrequencySelect(selectedId) {
        const options = this.hierarchy.pmFrequencies.map(freq => 
            `<option value="${freq.id}" ${freq.id === selectedId ? 'selected' : ''}>${this.escapeHtml(freq.name)}</option>`
        ).join('');
        return `<select class="hierarchy-input">${options || '<option value="">-- Select --</option>'}</select>`;
    }

    renderChecklistSelect(pmProgramId, selectedId) {
        const checklists = pmProgramId ? 
            this.hierarchy.pmChecklists.filter(c => c.pm_program_id === pmProgramId) : 
            [];
        const options = checklists.map(chk => 
            `<option value="${chk.id}" ${chk.id === selectedId ? 'selected' : ''}>${this.escapeHtml(chk.name)}</option>`
        ).join('');
        return `<select class="hierarchy-input">${options || '<option value="">-- Create New --</option>'}</select>`;
    }

    // Add functions for each column
    async addDeviceType() {
        const name = prompt('Enter Device Type name:');
        if (!name || !name.trim()) return;

        try {
            if (!this.hierarchyManager) {
                this.hierarchyManager = new ParentChildHierarchyManager(this.supabaseClient);
            }
            
            await this.hierarchyManager.createDeviceType(name.trim());
            await this.loadAllData();
            this.render();
            this.showToast('Device Type created successfully', 'success');
        } catch (error) {
            console.error('Error creating device type:', error);
            this.showToast(error.message || 'Failed to create device type', 'error');
        }
    }

    async addManufacturer() {
        const deviceTypeId = prompt('Select Device Type ID (or enter name to create new):');
        if (!deviceTypeId) return;

        // Try to find by name first
        let typeId = this.hierarchy.deviceTypes.find(t => t.name.toLowerCase() === deviceTypeId.toLowerCase())?.id;
        if (!typeId) {
            typeId = deviceTypeId; // Assume it's an ID
        }

        const name = prompt('Enter Manufacturer name:');
        if (!name || !name.trim()) return;

        try {
            if (!this.hierarchyManager) {
                this.hierarchyManager = new ParentChildHierarchyManager(this.supabaseClient);
            }
            
            await this.hierarchyManager.createManufacturer(name.trim(), typeId);
            await this.loadAllData();
            this.render();
            this.showToast('Manufacturer created successfully', 'success');
        } catch (error) {
            console.error('Error creating manufacturer:', error);
            this.showToast(error.message || 'Failed to create manufacturer', 'error');
        }
    }

    async addDeviceModel() {
        const manufacturerId = prompt('Select Manufacturer ID (or enter name to find):');
        if (!manufacturerId) return;

        // Try to find by name first
        let mfgId = this.hierarchy.manufacturers.find(m => m.name.toLowerCase() === manufacturerId.toLowerCase())?.id;
        if (!mfgId) {
            mfgId = manufacturerId; // Assume it's an ID
        }

        const name = prompt('Enter Device Model name:');
        if (!name || !name.trim()) return;

        try {
            if (!this.hierarchyManager) {
                this.hierarchyManager = new ParentChildHierarchyManager(this.supabaseClient);
            }
            
            await this.hierarchyManager.createDeviceModel(name.trim(), mfgId);
            await this.loadAllData();
            this.render();
            this.showToast('Device Model created successfully', 'success');
        } catch (error) {
            console.error('Error creating device model:', error);
            this.showToast(error.message || 'Failed to create device model', 'error');
        }
    }

    async addPMFrequency() {
        const name = prompt('Enter PM Frequency name (e.g., "Annual PM", "Quarterly PM"):');
        if (!name || !name.trim()) return;

        try {
            const { data, error } = await this.supabaseClient
                .from('pm_frequencies')
                .insert({
                    name: name.trim(),
                    is_active: true
                })
                .select()
                .single();

            if (error) throw error;
            
            await this.loadAllData();
            this.render();
            this.showToast('PM Frequency created successfully', 'success');
        } catch (error) {
            console.error('Error creating PM frequency:', error);
            this.showToast(error.message || 'Failed to create PM frequency', 'error');
        }
    }

    async addChecklist() {
        const pmProgramId = prompt('Select PM Program ID:');
        if (!pmProgramId) return;

        const name = prompt('Enter Checklist name:');
        if (!name || !name.trim()) return;

        try {
            if (!this.hierarchyManager) {
                this.hierarchyManager = new ParentChildHierarchyManager(this.supabaseClient);
            }
            
            await this.hierarchyManager.createPMChecklist(name.trim(), pmProgramId);
            await this.loadAllData();
            this.render();
            this.showToast('Checklist created successfully', 'success');
        } catch (error) {
            console.error('Error creating checklist:', error);
            this.showToast(error.message || 'Failed to create checklist', 'error');
        }
    }

    editRow(rowId) {
        this.editingRow = rowId;
        this.render();
    }

    cancelEdit() {
        this.editingRow = null;
        this.render();
    }

    async saveRow(rowId) {
        // Get values from inputs
        const row = document.querySelector(`[data-row-id="${rowId}"]`);
        if (!row) return;

        const deviceTypeId = row.querySelector('[data-field="deviceType"] select')?.value;
        const manufacturerId = row.querySelector('[data-field="manufacturer"] select')?.value;
        const modelId = row.querySelector('[data-field="model"] select')?.value;
        const pmFrequencyId = row.querySelector('[data-field="pmFrequency"] select')?.value;

        // Update PM Program
        try {
            const { error } = await this.supabaseClient
                .from('pm_programs')
                .update({
                    device_model_id: modelId,
                    pm_frequency_id: pmFrequencyId
                })
                .eq('id', rowId);

            if (error) throw error;

            await this.loadAllData();
            this.editingRow = null;
            this.render();
            this.showToast('Row updated successfully', 'success');
        } catch (error) {
            console.error('Error updating row:', error);
            this.showToast(error.message || 'Failed to update row', 'error');
        }
    }

    async deleteRow(rowId) {
        if (!confirm('Are you sure you want to delete this row? This action cannot be undone.')) {
            return;
        }

        try {
            const { error } = await this.supabaseClient
                .from('pm_programs')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', rowId);

            if (error) throw error;

            await this.loadAllData();
            this.render();
            this.showToast('Row deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting row:', error);
            this.showToast(error.message || 'Failed to delete row', 'error');
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message, type = 'info') {
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            alert(message);
        }
    }
}

// Expose globally
window.HierarchyListManager = HierarchyListManager;

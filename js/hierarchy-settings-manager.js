/**
 * Hierarchy Settings Manager
 * UI component for managing the parent-child hierarchy in Settings page
 * Tree/accordion view with inline creation support
 * All operations use ParentChildHierarchyManager (which uses MCP Supabase)
 */

class HierarchySettingsManager {
    constructor(supabaseClient) {
        this.supabaseClient = supabaseClient;
        this.hierarchyManager = new ParentChildHierarchyManager(supabaseClient);
        this.container = null;
    }

    async init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        await this.hierarchyManager.loadFullHierarchy();
        this.render();
        this.setupEventListeners();
    }

    render() {
        if (!this.container) return;

        const hierarchy = this.hierarchyManager.hierarchy;
        
        this.container.innerHTML = `
            <div class="hierarchy-settings-container space-y-6">
                <!-- Header -->
                <div class="flex items-center justify-between mb-6">
                    <div>
                        <h3 class="text-xl font-bold text-slate-800">Device Hierarchy Configuration</h3>
                        <p class="text-sm text-slate-600 mt-1">Define device types, manufacturers, models, and PM programs</p>
                    </div>
                    <button onclick="window.hierarchySettingsManager.expandAll()" class="btn btn-secondary btn-sm">
                        <i class="fas fa-expand"></i> Expand All
                    </button>
                </div>

                <!-- Tree View -->
                <div id="hierarchy-tree" class="bg-white rounded-lg border border-slate-200 p-4">
                    ${this.renderTreeView(hierarchy)}
                </div>

                <!-- Quick Add Section -->
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 class="font-semibold text-blue-900 mb-3">Quick Add</h4>
                    <div id="quick-add-form" class="space-y-3">
                        ${this.renderQuickAddForm()}
                    </div>
                </div>
            </div>
        `;
    }

    renderTreeView(hierarchy) {
        if (hierarchy.deviceTypes.length === 0) {
            return `
                <div class="text-center py-8 text-slate-500">
                    <i class="fas fa-info-circle text-2xl mb-2"></i>
                    <p>No device types configured. Use "Quick Add" to create your first hierarchy.</p>
                </div>
            `;
        }

        return hierarchy.deviceTypes.map(type => {
            const manufacturers = hierarchy.manufacturers.filter(m => 
                m.device_type_id === type.id && m.is_active && !m.deleted_at
            );

            return `
                <div class="hierarchy-node mb-4 border border-slate-200 rounded-lg overflow-hidden">
                    <!-- Device Type Level -->
                    <div class="bg-slate-50 p-3 flex items-center justify-between border-b border-slate-200">
                        <div class="flex items-center gap-3 flex-1">
                            <i class="fas fa-chevron-down text-slate-400 cursor-pointer toggle-node" data-type-id="${type.id}"></i>
                            <i class="fas fa-tag text-blue-600"></i>
                            <div class="flex-1">
                                <div class="font-semibold text-slate-900">${this.escapeHtml(type.name)}</div>
                                ${type.description ? `<div class="text-xs text-slate-600">${this.escapeHtml(type.description)}</div>` : ''}
                            </div>
                        </div>
                        <button onclick="window.hierarchySettingsManager.addManufacturer('${type.id}')" 
                                class="btn btn-secondary btn-sm">
                            <i class="fas fa-plus"></i> Add Manufacturer
                        </button>
                    </div>

                    <!-- Manufacturers Level (Collapsible) -->
                    <div class="manufacturers-container" data-type-id="${type.id}" style="display: none;">
                        ${manufacturers.length === 0 ? `
                            <div class="p-4 text-center text-slate-400 text-sm">
                                No manufacturers. Click "Add Manufacturer" to create one.
                            </div>
                        ` : manufacturers.map(mfg => {
                            const models = hierarchy.deviceModels.filter(m => 
                                m.manufacturer_id === mfg.id && m.is_active && !m.deleted_at
                            );

                            return `
                                <div class="manufacturer-node ml-6 border-l-2 border-slate-200">
                                    <div class="bg-white p-3 flex items-center justify-between">
                                        <div class="flex items-center gap-3 flex-1">
                                            <i class="fas fa-chevron-down text-slate-400 cursor-pointer toggle-node" data-mfg-id="${mfg.id}"></i>
                                            <i class="fas fa-industry text-green-600"></i>
                                            <div class="flex-1">
                                                <div class="font-medium text-slate-800">${this.escapeHtml(mfg.name)}</div>
                                                ${mfg.description ? `<div class="text-xs text-slate-600">${this.escapeHtml(mfg.description)}</div>` : ''}
                                            </div>
                                        </div>
                                        <button onclick="window.hierarchySettingsManager.addDeviceModel('${mfg.id}')" 
                                                class="btn btn-secondary btn-sm">
                                            <i class="fas fa-plus"></i> Add Model
                                        </button>
                                    </div>

                                    <!-- Models Level (Collapsible) -->
                                    <div class="models-container" data-mfg-id="${mfg.id}" style="display: none;">
                                        ${models.length === 0 ? `
                                            <div class="ml-6 p-3 text-center text-slate-400 text-sm">
                                                No models. Click "Add Model" to create one.
                                            </div>
                                        ` : models.map(model => {
                                            const pmProgram = hierarchy.pmPrograms.find(p => 
                                                p.device_model_id === model.id && p.is_active && !p.deleted_at
                                            );

                                            return `
                                                <div class="model-node ml-6 border-l-2 border-slate-200">
                                                    <div class="bg-white p-3 flex items-center justify-between">
                                                        <div class="flex items-center gap-3 flex-1">
                                                            <i class="fas fa-chevron-down text-slate-400 cursor-pointer toggle-node" data-model-id="${model.id}"></i>
                                                            <i class="fas fa-cube text-purple-600"></i>
                                                            <div class="flex-1">
                                                                <div class="font-medium text-slate-800">${this.escapeHtml(model.name)}</div>
                                                                ${model.description ? `<div class="text-xs text-slate-600">${this.escapeHtml(model.description)}</div>` : ''}
                                                                <div class="text-xs text-slate-500 mt-1">
                                                                    Risk: ${model.risk_class || 'N/A'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button onclick="window.hierarchySettingsManager.addPMProgram('${model.id}')" 
                                                                class="btn btn-secondary btn-sm">
                                                            <i class="fas fa-plus"></i> Add PM Program
                                                        </button>
                                                    </div>

                                                    <!-- PM Program Level (Collapsible) -->
                                                    <div class="pm-program-container" data-model-id="${model.id}" style="display: none;">
                                                        ${pmProgram ? `
                                                            <div class="ml-6 p-3 bg-slate-50 border-l-2 border-blue-200">
                                                                <div class="flex items-center justify-between mb-2">
                                                                    <div class="flex items-center gap-2">
                                                                        <i class="fas fa-calendar-check text-blue-600"></i>
                                                                        <span class="font-medium text-slate-800">${this.escapeHtml(pmProgram.name)}</span>
                                                                        <span class="text-xs text-slate-600">
                                                                            (${pmProgram.pm_frequencies?.name || 'Frequency N/A'})
                                                                        </span>
                                                                    </div>
                                                                    <button onclick="window.hierarchySettingsManager.addPMChecklist('${pmProgram.id}')" 
                                                                            class="btn btn-secondary btn-sm">
                                                                        <i class="fas fa-plus"></i> Add Checklist
                                                                    </button>
                                                                </div>
                                                                ${this.renderPMChecklist(pmProgram.id, hierarchy)}
                                                            </div>
                                                        ` : `
                                                            <div class="ml-6 p-3 text-center text-slate-400 text-sm">
                                                                No PM program. Click "Add PM Program" to create one.
                                                            </div>
                                                        `}
                                                    </div>
                                                </div>
                                            `;
                                        }).join('')}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderPMChecklist(pmProgramId, hierarchy) {
        const checklist = hierarchy.pmChecklists.find(c => 
            c.pm_program_id === pmProgramId && c.is_active && !c.deleted_at
        );

        if (!checklist) {
            return '<div class="text-xs text-slate-400">No checklist assigned</div>';
        }

        const items = hierarchy.pmChecklistItems.filter(i => 
            i.pm_checklist_id === checklist.id && !i.deleted_at
        ).sort((a, b) => a.sort_order - b.sort_order);

        return `
            <div class="checklist-container ml-4 mt-2">
                <div class="text-xs font-medium text-slate-700 mb-1">
                    <i class="fas fa-list-check"></i> ${this.escapeHtml(checklist.name)}
                </div>
                ${items.length === 0 ? `
                    <div class="text-xs text-slate-400 ml-4">No checklist items</div>
                ` : `
                    <ul class="text-xs text-slate-600 ml-4 space-y-1">
                        ${items.map(item => `
                            <li class="flex items-center gap-2">
                                <i class="fas fa-${item.item_type === 'checkbox' ? 'square' : 'circle'} text-slate-400"></i>
                                ${this.escapeHtml(item.name)}
                                ${item.is_required ? '<span class="text-red-500 text-xs">*</span>' : ''}
                            </li>
                        `).join('')}
                    </ul>
                `}
            </div>
        `;
    }

    renderQuickAddForm() {
        return `
            <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
                <div>
                    <label class="block text-xs font-medium text-slate-700 mb-1">Device Type</label>
                    <input type="text" id="quick-add-type" class="form-input text-sm" placeholder="e.g., Defibrillator">
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-700 mb-1">Manufacturer</label>
                    <input type="text" id="quick-add-manufacturer" class="form-input text-sm" placeholder="e.g., Zoll">
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-700 mb-1">Model</label>
                    <input type="text" id="quick-add-model" class="form-input text-sm" placeholder="e.g., R Series">
                </div>
                <div>
                    <label class="block text-xs font-medium text-slate-700 mb-1">PM Frequency</label>
                    <select id="quick-add-pm-frequency" class="form-input text-sm">
                        <option value="">Select...</option>
                    </select>
                </div>
                <div class="flex items-end">
                    <button onclick="window.hierarchySettingsManager.quickAdd()" class="btn btn-primary w-full">
                        <i class="fas fa-plus"></i> Add
                    </button>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Toggle node expansion
        this.container.addEventListener('click', (e) => {
            if (e.target.closest('.toggle-node')) {
                const toggle = e.target.closest('.toggle-node');
                const typeId = toggle.dataset.typeId;
                const mfgId = toggle.dataset.mfgId;
                const modelId = toggle.dataset.modelId;

                if (typeId) {
                    this.toggleNode(`.manufacturers-container[data-type-id="${typeId}"]`, toggle);
                } else if (mfgId) {
                    this.toggleNode(`.models-container[data-mfg-id="${mfgId}"]`, toggle);
                } else if (modelId) {
                    this.toggleNode(`.pm-program-container[data-model-id="${modelId}"]`, toggle);
                }
            }
        });

        // Load PM frequencies for quick add
        this.loadPMFrequencies();
    }

    toggleNode(selector, toggleIcon) {
        const container = this.container.querySelector(selector);
        if (container) {
            const isHidden = container.style.display === 'none';
            container.style.display = isHidden ? 'block' : 'none';
            toggleIcon.classList.toggle('fa-chevron-down', !isHidden);
            toggleIcon.classList.toggle('fa-chevron-right', isHidden);
        }
    }

    async loadPMFrequencies() {
        try {
            const { data, error } = await this.supabaseClient
                .from('pm_frequencies')
                .select('id, name, days')
                .eq('is_active', true)
                .is('deleted_at', null)
                .order('sort_order');

            if (error) throw error;

            const select = document.getElementById('quick-add-pm-frequency');
            if (select) {
                select.innerHTML = '<option value="">Select...</option>';
                (data || []).forEach(freq => {
                    const option = document.createElement('option');
                    option.value = freq.id;
                    option.textContent = `${freq.name} (${freq.days} days)`;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading PM frequencies:', error);
        }
    }

    async quickAdd() {
        const typeName = document.getElementById('quick-add-type')?.value.trim();
        const mfgName = document.getElementById('quick-add-manufacturer')?.value.trim();
        const modelName = document.getElementById('quick-add-model')?.value.trim();
        const pmFreqId = document.getElementById('quick-add-pm-frequency')?.value;

        if (!typeName || !mfgName || !modelName || !pmFreqId) {
            showToast('All fields are required', 'error');
            return;
        }

        try {
            showToast('Creating hierarchy...', 'info');

            // Create device type
            let type = this.hierarchyManager.hierarchy.deviceTypes.find(t => 
                t.name.toLowerCase() === typeName.toLowerCase()
            );
            if (!type) {
                type = await this.hierarchyManager.createDeviceType(typeName);
            }

            // Create manufacturer
            let manufacturer = this.hierarchyManager.hierarchy.manufacturers.find(m => 
                m.name.toLowerCase() === mfgName.toLowerCase() && 
                m.device_type_id === type.id
            );
            if (!manufacturer) {
                manufacturer = await this.hierarchyManager.createManufacturer(mfgName, type.id);
            }

            // Create device model
            let model = this.hierarchyManager.hierarchy.deviceModels.find(m => 
                m.name.toLowerCase() === modelName.toLowerCase() && 
                m.manufacturer_id === manufacturer.id
            );
            if (!model) {
                model = await this.hierarchyManager.createDeviceModel(modelName, manufacturer.id);
            }

            // Create PM program
            let pmProgram = this.hierarchyManager.hierarchy.pmPrograms.find(p => 
                p.device_model_id === model.id
            );
            if (!pmProgram) {
                pmProgram = await this.hierarchyManager.createPMProgram(
                    `${modelName} PM Program`,
                    model.id,
                    pmFreqId
                );
            }

            // Clear form
            document.getElementById('quick-add-type').value = '';
            document.getElementById('quick-add-manufacturer').value = '';
            document.getElementById('quick-add-model').value = '';
            document.getElementById('quick-add-pm-frequency').value = '';

            showToast('Hierarchy created successfully', 'success');
            await this.init(this.container.id);
        } catch (error) {
            console.error('Error in quick add:', error);
            showToast(error.message || 'Error creating hierarchy', 'error');
        }
    }

    async addManufacturer(deviceTypeId) {
        const name = prompt('Enter manufacturer name:');
        if (!name || !name.trim()) return;

        try {
            await this.hierarchyManager.createManufacturer(name.trim(), deviceTypeId);
            showToast('Manufacturer created', 'success');
            await this.init(this.container.id);
        } catch (error) {
            showToast(error.message || 'Error creating manufacturer', 'error');
        }
    }

    async addDeviceModel(manufacturerId) {
        const name = prompt('Enter device model name:');
        if (!name || !name.trim()) return;

        try {
            await this.hierarchyManager.createDeviceModel(name.trim(), manufacturerId);
            showToast('Device model created', 'success');
            await this.init(this.container.id);
        } catch (error) {
            showToast(error.message || 'Error creating device model', 'error');
        }
    }

    async addPMProgram(deviceModelId) {
        // Show modal or prompt for PM frequency selection
        const pmFreqId = prompt('Enter PM Frequency ID (or use Settings to select):');
        if (!pmFreqId) return;

        try {
            const model = this.hierarchyManager.hierarchy.deviceModels.find(m => m.id === deviceModelId);
            await this.hierarchyManager.createPMProgram(
                `${model?.name || 'Model'} PM Program`,
                deviceModelId,
                pmFreqId
            );
            showToast('PM program created', 'success');
            await this.init(this.container.id);
        } catch (error) {
            showToast(error.message || 'Error creating PM program', 'error');
        }
    }

    async addPMChecklist(pmProgramId) {
        const name = prompt('Enter PM checklist name:');
        if (!name || !name.trim()) return;

        try {
            await this.hierarchyManager.createPMChecklist(name.trim(), pmProgramId);
            showToast('PM checklist created', 'success');
            await this.init(this.container.id);
        } catch (error) {
            showToast(error.message || 'Error creating PM checklist', 'error');
        }
    }

    expandAll() {
        const containers = this.container.querySelectorAll('[class*="-container"]');
        containers.forEach(container => {
            container.style.display = 'block';
        });
        const toggles = this.container.querySelectorAll('.toggle-node');
        toggles.forEach(toggle => {
            toggle.classList.remove('fa-chevron-right');
            toggle.classList.add('fa-chevron-down');
        });
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Expose globally
window.HierarchySettingsManager = HierarchySettingsManager;

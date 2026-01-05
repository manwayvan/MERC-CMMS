/**
 * Unified MMD Management Modal - Single Page Form
 * Combines Type → Make → Model → PM Frequency → PM Checklist creation
 * Single-page form design for mobile-friendly use
 * Works from both Settings and Asset Modal
 */

class UnifiedMMDModal {
    constructor(supabaseClient) {
        this.supabaseClient = supabaseClient;
        this.modal = null;
        this.init();
    }

    init() {
        this.createModal();
        this.setupEventListeners();
    }

    createModal() {
        // Remove existing modal if any
        const existing = document.getElementById('unified-mmd-modal');
        if (existing) existing.remove();

        const modalHTML = `
            <div id="unified-mmd-modal" class="modal">
                <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
                    <div class="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div class="flex justify-between items-center">
                            <div>
                                <h2 class="text-2xl font-bold text-gray-900">Create Equipment Configuration</h2>
                                <p class="text-sm text-gray-600 mt-1">Add Type → Make → Model → PM Frequency → PM Checklist</p>
                            </div>
                            <button id="unified-mmd-close" class="text-gray-400 hover:text-gray-600 text-2xl">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="p-6">
                        <form id="unified-mmd-form" class="space-y-6">
                            <!-- Equipment Type -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">
                                    Equipment Type <span class="text-red-500">*</span>
                                </label>
                                <div class="space-y-3">
                                    <div>
                                        <label class="block text-xs text-gray-600 mb-1">Select Existing Type</label>
                                        <select id="unified-type-select" class="form-input">
                                            <option value="">-- Select Existing Type --</option>
                                        </select>
                                    </div>
                                    <div class="text-center text-gray-500 text-xs">OR</div>
                                    <div>
                                        <label class="block text-xs text-gray-600 mb-1">Create New Type</label>
                                        <input type="text" id="unified-type-new" class="form-input" placeholder="Enter new type name">
                                        <textarea id="unified-type-desc" class="form-input mt-2" rows="2" placeholder="Description (optional)"></textarea>
                                    </div>
                                </div>
                            </div>

                            <!-- Make -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">
                                    Make <span class="text-red-500">*</span>
                                </label>
                                <div class="space-y-3">
                                    <div>
                                        <label class="block text-xs text-gray-600 mb-1">Select Existing Make</label>
                                        <select id="unified-make-select" class="form-input" disabled>
                                            <option value="">-- Select Type First --</option>
                                        </select>
                                    </div>
                                    <div class="text-center text-gray-500 text-xs">OR</div>
                                    <div>
                                        <label class="block text-xs text-gray-600 mb-1">Create New Make</label>
                                        <input type="text" id="unified-make-new" class="form-input" placeholder="Enter new make name" disabled>
                                        <textarea id="unified-make-desc" class="form-input mt-2" rows="2" placeholder="Description (optional)" disabled></textarea>
                                    </div>
                                </div>
                            </div>

                            <!-- Model -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">
                                    Model <span class="text-red-500">*</span>
                                </label>
                                <div class="space-y-3">
                                    <div>
                                        <label class="block text-xs text-gray-600 mb-1">Select Existing Model</label>
                                        <select id="unified-model-select" class="form-input" disabled>
                                            <option value="">-- Select Make First --</option>
                                        </select>
                                    </div>
                                    <div class="text-center text-gray-500 text-xs">OR</div>
                                    <div>
                                        <label class="block text-xs text-gray-600 mb-1">Create New Model</label>
                                        <input type="text" id="unified-model-new" class="form-input" placeholder="Enter new model name" disabled>
                                        <textarea id="unified-model-desc" class="form-input mt-2" rows="2" placeholder="Description (optional)" disabled></textarea>
                                    </div>
                                </div>
                            </div>

                            <!-- PM Frequency -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">
                                    PM Frequency <span class="text-red-500">*</span>
                                </label>
                                <select id="unified-pm-frequency-select" class="form-input" required disabled>
                                    <option value="">-- Select Model First --</option>
                                </select>
                                <p class="text-xs text-gray-500 mt-1">PM Frequency is required for all models</p>
                            </div>

                            <!-- PM Checklist -->
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2">
                                    PM Checklist <span class="text-red-500">*</span>
                                </label>
                                <div class="space-y-3">
                                    <div>
                                        <label class="block text-xs text-gray-600 mb-1">Select Existing Checklist</label>
                                        <select id="unified-checklist-select" class="form-input">
                                            <option value="">-- Select Existing Checklist --</option>
                                        </select>
                                    </div>
                                    <div class="text-center text-gray-500 text-xs">OR</div>
                                    <div>
                                        <label class="block text-xs text-gray-600 mb-1">Create New Checklist</label>
                                        <input type="text" id="unified-checklist-new" class="form-input" placeholder="Enter checklist name">
                                        <textarea id="unified-checklist-desc" class="form-input mt-2" rows="2" placeholder="Description (optional)"></textarea>
                                        
                                        <!-- Checklist Items Section -->
                                        <div class="mt-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
                                            <div class="flex justify-between items-center mb-3">
                                                <label class="block text-sm font-semibold text-gray-700">Checklist Items</label>
                                                <div class="flex gap-2">
                                                    <button type="button" id="unified-checklist-import-csv" class="btn btn-secondary btn-sm text-xs">
                                                        <i class="fas fa-file-csv mr-1"></i>Import CSV
                                                    </button>
                                                    <button type="button" id="unified-checklist-import-xml" class="btn btn-secondary btn-sm text-xs">
                                                        <i class="fas fa-file-code mr-1"></i>Import XML
                                                    </button>
                                                    <button type="button" id="unified-checklist-add-item" class="btn btn-primary btn-sm text-xs">
                                                        <i class="fas fa-plus mr-1"></i>Add Item
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <!-- CSV/XML Import Area -->
                                            <div id="unified-checklist-import-area" class="mb-3" style="display: none;">
                                                <textarea id="unified-checklist-import-data" class="form-input text-xs" rows="4" placeholder="Paste CSV (comma-separated) or XML data here..."></textarea>
                                                <div class="flex gap-2 mt-2">
                                                    <button type="button" id="unified-checklist-parse-import" class="btn btn-primary btn-sm text-xs">
                                                        <i class="fas fa-check mr-1"></i>Parse & Add Items
                                                    </button>
                                                    <button type="button" id="unified-checklist-cancel-import" class="btn btn-secondary btn-sm text-xs">
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <!-- Checklist Items List -->
                                            <div id="unified-checklist-items-list" class="space-y-2 max-h-60 overflow-y-auto">
                                                <p class="text-xs text-gray-500 text-center py-4">No items yet. Click "Add Item" or import from CSV/XML.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Action Buttons -->
                            <div class="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
                                <button type="button" id="unified-mmd-cancel" class="btn btn-secondary order-2 sm:order-1">
                                    Cancel
                                </button>
                                <button type="submit" id="unified-mmd-save" class="btn btn-primary order-1 sm:order-2">
                                    <i class="fas fa-save mr-2"></i>Save Configuration
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('unified-mmd-modal');
        this.addModalStyles();
    }

    addModalStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #unified-mmd-modal .modal-content {
                pointer-events: auto;
            }
            #unified-mmd-modal .modal-content * {
                pointer-events: auto;
            }
            @media (max-width: 768px) {
                #unified-mmd-modal .modal-content {
                    max-width: 100%;
                    max-height: 100vh;
                    border-radius: 0;
                    margin: 0;
                }
            }
        `;
        if (!document.getElementById('unified-mmd-modal-styles')) {
            style.id = 'unified-mmd-modal-styles';
            document.head.appendChild(style);
        }
    }

    setupEventListeners() {
        // Close button
        const closeBtn = document.getElementById('unified-mmd-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.close();
            });
        }
        
        const cancelBtn = document.getElementById('unified-mmd-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.close();
            });
        }
        
        // Form submission
        const form = document.getElementById('unified-mmd-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await this.save();
            });
        }

        // Type selection - enable Make when Type is selected
        const typeSelect = document.getElementById('unified-type-select');
        if (typeSelect) {
            typeSelect.addEventListener('change', async (e) => {
                const typeId = e.target.value || null;
                if (typeId) {
                    await this.loadMakes(typeId);
                    this.enableMakeFields();
                } else {
                    this.disableMakeFields();
                    this.disableModelFields();
                }
            });
        }

        // Type new input - enable Make when Type is entered
        const typeNew = document.getElementById('unified-type-new');
        if (typeNew) {
            typeNew.addEventListener('input', () => {
                if (typeNew.value.trim()) {
                    this.enableMakeFields();
                } else if (!typeSelect?.value) {
                    this.disableMakeFields();
                }
            });
        }

        // Make selection - enable Model when Make is selected
        const makeSelect = document.getElementById('unified-make-select');
        if (makeSelect) {
            makeSelect.addEventListener('change', async (e) => {
                const makeId = e.target.value || null;
                if (makeId) {
                    await this.loadModels(makeId);
                    this.enableModelFields();
                } else {
                    this.disableModelFields();
                }
            });
        }

        // Make new input - enable Model when Make is entered
        const makeNew = document.getElementById('unified-make-new');
        if (makeNew) {
            makeNew.addEventListener('input', () => {
                if (makeNew.value.trim()) {
                    this.enableModelFields();
                } else if (!makeSelect?.value) {
                    this.disableModelFields();
                }
            });
        }

        // Model selection - enable PM Frequency when Model is selected
        const modelSelect = document.getElementById('unified-model-select');
        if (modelSelect) {
            modelSelect.addEventListener('change', () => {
                this.enablePMFrequency();
            });
        }

        // Model new input - enable PM Frequency when Model is entered
        const modelNew = document.getElementById('unified-model-new');
        if (modelNew) {
            modelNew.addEventListener('input', () => {
                if (modelNew.value.trim()) {
                    this.enablePMFrequency();
                } else if (!modelSelect?.value) {
                    this.disablePMFrequency();
                }
            });
        }

        // Prevent modal from closing when clicking inside - BUT allow buttons to work
        const modalContent = this.modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.addEventListener('click', (e) => {
                const target = e.target;
                const isButton = target.tagName === 'BUTTON' || target.closest('button') !== null;
                if (!isButton) {
                    e.stopPropagation();
                }
            }, false);
        }

        // Prevent backdrop clicks from closing - only close on direct backdrop click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        }, false);

        // Setup checklist handlers
        this.setupChecklistHandlers();
    }

    enableMakeFields() {
        const makeSelect = document.getElementById('unified-make-select');
        const makeNew = document.getElementById('unified-make-new');
        const makeDesc = document.getElementById('unified-make-desc');
        if (makeSelect) makeSelect.disabled = false;
        if (makeNew) makeNew.disabled = false;
        if (makeDesc) makeDesc.disabled = false;
    }

    disableMakeFields() {
        const makeSelect = document.getElementById('unified-make-select');
        const makeNew = document.getElementById('unified-make-new');
        const makeDesc = document.getElementById('unified-make-desc');
        if (makeSelect) { makeSelect.disabled = true; makeSelect.value = ''; }
        if (makeNew) { makeNew.disabled = true; makeNew.value = ''; }
        if (makeDesc) { makeDesc.disabled = true; makeDesc.value = ''; }
    }

    enableModelFields() {
        const modelSelect = document.getElementById('unified-model-select');
        const modelNew = document.getElementById('unified-model-new');
        const modelDesc = document.getElementById('unified-model-desc');
        if (modelSelect) modelSelect.disabled = false;
        if (modelNew) modelNew.disabled = false;
        if (modelDesc) modelDesc.disabled = false;
    }

    disableModelFields() {
        const modelSelect = document.getElementById('unified-model-select');
        const modelNew = document.getElementById('unified-model-new');
        const modelDesc = document.getElementById('unified-model-desc');
        if (modelSelect) { modelSelect.disabled = true; modelSelect.value = ''; }
        if (modelNew) { modelNew.disabled = true; modelNew.value = ''; }
        if (modelDesc) { modelDesc.disabled = true; modelDesc.value = ''; }
    }

    enablePMFrequency() {
        const pmSelect = document.getElementById('unified-pm-frequency-select');
        if (pmSelect) pmSelect.disabled = false;
    }

    disablePMFrequency() {
        const pmSelect = document.getElementById('unified-pm-frequency-select');
        if (pmSelect) { pmSelect.disabled = true; pmSelect.value = ''; }
    }

    async open(context = {}) {
        // Reset form
        this.reset();
        
        // Load initial data
        await this.loadTypes();
        await this.loadPMFrequencies();
        await this.loadChecklists();
        
        // If context has pre-selected values, populate them
        if (context.type_id) {
            document.getElementById('unified-type-select').value = context.type_id;
            await this.loadMakes(context.type_id);
            this.enableMakeFields();
        }
        if (context.make_id) {
            document.getElementById('unified-make-select').value = context.make_id;
            await this.loadModels(context.make_id);
            this.enableModelFields();
        }
        if (context.model_id) {
            document.getElementById('unified-model-select').value = context.model_id;
            this.enablePMFrequency();
        }

        // Store instance globally for inline handlers
        window.unifiedMMDModalInstance = this;

        this.modal.classList.add('active');
    }

    close() {
        this.modal.classList.remove('active');
        this.reset();
    }

    reset() {
        document.getElementById('unified-mmd-form').reset();
        this.disableMakeFields();
        this.disableModelFields();
        this.disablePMFrequency();
        this.checklistItems = [];
        this.renderChecklistItems();
        this.hideImportArea();
    }

    async loadTypes() {
        const { data, error } = await this.supabaseClient
            .from('equipment_types')
            .select('id, name')
            .eq('is_active', true)
            .is('deleted_at', null)
            .order('name');
        
        if (error) {
            console.error('Error loading types:', error);
            return;
        }

        const select = document.getElementById('unified-type-select');
        select.innerHTML = '<option value="">-- Select Existing Type --</option>';
        data.forEach(type => {
            const option = document.createElement('option');
            option.value = type.id;
            option.textContent = type.name;
            select.appendChild(option);
        });
    }

    async loadMakes(typeId) {
        if (!typeId) return;

        const { data, error } = await this.supabaseClient
            .from('equipment_makes')
            .select('id, name')
            .eq('type_id', typeId)
            .eq('is_active', true)
            .is('deleted_at', null)
            .order('name');
        
        if (error) {
            console.error('Error loading makes:', error);
            return;
        }

        const select = document.getElementById('unified-make-select');
        select.innerHTML = '<option value="">-- Select Existing Make --</option>';
        data.forEach(make => {
            const option = document.createElement('option');
            option.value = make.id;
            option.textContent = make.name;
            select.appendChild(option);
        });
    }

    async loadModels(makeId) {
        if (!makeId) return;

        const { data, error } = await this.supabaseClient
            .from('equipment_models')
            .select('id, name')
            .eq('make_id', makeId)
            .eq('is_active', true)
            .is('deleted_at', null)
            .order('name');
        
        if (error) {
            console.error('Error loading models:', error);
            return;
        }

        const select = document.getElementById('unified-model-select');
        select.innerHTML = '<option value="">-- Select Existing Model --</option>';
        data.forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = model.name;
            select.appendChild(option);
        });
    }

    async loadPMFrequencies() {
        const { data, error } = await this.supabaseClient
            .from('pm_frequencies')
            .select('id, name, days')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });
        
        if (error) {
            console.error('Error loading PM frequencies:', error);
            return;
        }

        const select = document.getElementById('unified-pm-frequency-select');
        select.innerHTML = '<option value="">-- Select PM Frequency --</option>';
        data.forEach(freq => {
            const option = document.createElement('option');
            option.value = freq.id;
            option.textContent = `${freq.name} (${freq.days} days)`;
            select.appendChild(option);
        });
    }

    async loadChecklists() {
        const { data, error } = await this.supabaseClient
            .from('checklists')
            .select('id, name')
            .eq('is_active', true)
            .order('name');
        
        if (error) {
            console.error('Error loading checklists:', error);
            return;
        }

        const select = document.getElementById('unified-checklist-select');
        select.innerHTML = '<option value="">-- Select Existing Checklist --</option>';
        if (data) {
            data.forEach(checklist => {
                const option = document.createElement('option');
                option.value = checklist.id;
                option.textContent = checklist.name;
                select.appendChild(option);
            });
        }
    }

    addChecklistItem() {
        const item = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            task_name: '',
            task_description: '',
            task_type: 'checkbox',
            is_required: false,
            sort_order: this.checklistItems.length
        };
        this.checklistItems.push(item);
        this.renderChecklistItems();
    }

    removeChecklistItem(itemId) {
        this.checklistItems = this.checklistItems.filter(item => item.id !== itemId);
        // Reorder
        this.checklistItems.forEach((item, index) => {
            item.sort_order = index;
        });
        this.renderChecklistItems();
    }

    updateChecklistItem(itemId, field, value) {
        const item = this.checklistItems.find(i => i.id === itemId);
        if (item) {
            item[field] = value;
        }
    }

    renderChecklistItems() {
        const container = document.getElementById('unified-checklist-items-list');
        if (!container) return;

        if (this.checklistItems.length === 0) {
            container.innerHTML = '<p class="text-xs text-gray-500 text-center py-4">No items yet. Click "Add Item" or import from CSV/XML.</p>';
            return;
        }

        container.innerHTML = this.checklistItems.map((item, index) => `
            <div class="bg-white border border-gray-200 rounded p-3 flex gap-3 items-start" data-item-id="${item.id}">
                <div class="flex-1 space-y-2">
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-semibold text-gray-600 w-8">${index + 1}.</span>
                        <input type="text" 
                               class="form-input text-sm flex-1" 
                               placeholder="Task name *" 
                               value="${this.escapeHtml(item.task_name)}"
                               onchange="window.unifiedMMDModalInstance?.updateChecklistItem('${item.id}', 'task_name', this.value)">
                    </div>
                    <textarea class="form-input text-xs" 
                              rows="2" 
                              placeholder="Task description (optional)"
                              onchange="window.unifiedMMDModalInstance?.updateChecklistItem('${item.id}', 'task_description', this.value)">${this.escapeHtml(item.task_description || '')}</textarea>
                    <div class="flex items-center gap-4 text-xs">
                        <label class="flex items-center gap-1">
                            <input type="checkbox" 
                                   ${item.is_required ? 'checked' : ''}
                                   onchange="window.unifiedMMDModalInstance?.updateChecklistItem('${item.id}', 'is_required', this.checked)">
                            <span>Required</span>
                        </label>
                        <select class="form-input text-xs" 
                                onchange="window.unifiedMMDModalInstance?.updateChecklistItem('${item.id}', 'task_type', this.value)">
                            <option value="checkbox" ${item.task_type === 'checkbox' ? 'selected' : ''}>Checkbox</option>
                            <option value="text" ${item.task_type === 'text' ? 'selected' : ''}>Text Input</option>
                            <option value="number" ${item.task_type === 'number' ? 'selected' : ''}>Number</option>
                        </select>
                    </div>
                </div>
                <button type="button" 
                        class="text-red-500 hover:text-red-700 text-sm"
                        onclick="window.unifiedMMDModalInstance?.removeChecklistItem('${item.id}')"
                        title="Remove item">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    showImportArea(format) {
        const importArea = document.getElementById('unified-checklist-import-area');
        const importData = document.getElementById('unified-checklist-import-data');
        if (importArea && importData) {
            importArea.style.display = 'block';
            if (format === 'csv') {
                importData.placeholder = 'Paste CSV data (comma-separated). Format: Task Name, Description, Required (true/false), Type (checkbox/text/number)\nExample:\nCheck battery voltage, Measure and record voltage, true, checkbox\nInspect cables, Check for damage or wear, true, checkbox';
            } else if (format === 'xml') {
                importData.placeholder = 'Paste XML data. Format:\n<checklist>\n  <item>\n    <name>Task Name</name>\n    <description>Description</description>\n    <required>true</required>\n    <type>checkbox</type>\n  </item>\n</checklist>';
            }
            importData.value = '';
            importData.focus();
        }
    }

    hideImportArea() {
        const importArea = document.getElementById('unified-checklist-import-area');
        const importData = document.getElementById('unified-checklist-import-data');
        if (importArea) importArea.style.display = 'none';
        if (importData) importData.value = '';
    }

    parseAndImportItems() {
        const importData = document.getElementById('unified-checklist-import-data').value.trim();
        if (!importData) {
            alert('Please paste data to import');
            return;
        }

        try {
            let items = [];
            
            // Try CSV first
            if (importData.includes(',') || importData.includes('\t')) {
                items = this.parseCSV(importData);
            } else if (importData.trim().startsWith('<')) {
                // Try XML
                items = this.parseXML(importData);
            } else {
                // Try line-by-line (simple format)
                items = this.parseSimpleFormat(importData);
            }

            if (items.length === 0) {
                alert('No items could be parsed from the data. Please check the format.');
                return;
            }

            // Add items to checklist
            items.forEach(item => {
                const checklistItem = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    task_name: item.name || item.task_name || '',
                    task_description: item.description || item.task_description || '',
                    task_type: item.type || item.task_type || 'checkbox',
                    is_required: item.required === true || item.required === 'true' || item.is_required === true,
                    sort_order: this.checklistItems.length
                };
                this.checklistItems.push(checklistItem);
            });

            this.renderChecklistItems();
            this.hideImportArea();
            
            if (window.showToast) {
                window.showToast(`Imported ${items.length} checklist item(s)`, 'success');
            }
        } catch (error) {
            console.error('Error parsing import data:', error);
            alert(`Error parsing data: ${error.message}`);
        }
    }

    parseCSV(data) {
        const lines = data.split('\n').filter(line => line.trim());
        const items = [];
        
        // Skip header if present
        let startIndex = 0;
        const firstLine = lines[0].toLowerCase();
        if (firstLine.includes('task') || firstLine.includes('name') || firstLine.includes('description')) {
            startIndex = 1;
        }

        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Parse CSV line (handle quoted fields)
            const fields = this.parseCSVLine(line);
            
            if (fields.length >= 1) {
                items.push({
                    name: fields[0] || '',
                    description: fields[1] || '',
                    required: fields[2] === 'true' || fields[2] === '1' || fields[2] === 'yes',
                    type: fields[3] || 'checkbox'
                });
            }
        }

        return items;
    }

    parseCSVLine(line) {
        const fields = [];
        let currentField = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                fields.push(currentField.trim());
                currentField = '';
            } else {
                currentField += char;
            }
        }
        fields.push(currentField.trim()); // Add last field

        return fields;
    }

    parseXML(data) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, 'text/xml');
        
        // Check for parsing errors
        const parseError = xmlDoc.querySelector('parsererror');
        if (parseError) {
            throw new Error('Invalid XML format: ' + parseError.textContent);
        }

        const items = [];
        const itemNodes = xmlDoc.querySelectorAll('item, checklist-item, task');
        
        itemNodes.forEach(node => {
            const name = node.querySelector('name, task-name, title')?.textContent || '';
            const description = node.querySelector('description, desc, task-description')?.textContent || '';
            const required = node.querySelector('required, is-required')?.textContent || 'false';
            const type = node.querySelector('type, task-type')?.textContent || 'checkbox';
            
            if (name) {
                items.push({
                    name: name.trim(),
                    description: description.trim(),
                    required: required.toLowerCase() === 'true' || required === '1',
                    type: type.trim() || 'checkbox'
                });
            }
        });

        return items;
    }

    parseSimpleFormat(data) {
        const lines = data.split('\n').filter(line => line.trim());
        return lines.map(line => ({
            name: line.trim(),
            description: '',
            required: false,
            type: 'checkbox'
        }));
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async save() {
        try {
            // Get form values
            const typeSelect = document.getElementById('unified-type-select').value;
            const typeNew = document.getElementById('unified-type-new').value.trim();
            const makeSelect = document.getElementById('unified-make-select').value;
            const makeNew = document.getElementById('unified-make-new').value.trim();
            const modelSelect = document.getElementById('unified-model-select').value;
            const modelNew = document.getElementById('unified-model-new').value.trim();
            const pmFrequencyId = document.getElementById('unified-pm-frequency-select').value;
            const checklistSelect = document.getElementById('unified-checklist-select').value;
            const checklistNew = document.getElementById('unified-checklist-new').value.trim();

            // Validate
            if (!typeSelect && !typeNew) {
                alert('Please select or enter an Equipment Type');
                return;
            }
            if (!makeSelect && !makeNew) {
                alert('Please select or enter a Make');
                return;
            }
            if (!modelSelect && !modelNew) {
                alert('Please select or enter a Model');
                return;
            }
            if (!pmFrequencyId) {
                alert('PM Frequency is required');
                return;
            }

            let typeId = typeSelect;
            let makeId = makeSelect;
            let modelId = modelSelect;

            // Create Type if needed
            if (!typeId && typeNew) {
                const { data, error } = await this.supabaseClient
                    .from('equipment_types')
                    .insert([{
                        name: typeNew,
                        description: document.getElementById('unified-type-desc').value.trim() || null,
                        is_active: true
                    }])
                    .select()
                    .single();
                
                if (error) throw error;
                typeId = data.id;
            }

            // Create Make if needed
            if (!makeId && makeNew && typeId) {
                const { data, error } = await this.supabaseClient
                    .from('equipment_makes')
                    .insert([{
                        name: makeNew,
                        type_id: typeId,
                        description: document.getElementById('unified-make-desc').value.trim() || null,
                        is_active: true
                    }])
                    .select()
                    .single();
                
                if (error) throw error;
                makeId = data.id;
            }

            // Create Model if needed
            if (!modelId && modelNew && makeId && pmFrequencyId) {
                const { data, error } = await this.supabaseClient
                    .from('equipment_models')
                    .insert([{
                        name: modelNew,
                        make_id: makeId,
                        pm_frequency_id: pmFrequencyId,
                        description: document.getElementById('unified-model-desc').value.trim() || null,
                        is_active: true
                    }])
                    .select()
                    .single();
                
                if (error) throw error;
                modelId = data.id;
            } else if (modelId && pmFrequencyId) {
                // Update existing model with PM frequency
                await this.supabaseClient
                    .from('equipment_models')
                    .update({ pm_frequency_id: pmFrequencyId })
                    .eq('id', modelId);
            }

            // Create checklist if needed
            let checklistId = checklistSelect;
            if (!checklistId && checklistNew) {
                // Create new checklist
                const { data: checklistData, error: checklistError } = await this.supabaseClient
                    .from('checklists')
                    .insert([{
                        name: checklistNew,
                        description: document.getElementById('unified-checklist-desc').value.trim() || null,
                        category: 'PM',
                        is_active: true
                    }])
                    .select()
                    .single();
                
                if (checklistError) throw checklistError;
                checklistId = checklistData.id;

                // Create checklist items
                if (this.checklistItems.length > 0) {
                    const itemsToSave = this.checklistItems
                        .filter(item => item.task_name.trim())
                        .map((item, index) => ({
                            checklist_id: checklistId,
                            task_name: item.task_name.trim(),
                            task_description: item.task_description?.trim() || null,
                            task_type: item.task_type || 'checkbox',
                            sort_order: index,
                            is_required: item.is_required || false
                        }));

                    if (itemsToSave.length > 0) {
                        const { error: itemsError } = await this.supabaseClient
                            .from('checklist_items')
                            .insert(itemsToSave);
                        
                        if (itemsError) throw itemsError;
                    }
                }
            }

            // Create device configuration if checklist is selected
            if (checklistId && modelId) {
                try {
                    const { data: existing } = await this.supabaseClient
                        .from('device_configurations')
                        .select('id')
                        .eq('category_id', typeId)
                        .eq('make_id', makeId)
                        .eq('model_id', modelId)
                        .maybeSingle();

                    if (!existing) {
                        const typeName = document.getElementById('unified-type-select')?.selectedOptions[0]?.textContent || typeNew;
                        const makeName = document.getElementById('unified-make-select')?.selectedOptions[0]?.textContent || makeNew;
                        const modelName = document.getElementById('unified-model-select')?.selectedOptions[0]?.textContent || modelNew;

                        await this.supabaseClient
                            .from('device_configurations')
                            .insert([{
                                name: `${typeName} - ${makeName} - ${modelName}`,
                                category_id: typeId,
                                make_id: makeId,
                                model_id: modelId,
                                pm_frequency_id: pmFrequencyId,
                                checklist_id: checklistId,
                                is_active: true
                            }]);
                    } else if (checklistId) {
                        // Update existing configuration with checklist
                        await this.supabaseClient
                            .from('device_configurations')
                            .update({ checklist_id: checklistId })
                            .eq('id', existing.id);
                    }
                } catch (configError) {
                    console.warn('Could not create device configuration:', configError);
                }
            }

            // Invalidate caches - get instance from mmdAssetFormManager or create new one
            try {
                if (window.mmdAssetFormManager && window.mmdAssetFormManager.referenceManager) {
                    window.mmdAssetFormManager.referenceManager.invalidateCache();
                } else if (window.MMDReferenceManager) {
                    // Try static method first
                    if (typeof window.MMDReferenceManager.invalidateAllCaches === 'function') {
                        window.MMDReferenceManager.invalidateAllCaches();
                    } else {
                        // Create a temporary instance to invalidate
                        const tempInstance = new window.MMDReferenceManager(this.supabaseClient);
                        tempInstance.invalidateCache();
                    }
                }
            } catch (cacheError) {
                console.warn('Could not invalidate MMD cache:', cacheError);
            }

            // Refresh dropdowns if asset modal is open
            if (window.mmdAssetFormManager) {
                await window.mmdAssetFormManager.loadMMDHierarchy();
                
                // Update dropdowns with new values
                if (typeId) {
                    const typeSelect = document.getElementById('mmd-type-select');
                    if (typeSelect) {
                        typeSelect.value = typeId;
                        if (window.handleMMDTypeChange) window.handleMMDTypeChange();
                    }
                }
                if (makeId) {
                    const makeSelect = document.getElementById('mmd-make-select');
                    if (makeSelect) {
                        setTimeout(() => {
                            makeSelect.value = makeId;
                            if (window.handleMMDMakeChange) window.handleMMDMakeChange();
                        }, 100);
                    }
                }
                if (modelId) {
                    const modelSelect = document.getElementById('mmd-model-select');
                    if (modelSelect) {
                        setTimeout(() => {
                            modelSelect.value = modelId;
                            if (window.handleMMDModelChange) window.handleMMDModelChange();
                        }, 200);
                    }
                }
            }

            // Show success message
            if (window.showToast) {
                window.showToast('Equipment configuration created successfully!', 'success');
            } else {
                alert('Equipment configuration created successfully!');
            }

            this.close();
        } catch (error) {
            console.error('Error saving configuration:', error);
            if (window.showToast) {
                window.showToast(`Error: ${error.message}`, 'error');
            } else {
                alert(`Error: ${error.message}`);
            }
        }
    }
}

// Expose globally
window.UnifiedMMDModal = UnifiedMMDModal;

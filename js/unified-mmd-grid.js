/**
 * Unified MMD Grid Manager
 * Single Excel-style grid showing Type → Make → Model hierarchy
 */
class UnifiedMMDGrid {
    constructor(containerId, supabaseClient) {
        this.container = document.getElementById(containerId);
        this.supabaseClient = supabaseClient;
        this.data = [];
        this.currentEdit = null;
    }

    async init() {
        await this.loadData();
        this.render();
        this.setupEventListeners();
    }

    async loadData() {
        try {
            const [typesResult, makesResult, modelsResult, frequenciesResult] = await Promise.all([
                this.supabaseClient
                    .from('equipment_types')
                    .select('id, name, description, is_active')
                    .is('deleted_at', null)
                    .order('name'),
                this.supabaseClient
                    .from('equipment_makes')
                    .select('id, name, type_id, description, is_active')
                    .is('deleted_at', null)
                    .order('name'),
                this.supabaseClient
                    .from('equipment_models')
                    .select('id, name, make_id, pm_frequency_id, description, is_active')
                    .is('deleted_at', null)
                    .order('name'),
                this.supabaseClient
                    .from('pm_frequencies')
                    .select('id, name, days')
                    .eq('is_active', true)
                    .order('sort_order')
            ]);

            const types = typesResult.data || [];
            const makes = makesResult.data || [];
            const models = modelsResult.data || [];
            const frequencies = frequenciesResult.data || [];

            // Build flat structure with hierarchy
            this.data = [];
            
            types.forEach(type => {
                const typeMakes = makes.filter(m => m.type_id === type.id);
                
                if (typeMakes.length === 0) {
                    // Type with no makes - show type row
                    this.data.push({
                        id: type.id,
                        level: 'type',
                        type_id: type.id,
                        type_name: type.name,
                        make_id: null,
                        make_name: null,
                        model_id: null,
                        model_name: null,
                        pm_frequency_id: null,
                        pm_frequency_name: null,
                        description: type.description,
                        is_active: type.is_active
                    });
                } else {
                    typeMakes.forEach(make => {
                        const makeModels = models.filter(m => m.make_id === make.id);
                        
                        if (makeModels.length === 0) {
                            // Make with no models - show make row
                            this.data.push({
                                id: `make-${make.id}`,
                                level: 'make',
                                type_id: type.id,
                                type_name: type.name,
                                make_id: make.id,
                                make_name: make.name,
                                model_id: null,
                                model_name: null,
                                pm_frequency_id: null,
                                pm_frequency_name: null,
                                description: make.description,
                                is_active: make.is_active
                            });
                        } else {
                            makeModels.forEach(model => {
                                const pmFreq = frequencies.find(f => f.id === model.pm_frequency_id);
                                this.data.push({
                                    id: `model-${model.id}`,
                                    level: 'model',
                                    type_id: type.id,
                                    type_name: type.name,
                                    make_id: make.id,
                                    make_name: make.name,
                                    model_id: model.id,
                                    model_name: model.name,
                                    pm_frequency_id: model.pm_frequency_id,
                                    pm_frequency_name: pmFreq ? `${pmFreq.name} (${pmFreq.days} days)` : null,
                                    description: model.description,
                                    is_active: model.is_active
                                });
                            });
                        }
                    });
                }
            });

            // Store reference data
            this.types = types;
            this.makes = makes;
            this.models = models;
            this.frequencies = frequencies;
        } catch (error) {
            console.error('Error loading MMD data:', error);
            throw error;
        }
    }

    render() {
        if (!this.container) return;

        const table = document.createElement('table');
        table.className = 'w-full border-collapse';
        table.setAttribute('tabindex', '0');

        // Header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.className = 'bg-slate-100 border-b-2 border-slate-300';
        
        const headers = [
            { label: 'Type', width: '20%' },
            { label: 'Make', width: '20%' },
            { label: 'Model', width: '20%' },
            { label: 'PM Frequency', width: '15%' },
            { label: 'Description', width: '15%' },
            { label: 'Active', width: '5%' },
            { label: 'Actions', width: '5%' }
        ];

        headers.forEach(h => {
            const th = document.createElement('th');
            th.className = 'px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase border-r border-slate-200';
            th.textContent = h.label;
            if (h.width) th.style.width = h.width;
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Body
        const tbody = document.createElement('tbody');
        tbody.id = 'unified-mmd-tbody';

        this.data.forEach((row, index) => {
            tbody.appendChild(this.createRow(row, index));
        });

        // Add new row button
        const addRow = document.createElement('tr');
        addRow.className = 'bg-slate-50 border-t-2 border-slate-300';
        const addCell = document.createElement('td');
        addCell.colSpan = headers.length;
        addCell.className = 'px-4 py-3';
        
        const addButton = document.createElement('button');
        addButton.className = 'btn btn-secondary btn-sm';
        addButton.innerHTML = '<i class="fas fa-plus mr-1"></i> Add New Row';
        addButton.onclick = () => this.addNewRow();
        addCell.appendChild(addButton);
        addRow.appendChild(addCell);
        tbody.appendChild(addRow);

        table.appendChild(tbody);
        this.container.innerHTML = '';
        this.container.appendChild(table);
    }

    createRow(rowData, rowIndex) {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-200 hover:bg-slate-50';
        tr.dataset.rowIndex = rowIndex;
        tr.dataset.level = rowData.level;

        // Type column
        const typeTd = this.createCell(rowData.type_name || '', rowData, 'type_name', rowIndex, false);
        tr.appendChild(typeTd);

        // Make column
        const makeTd = this.createCell(rowData.make_name || '', rowData, 'make_name', rowIndex, rowData.level === 'type');
        tr.appendChild(makeTd);

        // Model column
        const modelTd = this.createCell(rowData.model_name || '', rowData, 'model_name', rowIndex, rowData.level !== 'model');
        tr.appendChild(modelTd);

        // PM Frequency column
        const pmTd = this.createCell(rowData.pm_frequency_name || '', rowData, 'pm_frequency_name', rowIndex, rowData.level !== 'model');
        tr.appendChild(pmTd);

        // Description column
        const descTd = this.createCell(rowData.description || '', rowData, 'description', rowIndex, false);
        tr.appendChild(descTd);

        // Active column
        const activeTd = document.createElement('td');
        activeTd.className = 'px-4 py-2 border-r border-slate-100 text-center';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = rowData.is_active !== false;
        checkbox.className = 'cursor-pointer';
        checkbox.onchange = () => {
            rowData.is_active = checkbox.checked;
            this.saveRow(rowIndex);
        };
        activeTd.appendChild(checkbox);
        tr.appendChild(activeTd);

        // Actions column
        const actionsTd = document.createElement('td');
        actionsTd.className = 'px-4 py-2';
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'flex gap-2';

        const saveBtn = document.createElement('button');
        saveBtn.className = 'text-blue-600 hover:text-blue-800 text-sm';
        saveBtn.innerHTML = '<i class="fas fa-save"></i>';
        saveBtn.title = 'Save';
        saveBtn.onclick = () => this.saveRow(rowIndex);
        actionsDiv.appendChild(saveBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'text-red-600 hover:text-red-800 text-sm';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.title = 'Archive';
        deleteBtn.onclick = () => this.deleteRow(rowIndex);
        actionsDiv.appendChild(deleteBtn);

        actionsTd.appendChild(actionsDiv);
        tr.appendChild(actionsTd);

        return tr;
    }

    createCell(value, rowData, field, rowIndex, disabled) {
        const td = document.createElement('td');
        td.className = 'px-4 py-2 border-r border-slate-100';
        td.dataset.field = field;
        td.dataset.rowIndex = rowIndex;

        if (disabled) {
            td.textContent = value;
            td.className += ' bg-slate-50 text-slate-400';
        } else {
            td.className += ' cursor-pointer editable-cell';
            td.textContent = value;
            td.onclick = () => this.startEdit(td, rowIndex, field, rowData);
        }

        return td;
    }

    startEdit(cell, rowIndex, field, rowData) {
        if (this.currentEdit) {
            this.cancelEdit();
        }

        this.currentEdit = { cell, rowIndex, field, originalValue: cell.textContent, rowData };

        // Handle different field types
        if (field === 'type_name') {
            // Type: Dropdown for existing or text input for new
            const container = document.createElement('div');
            container.className = 'space-y-1';
            
            const select = document.createElement('select');
            select.className = 'w-full px-2 py-1 border border-blue-500 rounded text-sm';
            select.innerHTML = '<option value="">-- Select Existing --</option>' +
                this.types.map(t => 
                    `<option value="${t.id}" ${rowData.type_id === t.id ? 'selected' : ''}>${t.name}</option>`
                ).join('');
            
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'w-full px-2 py-1 border border-blue-500 rounded text-sm';
            input.placeholder = 'Or type new type name';
            input.value = rowData.type_id ? '' : (rowData.type_name || '');
            
            container.appendChild(select);
            container.appendChild(input);
            
            cell.textContent = '';
            cell.appendChild(container);
            select.focus();

            const finish = () => {
                const selectedValue = select.value;
                const inputValue = input.value.trim();
                if (selectedValue) {
                    this.finishEdit(selectedValue, 'type_id');
                } else if (inputValue) {
                    this.finishEdit(inputValue, 'type_name');
                } else {
                    this.cancelEdit();
                }
            };

            select.onchange = () => {
                if (select.value) input.value = '';
            };
            select.onblur = finish;
            input.onblur = finish;
            select.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault();
                    finish();
                } else if (e.key === 'Escape') {
                    this.cancelEdit();
                }
            };
            input.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault();
                    finish();
                } else if (e.key === 'Escape') {
                    this.cancelEdit();
                }
            };
        } else if (field === 'make_name') {
            // Make: Allow dropdown (filtered by type) or text input for new makes
            if (!rowData.type_id) {
                alert('Please select a Type first');
                this.cancelEdit();
                return;
            }
            
            const container = document.createElement('div');
            container.className = 'relative';
            
            const select = document.createElement('select');
            select.className = 'w-full px-2 py-1 border border-blue-500 rounded mb-1';
            const typeMakes = this.makes.filter(m => m.type_id === rowData.type_id);
            select.innerHTML = '<option value="">-- Select Existing --</option>' +
                typeMakes.map(m => 
                    `<option value="${m.id}" ${rowData.make_id === m.id ? 'selected' : ''}>${m.name}</option>`
                ).join('');
            
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'w-full px-2 py-1 border border-blue-500 rounded';
            input.placeholder = 'Or type new make name';
            input.value = rowData.make_id ? '' : rowData.make_name;
            
            container.appendChild(select);
            container.appendChild(input);
            
            cell.textContent = '';
            cell.appendChild(container);
            select.focus();

            const finish = () => {
                const selectedValue = select.value;
                const inputValue = input.value.trim();
                if (selectedValue) {
                    this.finishEdit(selectedValue, 'make_id');
                } else if (inputValue) {
                    this.finishEdit(inputValue, 'make_name');
                } else {
                    this.cancelEdit();
                }
            };

            select.onchange = () => {
                if (select.value) input.value = '';
            };
            select.onblur = finish;
            input.onblur = finish;
            select.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault();
                    finish();
                } else if (e.key === 'Escape') {
                    this.cancelEdit();
                }
            };
            input.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault();
                    finish();
                } else if (e.key === 'Escape') {
                    this.cancelEdit();
                }
            };
        } else if (field === 'model_name') {
            // Model text input
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'w-full px-2 py-1 border border-blue-500 rounded';
            input.value = cell.textContent.trim();
            
            cell.textContent = '';
            cell.appendChild(input);
            input.focus();
            input.select();

            input.onblur = () => this.finishEdit(input.value, 'model_name');
            input.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault();
                    this.finishEdit(input.value, 'model_name');
                } else if (e.key === 'Escape') {
                    this.cancelEdit();
                }
            };
        } else if (field === 'pm_frequency_name') {
            // PM Frequency dropdown
            const select = document.createElement('select');
            select.className = 'w-full px-2 py-1 border border-blue-500 rounded';
            select.innerHTML = '<option value="">-- Select --</option>' +
                this.frequencies.map(f => 
                    `<option value="${f.id}" ${rowData.pm_frequency_id === f.id ? 'selected' : ''}>${f.name} (${f.days} days)</option>`
                ).join('');
            
            cell.textContent = '';
            cell.appendChild(select);
            select.focus();

            select.onblur = () => this.finishEdit(select.value, 'pm_frequency_id');
            select.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault();
                    this.finishEdit(select.value, 'pm_frequency_id');
                } else if (e.key === 'Escape') {
                    this.cancelEdit();
                }
            };
        } else {
            // Description text input
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'w-full px-2 py-1 border border-blue-500 rounded';
            input.value = cell.textContent.trim();
            
            cell.textContent = '';
            cell.appendChild(input);
            input.focus();
            input.select();

            input.onblur = () => this.finishEdit(input.value, field);
            input.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault();
                    this.finishEdit(input.value, field);
                } else if (e.key === 'Escape') {
                    this.cancelEdit();
                }
            };
        }
    }

    finishEdit(value, field) {
        if (!this.currentEdit) return;

        const { cell, rowIndex, rowData } = this.currentEdit;

        // Update row data
        if (field === 'type_id') {
            const type = this.types.find(t => t.id === value);
            const oldTypeId = rowData.type_id;
            rowData.type_id = value;
            rowData.type_name = type ? type.name : '';
            // Clear make and model if type changes
            if (oldTypeId !== value) {
                rowData.make_id = null;
                rowData.make_name = null;
                rowData.model_id = null;
                rowData.model_name = null;
                rowData.pm_frequency_id = null;
                rowData.pm_frequency_name = null;
            }
        } else if (field === 'type_name') {
            // New type name entered
            rowData.type_name = value;
            rowData.type_id = null; // Will be created on save
        } else if (field === 'make_id') {
            const make = this.makes.find(m => m.id === value);
            const oldMakeId = rowData.make_id;
            rowData.make_id = value;
            rowData.make_name = make ? make.name : '';
            // Clear model if make changes
            if (oldMakeId !== value) {
                rowData.model_id = null;
                rowData.model_name = null;
                rowData.pm_frequency_id = null;
                rowData.pm_frequency_name = null;
            }
        } else if (field === 'make_name') {
            // New make name entered
            rowData.make_name = value;
            rowData.make_id = null; // Will be created on save
        } else if (field === 'pm_frequency_id') {
            const freq = this.frequencies.find(f => f.id === value);
            rowData.pm_frequency_id = value;
            rowData.pm_frequency_name = freq ? `${freq.name} (${freq.days} days)` : '';
        } else if (field === 'model_name') {
            rowData.model_name = value;
        } else {
            rowData[field] = value;
        }

        // Update display
        if (field === 'type_id' || field === 'type_name') {
            cell.textContent = rowData.type_name;
        } else if (field === 'make_id' || field === 'make_name') {
            cell.textContent = rowData.make_name;
        } else if (field === 'pm_frequency_id') {
            cell.textContent = rowData.pm_frequency_name;
        } else {
            cell.textContent = value || '';
        }

        this.currentEdit = null;
    }

    cancelEdit() {
        if (!this.currentEdit) return;
        const { cell, originalValue } = this.currentEdit;
        cell.textContent = originalValue;
        this.currentEdit = null;
    }

    addNewRow() {
        const newRow = {
            id: `new-${Date.now()}`,
            level: 'type',
            type_id: null,
            type_name: '',
            make_id: null,
            make_name: null,
            model_id: null,
            model_name: null,
            pm_frequency_id: null,
            pm_frequency_name: null,
            description: '',
            is_active: true,
            _isNew: true
        };
        this.data.push(newRow);
        this.render();
    }

    async saveRow(rowIndex) {
        const rowData = this.data[rowIndex];
        
        try {
            // Determine what to save based on what's filled in
            if (rowData.model_id || (rowData.model_name && rowData.make_id && rowData.pm_frequency_id)) {
                // Save as Model
                if (!rowData.make_id || !rowData.model_name || !rowData.pm_frequency_id) {
                    alert('Make, Model name, and PM Frequency are required for Models');
                    return;
                }
                const payload = {
                    make_id: rowData.make_id,
                    name: rowData.model_name.trim(),
                    pm_frequency_id: rowData.pm_frequency_id,
                    description: rowData.description?.trim() || null,
                    is_active: rowData.is_active !== false
                };
                if (rowData._isNew || !rowData.model_id) {
                    const { data, error } = await this.supabaseClient
                        .from('equipment_models')
                        .insert([payload])
                        .select()
                        .single();
                    if (error) throw error;
                    rowData.model_id = data.id;
                    rowData.id = `model-${data.id}`;
                    rowData.level = 'model';
                } else {
                    const { error } = await this.supabaseClient
                        .from('equipment_models')
                        .update(payload)
                        .eq('id', rowData.model_id);
                    if (error) throw error;
                }
            } else if (rowData.make_id || (rowData.make_name && rowData.type_id)) {
                // Save as Make
                if (!rowData.type_id || !rowData.make_name) {
                    alert('Type and Make name are required for Makes');
                    return;
                }
                const payload = {
                    type_id: rowData.type_id,
                    name: rowData.make_name.trim(),
                    description: rowData.description?.trim() || null,
                    is_active: rowData.is_active !== false
                };
                if (rowData._isNew || !rowData.make_id) {
                    const { data, error } = await this.supabaseClient
                        .from('equipment_makes')
                        .insert([payload])
                        .select()
                        .single();
                    if (error) throw error;
                    rowData.make_id = data.id;
                    rowData.id = `make-${data.id}`;
                    rowData.level = 'make';
                } else {
                    const { error } = await this.supabaseClient
                        .from('equipment_makes')
                        .update(payload)
                        .eq('id', rowData.make_id);
                    if (error) throw error;
                }
            } else {
                // Save as Type
                if (!rowData.type_name) {
                    alert('Type name is required');
                    return;
                }
                const payload = {
                    name: rowData.type_name.trim(),
                    description: rowData.description?.trim() || null,
                    is_active: rowData.is_active !== false
                };
                if (rowData._isNew || !rowData.type_id) {
                    const { data, error } = await this.supabaseClient
                        .from('equipment_types')
                        .insert([payload])
                        .select()
                        .single();
                    if (error) throw error;
                    rowData.id = data.id;
                    rowData.type_id = data.id;
                    rowData.level = 'type';
                } else {
                    const { error } = await this.supabaseClient
                        .from('equipment_types')
                        .update(payload)
                        .eq('id', rowData.type_id);
                    if (error) throw error;
                }
            }

            rowData._isNew = false;
            
            // Invalidate cache
            if (window.MMDReferenceManager) {
                window.MMDReferenceManager.invalidateAllCaches();
            }

            // Reload data
            await this.loadData();
            this.render();
        } catch (error) {
            console.error('Error saving row:', error);
            alert(`Failed to save: ${error.message}`);
        }
    }

    async deleteRow(rowIndex) {
        const rowData = this.data[rowIndex];
        
        if (!confirm(`Are you sure you want to archive this ${rowData.level}?`)) {
            return;
        }

        try {
            if (rowData.level === 'type' && rowData.type_id) {
                await this.supabaseClient
                    .from('equipment_types')
                    .update({ deleted_at: new Date().toISOString() })
                    .eq('id', rowData.type_id);
            } else if (rowData.level === 'make' && rowData.make_id) {
                await this.supabaseClient
                    .from('equipment_makes')
                    .update({ deleted_at: new Date().toISOString() })
                    .eq('id', rowData.make_id);
            } else if (rowData.level === 'model' && rowData.model_id) {
                await this.supabaseClient
                    .from('equipment_models')
                    .update({ deleted_at: new Date().toISOString() })
                    .eq('id', rowData.model_id);
            }

            // Invalidate cache
            if (window.MMDReferenceManager) {
                window.MMDReferenceManager.invalidateAllCaches();
            }

            // Reload data
            await this.loadData();
            this.render();
        } catch (error) {
            console.error('Error deleting row:', error);
            alert(`Failed to archive: ${error.message}`);
        }
    }

    setupEventListeners() {
        // Click outside to cancel edit
        document.addEventListener('click', (e) => {
            if (this.currentEdit && !this.currentEdit.cell.contains(e.target)) {
                this.cancelEdit();
            }
        });
    }
}

if (typeof window !== 'undefined') {
    window.UnifiedMMDGrid = UnifiedMMDGrid;
}

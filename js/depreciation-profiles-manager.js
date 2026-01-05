/**
 * Depreciation Profiles Manager
 * Excel-style grid for managing depreciation profiles
 */
class DepreciationProfilesManager {
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
            const { data, error } = await this.supabaseClient
                .from('depreciation_profiles')
                .select('id, name, method, useful_life_years, salvage_value, start_date_rule, description, is_active, created_at, updated_at')
                .is('deleted_at', null)
                .order('name');

            if (error) throw error;
            this.data = data || [];
        } catch (error) {
            console.error('Error loading depreciation profiles:', error);
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
            { label: 'Profile Name', width: '20%' },
            { label: 'Method', width: '15%' },
            { label: 'Useful Life (Years)', width: '12%' },
            { label: 'Salvage Value ($)', width: '12%' },
            { label: 'Start Date Rule', width: '15%' },
            { label: 'Description', width: '16%' },
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
        tbody.id = 'depreciation-profiles-tbody';

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
        addButton.innerHTML = '<i class="fas fa-plus mr-1"></i> Add New Profile';
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

        // Name
        const nameTd = this.createCell(rowData.name || '', rowData, 'name', rowIndex, false);
        tr.appendChild(nameTd);

        // Method
        const methodTd = this.createCell(rowData.method || '', rowData, 'method', rowIndex, false);
        tr.appendChild(methodTd);

        // Useful Life
        const lifeTd = this.createCell(rowData.useful_life_years || '', rowData, 'useful_life_years', rowIndex, false);
        tr.appendChild(lifeTd);

        // Salvage Value
        const salvageTd = this.createCell(rowData.salvage_value || '0', rowData, 'salvage_value', rowIndex, false);
        tr.appendChild(salvageTd);

        // Start Date Rule
        const ruleTd = this.createCell(rowData.start_date_rule || 'purchase_date', rowData, 'start_date_rule', rowIndex, false);
        tr.appendChild(ruleTd);

        // Description
        const descTd = this.createCell(rowData.description || '', rowData, 'description', rowIndex, false);
        tr.appendChild(descTd);

        // Active
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

        // Actions
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

        if (field === 'method') {
            // Method dropdown
            const select = document.createElement('select');
            select.className = 'w-full px-2 py-1 border border-blue-500 rounded text-sm';
            const methods = [
                { value: 'straight-line', label: 'Straight-Line' },
                { value: 'declining-balance', label: 'Declining Balance' },
                { value: 'sum-of-years', label: 'Sum of Years' },
                { value: 'units-of-production', label: 'Units of Production' },
                { value: 'none', label: 'None' }
            ];
            select.innerHTML = methods.map(m => 
                `<option value="${m.value}" ${rowData.method === m.value ? 'selected' : ''}>${m.label}</option>`
            ).join('');
            
            cell.textContent = '';
            cell.appendChild(select);
            select.focus();

            select.onblur = () => this.finishEdit(select.value, field);
            select.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault();
                    this.finishEdit(select.value, field);
                } else if (e.key === 'Escape') {
                    this.cancelEdit();
                }
            };
        } else if (field === 'start_date_rule') {
            // Start date rule dropdown
            const select = document.createElement('select');
            select.className = 'w-full px-2 py-1 border border-blue-500 rounded text-sm';
            const rules = [
                { value: 'purchase_date', label: 'Purchase Date' },
                { value: 'in_service_date', label: 'In Service Date' },
                { value: 'custom', label: 'Custom Date' }
            ];
            select.innerHTML = rules.map(r => 
                `<option value="${r.value}" ${rowData.start_date_rule === r.value ? 'selected' : ''}>${r.label}</option>`
            ).join('');
            
            cell.textContent = '';
            cell.appendChild(select);
            select.focus();

            select.onblur = () => this.finishEdit(select.value, field);
            select.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault();
                    this.finishEdit(select.value, field);
                } else if (e.key === 'Escape') {
                    this.cancelEdit();
                }
            };
        } else if (field === 'useful_life_years' || field === 'salvage_value') {
            // Numeric input
            const input = document.createElement('input');
            input.type = 'number';
            input.step = field === 'useful_life_years' ? '0.5' : '0.01';
            input.min = '0';
            input.className = 'w-full px-2 py-1 border border-blue-500 rounded text-sm';
            input.value = value || '0';
            
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
        } else {
            // Text input
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'w-full px-2 py-1 border border-blue-500 rounded text-sm';
            input.value = value || '';
            
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
        if (field === 'useful_life_years' || field === 'salvage_value') {
            rowData[field] = parseFloat(value) || 0;
        } else if (field === 'method') {
            rowData[field] = value;
        } else {
            rowData[field] = value.trim();
        }

        // Update display
        if (field === 'method') {
            const methods = {
                'straight-line': 'Straight-Line',
                'declining-balance': 'Declining Balance',
                'sum-of-years': 'Sum of Years',
                'units-of-production': 'Units of Production',
                'none': 'None'
            };
            cell.textContent = methods[value] || value;
        } else if (field === 'start_date_rule') {
            const rules = {
                'purchase_date': 'Purchase Date',
                'in_service_date': 'In Service Date',
                'custom': 'Custom Date'
            };
            cell.textContent = rules[value] || value;
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
            name: '',
            method: 'straight-line',
            useful_life_years: 5,
            salvage_value: 0,
            start_date_rule: 'purchase_date',
            description: '',
            is_active: true,
            _isNew: true
        };
        this.data.push(newRow);
        this.render();
    }

    async saveRow(rowIndex) {
        const rowData = this.data[rowIndex];
        
        // Validate
        if (!rowData.name || !rowData.name.trim()) {
            alert('Profile name is required');
            return;
        }
        if (!rowData.method) {
            alert('Depreciation method is required');
            return;
        }
        if (!rowData.useful_life_years || rowData.useful_life_years <= 0) {
            alert('Useful life must be greater than 0');
            return;
        }
        if (rowData.salvage_value < 0) {
            alert('Salvage value cannot be negative');
            return;
        }

        try {
            const { data: { user } } = await this.supabaseClient.auth.getUser();
            const payload = {
                name: rowData.name.trim(),
                method: rowData.method,
                useful_life_years: rowData.useful_life_years,
                salvage_value: rowData.salvage_value || 0,
                start_date_rule: rowData.start_date_rule || 'purchase_date',
                description: rowData.description?.trim() || null,
                is_active: rowData.is_active !== false,
                updated_by: user?.id
            };

            if (rowData._isNew || !rowData.id || rowData.id.toString().startsWith('new-')) {
                payload.created_by = user?.id;
                const { data, error } = await this.supabaseClient
                    .from('depreciation_profiles')
                    .insert([payload])
                    .select()
                    .single();
                if (error) throw error;
                rowData.id = data.id;
            } else {
                const { error } = await this.supabaseClient
                    .from('depreciation_profiles')
                    .update(payload)
                    .eq('id', rowData.id);
                if (error) throw error;
            }

            rowData._isNew = false;
            
            // Invalidate cache if exists
            if (window.DepreciationReferenceManager) {
                window.DepreciationReferenceManager.invalidateCache();
            }

            // Reload data
            await this.loadData();
            this.render();
            
            // Show warning if profile is in use
            const { count } = await this.supabaseClient
                .from('assets')
                .select('id', { count: 'exact', head: true })
                .eq('depreciation_profile_id', rowData.id)
                .is('deleted_at', null);
            
            if (count > 0) {
                console.log(`Profile "${rowData.name}" is used by ${count} asset(s)`);
            }
        } catch (error) {
            console.error('Error saving depreciation profile:', error);
            alert(`Failed to save: ${error.message}`);
        }
    }

    async deleteRow(rowIndex) {
        const rowData = this.data[rowIndex];
        
        // Check if in use
        const { count } = await this.supabaseClient
            .from('assets')
            .select('id', { count: 'exact', head: true })
            .eq('depreciation_profile_id', rowData.id)
            .is('deleted_at', null);
        
        if (count > 0) {
            alert(`Cannot archive: This profile is used by ${count} asset(s). Please reassign those assets first.`);
            return;
        }
        
        if (!confirm(`Are you sure you want to archive "${rowData.name}"?`)) {
            return;
        }

        try {
            const { error } = await this.supabaseClient
                .from('depreciation_profiles')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', rowData.id);
            if (error) throw error;

            // Invalidate cache if exists
            if (window.DepreciationReferenceManager) {
                window.DepreciationReferenceManager.invalidateCache();
            }

            // Reload data
            await this.loadData();
            this.render();
        } catch (error) {
            console.error('Error archiving depreciation profile:', error);
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
    window.DepreciationProfilesManager = DepreciationProfilesManager;
}

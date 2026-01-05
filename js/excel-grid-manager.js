/**
 * Excel-Style Grid Manager for MMD Reference Data
 * Provides inline editing, bulk paste, keyboard navigation
 */
class ExcelGridManager {
    constructor(containerId, config) {
        this.container = document.getElementById(containerId);
        this.config = {
            columns: config.columns || [],
            data: config.data || [],
            editable: config.editable !== false,
            onSave: config.onSave || (() => {}),
            onDelete: config.onDelete || (() => {}),
            onAdd: config.onAdd || (() => {}),
            canEdit: config.canEdit || (() => true),
            validateRow: config.validateRow || (() => ({ valid: true }))
        };
        this.currentEdit = null;
        this.selectedCell = null;
        this.originalData = [];
    }

    /**
     * Initialize the grid
     */
    init() {
        this.render();
        this.setupEventListeners();
    }

    /**
     * Render the grid
     */
    render() {
        if (!this.container) return;

        // Inject styles if not already present
        if (!document.getElementById('excel-grid-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'excel-grid-styles';
            styleSheet.textContent = ExcelGridManager.styles.replace(/<style>|<\/style>/g, '');
            document.head.appendChild(styleSheet);
        }

        const table = document.createElement('table');
        table.className = 'excel-grid-table w-full border-collapse';
        table.setAttribute('tabindex', '0');

        // Header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.className = 'bg-slate-100 border-b-2 border-slate-300';

        this.config.columns.forEach(col => {
            const th = document.createElement('th');
            th.className = 'px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase border-r border-slate-200';
            th.textContent = col.label;
            if (col.width) {
                th.style.width = col.width;
            }
            headerRow.appendChild(th);
        });

        // Actions column
        const actionsTh = document.createElement('th');
        actionsTh.className = 'px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase w-24';
        actionsTh.textContent = 'Actions';
        headerRow.appendChild(actionsTh);

        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Body
        const tbody = document.createElement('tbody');
        tbody.id = `${this.container.id}-tbody`;

        this.config.data.forEach((row, rowIndex) => {
            tbody.appendChild(this.createRow(row, rowIndex));
        });

        // Add new row button
        const addRow = document.createElement('tr');
        addRow.className = 'bg-slate-50 border-t-2 border-slate-300';
        const addCell = document.createElement('td');
        addCell.colSpan = this.config.columns.length + 1;
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

    /**
     * Create a table row
     */
    createRow(rowData, rowIndex) {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-200 hover:bg-slate-50';
        tr.dataset.rowIndex = rowIndex;
        tr.dataset.rowId = rowData.id || `new-${rowIndex}`;

        this.config.columns.forEach(col => {
            const td = document.createElement('td');
            td.className = 'px-4 py-2 border-r border-slate-100';
            td.dataset.column = col.key;
            td.dataset.rowIndex = rowIndex;

            if (col.editable !== false && this.config.editable && this.config.canEdit(rowData)) {
                td.className += ' cursor-pointer editable-cell';
                td.contentEditable = false;
                td.textContent = rowData[col.key] || '';
                td.onclick = () => this.startEdit(td, rowIndex, col);
            } else {
                td.textContent = rowData[col.key] || '';
            }

            tr.appendChild(td);
        });

        // Actions column
        const actionsTd = document.createElement('td');
        actionsTd.className = 'px-4 py-2';
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'flex gap-2';

        if (this.config.canEdit(rowData)) {
            const saveBtn = document.createElement('button');
            saveBtn.className = 'text-blue-600 hover:text-blue-800 text-sm';
            saveBtn.innerHTML = '<i class="fas fa-save"></i>';
            saveBtn.title = 'Save changes';
            saveBtn.onclick = (e) => {
                e.stopPropagation();
                this.saveRow(rowIndex);
            };
            actionsDiv.appendChild(saveBtn);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'text-red-600 hover:text-red-800 text-sm';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.title = 'Archive';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                this.deleteRow(rowIndex);
            };
            actionsDiv.appendChild(deleteBtn);
        }

        actionsTd.appendChild(actionsDiv);
        tr.appendChild(actionsTd);

        return tr;
    }

    /**
     * Start editing a cell
     */
    startEdit(cell, rowIndex, column) {
        if (this.currentEdit) {
            this.cancelEdit();
        }

        const rowData = this.config.data[rowIndex];
        const originalValue = rowData[column.key] || '';
        this.currentEdit = { cell, rowIndex, column, originalValue };
        this.selectedCell = cell;
        
        // Handle different input types
        if (column.type === 'select' && column.options) {
            // Create select dropdown
            const select = document.createElement('select');
            select.className = 'w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500';
            select.innerHTML = '<option value="">-- Select --</option>' +
                column.options.map(opt => 
                    `<option value="${opt.value}" ${rowData[column.key] === opt.value ? 'selected' : ''}>${opt.label}</option>`
                ).join('');
            
            cell.textContent = '';
            cell.appendChild(select);
            select.focus();

            select.onblur = () => {
                if (this.currentEdit && this.currentEdit.cell === cell) {
                    this.finishEdit(select.value);
                }
            };

            select.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === 'Tab') {
                    e.preventDefault();
                    this.finishEdit(select.value);
                    if (e.key === 'Tab') {
                        this.moveToNextCell();
                    }
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    this.cancelEdit();
                }
            };
        } else if (column.type === 'checkbox') {
            // Toggle checkbox
            const checked = rowData[column.key] !== false;
            rowData[column.key] = !checked;
            cell.textContent = checked ? '✓' : '';
            cell.className = cell.className.replace(/bg-\w+-\d+/, '') + (checked ? ' bg-green-100' : ' bg-gray-100');
            this.currentEdit = null;
            this.selectedCell = null;
        } else {
            // Create text input
            const input = document.createElement('input');
            input.type = column.type || 'text';
            input.className = 'w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500';
            input.value = cell.textContent.trim();
            
            cell.textContent = '';
            cell.appendChild(input);
            input.focus();
            input.select();

            // Handle input events
            input.onblur = () => {
                if (this.currentEdit && this.currentEdit.cell === cell) {
                    this.finishEdit(input.value);
                }
            };

            input.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.finishEdit(input.value);
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    this.cancelEdit();
                } else if (e.key === 'Tab') {
                    e.preventDefault();
                    this.finishEdit(input.value);
                    this.moveToNextCell();
                }
            };
        }
    }

    /**
     * Finish editing
     */
    finishEdit(value) {
        if (!this.currentEdit) return;

        const { cell, rowIndex, column } = this.currentEdit;
        const rowData = this.config.data[rowIndex];
        
        // Update data
        rowData[column.key] = value;

        // Validate
        const validation = this.config.validateRow(rowData);
        if (!validation.valid) {
            cell.classList.add('border-red-500', 'bg-red-50');
            cell.title = validation.error || 'Invalid value';
            setTimeout(() => {
                cell.classList.remove('border-red-500', 'bg-red-50');
                cell.title = '';
            }, 3000);
            return;
        }

        // Update cell display
        cell.textContent = value || '';
        cell.classList.remove('border-red-500', 'bg-red-50');

        this.currentEdit = null;
        this.selectedCell = null;
    }

    /**
     * Cancel editing
     */
    cancelEdit() {
        if (!this.currentEdit) return;

        const { cell, originalValue } = this.currentEdit;
        cell.textContent = originalValue;
        this.currentEdit = null;
        this.selectedCell = null;
    }

    /**
     * Move to next cell
     */
    moveToNextCell() {
        // Implementation for tab navigation
        // This would move to the next editable cell
    }

    /**
     * Add new row
     */
    addNewRow() {
        const newRow = {};
        this.config.columns.forEach(col => {
            newRow[col.key] = '';
        });
        newRow.id = `new-${Date.now()}`;
        newRow._isNew = true;

        this.config.data.push(newRow);
        this.render();
        
        // Focus on first editable cell of new row
        const tbody = document.getElementById(`${this.container.id}-tbody`);
        const newRowElement = tbody.querySelector(`tr[data-row-id="${newRow.id}"]`);
        if (newRowElement) {
            const firstEditable = newRowElement.querySelector('.editable-cell');
            if (firstEditable) {
                setTimeout(() => firstEditable.click(), 100);
            }
        }
    }

    /**
     * Save a row
     */
    async saveRow(rowIndex) {
        const rowData = this.config.data[rowIndex];
        const validation = this.config.validateRow(rowData);
        
        if (!validation.valid) {
            alert(validation.error || 'Row validation failed');
            return;
        }

        try {
            await this.config.onSave(rowData);
            rowData._isNew = false;
            this.render();
        } catch (error) {
            console.error('Error saving row:', error);
            alert(`Failed to save: ${error.message}`);
        }
    }

    /**
     * Delete/Archive a row
     */
    async deleteRow(rowIndex) {
        const rowData = this.config.data[rowIndex];
        
        if (!confirm(`Are you sure you want to archive "${rowData.name || 'this item'}"?`)) {
            return;
        }

        try {
            await this.config.onDelete(rowData);
            this.config.data.splice(rowIndex, 1);
            this.render();
        } catch (error) {
            console.error('Error deleting row:', error);
            alert(`Failed to archive: ${error.message}`);
        }
    }

    /**
     * Handle bulk paste from clipboard
     */
    handlePaste(e) {
        if (!this.selectedCell) return;

        e.preventDefault();
        const pasteData = e.clipboardData.getData('text');
        const rows = pasteData.split('\n').filter(r => r.trim());

        // Parse tab or comma delimited
        const delimiter = pasteData.includes('\t') ? '\t' : ',';
        const parsedRows = rows.map(row => {
            const cells = row.split(delimiter).map(c => c.trim());
            const rowData = {};
            this.config.columns.forEach((col, idx) => {
                rowData[col.key] = cells[idx] || '';
            });
            return rowData;
        });

        // Add rows
        parsedRows.forEach(row => {
            row.id = `new-${Date.now()}-${Math.random()}`;
            row._isNew = true;
            this.config.data.push(row);
        });

        this.render();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Keyboard navigation
        this.container.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
                e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                // Navigate cells
            } else if (e.ctrlKey && e.key === 'v') {
                // Handle paste
                this.handlePaste(e);
            }
        });

        // Click outside to cancel edit
        document.addEventListener('click', (e) => {
            if (this.currentEdit && !this.currentEdit.cell.contains(e.target)) {
                this.cancelEdit();
            }
        });
    }

    /**
     * Update data and re-render
     */
    updateData(newData) {
        this.config.data = newData;
        this.render();
    }
}

// Export globally
if (typeof window !== 'undefined') {
    window.ExcelGridManager = ExcelGridManager;
}

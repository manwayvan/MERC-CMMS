// Work Order Parts Management
const WorkOrderParts = {
    supabaseClient: null,
    parts: [],
    workOrderParts: {}, // Store parts by work order ID
    currentWorkOrderId: null,
    currentMode: null, // 'create' or 'view'

    async init() {
        // Initialize Supabase client - prioritize shared client to avoid multiple instances
        if (window.sharedSupabaseClient) {
            this.supabaseClient = window.sharedSupabaseClient;
        } else if (typeof window.supabase !== 'undefined' && typeof CONFIG !== 'undefined') {
            this.supabaseClient = window.supabase.createClient(
                CONFIG.SUPABASE_URL || 'https://hmdemsbqiqlqcggwblvl.supabase.co',
                CONFIG.SUPABASE_ANON_KEY || 'sb_publishable_Z9oNxTGDCCz3EZnh6NqySg_QzF6amCN'
            );
        } else {
            console.error('Supabase client not initialized');
            return;
        }

        // Load parts for dropdown
        await this.loadParts();
        this.setupEventListeners();
    },

    async loadParts() {
        try {
            const { data, error } = await this.supabaseClient
                .from('parts')
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (error) throw error;
            this.parts = data || [];
            // Refresh dropdown if modal is open
            const partSelect = document.getElementById('add-part-select');
            if (partSelect && this.currentWorkOrderId) {
                this.populatePartsDropdown();
            }
        } catch (error) {
            console.error('Error loading parts:', error);
        }
    },

    populatePartsDropdown() {
        const partSelect = document.getElementById('add-part-select');
        if (!partSelect) return;
        
        const currentValue = partSelect.value; // Preserve selection
        
        partSelect.innerHTML = '<option value="">Select Part</option>' +
            this.parts.map(p => {
                const stockStatus = p.stock_quantity > p.reorder_point ? 'In Stock' : 
                                   p.stock_quantity > 0 ? 'Low Stock' : 'Out of Stock';
                return `<option value="${p.id}" data-cost="${p.unit_cost}" data-stock="${p.stock_quantity}">
                    ${this.escapeHtml(p.part_number)} - ${this.escapeHtml(p.name)} (${stockStatus})
                </option>`;
            }).join('');
        
        // Restore selection if it still exists
        if (currentValue) {
            partSelect.value = currentValue;
        }
    },

    async loadWorkOrderParts(workOrderId) {
        try {
            const { data, error } = await this.supabaseClient
                .from('work_order_parts')
                .select(`
                    *,
                    parts:part_id(id, part_number, name, unit_of_measure, stock_quantity)
                `)
                .eq('work_order_id', workOrderId)
                .order('created_at');

            if (error) throw error;
            this.workOrderParts[workOrderId] = data || [];
            return data || [];
        } catch (error) {
            console.error('Error loading work order parts:', error);
            return [];
        }
    },

    async renderWorkOrderParts(workOrderId, mode) {
        // Use unified element IDs
        const container = document.getElementById('wo-parts-list');
        const totalDiv = document.getElementById('wo-parts-total');
        const totalAmount = document.getElementById('wo-parts-total-amount');
        
        if (!container) return;

        let parts = [];
        if (mode === 'view' && workOrderId) {
            parts = await this.loadWorkOrderParts(workOrderId);
        } else if (mode === 'create') {
            // Get parts from temporary storage
            parts = this.workOrderParts[workOrderId] || [];
        }

        if (parts.length === 0) {
            container.innerHTML = '<p class="text-xs text-slate-500 italic">No parts added yet</p>';
            totalDiv.classList.add('hidden');
            return;
        }

        let totalCost = 0;
        container.innerHTML = parts.map((part, index) => {
            const partInfo = part.parts || {};
            const quantity = part.quantity_used || 0;
            const unitCost = parseFloat(part.unit_cost || 0);
            const lineTotal = quantity * unitCost;
            totalCost += lineTotal;

            return `
                <div class="bg-white rounded-lg border border-slate-200 p-3 flex items-center justify-between">
                    <div class="flex-1">
                        <div class="font-medium text-slate-900">${this.escapeHtml(partInfo.part_number || 'N/A')} - ${this.escapeHtml(partInfo.name || 'Unknown Part')}</div>
                        <div class="text-sm text-slate-600">
                            Quantity: ${quantity} ${partInfo.unit_of_measure || 'each'} × $${unitCost.toFixed(2)} = $${lineTotal.toFixed(2)}
                        </div>
                        ${part.notes ? `<div class="text-xs text-slate-500 mt-1">${this.escapeHtml(part.notes)}</div>` : ''}
                    </div>
                    <button type="button" onclick="WorkOrderParts.removePart('${workOrderId || 'temp'}', ${index}, '${mode}')" class="text-red-600 hover:text-red-800 ml-3">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        }).join('');

        if (totalCost > 0) {
            totalDiv.classList.remove('hidden');
            totalAmount.textContent = `$${totalCost.toFixed(2)}`;
        } else {
            totalDiv.classList.add('hidden');
        }
    },

    async openAddPartModal(workOrderId, mode) {
        this.currentWorkOrderId = workOrderId;
        this.currentMode = mode;
        
        const modal = document.getElementById('add-part-modal');
        const form = document.getElementById('add-part-form');
        const partSelect = document.getElementById('add-part-select');
        const woIdInput = document.getElementById('add-part-wo-id');
        const modeInput = document.getElementById('add-part-mode');

        form.reset();
        woIdInput.value = workOrderId || '';
        modeInput.value = mode;

        // For create mode, generate a temporary ID if needed
        if (mode === 'create' && !workOrderId) {
            const tempId = 'temp-' + Date.now();
            woIdInput.value = tempId;
            if (!this.workOrderParts[tempId]) {
                this.workOrderParts[tempId] = [];
            }
        }

        // Populate parts dropdown
        this.populatePartsDropdown();

        // Update unit cost when part is selected
        partSelect.addEventListener('change', (e) => {
            const selectedOption = e.target.options[e.target.selectedIndex];
            const unitCost = parseFloat(selectedOption.dataset.cost || 0);
            const stock = parseInt(selectedOption.dataset.stock || 0);
            
            document.getElementById('add-part-unit-cost').value = unitCost;
            document.getElementById('part-stock-info').textContent = 
                `Available: ${stock} | Unit Cost: $${unitCost.toFixed(2)}`;
            this.updateTotalCost();
        });

        // Update total when quantity or cost changes
        document.getElementById('add-part-quantity').addEventListener('input', () => this.updateTotalCost());
        document.getElementById('add-part-unit-cost').addEventListener('input', () => this.updateTotalCost());

        modal.classList.add('active');
    },

    updateTotalCost() {
        const quantity = parseFloat(document.getElementById('add-part-quantity').value || 0);
        const unitCost = parseFloat(document.getElementById('add-part-unit-cost').value || 0);
        const total = quantity * unitCost;
        document.getElementById('add-part-total-cost').value = `$${total.toFixed(2)}`;
    },

    closeAddPartModal() {
        document.getElementById('add-part-modal').classList.remove('active');
        this.currentWorkOrderId = null;
        this.currentMode = null;
    },

    async savePart(e) {
        e.preventDefault();
        
        const workOrderId = document.getElementById('add-part-wo-id').value;
        const mode = document.getElementById('add-part-mode').value;
        const partId = document.getElementById('add-part-select').value;
        const quantity = parseInt(document.getElementById('add-part-quantity').value);
        const unitCost = parseFloat(document.getElementById('add-part-unit-cost').value);
        const notes = document.getElementById('add-part-notes').value || null;

        if (!partId || !quantity || !unitCost) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        // Check if part has enough stock
        const part = this.parts.find(p => p.id === partId);
        if (part && part.stock_quantity < quantity) {
            if (!confirm(`Warning: Only ${part.stock_quantity} available in stock. Continue anyway?`)) {
                return;
            }
        }

        if (mode === 'create') {
            // Store temporarily for new work order
            const tempId = workOrderId || 'temp-' + Date.now();
            if (!this.workOrderParts[tempId]) {
                this.workOrderParts[tempId] = [];
            }
            
            const partInfo = this.parts.find(p => p.id === partId);
            this.workOrderParts[tempId].push({
                part_id: partId,
                quantity_used: quantity,
                unit_cost: unitCost,
                notes: notes,
                parts: partInfo
            });

            await this.renderWorkOrderParts(tempId, mode);
            this.closeAddPartModal();
            this.showToast('Part added to work order', 'success');
        } else if (mode === 'view' && workOrderId) {
            // Save to database for existing work order
            try {
                const { error } = await this.supabaseClient
                    .from('work_order_parts')
                    .insert({
                        work_order_id: workOrderId,
                        part_id: partId,
                        quantity_used: quantity,
                        unit_cost: unitCost,
                        notes: notes
                    });

                if (error) throw error;
                
                await this.renderWorkOrderParts(workOrderId, mode);
                this.closeAddPartModal();
                this.showToast('Part added successfully', 'success');
            } catch (error) {
                console.error('Error saving part:', error);
                this.showToast(`Failed to add part: ${error.message}`, 'error');
            }
        }
    },

    removePart(workOrderId, index, mode) {
        if (mode === 'create') {
            // Remove from temporary storage
            if (this.workOrderParts[workOrderId]) {
                this.workOrderParts[workOrderId].splice(index, 1);
                this.renderWorkOrderParts(workOrderId, mode);
            }
        } else if (mode === 'view' && workOrderId) {
            // Remove from database
            const parts = this.workOrderParts[workOrderId] || [];
            const part = parts[index];
            if (part && part.id) {
                if (confirm('Are you sure you want to remove this part?')) {
                    this.supabaseClient
                        .from('work_order_parts')
                        .delete()
                        .eq('id', part.id)
                        .then(() => {
                            this.renderWorkOrderParts(workOrderId, mode);
                            this.showToast('Part removed', 'success');
                        })
                        .catch(error => {
                            console.error('Error removing part:', error);
                            this.showToast('Failed to remove part', 'error');
                        });
                }
            }
        }
    },

    async getWorkOrderPartsForSave(workOrderId) {
        // Get parts stored for new work order
        return this.workOrderParts[workOrderId] || [];
    },

    async saveWorkOrderParts(workOrderId) {
        // Save all parts for a newly created work order
        const parts = this.workOrderParts[workOrderId] || [];
        if (parts.length === 0) return;

        try {
            const partsToInsert = parts.map(p => ({
                work_order_id: workOrderId,
                part_id: p.part_id,
                quantity_used: p.quantity_used,
                unit_cost: p.unit_cost,
                notes: p.notes
            }));

            const { error } = await this.supabaseClient
                .from('work_order_parts')
                .insert(partsToInsert);

            if (error) throw error;

            // Clear temporary storage
            delete this.workOrderParts[workOrderId];
            return true;
        } catch (error) {
            console.error('Error saving work order parts:', error);
            throw error;
        }
    },

    clearWorkOrderParts(workOrderId) {
        // Clear temporary parts storage
        delete this.workOrderParts[workOrderId];
    },

    setupEventListeners() {
        const form = document.getElementById('add-part-form');
        if (form) {
            form.addEventListener('submit', (e) => this.savePart(e));
        }
    },

    showToast(message, type = 'info') {
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            alert(message);
        }
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Global functions for onclick handlers
function addPartToWorkOrder() {
    // Get mode from unified modal
    const modeInput = document.getElementById('workorder-mode');
    const mode = modeInput?.value || 'create';
    
    let workOrderId;
    if (mode === 'create') {
        // Use existing temp ID or create new one
        const tempIds = Object.keys(WorkOrderParts.workOrderParts || {}).filter(id => id.startsWith('temp-'));
        workOrderId = tempIds.length > 0 ? tempIds[0] : 'temp-' + Date.now();
        // Ensure the temp ID exists in storage
        if (!WorkOrderParts.workOrderParts[workOrderId]) {
            WorkOrderParts.workOrderParts[workOrderId] = [];
        }
    } else {
        workOrderId = document.getElementById('workorder-id')?.value;
        if (!workOrderId) {
            WorkOrderParts.showToast('Work order ID not found', 'error');
            return;
        }
    }
    WorkOrderParts.openAddPartModal(workOrderId, mode);
}

function closeAddPartModal() {
    WorkOrderParts.closeAddPartModal();
}

async function openCreatePartFromWorkOrder() {
    // Close the add part modal temporarily
    const addPartModal = document.getElementById('add-part-modal');
    const wasOpen = addPartModal?.classList.contains('active');
    if (wasOpen) {
        addPartModal.classList.remove('active');
    }
    
    // Open the part creation modal from inventory manager
    if (typeof InventoryManager !== 'undefined' && InventoryManager.openPartModal) {
        await InventoryManager.openPartModal(null);
        
        // Listen for part creation success
        const partForm = document.getElementById('part-form');
        if (partForm) {
            const originalSubmit = partForm.onsubmit;
            partForm.onsubmit = async (e) => {
                e.preventDefault();
                try {
                    // Save the part
                    await InventoryManager.savePart(e);
                    
                    // Reload parts in WorkOrderParts
                    await WorkOrderParts.loadParts();
                    
                    // Reopen the add part modal and select the new part
                    if (wasOpen) {
                        const workOrderId = document.getElementById('add-part-wo-id')?.value;
                        const mode = document.getElementById('add-part-mode')?.value;
                        if (workOrderId && mode) {
                            await WorkOrderParts.openAddPartModal(workOrderId, mode);
                            
                            // Select the newly created part (last in list)
                            setTimeout(() => {
                                const partSelect = document.getElementById('add-part-select');
                                if (partSelect && WorkOrderParts.parts.length > 0) {
                                    const newPart = WorkOrderParts.parts[WorkOrderParts.parts.length - 1];
                                    partSelect.value = newPart.id;
                                    partSelect.dispatchEvent(new Event('change'));
                                }
                            }, 100);
                        }
                    }
                } catch (error) {
                    console.error('Error creating part:', error);
                }
            };
        }
    } else {
        WorkOrderParts.showToast('Inventory manager not available', 'error');
        if (wasOpen) {
            addPartModal.classList.add('active');
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    WorkOrderParts.init();
});


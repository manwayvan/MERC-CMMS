// Inventory Management Module
const InventoryManager = {
    supabaseClient: null,
    parts: [],
    vendors: [],
    locations: [],
    purchaseOrders: [],
    transactions: [],
    partCategories: [],
    filteredParts: [],

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

        // Load all data
        await this.loadAllData();
        this.setupEventListeners();
    },

    async loadAllData() {
        try {
            await Promise.all([
                this.loadParts(),
                this.loadVendors(),
                this.loadLocations(),
                this.loadPartCategories(),
                this.loadPurchaseOrders(),
                this.loadTransactions(),
                this.loadStats()
            ]);
        } catch (error) {
            console.error('Error loading inventory data:', error);
            this.showToast('Failed to load inventory data', 'error');
        }
    },

    async loadStats() {
        try {
            const { data: partsData } = await this.supabaseClient
                .from('parts')
                .select('stock_quantity, reorder_point')
                .eq('is_active', true);

            if (!partsData) return;

            let totalParts = partsData.length;
            let inStock = 0;
            let lowStock = 0;
            let outOfStock = 0;

            partsData.forEach(part => {
                if (part.stock_quantity > part.reorder_point) {
                    inStock++;
                } else if (part.stock_quantity > 0 && part.stock_quantity <= part.reorder_point) {
                    lowStock++;
                } else {
                    outOfStock++;
                }
            });

            document.getElementById('stat-total-parts').textContent = totalParts;
            document.getElementById('stat-in-stock').textContent = inStock;
            document.getElementById('stat-low-stock').textContent = lowStock;
            document.getElementById('stat-out-of-stock').textContent = outOfStock;

            // Show alerts for low/out of stock items
            if (lowStock > 0 || outOfStock > 0) {
                this.checkStockAlerts();
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    },

    async checkStockAlerts() {
        try {
            const { data: lowStockParts } = await this.supabaseClient
                .from('parts')
                .select('id, part_number, name, stock_quantity, reorder_point, reorder_quantity')
                .eq('is_active', true)
                .or(`stock_quantity.eq.0,stock_quantity.lte.reorder_point`);

            if (lowStockParts && lowStockParts.length > 0) {
                const alertParts = lowStockParts.map(p => 
                    `${p.part_number} (${p.stock_quantity} in stock, reorder: ${p.reorder_quantity})`
                ).join(', ');

                if (lowStockParts.length <= 5) {
                    this.showToast(
                        `Low Stock Alert: ${lowStockParts.length} part(s) need reordering - ${alertParts}`,
                        'warning'
                    );
                } else {
                    this.showToast(
                        `Low Stock Alert: ${lowStockParts.length} parts need reordering. Check inventory for details.`,
                        'warning'
                    );
                }
            }
        } catch (error) {
            console.error('Error checking stock alerts:', error);
        }
    },

    async loadParts() {
        try {
            const { data, error } = await this.supabaseClient
                .from('parts')
                .select(`
                    *,
                    part_categories:category_id(id, name),
                    vendors:vendor_id(id, name),
                    inventory_locations:location_id(id, name)
                `)
                .order('name');

            if (error) throw error;
            this.parts = data || [];
            this.filteredParts = [...this.parts];
            this.renderParts();
            this.populatePartCategoryFilter();
        } catch (error) {
            console.error('Error loading parts:', error);
            this.showToast('Failed to load parts', 'error');
        }
    },

    renderParts() {
        const tbody = document.getElementById('parts-table-body');
        if (!tbody) return;

        if (this.filteredParts.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" class="px-4 py-8 text-center text-slate-500">
                        <i class="fas fa-inbox text-2xl mb-2"></i>
                        <p>No parts found. Click "Add Part" to create one.</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.filteredParts.map(part => {
            const stockStatus = this.getStockStatus(part);
            const statusClass = stockStatus === 'low' ? 'stock-warning' : stockStatus === 'out' ? 'stock-low' : 'stock-ok';
            const statusText = stockStatus === 'low' ? 'Low Stock' : stockStatus === 'out' ? 'Out of Stock' : 'In Stock';
            const statusBadge = stockStatus === 'low' ? 'bg-yellow-100 text-yellow-800' : 
                               stockStatus === 'out' ? 'bg-red-100 text-red-800' : 
                               'bg-green-100 text-green-800';

            return `
                <tr class="${statusClass}">
                    <td class="px-4 py-3 font-medium text-slate-900">${this.escapeHtml(part.part_number)}</td>
                    <td class="px-4 py-3 text-slate-900">${this.escapeHtml(part.name)}</td>
                    <td class="px-4 py-3 text-slate-600">${part.part_categories ? this.escapeHtml(part.part_categories.name) : '-'}</td>
                    <td class="px-4 py-3 text-slate-600">${part.vendors ? this.escapeHtml(part.vendors.name) : '-'}</td>
                    <td class="px-4 py-3 font-semibold ${stockStatus === 'out' ? 'text-red-600' : stockStatus === 'low' ? 'text-yellow-600' : 'text-green-600'}">
                        ${part.stock_quantity} ${part.unit_of_measure || 'each'}
                    </td>
                    <td class="px-4 py-3 text-slate-600">${part.reorder_point}</td>
                    <td class="px-4 py-3 text-slate-600">$${parseFloat(part.unit_cost || 0).toFixed(2)}</td>
                    <td class="px-4 py-3">
                        <span class="status-badge ${statusBadge}">${statusText}</span>
                    </td>
                    <td class="px-4 py-3">
                        <div class="flex gap-2">
                            <button onclick="InventoryManager.editPart('${part.id}')" class="text-blue-600 hover:text-blue-800">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="InventoryManager.deletePart('${part.id}')" class="text-red-600 hover:text-red-800">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    getStockStatus(part) {
        if (part.stock_quantity === 0) return 'out';
        if (part.stock_quantity <= part.reorder_point) return 'low';
        return 'ok';
    },

    filterParts() {
        const searchTerm = document.getElementById('parts-search')?.value.toLowerCase() || '';
        const categoryFilter = document.getElementById('parts-category-filter')?.value || '';
        const statusFilter = document.getElementById('parts-status-filter')?.value || '';

        this.filteredParts = this.parts.filter(part => {
            const matchesSearch = !searchTerm || 
                part.part_number?.toLowerCase().includes(searchTerm) ||
                part.name?.toLowerCase().includes(searchTerm);
            
            const matchesCategory = !categoryFilter || part.category_id === categoryFilter;
            
            const stockStatus = this.getStockStatus(part);
            const matchesStatus = !statusFilter || 
                (statusFilter === 'in-stock' && stockStatus === 'ok') ||
                (statusFilter === 'low-stock' && stockStatus === 'low') ||
                (statusFilter === 'out-of-stock' && stockStatus === 'out');

            return matchesSearch && matchesCategory && matchesStatus;
        });

        this.renderParts();
    },

    populatePartCategoryFilter() {
        const select = document.getElementById('parts-category-filter');
        if (!select) return;

        const categories = [...new Set(this.parts.map(p => p.category_id).filter(Boolean))];
        const categoryMap = {};
        this.parts.forEach(p => {
            if (p.category_id && p.part_categories) {
                categoryMap[p.category_id] = p.part_categories.name;
            }
        });

        const currentValue = select.value;
        select.innerHTML = '<option value="">All Categories</option>' +
            categories.map(id => `<option value="${id}">${this.escapeHtml(categoryMap[id] || 'Unknown')}</option>`).join('');
        
        if (currentValue) select.value = currentValue;
    },

    async loadPartCategories() {
        try {
            const { data } = await this.supabaseClient
                .from('part_categories')
                .select('*')
                .order('name');
            this.partCategories = data || [];
        } catch (error) {
            console.error('Error loading part categories:', error);
        }
    },

    async loadVendors() {
        try {
            const { data, error } = await this.supabaseClient
                .from('vendors')
                .select('*')
                .order('name');

            if (error) throw error;
            this.vendors = data || [];
            this.renderVendors();
        } catch (error) {
            console.error('Error loading vendors:', error);
            this.showToast('Failed to load vendors', 'error');
        }
    },

    renderVendors() {
        const tbody = document.getElementById('vendors-table-body');
        if (!tbody) return;

        const searchTerm = document.getElementById('vendors-search')?.value.toLowerCase() || '';
        const filtered = this.vendors.filter(v => 
            !searchTerm || 
            v.name?.toLowerCase().includes(searchTerm) ||
            v.contact_person?.toLowerCase().includes(searchTerm) ||
            v.email?.toLowerCase().includes(searchTerm)
        );

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-4 py-8 text-center text-slate-500">
                        <i class="fas fa-inbox text-2xl mb-2"></i>
                        <p>No vendors found.</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filtered.map(vendor => `
            <tr>
                <td class="px-4 py-3 font-medium text-slate-900">${this.escapeHtml(vendor.name)}</td>
                <td class="px-4 py-3 text-slate-600">${this.escapeHtml(vendor.contact_person || '-')}</td>
                <td class="px-4 py-3 text-slate-600">${this.escapeHtml(vendor.email || '-')}</td>
                <td class="px-4 py-3 text-slate-600">${this.escapeHtml(vendor.phone || '-')}</td>
                <td class="px-4 py-3">
                    <span class="status-badge ${vendor.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                        ${vendor.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <div class="flex gap-2">
                        <button onclick="InventoryManager.editVendor('${vendor.id}')" class="text-blue-600 hover:text-blue-800">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="InventoryManager.deleteVendor('${vendor.id}')" class="text-red-600 hover:text-red-800">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    filterVendors() {
        this.renderVendors();
    },

    async loadLocations() {
        try {
            const { data, error } = await this.supabaseClient
                .from('inventory_locations')
                .select('*')
                .order('name');

            if (error) throw error;
            this.locations = data || [];
            this.renderLocations();
        } catch (error) {
            console.error('Error loading locations:', error);
            this.showToast('Failed to load locations', 'error');
        }
    },

    renderLocations() {
        const grid = document.getElementById('locations-grid');
        if (!grid) return;

        if (this.locations.length === 0) {
            grid.innerHTML = `
                <div class="col-span-full text-center text-slate-500 py-8">
                    <i class="fas fa-inbox text-2xl mb-2"></i>
                    <p>No locations found.</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.locations.map(location => `
            <div class="bg-white rounded-lg shadow-md p-6 border-l-4 ${location.is_active ? 'border-green-500' : 'border-gray-300'}">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-lg font-bold text-slate-800">${this.escapeHtml(location.name)}</h3>
                        <p class="text-sm text-slate-600 mt-1">${this.escapeHtml(location.description || '')}</p>
                    </div>
                    <span class="status-badge ${location.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                        ${location.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>
                ${location.address ? `<p class="text-sm text-slate-500 mb-4"><i class="fas fa-map-marker-alt mr-2"></i>${this.escapeHtml(location.address)}</p>` : ''}
                <div class="flex gap-2">
                    <button onclick="InventoryManager.editLocation('${location.id}')" class="btn btn-secondary btn-sm">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button onclick="InventoryManager.deleteLocation('${location.id}')" class="btn btn-danger btn-sm">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    },

    async loadPurchaseOrders() {
        try {
            const { data, error } = await this.supabaseClient
                .from('purchase_orders')
                .select(`
                    *,
                    vendors:vendor_id(id, name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            this.purchaseOrders = data || [];
            this.renderPurchaseOrders();
        } catch (error) {
            console.error('Error loading purchase orders:', error);
            this.showToast('Failed to load purchase orders', 'error');
        }
    },

    renderPurchaseOrders() {
        const tbody = document.getElementById('purchase-orders-table-body');
        if (!tbody) return;

        if (this.purchaseOrders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-4 py-8 text-center text-slate-500">
                        <i class="fas fa-inbox text-2xl mb-2"></i>
                        <p>No purchase orders found.</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.purchaseOrders.map(po => {
            const statusColors = {
                'pending': 'bg-yellow-100 text-yellow-800',
                'ordered': 'bg-blue-100 text-blue-800',
                'received': 'bg-green-100 text-green-800',
                'partial': 'bg-orange-100 text-orange-800',
                'cancelled': 'bg-red-100 text-red-800'
            };

            return `
                <tr>
                    <td class="px-4 py-3 font-medium text-slate-900">${this.escapeHtml(po.id)}</td>
                    <td class="px-4 py-3 text-slate-600">${po.vendors ? this.escapeHtml(po.vendors.name) : '-'}</td>
                    <td class="px-4 py-3 text-slate-600">${po.order_date || '-'}</td>
                    <td class="px-4 py-3 text-slate-600">${po.expected_delivery_date || '-'}</td>
                    <td class="px-4 py-3 font-semibold text-slate-900">$${parseFloat(po.total_amount || 0).toFixed(2)}</td>
                    <td class="px-4 py-3">
                        <span class="status-badge ${statusColors[po.status] || 'bg-gray-100 text-gray-800'}">
                            ${po.status}
                        </span>
                    </td>
                    <td class="px-4 py-3">
                        <button onclick="InventoryManager.viewPO('${po.id}')" class="text-blue-600 hover:text-blue-800">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    async loadTransactions() {
        try {
            const { data, error } = await this.supabaseClient
                .from('inventory_transactions')
                .select(`
                    *,
                    parts:part_id(id, part_number, name)
                `)
                .order('created_at', { ascending: false })
                .limit(500);

            if (error) throw error;
            this.transactions = data || [];
            this.renderTransactions();
        } catch (error) {
            console.error('Error loading transactions:', error);
            this.showToast('Failed to load transactions', 'error');
        }
    },

    renderTransactions() {
        const tbody = document.getElementById('transactions-table-body');
        if (!tbody) return;

        const searchTerm = document.getElementById('transactions-search')?.value.toLowerCase() || '';
        const typeFilter = document.getElementById('transactions-type-filter')?.value || '';

        const filtered = this.transactions.filter(t => {
            const matchesSearch = !searchTerm ||
                t.parts?.part_number?.toLowerCase().includes(searchTerm) ||
                t.parts?.name?.toLowerCase().includes(searchTerm);
            const matchesType = !typeFilter || t.transaction_type === typeFilter;
            return matchesSearch && matchesType;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-4 py-8 text-center text-slate-500">
                        <i class="fas fa-inbox text-2xl mb-2"></i>
                        <p>No transactions found.</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filtered.map(trans => {
            const date = new Date(trans.created_at);
            return `
                <tr>
                    <td class="px-4 py-3 text-slate-600">${date.toLocaleDateString()} ${date.toLocaleTimeString()}</td>
                    <td class="px-4 py-3 font-medium text-slate-900">
                        ${trans.parts ? `${this.escapeHtml(trans.parts.part_number)} - ${this.escapeHtml(trans.parts.name)}` : '-'}
                    </td>
                    <td class="px-4 py-3">
                        <span class="status-badge bg-blue-100 text-blue-800">${trans.transaction_type}</span>
                    </td>
                    <td class="px-4 py-3 font-semibold ${trans.transaction_type === 'usage' || trans.transaction_type === 'damage' ? 'text-red-600' : 'text-green-600'}">
                        ${trans.transaction_type === 'usage' || trans.transaction_type === 'damage' ? '-' : '+'}${trans.quantity}
                    </td>
                    <td class="px-4 py-3 text-slate-600">${trans.unit_cost ? `$${parseFloat(trans.unit_cost).toFixed(2)}` : '-'}</td>
                    <td class="px-4 py-3 text-slate-600">
                        ${trans.reference_type && trans.reference_id ? `${trans.reference_type}: ${trans.reference_id}` : '-'}
                    </td>
                    <td class="px-4 py-3 text-slate-600">${this.escapeHtml(trans.notes || '-')}</td>
                </tr>
            `;
        }).join('');
    },

    filterTransactions() {
        this.renderTransactions();
    },

    // Part CRUD
    async openPartModal(partId = null) {
        const modal = document.getElementById('part-modal');
        const form = document.getElementById('part-form');
        const title = document.getElementById('part-modal-title');

        form.reset();
        document.getElementById('part-id').value = partId || '';

        // Load dropdowns
        await this.populatePartCategoryDropdown();
        await this.populateVendorDropdown();
        await this.populateLocationDropdown();

        if (partId) {
            const part = this.parts.find(p => p.id === partId);
            if (part) {
                title.textContent = 'Edit Part';
                document.getElementById('part-number').value = part.part_number;
                document.getElementById('part-name').value = part.name;
                document.getElementById('part-description').value = part.description || '';
                document.getElementById('part-category').value = part.category_id || '';
                document.getElementById('part-manufacturer').value = part.manufacturer || '';
                document.getElementById('part-vendor').value = part.vendor_id || '';
                document.getElementById('part-location').value = part.location_id || '';
                document.getElementById('part-unit-cost').value = part.unit_cost || 0;
                document.getElementById('part-stock-quantity').value = part.stock_quantity || 0;
                document.getElementById('part-reorder-point').value = part.reorder_point || 0;
                document.getElementById('part-reorder-quantity').value = part.reorder_quantity || 0;
                document.getElementById('part-unit-of-measure').value = part.unit_of_measure || 'each';
                document.getElementById('part-active').checked = part.is_active !== false;
                document.getElementById('part-notes').value = part.notes || '';
            }
        } else {
            title.textContent = 'Add Part';
        }

        modal.classList.add('active');
    },

    closePartModal() {
        document.getElementById('part-modal').classList.remove('active');
    },

    async populatePartCategoryDropdown() {
        const select = document.getElementById('part-category');
        if (!select) return;

        select.innerHTML = '<option value="">Select Category</option>' +
            this.partCategories.map(c => `<option value="${c.id}">${this.escapeHtml(c.name)}</option>`).join('');
    },

    async populateVendorDropdown() {
        const select = document.getElementById('part-vendor');
        if (!select) return;

        select.innerHTML = '<option value="">Select Vendor</option>' +
            this.vendors.filter(v => v.is_active).map(v => `<option value="${v.id}">${this.escapeHtml(v.name)}</option>`).join('');
    },

    async populateLocationDropdown() {
        const select = document.getElementById('part-location');
        if (!select) return;

        select.innerHTML = '<option value="">Select Location</option>' +
            this.locations.filter(l => l.is_active).map(l => `<option value="${l.id}">${this.escapeHtml(l.name)}</option>`).join('');
    },

    async savePart(e) {
        e.preventDefault();
        const form = e.target;
        const partId = document.getElementById('part-id').value;

        const partData = {
            part_number: document.getElementById('part-number').value,
            name: document.getElementById('part-name').value,
            description: document.getElementById('part-description').value || null,
            category_id: document.getElementById('part-category').value || null,
            manufacturer: document.getElementById('part-manufacturer').value || null,
            vendor_id: document.getElementById('part-vendor').value || null,
            location_id: document.getElementById('part-location').value || null,
            unit_cost: parseFloat(document.getElementById('part-unit-cost').value) || 0,
            stock_quantity: parseInt(document.getElementById('part-stock-quantity').value) || 0,
            reorder_point: parseInt(document.getElementById('part-reorder-point').value) || 0,
            reorder_quantity: parseInt(document.getElementById('part-reorder-quantity').value) || 0,
            unit_of_measure: document.getElementById('part-unit-of-measure').value || 'each',
            is_active: document.getElementById('part-active').checked,
            notes: document.getElementById('part-notes').value || null
        };

        try {
            if (partId) {
                const { error } = await this.supabaseClient
                    .from('parts')
                    .update(partData)
                    .eq('id', partId);
                if (error) throw error;
                this.showToast('Part updated successfully', 'success');
            } else {
                const { error } = await this.supabaseClient
                    .from('parts')
                    .insert(partData);
                if (error) throw error;
                this.showToast('Part created successfully', 'success');
            }

            this.closePartModal();
            await this.loadParts();
            await this.loadStats();
        } catch (error) {
            console.error('Error saving part:', error);
            this.showToast(`Failed to save: ${error.message}`, 'error');
        }
    },

    async editPart(partId) {
        await this.openPartModal(partId);
    },

    async deletePart(partId) {
        if (!confirm('Are you sure you want to delete this part?')) return;

        try {
            const { error } = await this.supabaseClient
                .from('parts')
                .delete()
                .eq('id', partId);
            if (error) throw error;
            this.showToast('Part deleted successfully', 'success');
            await this.loadParts();
            await this.loadStats();
        } catch (error) {
            console.error('Error deleting part:', error);
            this.showToast(`Failed to delete: ${error.message}`, 'error');
        }
    },

    // Vendor CRUD
    async openVendorModal(vendorId = null) {
        const modal = document.getElementById('vendor-modal');
        const form = document.getElementById('vendor-form');
        const title = document.getElementById('vendor-modal-title');

        form.reset();
        document.getElementById('vendor-id').value = vendorId || '';

        if (vendorId) {
            const vendor = this.vendors.find(v => v.id === vendorId);
            if (vendor) {
                title.textContent = 'Edit Vendor';
                document.getElementById('vendor-name').value = vendor.name;
                document.getElementById('vendor-contact-person').value = vendor.contact_person || '';
                document.getElementById('vendor-email').value = vendor.email || '';
                document.getElementById('vendor-phone').value = vendor.phone || '';
                document.getElementById('vendor-website').value = vendor.website || '';
                document.getElementById('vendor-address').value = vendor.address || '';
                document.getElementById('vendor-payment-terms').value = vendor.payment_terms || '';
                document.getElementById('vendor-notes').value = vendor.notes || '';
                document.getElementById('vendor-active').checked = vendor.is_active !== false;
            }
        } else {
            title.textContent = 'Add Vendor';
        }

        modal.classList.add('active');
    },

    closeVendorModal() {
        document.getElementById('vendor-modal').classList.remove('active');
    },

    async saveVendor(e) {
        e.preventDefault();
        const vendorId = document.getElementById('vendor-id').value;

        const vendorData = {
            name: document.getElementById('vendor-name').value,
            contact_person: document.getElementById('vendor-contact-person').value || null,
            email: document.getElementById('vendor-email').value || null,
            phone: document.getElementById('vendor-phone').value || null,
            website: document.getElementById('vendor-website').value || null,
            address: document.getElementById('vendor-address').value || null,
            payment_terms: document.getElementById('vendor-payment-terms').value || null,
            notes: document.getElementById('vendor-notes').value || null,
            is_active: document.getElementById('vendor-active').checked
        };

        try {
            if (vendorId) {
                const { error } = await this.supabaseClient
                    .from('vendors')
                    .update(vendorData)
                    .eq('id', vendorId);
                if (error) throw error;
                this.showToast('Vendor updated successfully', 'success');
            } else {
                const { error } = await this.supabaseClient
                    .from('vendors')
                    .insert(vendorData);
                if (error) throw error;
                this.showToast('Vendor created successfully', 'success');
            }

            this.closeVendorModal();
            await this.loadVendors();
        } catch (error) {
            console.error('Error saving vendor:', error);
            this.showToast(`Failed to save: ${error.message}`, 'error');
        }
    },

    async editVendor(vendorId) {
        await this.openVendorModal(vendorId);
    },

    async deleteVendor(vendorId) {
        if (!confirm('Are you sure you want to delete this vendor?')) return;

        try {
            const { error } = await this.supabaseClient
                .from('vendors')
                .delete()
                .eq('id', vendorId);
            if (error) throw error;
            this.showToast('Vendor deleted successfully', 'success');
            await this.loadVendors();
        } catch (error) {
            console.error('Error deleting vendor:', error);
            this.showToast(`Failed to delete: ${error.message}`, 'error');
        }
    },

    // Location CRUD
    async openLocationModal(locationId = null) {
        const modal = document.getElementById('location-modal');
        const form = document.getElementById('location-form');
        const title = document.getElementById('location-modal-title');

        form.reset();
        document.getElementById('location-id').value = locationId || '';

        if (locationId) {
            const location = this.locations.find(l => l.id === locationId);
            if (location) {
                title.textContent = 'Edit Location';
                document.getElementById('location-name').value = location.name;
                document.getElementById('location-description').value = location.description || '';
                document.getElementById('location-address').value = location.address || '';
                document.getElementById('location-active').checked = location.is_active !== false;
            }
        } else {
            title.textContent = 'Add Location';
        }

        modal.classList.add('active');
    },

    closeLocationModal() {
        document.getElementById('location-modal').classList.remove('active');
    },

    async saveLocation(e) {
        e.preventDefault();
        const locationId = document.getElementById('location-id').value;

        const locationData = {
            name: document.getElementById('location-name').value,
            description: document.getElementById('location-description').value || null,
            address: document.getElementById('location-address').value || null,
            is_active: document.getElementById('location-active').checked
        };

        try {
            if (locationId) {
                const { error } = await this.supabaseClient
                    .from('inventory_locations')
                    .update(locationData)
                    .eq('id', locationId);
                if (error) throw error;
                this.showToast('Location updated successfully', 'success');
            } else {
                const { error } = await this.supabaseClient
                    .from('inventory_locations')
                    .insert(locationData);
                if (error) throw error;
                this.showToast('Location created successfully', 'success');
            }

            this.closeLocationModal();
            await this.loadLocations();
        } catch (error) {
            console.error('Error saving location:', error);
            this.showToast(`Failed to save: ${error.message}`, 'error');
        }
    },

    async editLocation(locationId) {
        await this.openLocationModal(locationId);
    },

    async deleteLocation(locationId) {
        if (!confirm('Are you sure you want to delete this location?')) return;

        try {
            const { error } = await this.supabaseClient
                .from('inventory_locations')
                .delete()
                .eq('id', locationId);
            if (error) throw error;
            this.showToast('Location deleted successfully', 'success');
            await this.loadLocations();
        } catch (error) {
            console.error('Error deleting location:', error);
            this.showToast(`Failed to delete: ${error.message}`, 'error');
        }
    },

    // Transaction Management
    async openTransactionModal() {
        const modal = document.getElementById('transaction-modal');
        const form = document.getElementById('transaction-form');

        form.reset();
        await this.populateTransactionPartDropdown();
        modal.classList.add('active');
    },

    closeTransactionModal() {
        document.getElementById('transaction-modal').classList.remove('active');
    },

    async populateTransactionPartDropdown() {
        const select = document.getElementById('transaction-part');
        if (!select) return;

        select.innerHTML = '<option value="">Select Part</option>' +
            this.parts.filter(p => p.is_active).map(p => 
                `<option value="${p.id}">${this.escapeHtml(p.part_number)} - ${this.escapeHtml(p.name)}</option>`
            ).join('');
    },

    async saveTransaction(e) {
        e.preventDefault();

        const transactionData = {
            part_id: document.getElementById('transaction-part').value,
            transaction_type: document.getElementById('transaction-type').value,
            quantity: parseInt(document.getElementById('transaction-quantity').value),
            unit_cost: parseFloat(document.getElementById('transaction-unit-cost').value) || null,
            reference_type: document.getElementById('transaction-reference-type').value || null,
            reference_id: document.getElementById('transaction-reference-id').value || null,
            notes: document.getElementById('transaction-notes').value || null
        };

        try {
            const { error } = await this.supabaseClient
                .from('inventory_transactions')
                .insert(transactionData);
            if (error) throw error;
            this.showToast('Transaction created successfully', 'success');
            this.closeTransactionModal();
            await this.loadTransactions();
            await this.loadParts();
            await this.loadStats();
        } catch (error) {
            console.error('Error saving transaction:', error);
            this.showToast(`Failed to save: ${error.message}`, 'error');
        }
    },

    async openPOModal() {
        this.showToast('Purchase Order functionality coming soon', 'info');
    },

    async viewPO(poId) {
        this.showToast('Purchase Order details coming soon', 'info');
    },

    setupEventListeners() {
        // Part form
        const partForm = document.getElementById('part-form');
        if (partForm) {
            partForm.addEventListener('submit', (e) => this.savePart(e));
        }

        // Vendor form
        const vendorForm = document.getElementById('vendor-form');
        if (vendorForm) {
            vendorForm.addEventListener('submit', (e) => this.saveVendor(e));
        }

        // Location form
        const locationForm = document.getElementById('location-form');
        if (locationForm) {
            locationForm.addEventListener('submit', (e) => this.saveLocation(e));
        }

        // Transaction form
        const transactionForm = document.getElementById('transaction-form');
        if (transactionForm) {
            transactionForm.addEventListener('submit', (e) => this.saveTransaction(e));
        }
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Global functions for onclick handlers
function switchTab(tab) {
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    const button = document.querySelector(`[data-tab="${tab}"]`);
    const content = document.getElementById(`${tab}-tab`);
    
    if (button) button.classList.add('active');
    if (content) content.classList.add('active');
}

function openPartModal() { InventoryManager.openPartModal(); }
function closePartModal() { InventoryManager.closePartModal(); }
function openVendorModal() { InventoryManager.openVendorModal(); }
function closeVendorModal() { InventoryManager.closeVendorModal(); }
function openLocationModal() { InventoryManager.openLocationModal(); }
function closeLocationModal() { InventoryManager.closeLocationModal(); }
function openTransactionModal() { InventoryManager.openTransactionModal(); }
function closeTransactionModal() { InventoryManager.closeTransactionModal(); }
function openPOModal() { InventoryManager.openPOModal(); }
function filterParts() { InventoryManager.filterParts(); }
function filterVendors() { InventoryManager.filterVendors(); }
function filterTransactions() { InventoryManager.filterTransactions(); }

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    InventoryManager.init();
});


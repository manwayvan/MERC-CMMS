// Master Database Manager - Unified Hierarchical View
// Manages Type → Make → Model hierarchy and PM Frequencies
const MasterDBManager = {
    currentType: null,
    currentEditId: null,
    currentTab: 'hierarchy',
    supabaseClient: null,
    hierarchyData: { categories: [], makes: [], models: [] },
    pmFrequencies: [],

    async init() {
        // Initialize Supabase client
        if (typeof window.supabase !== 'undefined' && typeof CONFIG !== 'undefined') {
            this.supabaseClient = window.supabase.createClient(
                CONFIG.SUPABASE_URL || 'https://hmdemsbqiqlqcggwblvl.supabase.co',
                CONFIG.SUPABASE_ANON_KEY || 'sb_publishable_Z9oNxTGDCCz3EZnh6NqySg_QzF6amCN'
            );
        } else if (window.sharedSupabaseClient) {
            this.supabaseClient = window.sharedSupabaseClient;
        }

        // Load data when tab is opened
        document.addEventListener('DOMContentLoaded', () => {
            const masterDbTab = document.querySelector('[data-tab="master-database"]');
            if (masterDbTab) {
                masterDbTab.addEventListener('click', () => {
                    this.loadStats();
                });
            }
        });

        // Setup form handler for item modal - use event delegation to ensure it works
        // Use a named function to avoid duplicate listeners
        if (!this._formHandlerAttached) {
            document.addEventListener('submit', (e) => {
                if (e.target && e.target.id === 'master-db-form') {
                    e.preventDefault();
                    console.log('Form submit event caught');
                    this.handleSubmit(e);
                }
            });
            this._formHandlerAttached = true;
        }

        // Setup quick add form inputs to update preview
        document.addEventListener('input', (e) => {
            if (e.target && e.target.id && e.target.id.startsWith('quick-')) {
                if (typeof this.updateQuickAddPreview === 'function') {
                    this.updateQuickAddPreview();
                }
            }
        });
    },

    async loadStats() {
        try {
            const [categories, makes, models, frequencies] = await Promise.all([
                this.supabaseClient.from('equipment_types').select('id', { count: 'exact' }).is('deleted_at', null),
                this.supabaseClient.from('equipment_makes').select('id', { count: 'exact' }).is('deleted_at', null),
                this.supabaseClient.from('equipment_models').select('id', { count: 'exact' }).is('deleted_at', null),
                this.supabaseClient.from('pm_frequencies').select('id', { count: 'exact' })
            ]);

            document.getElementById('stats-categories').textContent = categories.count || 0;
            document.getElementById('stats-makes').textContent = makes.count || 0;
            document.getElementById('stats-models').textContent = models.count || 0;
            document.getElementById('stats-frequencies').textContent = frequencies.count || 0;
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    },

    async openMasterModal() {
        const modal = document.getElementById('master-db-modal');
        this.currentTab = 'configurations';
        this.switchMasterTab('configurations');
        await this.loadConfigurations();
        await this.loadHierarchy();
        await this.loadPMFrequencies();
        modal.classList.add('active');
    },

    switchMasterTab(tab) {
        this.currentTab = tab;
        
        // Update tab buttons
        const configTab = document.getElementById('master-db-tab-configurations');
        const hierarchyTab = document.getElementById('master-db-tab-hierarchy');
        const frequenciesTab = document.getElementById('master-db-tab-frequencies');
        const configContent = document.getElementById('master-db-configurations-content');
        const hierarchyContent = document.getElementById('master-db-hierarchy-content');
        const frequenciesContent = document.getElementById('master-db-frequencies-content');

        // Reset all tabs
        [configTab, hierarchyTab, frequenciesTab].forEach(t => {
            t.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
            t.classList.add('text-slate-500');
        });
        [configContent, hierarchyContent, frequenciesContent].forEach(c => {
            if (c) c.style.display = 'none';
        });

        // Activate selected tab
        if (tab === 'configurations') {
            configTab.classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
            configTab.classList.remove('text-slate-500');
            if (configContent) configContent.style.display = 'block';
        } else if (tab === 'hierarchy') {
            hierarchyTab.classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
            hierarchyTab.classList.remove('text-slate-500');
            if (hierarchyContent) hierarchyContent.style.display = 'block';
        } else if (tab === 'frequencies') {
            frequenciesTab.classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
            frequenciesTab.classList.remove('text-slate-500');
            if (frequenciesContent) frequenciesContent.style.display = 'block';
        }
    },

    async loadHierarchy() {
        try {
            // Use the same MMD tables as Asset Modal: equipment_types, equipment_makes, equipment_models
            // Try RPC function first for efficiency
            const { data: rpcData, error: rpcError } = await this.supabaseClient.rpc('get_mmd_hierarchy');
            
            if (!rpcError && rpcData && rpcData.length > 0) {
                const result = rpcData[0];
                this.hierarchyData = {
                    categories: result.types || [],
                    makes: result.makes || [],
                    models: result.models || []
                };
            } else {
                // Fallback to individual queries
                const [categoriesResult, makesResult, modelsResult] = await Promise.all([
                    this.supabaseClient.from('equipment_types').select('*').is('deleted_at', null).order('name'),
                    this.supabaseClient.from('equipment_makes').select('*, equipment_types:type_id(id, name)').is('deleted_at', null).order('name'),
                    this.supabaseClient.from('equipment_models').select('*, equipment_makes:make_id(id, name, type_id, equipment_types:type_id(id, name))').is('deleted_at', null).order('name')
                ]);

                this.hierarchyData = {
                    categories: categoriesResult.data || [],
                    makes: makesResult.data || [],
                    models: modelsResult.data || []
                };
            }

            this.renderHierarchy();
        } catch (error) {
            console.error('Error loading hierarchy:', error);
            this.showToast('Failed to load hierarchy', 'error');
        }
    },

    renderHierarchy() {
        const container = document.getElementById('hierarchy-tree');
        if (!container) return;

        const searchTerm = document.getElementById('hierarchy-search')?.value.toLowerCase() || '';

        // Build hierarchy structure
        const hierarchy = {};
        
        this.hierarchyData.categories.forEach(cat => {
            if (!searchTerm || cat.name.toLowerCase().includes(searchTerm)) {
                hierarchy[cat.id] = {
                    category: cat,
                    makes: {}
                };
            }
        });

        this.hierarchyData.makes.forEach(make => {
            const typeId = make.type_id || (make.equipment_types && make.equipment_types.id);
            if (hierarchy[typeId] && (!searchTerm || make.name.toLowerCase().includes(searchTerm))) {
                hierarchy[typeId].makes[make.id] = {
                    make: make,
                    models: []
                };
            }
        });

        this.hierarchyData.models.forEach(model => {
            const makeId = model.make_id;
            const make = this.hierarchyData.makes.find(m => m.id === makeId);
            const typeId = make ? (make.type_id || (make.equipment_types && make.equipment_types.id)) : null;
            if (make && typeId && hierarchy[typeId]?.makes[makeId]) {
                if (!searchTerm || model.name.toLowerCase().includes(searchTerm)) {
                    hierarchy[typeId].makes[makeId].models.push(model);
                }
            }
        });

        // Render tree
        let html = '';
        Object.values(hierarchy).forEach(({ category, makes }) => {
            const makeCount = Object.keys(makes).length;
            const modelCount = Object.values(makes).reduce((sum, m) => sum + m.models.length, 0);
            
            html += `
                <div class="mb-4 border border-slate-200 rounded-lg overflow-hidden">
                    <div class="bg-blue-50 px-4 py-3 flex items-center justify-between">
                        <div class="flex items-center gap-3 flex-1">
                            <i class="fas fa-chevron-down text-blue-600 cursor-pointer" onclick="MasterDBManager.toggleCategory('${category.id}')"></i>
                            <i class="fas fa-tags text-blue-600"></i>
                            <div class="flex-1">
                                <div class="font-semibold text-slate-800">${this.escapeHtml(category.name)}</div>
                                <div class="text-xs text-slate-600">${this.escapeHtml(category.description || '')}</div>
                            </div>
                            <div class="text-xs text-slate-500">
                                ${makeCount} ${makeCount === 1 ? 'make' : 'makes'}, ${modelCount} ${modelCount === 1 ? 'model' : 'models'}
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="MasterDBManager.openAddModal('make', '${category.id}')" class="btn btn-secondary btn-sm" title="Add Manufacturer">
                                <i class="fas fa-plus"></i> Make
                            </button>
                            <button onclick="MasterDBManager.editItem('category', '${category.id}')" class="text-blue-600 hover:text-blue-800" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="MasterDBManager.deleteItem('category', '${category.id}')" class="text-red-600 hover:text-red-800" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div id="category-${category.id}-content" class="bg-white">
                        ${Object.values(makes).map(({ make, models }) => `
                            <div class="border-t border-slate-200">
                                <div class="px-8 py-3 flex items-center justify-between bg-slate-50">
                                    <div class="flex items-center gap-3 flex-1">
                                        <i class="fas fa-chevron-down text-green-600 cursor-pointer ml-4" onclick="MasterDBManager.toggleMake('${make.id}')"></i>
                                        <i class="fas fa-industry text-green-600"></i>
                                        <div class="flex-1">
                                            <div class="font-medium text-slate-800">${this.escapeHtml(make.name)}</div>
                                            <div class="text-xs text-slate-600">${this.escapeHtml(make.description || '')}</div>
                                        </div>
                                        <div class="text-xs text-slate-500">
                                            ${models.length} ${models.length === 1 ? 'model' : 'models'}
                                        </div>
                                    </div>
                                    <div class="flex gap-2">
                                        <button onclick="MasterDBManager.openAddModal('model', null, '${make.id}')" class="btn btn-secondary btn-sm" title="Add Model">
                                            <i class="fas fa-plus"></i> Model
                                        </button>
                                        <button onclick="MasterDBManager.editItem('make', '${make.id}')" class="text-blue-600 hover:text-blue-800" title="Edit">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button onclick="MasterDBManager.deleteItem('make', '${make.id}')" class="text-red-600 hover:text-red-800" title="Delete">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                                <div id="make-${make.id}-content" class="bg-white">
                                    ${models.map(model => `
                                        <div class="border-t border-slate-100 px-12 py-2 flex items-center justify-between hover:bg-slate-50">
                                            <div class="flex items-center gap-3 flex-1">
                                                <i class="fas fa-cube text-purple-600"></i>
                                                <div class="flex-1">
                                                    <div class="text-sm font-medium text-slate-800">${this.escapeHtml(model.name)}</div>
                                                    <div class="text-xs text-slate-600">${this.escapeHtml(model.description || '')}</div>
                                                </div>
                                            </div>
                                            <div class="flex gap-2">
                                                <button onclick="MasterDBManager.editItem('model', '${model.id}')" class="text-blue-600 hover:text-blue-800" title="Edit">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button onclick="MasterDBManager.deleteItem('model', '${model.id}')" class="text-red-600 hover:text-red-800" title="Delete">
                                                    <i class="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    `).join('')}
                                    ${models.length === 0 ? '<div class="px-12 py-4 text-sm text-slate-400 italic">No models yet</div>' : ''}
                                </div>
                            </div>
                        `).join('')}
                        ${makeCount === 0 ? '<div class="px-8 py-4 text-sm text-slate-400 italic">No manufacturers yet</div>' : ''}
                    </div>
                </div>
            `;
        });

        if (html === '') {
            html = '<div class="text-center text-slate-500 py-8">No items found. Click "Add Type" to get started.</div>';
        }

        container.innerHTML = html;
    },

    toggleCategory(categoryId) {
        const content = document.getElementById(`category-${categoryId}-content`);
        if (content) {
            content.style.display = content.style.display === 'none' ? 'block' : 'none';
        }
    },

    toggleMake(makeId) {
        const content = document.getElementById(`make-${makeId}-content`);
        if (content) {
            content.style.display = content.style.display === 'none' ? 'block' : 'none';
        }
    },

    filterHierarchy() {
        this.renderHierarchy();
    },

    async loadPMFrequencies() {
        try {
            const { data, error } = await this.supabaseClient
                .from('pm_frequencies')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error) throw error;

            this.pmFrequencies = data || [];
            this.renderPMFrequencies();
        } catch (error) {
            console.error('Error loading PM frequencies:', error);
            this.showToast('Failed to load PM frequencies', 'error');
        }
    },

    renderPMFrequencies() {
        const tbody = document.getElementById('master-db-frequencies-table');
        if (!tbody) return;

        const searchTerm = document.getElementById('frequency-search')?.value.toLowerCase() || '';
        const filtered = this.pmFrequencies.filter(freq => 
            !searchTerm || 
            freq.name.toLowerCase().includes(searchTerm) ||
            freq.code.toLowerCase().includes(searchTerm)
        );

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-slate-500">No PM frequencies found</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(freq => `
            <tr>
                <td class="px-4 py-3 text-sm font-medium text-slate-900">${this.escapeHtml(freq.name)}</td>
                <td class="px-4 py-3 text-sm text-slate-600">${this.escapeHtml(freq.code)}</td>
                <td class="px-4 py-3 text-sm text-slate-600">${freq.days}</td>
                <td class="px-4 py-3 text-sm text-slate-600">${this.escapeHtml(freq.description || '')}</td>
                <td class="px-4 py-3 text-sm">
                    <span class="status-badge ${freq.is_active ? 'status-active' : 'status-inactive'}">
                        ${freq.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td class="px-4 py-3 text-sm">
                    <button onclick="MasterDBManager.editItem('pm-frequency', '${freq.id}')" class="text-blue-600 hover:text-blue-800 mr-3">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button onclick="MasterDBManager.deleteItem('pm-frequency', '${freq.id}')" class="text-red-600 hover:text-red-800">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `).join('');
    },

    filterFrequencies() {
        this.renderPMFrequencies();
    },

    openAddModal(type, categoryId = null, makeId = null) {
        this.currentType = type;
        this.currentEditId = null;
        const modal = document.getElementById('master-db-item-modal');
        if (!modal) {
            console.error('master-db-item-modal not found');
            return;
        }
        const title = document.getElementById('master-db-item-modal-title');
        const form = document.getElementById('master-db-form');

        // Reset form
        form.reset();
        document.getElementById('master-db-id').value = '';
        document.getElementById('master-db-type').value = type;

        // Hide all field groups
        ['category', 'make', 'model', 'pm-frequency'].forEach(t => {
            const fields = document.getElementById(`${t}-fields`);
            if (fields) fields.style.display = 'none';
        });

        // Show appropriate fields
        const fieldsToShow = document.getElementById(`${type}-fields`);
        if (fieldsToShow) {
            fieldsToShow.style.display = 'block';
        }

        // Pre-populate parent IDs if provided
        if (type === 'make' && categoryId) {
            document.getElementById('make-type-id').value = categoryId;
        }
        if (type === 'model' && makeId) {
            const make = this.hierarchyData.makes.find(m => m.id === makeId);
            if (make) {
                const typeId = make.type_id || (make.equipment_types && make.equipment_types.id);
                if (typeId) {
                    document.getElementById('model-type-id').value = typeId;
                    this.updateMakeDropdown();
                }
                document.getElementById('model-make-id').value = makeId;
            }
        }

        // Set title
        const titles = {
            'category': 'Add Device Type',
            'make': 'Add Manufacturer',
            'model': 'Add Device Model',
            'pm-frequency': 'Add PM Frequency'
        };
        if (title) {
            title.textContent = titles[type] || 'Add Item';
        }

        // Load dropdowns if needed
        if (type === 'make' || type === 'model') {
            this.loadCategoryDropdowns();
        }
        if (type === 'model') {
            this.updateMakeDropdown();
        }

        modal.classList.add('active');
    },

    async editItem(type, id) {
        this.currentType = type;
        this.currentEditId = id;
        const modal = document.getElementById('master-db-item-modal');
        const title = document.getElementById('master-db-item-modal-title');
        const form = document.getElementById('master-db-form');

        try {
            let table = '';
            if (type === 'category') table = 'equipment_types';
            else if (type === 'make') table = 'equipment_makes';
            else if (type === 'model') table = 'equipment_models';
            else if (type === 'pm-frequency') table = 'pm_frequencies';

            const { data, error } = await this.supabaseClient
                .from(table)
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            // Populate form
            document.getElementById('master-db-id').value = id;
            document.getElementById('master-db-type').value = type;

            // Hide all field groups
            ['category', 'make', 'model', 'pm-frequency'].forEach(t => {
                const fields = document.getElementById(`${t}-fields`);
                if (fields) fields.style.display = 'none';
            });

            // Show appropriate fields and populate
            if (type === 'category') {
                const fields = document.getElementById('category-fields');
                if (fields) fields.style.display = 'block';
                document.getElementById('category-name').value = data.name || '';
                document.getElementById('category-description').value = data.description || '';
            } else if (type === 'make') {
                const fields = document.getElementById('make-fields');
                if (fields) fields.style.display = 'block';
                await this.loadCategoryDropdowns();
                const typeId = data.type_id || (data.equipment_types && data.equipment_types.id);
                document.getElementById('make-type-id').value = typeId || '';
                document.getElementById('make-name').value = data.name || '';
                document.getElementById('make-description').value = data.description || '';
            } else if (type === 'model') {
                const fields = document.getElementById('model-fields');
                if (fields) fields.style.display = 'block';
                await this.loadCategoryDropdowns();
                const make = this.hierarchyData.makes.find(m => m.id === data.make_id);
                if (make) {
                    const typeId = make.type_id || (make.equipment_types && make.equipment_types.id);
                    document.getElementById('model-type-id').value = typeId || '';
                    await this.updateMakeDropdown();
                }
                document.getElementById('model-make-id').value = data.make_id || '';
                document.getElementById('model-name').value = data.name || '';
                document.getElementById('model-description').value = data.description || '';
            } else if (type === 'pm-frequency') {
                const fields = document.getElementById('pm-frequency-fields');
                if (fields) fields.style.display = 'block';
                document.getElementById('pm-frequency-name').value = data.name || '';
                document.getElementById('pm-frequency-code').value = data.code || '';
                document.getElementById('pm-frequency-days').value = data.days || '';
                document.getElementById('pm-frequency-sort').value = data.sort_order || 0;
                document.getElementById('pm-frequency-description').value = data.description || '';
                document.getElementById('pm-frequency-active').checked = data.is_active !== false;
            }

            // Set title
            const titles = {
                'category': 'Edit Device Type',
                'make': 'Edit Manufacturer',
                'model': 'Edit Device Model',
                'pm-frequency': 'Edit PM Frequency'
            };
            if (title) title.textContent = titles[type] || 'Edit Item';

            modal.classList.add('active');
        } catch (error) {
            console.error('Error loading item:', error);
            this.showToast('Failed to load item', 'error');
        }
    },

    async loadCategoryDropdowns() {
        try {
            const { data, error } = await this.supabaseClient
                .from('equipment_types')
                .select('id, name')
                .is('deleted_at', null)
                .order('name');

            if (error) throw error;

            const dropdowns = ['make-type-id', 'model-type-id'];
            dropdowns.forEach(dropdownId => {
                const dropdown = document.getElementById(dropdownId);
                if (dropdown) {
                    const currentValue = dropdown.value;
                    dropdown.innerHTML = '<option value="">Select Equipment Type</option>' +
                        data.map(cat => `<option value="${cat.id}">${this.escapeHtml(cat.name)}</option>`).join('');
                    if (currentValue) {
                        dropdown.value = currentValue;
                    }
                }
            });
        } catch (error) {
            console.error('Error loading equipment types:', error);
        }
    },

    async updateMakeDropdown() {
        const typeId = document.getElementById('model-type-id')?.value || '';
        const makeDropdown = document.getElementById('model-make-id');
        if (!makeDropdown) return;

        try {
            let query = this.supabaseClient
                .from('equipment_makes')
                .select('id, name')
                .is('deleted_at', null)
                .order('name');

            if (typeId) {
                query = query.eq('type_id', typeId);
            }

            const { data, error } = await query;
            if (error) throw error;

            const currentValue = makeDropdown.value;
            makeDropdown.innerHTML = '<option value="">Select Manufacturer</option>' +
                (data || []).map(make => `<option value="${make.id}">${this.escapeHtml(make.name)}</option>`).join('');
            if (currentValue) {
                makeDropdown.value = currentValue;
            }
        } catch (error) {
            console.error('Error loading makes:', error);
        }
    },

    async handleSubmit(e) {
        if (e) e.preventDefault();
        
        const typeInput = document.getElementById('master-db-type');
        const idInput = document.getElementById('master-db-id');
        
        if (!typeInput) {
            console.error('master-db-type input not found');
            this.showToast('Form error: Type field not found', 'error');
            return;
        }
        
        const type = typeInput.value;
        const id = idInput ? idInput.value : '';
        
        console.log('handleSubmit called:', { type, id });

        try {
            let payload = {};
            let table = '';

            if (type === 'category') {
                table = 'equipment_types';
                const name = document.getElementById('category-name').value.trim();
                if (!name) {
                    this.showToast('Name is required', 'error');
                    return;
                }
                payload = {
                    name: name,
                    description: document.getElementById('category-description').value.trim() || null,
                    is_active: true
                };
                // Equipment types use auto-generated IDs from database default
            } else if (type === 'make') {
                table = 'equipment_makes';
                const typeId = document.getElementById('make-type-id').value;
                const name = document.getElementById('make-name').value.trim();
                if (!typeId || !name) {
                    this.showToast('Equipment Type and Name are required', 'error');
                    return;
                }
                payload = {
                    type_id: typeId,
                    name: name,
                    description: document.getElementById('make-description').value.trim() || null,
                    is_active: true
                };
                // Equipment makes use auto-generated IDs from database default
            } else if (type === 'model') {
                table = 'equipment_models';
                const makeId = document.getElementById('model-make-id').value;
                const name = document.getElementById('model-name').value.trim();
                if (!makeId || !name) {
                    this.showToast('Make and Name are required', 'error');
                    return;
                }
                payload = {
                    make_id: makeId,
                    name: name,
                    description: document.getElementById('model-description').value.trim() || null,
                    is_active: true
                };
                // Equipment models use auto-generated IDs from database default
            } else if (type === 'pm-frequency') {
                table = 'pm_frequencies';
                const name = document.getElementById('pm-frequency-name').value.trim();
                const code = document.getElementById('pm-frequency-code').value.trim().toLowerCase();
                const days = parseInt(document.getElementById('pm-frequency-days').value);
                if (!name || !code || !days) {
                    this.showToast('Name, Code, and Days are required', 'error');
                    return;
                }
                payload = {
                    name: name,
                    code: code,
                    days: days,
                    description: document.getElementById('pm-frequency-description').value.trim() || null,
                    sort_order: parseInt(document.getElementById('pm-frequency-sort').value) || 0,
                    is_active: document.getElementById('pm-frequency-active').checked
                };
                if (!id) {
                    payload.id = code;
                }
            }

            let result;
            if (id) {
                // Update
                result = await this.supabaseClient
                    .from(table)
                    .update(payload)
                    .eq('id', id)
                    .select()
                    .single();
            } else {
                // Insert
                result = await this.supabaseClient
                    .from(table)
                    .insert([payload])
                    .select()
                    .single();
            }

            if (result.error) throw result.error;

            this.showToast(`${type === 'category' ? 'Device Type' : type === 'make' ? 'Manufacturer' : type === 'model' ? 'Model' : 'PM Frequency'} saved successfully`, 'success');
            this.closeItemModal();
            
            // Reload data
            await this.loadHierarchy();
            await this.loadPMFrequencies();
            await this.loadStats();

            // Trigger refresh in other pages if they're open
            if (window.loadReferenceData) {
                window.loadReferenceData();
            }
            if (window.loadPMFrequencies) {
                window.loadPMFrequencies();
            }
        } catch (error) {
            console.error('Error saving:', error);
            console.error('Error details:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            this.showToast(`Failed to save: ${error.message || 'Unknown error'}`, 'error');
        }
    },

    async deleteItem(type, id) {
        if (!confirm(`Are you sure you want to delete this ${type}? This action cannot be undone.`)) {
            return;
        }

        try {
            let table = '';
            if (type === 'category') table = 'equipment_types';
            else if (type === 'make') table = 'equipment_makes';
            else if (type === 'model') table = 'equipment_models';
            else if (type === 'pm-frequency') table = 'pm_frequencies';

            const { error } = await this.supabaseClient
                .from(table)
                .delete()
                .eq('id', id);

            if (error) throw error;

            this.showToast('Item deleted successfully', 'success');
            
            // Reload data
            await this.loadHierarchy();
            await this.loadPMFrequencies();
            await this.loadStats();

            // Trigger refresh in other pages
            if (window.loadReferenceData) {
                window.loadReferenceData();
            }
            if (window.loadPMFrequencies) {
                window.loadPMFrequencies();
            }
            // Refresh Asset Modal MMD data if it's loaded
            if (window.MMDAssetFormManager && window.MMDAssetFormManager.loadMMDHierarchy) {
                await window.MMDAssetFormManager.loadMMDHierarchy();
            }
        } catch (error) {
            console.error('Error deleting:', error);
            this.showToast(`Failed to delete: ${error.message}`, 'error');
        }
    },

    closeModal() {
        document.getElementById('master-db-modal').classList.remove('active');
    },

    closeItemModal() {
        const modal = document.getElementById('master-db-item-modal');
        if (modal) {
            modal.classList.remove('active');
        }
        this.currentType = null;
        this.currentEditId = null;
    },

    showToast(message, type = 'info') {
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            alert(message);
        }
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // ============================================
    // DEVICE CONFIGURATIONS MANAGEMENT
    // ============================================

    configurations: [],
    configSearchTerm: '',

    async loadConfigurations() {
        try {
            // First, get the base configurations
            const { data: configs, error: configError } = await this.supabaseClient
                .from('device_configurations')
                .select('*')
                .order('name');

            if (configError) throw configError;

            // Then, enrich with related data
            const enrichedConfigs = await Promise.all(
                (configs || []).map(async (config) => {
                    const enriched = { ...config };
                    
                    // Load category
                    if (config.category_id) {
                        const { data: category } = await this.supabaseClient
                            .from('device_categories')
                            .select('id, name')
                            .eq('id', config.category_id)
                            .single();
                        enriched.device_categories = category;
                    }
                    
                    // Load make
                    if (config.make_id) {
                        const { data: make } = await this.supabaseClient
                            .from('device_makes')
                            .select('id, name')
                            .eq('id', config.make_id)
                            .single();
                        enriched.device_makes = make;
                    }
                    
                    // Load model
                    if (config.model_id) {
                        const { data: model } = await this.supabaseClient
                            .from('device_models')
                            .select('id, name')
                            .eq('id', config.model_id)
                            .single();
                        enriched.device_models = model;
                    }
                    
                    // Load PM frequency
                    if (config.pm_frequency_id) {
                        const { data: frequency } = await this.supabaseClient
                            .from('pm_frequencies')
                            .select('id, name, days')
                            .eq('id', config.pm_frequency_id)
                            .single();
                        enriched.pm_frequencies = frequency;
                    }
                    
                    // Load checklist
                    if (config.checklist_id) {
                        const { data: checklist } = await this.supabaseClient
                            .from('checklists')
                            .select('id, name')
                            .eq('id', config.checklist_id)
                            .single();
                        enriched.checklists = checklist;
                    }
                    
                    return enriched;
                })
            );

            this.configurations = enrichedConfigs;
            this.renderConfigurations();
        } catch (error) {
            console.error('Error loading configurations:', error);
            this.showToast(`Failed to load configurations: ${error.message}`, 'error');
        }
    },

    renderConfigurations() {
        const tbody = document.getElementById('configurations-table');
        if (!tbody) return;

        const filtered = this.configSearchTerm
            ? this.configurations.filter(c => 
                c.name?.toLowerCase().includes(this.configSearchTerm.toLowerCase()) ||
                c.device_categories?.name?.toLowerCase().includes(this.configSearchTerm.toLowerCase()) ||
                c.device_makes?.name?.toLowerCase().includes(this.configSearchTerm.toLowerCase()) ||
                c.device_models?.name?.toLowerCase().includes(this.configSearchTerm.toLowerCase())
            )
            : this.configurations;

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="px-4 py-8 text-center text-slate-500">
                        <i class="fas fa-inbox text-2xl mb-2"></i>
                        <p>No configurations found. Click "Add Configuration" to create one.</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filtered.map(config => `
            <tr class="hover:bg-slate-50">
                <td class="px-4 py-3 font-medium text-slate-900">${this.escapeHtml(config.name || 'Unnamed')}</td>
                <td class="px-4 py-3 text-slate-600">${this.escapeHtml(config.device_categories?.name || '-')}</td>
                <td class="px-4 py-3 text-slate-600">${this.escapeHtml(config.device_makes?.name || '-')}</td>
                <td class="px-4 py-3 text-slate-600">${this.escapeHtml(config.device_models?.name || '-')}</td>
                <td class="px-4 py-3 text-slate-600">${config.pm_frequencies ? `${this.escapeHtml(config.pm_frequencies.name)} (${config.pm_frequencies.days} days)` : '-'}</td>
                <td class="px-4 py-3 text-slate-600">${config.checklists ? this.escapeHtml(config.checklists.name) : '-'}</td>
                <td class="px-4 py-3">
                    <span class="status-badge ${config.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                        ${config.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <div class="flex gap-2">
                        <button onclick="MasterDBManager.editConfiguration('${config.id}')" class="text-blue-600 hover:text-blue-800">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="MasterDBManager.deleteConfiguration('${config.id}')" class="text-red-600 hover:text-red-800">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    filterConfigurations() {
        this.configSearchTerm = document.getElementById('config-search')?.value || '';
        this.renderConfigurations();
    },

    async openConfigModal(configId = null) {
        const modal = document.getElementById('config-modal');
        const form = document.getElementById('config-form');
        const title = document.getElementById('config-modal-title');
        
        form.reset();
        document.getElementById('config-id').value = configId || '';

        // Hide all quick-add containers
        ['type', 'make', 'model'].forEach(type => {
            this.cancelQuickAdd(type);
        });

        // Load dropdowns
        await this.loadConfigCategories();
        await this.loadPMFrequencyDropdown();
        await this.loadChecklistDropdown();

        if (configId) {
            // Edit mode
            const config = this.configurations.find(c => c.id === configId);
            if (config) {
                title.textContent = 'Edit Configuration';
                document.getElementById('config-name').value = config.name || '';
                document.getElementById('config-category').value = config.category_id;
                await this.updateConfigMakes();
                document.getElementById('config-make').value = config.make_id;
                await this.updateConfigModels();
                document.getElementById('config-model').value = config.model_id;
                document.getElementById('config-pm-frequency').value = config.pm_frequency_id || '';
                document.getElementById('config-checklist').value = config.checklist_id || '';
                document.getElementById('config-description').value = config.description || '';
                document.getElementById('config-active').checked = config.is_active !== false;
            }
        } else {
            title.textContent = 'Add Configuration';
        }

        modal.classList.add('active');
    },

    closeConfigModal() {
        document.getElementById('config-modal').classList.remove('active');
    },

    async loadConfigCategories() {
        const select = document.getElementById('config-category');
        if (!select) return;

        const { data } = await this.supabaseClient
            .from('device_categories')
            .select('*')
            .order('name');

        select.innerHTML = '<option value="">Select Type</option>' +
            (data || []).map(c => `<option value="${c.id}">${this.escapeHtml(c.name)}</option>`).join('');
    },

    async updateConfigMakes() {
        const categoryId = document.getElementById('config-category').value;
        const makeSelect = document.getElementById('config-make');
        const modelSelect = document.getElementById('config-model');
        const addMakeBtn = document.getElementById('config-add-make-btn');

        if (!categoryId) {
            makeSelect.innerHTML = '<option value="">Select Manufacturer</option>';
            makeSelect.disabled = true;
            modelSelect.innerHTML = '<option value="">Select Model</option>';
            modelSelect.disabled = true;
            if (addMakeBtn) addMakeBtn.disabled = true;
            if (document.getElementById('config-add-model-btn')) {
                document.getElementById('config-add-model-btn').disabled = true;
            }
            return;
        }

        const { data } = await this.supabaseClient
            .from('device_makes')
            .select('*')
            .eq('category_id', categoryId)
            .order('name');

        makeSelect.innerHTML = '<option value="">Select Manufacturer</option>' +
            (data || []).map(m => `<option value="${m.id}">${this.escapeHtml(m.name)}</option>`).join('');
        
        makeSelect.disabled = false;
        if (addMakeBtn) addMakeBtn.disabled = false;
        modelSelect.innerHTML = '<option value="">Select Model</option>';
        modelSelect.disabled = true;
        if (document.getElementById('config-add-model-btn')) {
            document.getElementById('config-add-model-btn').disabled = true;
        }
    },

    async updateConfigModels() {
        const makeId = document.getElementById('config-make').value;
        const modelSelect = document.getElementById('config-model');
        const addModelBtn = document.getElementById('config-add-model-btn');

        if (!makeId) {
            modelSelect.innerHTML = '<option value="">Select Model</option>';
            modelSelect.disabled = true;
            if (addModelBtn) addModelBtn.disabled = true;
            return;
        }

        const { data } = await this.supabaseClient
            .from('device_models')
            .select('*')
            .eq('make_id', makeId)
            .order('name');

        modelSelect.innerHTML = '<option value="">Select Model</option>' +
            (data || []).map(m => `<option value="${m.id}">${this.escapeHtml(m.name)}</option>`).join('');
        
        modelSelect.disabled = false;
        if (addModelBtn) addModelBtn.disabled = false;
    },

    async loadPMFrequencyDropdown() {
        const select = document.getElementById('config-pm-frequency');
        if (!select) return;

        const { data } = await this.supabaseClient
            .from('pm_frequencies')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        select.innerHTML = '<option value="">No PM Schedule</option>' +
            (data || []).map(f => `<option value="${f.id}">${this.escapeHtml(f.name)} (${f.days} days)</option>`).join('');
    },

    async loadChecklistDropdown() {
        const select = document.getElementById('config-checklist');
        if (!select) return;

        try {
            const { data } = await this.supabaseClient
                .from('checklists')
                .select('*')
                .eq('is_active', true)
                .order('name');

            select.innerHTML = '<option value="">No Checklist</option>' +
                (data || []).map(c => `<option value="${c.id}">${this.escapeHtml(c.name)}</option>`).join('');
        } catch (error) {
            // Checklists table might not exist
            select.innerHTML = '<option value="">No Checklist</option>';
        }
    },

    async handleConfigSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const configId = document.getElementById('config-id').value;

        const configData = {
            name: document.getElementById('config-name').value,
            category_id: document.getElementById('config-category').value,
            make_id: document.getElementById('config-make').value,
            model_id: document.getElementById('config-model').value,
            pm_frequency_id: document.getElementById('config-pm-frequency').value || null,
            checklist_id: document.getElementById('config-checklist').value || null,
            description: document.getElementById('config-description').value || null,
            is_active: document.getElementById('config-active').checked
        };

        try {
            if (configId) {
                const { error } = await this.supabaseClient
                    .from('device_configurations')
                    .update(configData)
                    .eq('id', configId);
                if (error) throw error;
                this.showToast('Configuration updated successfully', 'success');
            } else {
                const { error } = await this.supabaseClient
                    .from('device_configurations')
                    .insert(configData);
                if (error) throw error;
                this.showToast('Configuration created successfully', 'success');
            }

            this.closeConfigModal();
            await this.loadConfigurations();
        } catch (error) {
            console.error('Error saving configuration:', error);
            this.showToast(`Failed to save: ${error.message}`, 'error');
        }
    },

    async editConfiguration(configId) {
        await this.openConfigModal(configId);
    },

    async deleteConfiguration(configId) {
        if (!configId) {
            this.showToast('Invalid configuration ID', 'error');
            return;
        }

        if (!confirm('Are you sure you want to delete this configuration? This action cannot be undone.')) return;

        try {
            const { error } = await this.supabaseClient
                .from('device_configurations')
                .delete()
                .eq('id', configId);
            
            if (error) {
                console.error('Delete error:', error);
                throw error;
            }
            
            this.showToast('Configuration deleted successfully', 'success');
            await this.loadConfigurations();
        } catch (error) {
            console.error('Error deleting configuration:', error);
            this.showToast(`Failed to delete: ${error.message || 'Unknown error'}`, 'error');
        }
    },

    showBulkUploadModal() {
        document.getElementById('bulk-upload-modal').classList.add('active');
        const fileInput = document.getElementById('bulk-upload-file');
        fileInput.value = '';
        fileInput.onchange = (e) => this.previewBulkUpload(e.target.files[0]);
    },

    closeBulkUploadModal() {
        document.getElementById('bulk-upload-modal').classList.remove('active');
    },

    async previewBulkUpload(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target.result;
            const lines = text.split('\n').filter(l => l.trim());
            const headers = lines[0].split(',').map(h => h.trim());
            
            // Show preview
            const previewDiv = document.getElementById('bulk-upload-preview');
            const previewTable = document.getElementById('bulk-preview-table');
            previewDiv.classList.remove('hidden');
            
            previewTable.innerHTML = `
                <thead class="bg-slate-50">
                    <tr>${headers.map(h => `<th class="px-3 py-2 text-xs font-medium text-slate-500">${h}</th>`).join('')}</tr>
                </thead>
                <tbody>
                    ${lines.slice(1, 6).map(line => {
                        const cols = line.split(',').map(c => c.trim());
                        return `<tr>${cols.map(c => `<td class="px-3 py-2 text-sm">${this.escapeHtml(c)}</td>`).join('')}</tr>`;
                    }).join('')}
                </tbody>
            `;
            
            document.getElementById('bulk-upload-btn').disabled = false;
        };
        reader.readAsText(file);
    },

    async processBulkUpload() {
        const fileInput = document.getElementById('bulk-upload-file');
        const file = fileInput.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target.result;
            const lines = text.split('\n').filter(l => l.trim());
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            
            const configs = [];
            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(',').map(c => c.trim());
                const row = {};
                headers.forEach((h, idx) => {
                    row[h] = cols[idx] || '';
                });

                // Find IDs for Type, Make, Model, PM Frequency
                const category = await this.findCategoryByName(row.type);
                const make = category ? await this.findMakeByName(category.id, row.make) : null;
                const model = make ? await this.findModelByName(make.id, row.model) : null;
                const frequency = row['pm frequency'] ? await this.findFrequencyByName(row['pm frequency']) : null;

                if (category && make && model) {
                    configs.push({
                        name: row.name || `${row.make} ${row.model} ${row.type}${frequency ? ' - ' + frequency.name + ' PM' : ''}`,
                        category_id: category.id,
                        make_id: make.id,
                        model_id: model.id,
                        pm_frequency_id: frequency?.id || null,
                        checklist_id: null, // TODO: Support checklist lookup
                        description: row.description || null,
                        is_active: true
                    });
                }
            }

            // Bulk insert
            if (configs.length > 0) {
                const { error } = await this.supabaseClient
                    .from('device_configurations')
                    .insert(configs);
                if (error) throw error;
                this.showToast(`Successfully imported ${configs.length} configurations`, 'success');
                this.closeBulkUploadModal();
                await this.loadConfigurations();
            }
        };
        reader.readAsText(file);
    },

    async findCategoryByName(name) {
        const { data } = await this.supabaseClient
            .from('device_categories')
            .select('*')
            .ilike('name', name)
            .limit(1);
        return data?.[0] || null;
    },

    async findMakeByName(categoryId, name) {
        const { data } = await this.supabaseClient
            .from('device_makes')
            .select('*')
            .eq('category_id', categoryId)
            .ilike('name', name)
            .limit(1);
        return data?.[0] || null;
    },

    async findModelByName(makeId, name) {
        const { data } = await this.supabaseClient
            .from('device_models')
            .select('*')
            .eq('make_id', makeId)
            .ilike('name', name)
            .limit(1);
        return data?.[0] || null;
    },

    async findFrequencyByName(name) {
        const { data } = await this.supabaseClient
            .from('pm_frequencies')
            .select('*')
            .ilike('name', name)
            .limit(1);
        return data?.[0] || null;
    },

    downloadTemplate() {
        const csv = 'Type,Make,Model,PM Frequency,Checklist (optional),Description (optional),Name (optional)\nDefib,Zoll,R Series,Monthly,,,Zoll R Series Defib - Monthly PM';
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'device_configurations_template.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    },

    // ============================================
    // QUICK ADD (SINGLE STEP) FUNCTIONALITY
    // ============================================

    async openQuickAddModal() {
        const modal = document.getElementById('quick-add-modal');
        if (!modal) {
            console.error('quick-add-modal not found');
            return;
        }

        // Reset form
        document.getElementById('quick-add-form').reset();
        document.getElementById('quick-type-select').value = '';
        document.getElementById('quick-make-select').value = '';
        document.getElementById('quick-make-select').disabled = true;
        document.getElementById('quick-model-select').value = '';
        document.getElementById('quick-model-select').disabled = true;
        document.getElementById('quick-pm-frequency').value = '';
        document.getElementById('quick-pm-frequency').disabled = true;
        
        // Disable dependent fields
        ['quick-make-name', 'quick-make-desc', 'quick-model-name', 'quick-model-desc'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.disabled = true;
        });

        // Load existing types and PM frequencies
        await this.loadQuickAddDropdowns();
        
        modal.classList.add('active');
        this.updateQuickAddPreview();
    },

    closeQuickAddModal() {
        const modal = document.getElementById('quick-add-modal');
        if (modal) modal.classList.remove('active');
    },

    async loadQuickAddDropdowns() {
        try {
            // Load equipment types (MMD system)
            const { data: types } = await this.supabaseClient
                .from('equipment_types')
                .select('id, name')
                .is('deleted_at', null)
                .order('name');
            
            const typeSelect = document.getElementById('quick-type-select');
            if (typeSelect && types) {
                typeSelect.innerHTML = '<option value="">-- Select Existing --</option>' +
                    types.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
            }

            // Load PM frequencies
            const { data: frequencies } = await this.supabaseClient
                .from('pm_frequencies')
                .select('id, name, code, days')
                .eq('is_active', true)
                .order('sort_order');
            
            const freqSelect = document.getElementById('quick-pm-frequency');
            if (freqSelect && frequencies) {
                freqSelect.innerHTML = '<option value="">-- Select Frequency --</option>' +
                    frequencies.map(f => `<option value="${f.id}">${f.name} (${f.days} days)</option>`).join('');
            }
        } catch (error) {
            console.error('Error loading quick add dropdowns:', error);
        }
    },

    async handleQuickTypeChange() {
        const typeSelect = document.getElementById('quick-type-select');
        const typeNameInput = document.getElementById('quick-type-name');
        const makeSelect = document.getElementById('quick-make-select');
        const makeNameInput = document.getElementById('quick-make-name');
        const makeDescInput = document.getElementById('quick-make-desc');

        if (!typeSelect || !typeNameInput || !makeSelect || !makeNameInput || !makeDescInput) {
            console.error('Quick add form elements not found');
            return;
        }

        const selectedTypeId = typeSelect.value;
        const newTypeName = typeNameInput.value.trim();

        if (selectedTypeId || newTypeName) {
            // Always enable make text input fields when type is selected or entered
            makeNameInput.disabled = false;
            makeDescInput.disabled = false;

            // Load makes for selected type
            if (selectedTypeId) {
                // Type is selected from dropdown - enable dropdown and load makes
                makeSelect.disabled = false;
                try {
                    const { data: makes } = await this.supabaseClient
                        .from('equipment_makes')
                        .select('id, name')
                        .is('deleted_at', null)
                        .eq('type_id', selectedTypeId)
                        .order('name');
                    
                    makeSelect.innerHTML = '<option value="">-- Select Existing --</option>' +
                        (makes || []).map(m => `<option value="${m.id}">${m.name}</option>`).join('');
                } catch (error) {
                    console.error('Error loading makes:', error);
                    makeSelect.innerHTML = '<option value="">-- Error loading makes --</option>';
                }
            } else if (newTypeName) {
                // New type being created - disable dropdown (can't select existing makes for non-existent type)
                // but keep text inputs enabled so user can type new make name
                makeSelect.disabled = true;
                makeSelect.innerHTML = '<option value="">-- Type Make Name Below (Type will be created) --</option>';
            }
        } else {
            // No type selected or entered - disable everything
            makeSelect.disabled = true;
            makeNameInput.disabled = true;
            makeDescInput.disabled = true;
            makeSelect.innerHTML = '<option value="">-- Select or Enter Type First --</option>';
        }

        this.handleQuickMakeChange();
        this.updateQuickAddPreview();
    },

    async handleQuickMakeChange() {
        const makeSelect = document.getElementById('quick-make-select');
        const makeNameInput = document.getElementById('quick-make-name');
        const modelSelect = document.getElementById('quick-model-select');
        const modelNameInput = document.getElementById('quick-model-name');
        const modelDescInput = document.getElementById('quick-model-desc');

        if (!makeSelect || !makeNameInput || !modelSelect || !modelNameInput || !modelDescInput) {
            console.error('Quick add form elements not found');
            return;
        }

        const selectedMakeId = makeSelect.value;
        const newMakeName = makeNameInput.value.trim();

        if (selectedMakeId || newMakeName) {
            // Always enable model text input fields when make is selected or entered
            modelNameInput.disabled = false;
            modelDescInput.disabled = false;

            // Load models for selected make
            if (selectedMakeId) {
                // Make is selected from dropdown - enable dropdown and load models
                modelSelect.disabled = false;
                try {
                    const { data: models } = await this.supabaseClient
                        .from('equipment_models')
                        .select('id, name')
                        .is('deleted_at', null)
                        .eq('make_id', selectedMakeId)
                        .order('name');
                    
                    modelSelect.innerHTML = '<option value="">-- Select Existing --</option>' +
                        (models || []).map(m => `<option value="${m.id}">${m.name}</option>`).join('');
                } catch (error) {
                    console.error('Error loading models:', error);
                    modelSelect.innerHTML = '<option value="">-- Error loading models --</option>';
                }
            } else if (newMakeName) {
                // New make being created - disable dropdown (can't select existing models for non-existent make)
                // but keep text inputs enabled so user can type new model name
                modelSelect.disabled = true;
                modelSelect.innerHTML = '<option value="">-- Type Model Name Below (Make will be created) --</option>';
            }
        } else {
            // No make selected or entered - disable everything
            modelSelect.disabled = true;
            modelNameInput.disabled = true;
            modelDescInput.disabled = true;
            modelSelect.innerHTML = '<option value="">-- Select or Enter Make First --</option>';
        }

        this.handleQuickModelChange();
        this.updateQuickAddPreview();
    },

    handleQuickModelChange() {
        const modelSelect = document.getElementById('quick-model-select');
        const modelNameInput = document.getElementById('quick-model-name');
        const pmFreqSelect = document.getElementById('quick-pm-frequency');

        const selectedModelId = modelSelect.value;
        const newModelName = modelNameInput.value.trim();

        if (selectedModelId || newModelName) {
            // Enable PM frequency
            pmFreqSelect.disabled = false;
        } else {
            pmFreqSelect.disabled = true;
            pmFreqSelect.value = '';
        }

        this.updateQuickAddPreview();
    },

    updateQuickAddPreview() {
        const preview = document.getElementById('quick-add-preview');
        if (!preview) return;

        const typeSelect = document.getElementById('quick-type-select');
        const typeName = document.getElementById('quick-type-name').value.trim() || 
                        (typeSelect.options[typeSelect.selectedIndex]?.text || '');
        
        const makeSelect = document.getElementById('quick-make-select');
        const makeName = document.getElementById('quick-make-name').value.trim() || 
                        (makeSelect.options[makeSelect.selectedIndex]?.text || '');
        
        const modelSelect = document.getElementById('quick-model-select');
        const modelName = document.getElementById('quick-model-name').value.trim() || 
                         (modelSelect.options[modelSelect.selectedIndex]?.text || '');
        
        const pmFreqSelect = document.getElementById('quick-pm-frequency');
        const pmFreq = pmFreqSelect.options[pmFreqSelect.selectedIndex]?.text || '';

        if (typeName || makeName || modelName) {
            preview.innerHTML = `
                <div class="flex items-center gap-2 text-slate-800">
                    <span class="font-medium">${typeName || '?'}</span>
                    <i class="fas fa-arrow-right text-slate-400"></i>
                    <span class="font-medium">${makeName || '?'}</span>
                    <i class="fas fa-arrow-right text-slate-400"></i>
                    <span class="font-medium">${modelName || '?'}</span>
                    ${pmFreq ? `<i class="fas fa-arrow-right text-slate-400"></i><span class="text-amber-600">${pmFreq}</span>` : ''}
                </div>
            `;
        } else {
            preview.innerHTML = '<p class="italic text-slate-500">Fill in the fields above to see preview</p>';
        }
    },

    async handleQuickAddSubmit(e) {
        if (e) e.preventDefault();

        try {
            // Get values
            const typeSelect = document.getElementById('quick-type-select');
            const typeNameInput = document.getElementById('quick-type-name');
            const typeDescInput = document.getElementById('quick-type-desc');
            
            const makeSelect = document.getElementById('quick-make-select');
            const makeNameInput = document.getElementById('quick-make-name');
            const makeDescInput = document.getElementById('quick-make-desc');
            
            const modelSelect = document.getElementById('quick-model-select');
            const modelNameInput = document.getElementById('quick-model-name');
            const modelDescInput = document.getElementById('quick-model-desc');
            
            const pmFreqSelect = document.getElementById('quick-pm-frequency');

            // Validate and get/create Type
            let typeId = typeSelect.value;
            const newTypeName = typeNameInput.value.trim();
            
            if (!typeId && !newTypeName) {
                this.showToast('Device Type is required', 'error');
                return;
            }

            if (!typeId && newTypeName) {
                // Create new equipment type (uses auto-generated ID from database)
                const { data: newType, error: typeError } = await this.supabaseClient
                    .from('equipment_types')
                    .insert([{
                        name: newTypeName,
                        description: typeDescInput.value.trim() || null,
                        is_active: true
                    }])
                    .select()
                    .single();
                
                if (typeError) throw typeError;
                typeId = newType.id;
                this.showToast('Equipment Type created', 'success');
            }

            // Validate and get/create Make
            let makeId = makeSelect.value;
            const newMakeName = makeNameInput.value.trim();
            
            if (!makeId && !newMakeName) {
                this.showToast('Make is required', 'error');
                return;
            }

            if (!makeId && newMakeName) {
                // Create new equipment make (uses auto-generated ID from database)
                const { data: newMake, error: makeError } = await this.supabaseClient
                    .from('equipment_makes')
                    .insert([{
                        type_id: typeId,
                        name: newMakeName,
                        description: makeDescInput.value.trim() || null,
                        is_active: true
                    }])
                    .select()
                    .single();
                
                if (makeError) throw makeError;
                makeId = newMake.id;
                this.showToast('Make created', 'success');
            }

            // Validate and get/create Model
            let modelId = modelSelect.value;
            const newModelName = modelNameInput.value.trim();
            
            if (!modelId && !newModelName) {
                this.showToast('Model is required', 'error');
                return;
            }

            if (!modelId && newModelName) {
                // Create new equipment model (uses auto-generated ID from database)
                const pmFreqId = pmFreqSelect.value || null;
                
                const { data: newModel, error: modelError } = await this.supabaseClient
                    .from('equipment_models')
                    .insert([{
                        make_id: makeId,
                        name: newModelName,
                        description: modelDescInput.value.trim() || null,
                        pm_frequency_id: pmFreqId,
                        is_active: true
                    }])
                    .select()
                    .single();
                
                if (modelError) throw modelError;
                modelId = newModel.id;
                this.showToast('Equipment Model created', 'success');
            } else if (modelId && pmFreqSelect.value) {
                // Update existing model with PM frequency
                await this.supabaseClient
                    .from('equipment_models')
                    .update({ pm_frequency_id: pmFreqSelect.value })
                    .eq('id', modelId);
            }

            this.showToast('All items saved successfully!', 'success');
            this.closeQuickAddModal();
            
            // Reload data
            await this.loadHierarchy();
            await this.loadPMFrequencies();
            await this.loadStats();

            // Trigger refresh in other pages
            if (window.loadReferenceData) window.loadReferenceData();
            if (window.loadPMFrequencies) window.loadPMFrequencies();
            if (window.MMDAssetFormManager && window.MMDAssetFormManager.loadMMDData) {
                window.MMDAssetFormManager.loadMMDData();
            }
        } catch (error) {
            console.error('Error in quick add:', error);
            this.showToast(`Failed to save: ${error.message || 'Unknown error'}`, 'error');
        }
    },

    // Real-time MMD creation from config modal
    showQuickAddType() {
        const container = document.getElementById('config-new-type-container');
        if (container) {
            container.classList.remove('hidden');
            document.getElementById('config-new-type-name').focus();
        }
    },

    showQuickAddMake() {
        const categoryId = document.getElementById('config-category').value;
        if (!categoryId) {
            this.showToast('Please select a Device Type first', 'warning');
            return;
        }
        const container = document.getElementById('config-new-make-container');
        if (container) {
            container.classList.remove('hidden');
            const nameInput = document.getElementById('config-new-make-name');
            if (nameInput) nameInput.focus();
        }
    },

    showQuickAddModel() {
        const makeId = document.getElementById('config-make').value;
        if (!makeId) {
            this.showToast('Please select a Manufacturer first', 'warning');
            return;
        }
        const container = document.getElementById('config-new-model-container');
        if (container) {
            container.classList.remove('hidden');
            document.getElementById('config-new-model-name').focus();
        }
    },

    cancelQuickAdd(type) {
        const container = document.getElementById(`config-new-${type}-container`);
        if (container) {
            container.classList.add('hidden');
            const nameInput = document.getElementById(`config-new-${type}-name`);
            const descInput = document.getElementById(`config-new-${type}-desc`);
            if (nameInput) nameInput.value = '';
            if (descInput) descInput.value = '';
        }
    },

    async createNewType() {
        const nameInput = document.getElementById('config-new-type-name');
        const descInput = document.getElementById('config-new-type-desc');
        const name = nameInput?.value.trim();
        
        if (!name) {
            this.showToast('Please enter a type name', 'warning');
            return;
        }

        try {
            // Generate ID
            const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
            const id = `ET-${today}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

            const { data, error } = await this.supabaseClient
                .from('device_categories')
                .insert([{
                    id: id,
                    name: name,
                    description: descInput?.value.trim() || null
                }])
                .select()
                .single();

            if (error) throw error;

            // Add to dropdown and select it
            const select = document.getElementById('config-category');
            const option = document.createElement('option');
            option.value = data.id;
            option.textContent = data.name;
            select.appendChild(option);
            select.value = data.id;

            // Hide the add form
            this.cancelQuickAdd('type');

            // Update makes dropdown
            await this.updateConfigMakes();

            this.showToast('Type created successfully!', 'success');
        } catch (error) {
            console.error('Error creating type:', error);
            this.showToast(`Failed to create type: ${error.message}`, 'error');
        }
    },

    async createNewMake() {
        const categoryId = document.getElementById('config-category').value;
        if (!categoryId) {
            this.showToast('Please select a Device Type first', 'warning');
            return;
        }

        const nameInput = document.getElementById('config-new-make-name');
        const descInput = document.getElementById('config-new-make-desc');
        const name = nameInput?.value.trim();
        
        if (!name) {
            this.showToast('Please enter a manufacturer name', 'warning');
            return;
        }

        try {
            // Generate ID
            const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
            const id = `EM-${today}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

            const { data, error } = await this.supabaseClient
                .from('device_makes')
                .insert([{
                    id: id,
                    name: name,
                    category_id: categoryId,
                    description: descInput?.value.trim() || null
                }])
                .select()
                .single();

            if (error) throw error;

            // Add to dropdown and select it
            const select = document.getElementById('config-make');
            const option = document.createElement('option');
            option.value = data.id;
            option.textContent = data.name;
            select.appendChild(option);
            select.value = data.id;

            // Hide the add form
            this.cancelQuickAdd('make');

            // Update models dropdown
            await this.updateConfigModels();

            this.showToast('Manufacturer created successfully!', 'success');
        } catch (error) {
            console.error('Error creating make:', error);
            this.showToast(`Failed to create manufacturer: ${error.message}`, 'error');
        }
    },

    async createNewModel() {
        const makeId = document.getElementById('config-make').value;
        if (!makeId) {
            this.showToast('Please select a Manufacturer first', 'warning');
            return;
        }

        const nameInput = document.getElementById('config-new-model-name');
        const descInput = document.getElementById('config-new-model-desc');
        const name = nameInput?.value.trim();
        
        if (!name) {
            this.showToast('Please enter a model name', 'warning');
            return;
        }

        try {
            // Generate ID
            const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
            const id = `MDL-${today}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

            const { data, error } = await this.supabaseClient
                .from('device_models')
                .insert([{
                    id: id,
                    name: name,
                    make_id: makeId,
                    description: descInput?.value.trim() || null
                }])
                .select()
                .single();

            if (error) throw error;

            // Add to dropdown and select it
            const select = document.getElementById('config-model');
            const option = document.createElement('option');
            option.value = data.id;
            option.textContent = data.name;
            select.appendChild(option);
            select.value = data.id;

            // Hide the add form
            this.cancelQuickAdd('model');

            this.showToast('Model created successfully!', 'success');
        } catch (error) {
            console.error('Error creating model:', error);
            this.showToast(`Failed to create model: ${error.message}`, 'error');
        }
    }
};

// Setup config form handler
document.addEventListener('DOMContentLoaded', () => {
    const configForm = document.getElementById('config-form');
    if (configForm) {
        configForm.addEventListener('submit', (e) => MasterDBManager.handleConfigSubmit(e));
    }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MasterDBManager.init());
} else {
    MasterDBManager.init();
}

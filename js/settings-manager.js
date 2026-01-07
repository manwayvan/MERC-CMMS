// Settings Manager - Handles all settings page functionality
const SettingsManager = {
    supabaseClient: null,
    currentTechnicianId: null,
    currentWorkOrderTypeId: null,

    async init() {
        // Initialize Supabase client - prioritize shared client to avoid multiple instances
        if (window.sharedSupabaseClient) {
            this.supabaseClient = window.sharedSupabaseClient;
        } else if (typeof window.supabase !== 'undefined' && typeof CONFIG !== 'undefined') {
            this.supabaseClient = window.supabase.createClient(
                CONFIG.SUPABASE_URL || 'https://hmdemsbqiqlqcggwblvl.supabase.co',
                CONFIG.SUPABASE_ANON_KEY || 'sb_publishable_Z9oNxTGDCCz3EZnh6NqySg_QzF6amCN'
            );
        } else if (typeof supabaseClient !== 'undefined') {
            this.supabaseClient = supabaseClient;
        }

        // Initialize all tabs
        this.initTechnicians();
        this.initWorkOrderTypes();
        this.initPMAutomation();
        this.initReporting();
        this.initAccessControl();
        this.initNotifications();
        this.initSystem();
        this.initMasterDatabase();
    },

    // ==================== PM Automation Tab ====================
    initPMAutomation() {
        const saveBtn = document.querySelector('#pm-automation .btn-primary');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.savePMAutomationSettings());
        }
        this.loadPMAutomationSettings();
    },

    async loadPMAutomationSettings() {
        // Load settings from localStorage or database
        const settings = JSON.parse(localStorage.getItem('pm_automation_settings') || '{}');
        
        // Apply settings to toggles
        document.querySelectorAll('#pm-automation .toggle').forEach((toggle, index) => {
            const key = ['auto_create', 'generate_7_days', 'auto_escalate', 'respect_blackout'][index];
            if (settings[key] !== undefined) {
                if (settings[key]) toggle.classList.add('active');
                else toggle.classList.remove('active');
            }
        });

        // Apply input values
        const lookaheadInput = document.querySelector('#pm-automation input[type="number"]');
        const leadTimeInput = document.querySelectorAll('#pm-automation input[type="number"]')[1];
        if (lookaheadInput && settings.pm_lookahead) lookaheadInput.value = settings.pm_lookahead;
        if (leadTimeInput && settings.scheduling_lead_time) leadTimeInput.value = settings.scheduling_lead_time;
    },

    async savePMAutomationSettings() {
        const settings = {
            auto_create: document.querySelectorAll('#pm-automation .toggle')[0].classList.contains('active'),
            generate_7_days: document.querySelectorAll('#pm-automation .toggle')[1].classList.contains('active'),
            auto_escalate: document.querySelectorAll('#pm-automation .toggle')[2].classList.contains('active'),
            respect_blackout: document.querySelectorAll('#pm-automation .toggle')[3].classList.contains('active'),
            pm_lookahead: parseInt(document.querySelectorAll('#pm-automation input[type="number"]')[0].value) || 90,
            scheduling_lead_time: parseInt(document.querySelectorAll('#pm-automation input[type="number"]')[1].value) || 14,
            assignment_strategy: document.querySelector('#pm-automation select').value || 'skill_based',
            max_wo_per_tech: parseInt(document.querySelectorAll('#pm-automation input[type="number"]')[2].value) || 8
        };

        localStorage.setItem('pm_automation_settings', JSON.stringify(settings));
        this.showToast('PM automation settings saved', 'success');
    },

    // ==================== Reporting Tab ====================
    initReporting() {
        const saveBtn = document.querySelector('#reporting .btn-primary');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveReportingSettings());
        }
        this.loadReportingSettings();
    },

    async loadReportingSettings() {
        const settings = JSON.parse(localStorage.getItem('reporting_settings') || '{}');
        
        document.querySelectorAll('#reporting .toggle').forEach((toggle, index) => {
            const keys = ['auto_generate', 'compliance_reports', 'financial_reports', 'custom_reports'];
            if (settings[keys[index]] !== undefined) {
                if (settings[keys[index]]) toggle.classList.add('active');
                else toggle.classList.remove('active');
            }
        });
    },

    async saveReportingSettings() {
        const settings = {
            auto_generate: document.querySelectorAll('#reporting .toggle')[0].classList.contains('active'),
            compliance_reports: document.querySelectorAll('#reporting .toggle')[1].classList.contains('active'),
            financial_reports: document.querySelectorAll('#reporting .toggle')[2].classList.contains('active'),
            custom_reports: document.querySelectorAll('#reporting .toggle')[3].classList.contains('active')
        };

        localStorage.setItem('reporting_settings', JSON.stringify(settings));
        this.showToast('Reporting settings saved', 'success');
    },

    // ==================== Access Control Tab ====================
    initAccessControl() {
        const saveBtn = document.querySelector('#access-control .btn-primary');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveAccessControlSettings());
        }
        this.loadAccessControlSettings();
    },

    async loadAccessControlSettings() {
        const settings = JSON.parse(localStorage.getItem('access_control_settings') || '{}');
        
        document.querySelectorAll('#access-control .toggle').forEach((toggle, index) => {
            const keys = ['require_mfa', 'session_timeout'];
            if (settings[keys[index]] !== undefined) {
                if (settings[keys[index]]) toggle.classList.add('active');
                else toggle.classList.remove('active');
            }
        });
    },

    async saveAccessControlSettings() {
        const settings = {
            require_mfa: document.querySelectorAll('#access-control .toggle')[0].classList.contains('active'),
            session_timeout: document.querySelectorAll('#access-control .toggle')[1].classList.contains('active')
        };

        localStorage.setItem('access_control_settings', JSON.stringify(settings));
        this.showToast('Access control settings saved', 'success');
    },

    // ==================== Notifications Tab ====================
    initNotifications() {
        const saveBtn = document.querySelector('#notifications .btn-primary');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveNotificationSettings());
        }
        this.loadNotificationSettings();
    },

    async loadNotificationSettings() {
        const settings = JSON.parse(localStorage.getItem('notification_settings') || '{}');
        
        document.querySelectorAll('#notifications .toggle').forEach((toggle, index) => {
            const keys = ['notify_critical', 'daily_summary'];
            if (settings[keys[index]] !== undefined) {
                if (settings[keys[index]]) toggle.classList.add('active');
                else toggle.classList.remove('active');
            }
        });
    },

    async saveNotificationSettings() {
        const settings = {
            notify_critical: document.querySelectorAll('#notifications .toggle')[0].classList.contains('active'),
            daily_summary: document.querySelectorAll('#notifications .toggle')[1].classList.contains('active')
        };

        localStorage.setItem('notification_settings', JSON.stringify(settings));
        this.showToast('Notification settings saved', 'success');
    },

    // ==================== Technicians Tab ====================
    initTechnicians() {
        const form = document.getElementById('technician-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleTechnicianSubmit(e));
        }
        this.loadTechnicians();
    },

    async loadTechnicians() {
        if (!this.supabaseClient) {
            document.getElementById('technician-list').innerHTML = '<li class="text-red-600">Supabase not connected</li>';
            return;
        }

        try {
            const { data, error } = await this.supabaseClient
                .from('technicians')
                .select('*')
                .order('full_name');

            if (error) throw error;

            const list = document.getElementById('technician-list');
            if (data && data.length > 0) {
                list.innerHTML = data.map(tech => `
                    <li class="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                        <div>
                            <p class="font-medium text-slate-800">${this.escapeHtml(tech.full_name || 'Unknown')}</p>
                            <p class="text-xs text-slate-500">${this.escapeHtml(tech.role || 'technician')} • ${this.escapeHtml(tech.email || 'No email')}</p>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="SettingsManager.editTechnician('${tech.id}')" class="text-blue-600 hover:text-blue-800">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="SettingsManager.deleteTechnician('${tech.id}')" class="text-red-600 hover:text-red-800">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </li>
                `).join('');
            } else {
                list.innerHTML = '<li class="text-slate-500">No technicians found. Add one above.</li>';
            }
        } catch (error) {
            console.error('Error loading technicians:', error);
            document.getElementById('technician-list').innerHTML = `<li class="text-red-600">Error: ${error.message}</li>`;
        }
    },

    async handleTechnicianSubmit(e) {
        e.preventDefault();
        if (!this.supabaseClient) {
            this.showToast('Supabase not connected', 'error');
            return;
        }

        const formData = new FormData(e.target);
        const technicianData = {
            full_name: formData.get('full_name'),
            role: formData.get('role') || 'technician',
            phone: formData.get('phone') || null,
            email: formData.get('email') || null,
            is_active: formData.get('is_active') === 'on'
        };

        try {
            if (this.currentTechnicianId) {
                // Update
                const { error } = await this.supabaseClient
                    .from('technicians')
                    .update(technicianData)
                    .eq('id', this.currentTechnicianId);
                
                if (error) throw error;
                this.showToast('Technician updated successfully', 'success');
            } else {
                // Insert
                const { error } = await this.supabaseClient
                    .from('technicians')
                    .insert([technicianData]);
                
                if (error) throw error;
                this.showToast('Technician added successfully', 'success');
            }

            e.target.reset();
            this.currentTechnicianId = null;
            await this.loadTechnicians();
        } catch (error) {
            console.error('Error saving technician:', error);
            this.showToast(`Failed to save technician: ${error.message}`, 'error');
        }
    },

    async editTechnician(id) {
        if (!this.supabaseClient) return;

        try {
            const { data, error } = await this.supabaseClient
                .from('technicians')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            const form = document.getElementById('technician-form');
            form.full_name.value = data.full_name || '';
            form.role.value = data.role || 'technician';
            form.phone.value = data.phone || '';
            form.email.value = data.email || '';
            form.is_active.checked = data.is_active !== false;

            this.currentTechnicianId = id;
            form.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            this.showToast(`Failed to load technician: ${error.message}`, 'error');
        }
    },

    async deleteTechnician(id) {
        if (!confirm('Are you sure you want to delete this technician?')) return;
        if (!this.supabaseClient) return;

        try {
            const { error } = await this.supabaseClient
                .from('technicians')
                .delete()
                .eq('id', id);

            if (error) throw error;
            this.showToast('Technician deleted successfully', 'success');
            await this.loadTechnicians();
        } catch (error) {
            this.showToast(`Failed to delete technician: ${error.message}`, 'error');
        }
    },

    // ==================== Work Order Types Tab ====================
    initWorkOrderTypes() {
        const form = document.getElementById('work-order-type-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleWorkOrderTypeSubmit(e));
        }
        const cancelBtn = document.getElementById('work-order-type-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.cancelWorkOrderTypeEdit());
        }
        this.loadWorkOrderTypes();
    },

    async loadWorkOrderTypes() {
        if (!this.supabaseClient) {
            document.getElementById('work-order-types-table').innerHTML = '<tr><td colspan="6" class="text-red-600">Supabase not connected</td></tr>';
            return;
        }

        try {
            const { data, error } = await this.supabaseClient
                .from('work_order_types')
                .select('*')
                .order('sort_order');

            if (error) throw error;

            const tbody = document.getElementById('work-order-types-table');
            if (data && data.length > 0) {
                tbody.innerHTML = data.map(type => `
                    <tr class="hover:bg-slate-50">
                        <td class="py-3 px-4">${this.escapeHtml(type.label || '')}</td>
                        <td class="py-3 px-4 text-sm text-slate-500">${this.escapeHtml(type.code || '')}</td>
                        <td class="py-3 px-4 text-sm text-slate-500">${this.escapeHtml(type.description || '')}</td>
                        <td class="py-3 px-4">
                            <span class="status-badge ${type.is_active ? 'status-active' : 'status-inactive'}">
                                ${type.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </td>
                        <td class="py-3 px-4 text-sm text-slate-500">${type.sort_order || 0}</td>
                        <td class="py-3 px-4 text-right">
                            <button onclick="SettingsManager.editWorkOrderType('${type.code}')" class="text-blue-600 hover:text-blue-800 mr-3">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="SettingsManager.deleteWorkOrderType('${type.code}')" class="text-red-600 hover:text-red-800">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center text-slate-500 py-8">No work order types found. Add one above.</td></tr>';
            }
        } catch (error) {
            console.error('Error loading work order types:', error);
            document.getElementById('work-order-types-table').innerHTML = `<tr><td colspan="6" class="text-red-600">Error: ${error.message}</td></tr>`;
        }
    },

    async handleWorkOrderTypeSubmit(e) {
        e.preventDefault();
        if (!this.supabaseClient) {
            this.showToast('Supabase not connected', 'error');
            return;
        }

        const typeData = {
            code: document.getElementById('work-order-type-code').value.trim(),
            label: document.getElementById('work-order-type-label').value.trim(),
            description: document.getElementById('work-order-type-description').value.trim() || null,
            sort_order: parseInt(document.getElementById('work-order-type-sort').value) || 0,
            is_active: document.getElementById('work-order-type-active').checked
        };

        if (!typeData.code || !typeData.label) {
            this.showToast('Code and Label are required', 'error');
            return;
        }

        try {
            if (this.currentWorkOrderTypeId) {
                // Update
                const { error } = await this.supabaseClient
                    .from('work_order_types')
                    .update(typeData)
                    .eq('code', this.currentWorkOrderTypeId);
                
                if (error) throw error;
                this.showToast('Work order type updated successfully', 'success');
            } else {
                // Insert
                const { error } = await this.supabaseClient
                    .from('work_order_types')
                    .insert([typeData]);
                
                if (error) throw error;
                this.showToast('Work order type added successfully', 'success');
            }

            e.target.reset();
            this.currentWorkOrderTypeId = null;
            document.getElementById('work-order-type-cancel').style.display = 'none';
            await this.loadWorkOrderTypes();
        } catch (error) {
            console.error('Error saving work order type:', error);
            this.showToast(`Failed to save work order type: ${error.message}`, 'error');
        }
    },

    async editWorkOrderType(code) {
        if (!this.supabaseClient) return;

        try {
            const { data, error } = await this.supabaseClient
                .from('work_order_types')
                .select('*')
                .eq('code', code)
                .single();

            if (error) throw error;

            document.getElementById('work-order-type-code').value = data.code || '';
            document.getElementById('work-order-type-label').value = data.label || '';
            document.getElementById('work-order-type-description').value = data.description || '';
            document.getElementById('work-order-type-sort').value = data.sort_order || 0;
            document.getElementById('work-order-type-active').checked = data.is_active !== false;

            this.currentWorkOrderTypeId = code;
            document.getElementById('work-order-type-cancel').style.display = 'inline-flex';
            document.getElementById('work-order-type-submit').innerHTML = '<i class="fas fa-save"></i> Update Type';
            document.getElementById('work-order-type-code').readOnly = true;
        } catch (error) {
            this.showToast(`Failed to load work order type: ${error.message}`, 'error');
        }
    },

    cancelWorkOrderTypeEdit() {
        document.getElementById('work-order-type-form').reset();
        this.currentWorkOrderTypeId = null;
        document.getElementById('work-order-type-cancel').style.display = 'none';
        document.getElementById('work-order-type-submit').innerHTML = '<i class="fas fa-plus"></i> Add Type';
        document.getElementById('work-order-type-code').readOnly = false;
    },

    async deleteWorkOrderType(code) {
        if (!confirm('Are you sure you want to delete this work order type?')) return;
        if (!this.supabaseClient) return;

        try {
            const { error } = await this.supabaseClient
                .from('work_order_types')
                .delete()
                .eq('code', code);

            if (error) throw error;
            this.showToast('Work order type deleted successfully', 'success');
            await this.loadWorkOrderTypes();
        } catch (error) {
            this.showToast(`Failed to delete work order type: ${error.message}`, 'error');
        }
    },

    // ==================== System Tab ====================
    initSystem() {
        const saveBtn = document.querySelector('#system .btn-primary');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveSystemSettings());
        }
        this.loadSystemSettings();
    },

    async saveSystemSettings() {
        const settings = {
            timezone: document.getElementById('system-timezone')?.value || 'America/New_York',
            fiscal_year_start: document.getElementById('system-fiscal-year')?.value || 'January'
        };

        localStorage.setItem('system_settings', JSON.stringify(settings));
        this.showToast('System settings saved', 'success');
    },

    async loadSystemSettings() {
        const settings = JSON.parse(localStorage.getItem('system_settings') || '{}');
        
        const timezoneSelect = document.getElementById('system-timezone');
        if (timezoneSelect && settings.timezone) {
            timezoneSelect.value = settings.timezone;
        }
        
        const fiscalYearSelect = document.getElementById('system-fiscal-year');
        if (fiscalYearSelect && settings.fiscal_year_start) {
            fiscalYearSelect.value = settings.fiscal_year_start;
        }
    },

    // ==================== Master Database Tab ====================
    initMasterDatabase() {
        // Load stats on tab switch
        const tabButton = document.querySelector('[data-tab="master-database"]');
        if (tabButton) {
            tabButton.addEventListener('click', () => {
                this.loadMasterDatabaseStats();
                this.loadMMDConfigurations();
            });
        }
        this.loadMasterDatabaseStats();
        this.loadMMDConfigurations();
    },

    async loadMasterDatabaseStats() {
        if (!this.supabaseClient) return;

        try {
            // Helper function to try new table, fallback to legacy
            const tryQuery = async (newTable, legacyTable, filterFn = null) => {
                try {
                    let query = this.supabaseClient.from(newTable).select('id', { count: 'exact', head: true });
                    if (filterFn) {
                        query = filterFn(query);
                    }
                    const { count, error } = await query;
                    if (error) throw error;
                    return count || 0;
                } catch (error) {
                    // Fallback to legacy table
                    try {
                        const { count, error: legacyError } = await this.supabaseClient
                            .from(legacyTable)
                            .select('id', { count: 'exact', head: true });
                        if (legacyError) throw legacyError;
                        return count || 0;
                    } catch (legacyError) {
                        console.warn(`Error loading ${newTable} and ${legacyTable}:`, legacyError);
                        return 0;
                    }
                }
            };

            // Load counts from new equipment tables (with fallback to legacy tables)
            const [categories, makes, models, frequencies] = await Promise.all([
                tryQuery('equipment_types', 'device_categories', (q) => q.is('deleted_at', null)),
                tryQuery('equipment_makes', 'device_makes', (q) => q.is('deleted_at', null)),
                tryQuery('equipment_models', 'device_models', (q) => q.is('deleted_at', null)),
                tryQuery('pm_frequencies', 'pm_frequencies', (q) => q.eq('is_active', true))
            ]);

            const categoriesEl = document.getElementById('stats-categories');
            const makesEl = document.getElementById('stats-makes');
            const modelsEl = document.getElementById('stats-models');
            const frequenciesEl = document.getElementById('stats-frequencies');

            if (categoriesEl) categoriesEl.textContent = categories;
            if (makesEl) makesEl.textContent = makes;
            if (modelsEl) modelsEl.textContent = models;
            if (frequenciesEl) frequenciesEl.textContent = frequencies;
        } catch (error) {
            console.error('Error loading master database stats:', error);
        }
    },

    async loadMMDConfigurations() {
        if (!this.supabaseClient) return;

        const tbody = document.getElementById('mmd-configurations-list');
        if (!tbody) return;

        try {
            // Load device configurations - show ALL active configurations
            // This ensures consistency with the summary cards which show all types/makes/models
            const { data: configs, error } = await this.supabaseClient
                .from('device_configurations')
                .select('id, name, category_id, make_id, model_id, pm_frequency_id, checklist_id, is_active')
                .eq('is_active', true)
                .order('name');

            if (error) {
                throw error;
            }

            if (!configs || configs.length === 0) {
                this.renderMMDConfigurations([]);
                return;
            }

            // Enrich with related data
            const enrichedConfigs = await Promise.all(
                configs.map(async (config) => {
                    const enriched = { ...config };
                    const typeId = config.type_id || config.category_id;
                    
                    if (typeId) {
                        try {
                            const { data: type } = await this.supabaseClient
                                .from('equipment_types')
                                .select('id, name')
                                .eq('id', typeId)
                                .single();
                            enriched.equipment_types = type;
                        } catch (e) {
                            // Try legacy table
                            try {
                                const { data: type } = await this.supabaseClient
                                    .from('device_categories')
                                    .select('id, name')
                                    .eq('id', typeId)
                                    .single();
                                enriched.equipment_types = type;
                            } catch (e2) {
                                console.warn('Could not load type:', e2);
                            }
                        }
                    }
                    
                    if (config.make_id) {
                        try {
                            const { data: make } = await this.supabaseClient
                                .from('equipment_makes')
                                .select('id, name')
                                .eq('id', config.make_id)
                                .single();
                            enriched.equipment_makes = make;
                        } catch (e) {
                            // Try legacy table
                            try {
                                const { data: make } = await this.supabaseClient
                                    .from('device_makes')
                                    .select('id, name')
                                    .eq('id', config.make_id)
                                    .single();
                                enriched.equipment_makes = make;
                            } catch (e2) {
                                console.warn('Could not load make:', e2);
                            }
                        }
                    }
                    
                    if (config.model_id) {
                        try {
                            const { data: model } = await this.supabaseClient
                                .from('equipment_models')
                                .select('id, name')
                                .eq('id', config.model_id)
                                .single();
                            enriched.equipment_models = model;
                        } catch (e) {
                            // Try legacy table
                            try {
                                const { data: model } = await this.supabaseClient
                                    .from('device_models')
                                    .select('id, name')
                                    .eq('id', config.model_id)
                                    .single();
                                enriched.equipment_models = model;
                            } catch (e2) {
                                console.warn('Could not load model:', e2);
                            }
                        }
                    }
                    
                    if (config.pm_frequency_id) {
                        try {
                            const { data: freq } = await this.supabaseClient
                                .from('pm_frequencies')
                                .select('id, name, days')
                                .eq('id', config.pm_frequency_id)
                                .single();
                            enriched.pm_frequencies = freq;
                        } catch (e) {
                            console.warn('Could not load PM frequency:', e);
                        }
                    }
                    
                    if (config.checklist_id) {
                        try {
                            const { data: checklist } = await this.supabaseClient
                                .from('checklists')
                                .select('id, name')
                                .eq('id', config.checklist_id)
                                .single();
                            enriched.checklists = checklist;
                        } catch (e) {
                            console.warn('Could not load checklist:', e);
                        }
                    }
                    
                    return enriched;
                })
            );

            this.renderMMDConfigurations(enrichedConfigs);
        } catch (error) {
            console.error('Error loading MMD configurations:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-4 py-8 text-center text-red-500">
                        <i class="fas fa-exclamation-circle text-2xl mb-2"></i>
                        <p>Error loading configurations: ${error.message}</p>
                    </td>
                </tr>
            `;
        }
    },

    renderMMDConfigurations(configs) {
        const tbody = document.getElementById('mmd-configurations-list');
        if (!tbody) return;

        if (configs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="px-4 py-8 text-center text-slate-500">
                        <i class="fas fa-inbox text-2xl mb-2"></i>
                        <p>No MMD configurations found. Click "Add New Configuration" to create one.</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = configs.map(config => {
            const typeName = config.equipment_types?.name || '-';
            const makeName = config.equipment_makes?.name || '-';
            const modelName = config.equipment_models?.name || '-';
            const freqName = config.pm_frequencies?.name || '-';
            const freqDays = config.pm_frequencies?.days || '';
            const checklistName = config.checklists?.name || '-';
            const statusClass = config.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
            const statusText = config.is_active ? 'Active' : 'Inactive';

            return `
                <tr class="hover:bg-slate-50">
                    <td class="px-4 py-3 text-slate-900">${this.escapeHtml(typeName)}</td>
                    <td class="px-4 py-3 text-slate-600">${this.escapeHtml(makeName)}</td>
                    <td class="px-4 py-3 text-slate-600">${this.escapeHtml(modelName)}</td>
                    <td class="px-4 py-3 text-slate-600">${this.escapeHtml(freqName)}${freqDays ? ` (${freqDays} days)` : ''}</td>
                    <td class="px-4 py-3 text-slate-600">${this.escapeHtml(checklistName)}</td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-1 text-xs font-semibold rounded-full ${statusClass}">
                            ${statusText}
                        </span>
                    </td>
                    <td class="px-4 py-3">
                        <div class="flex gap-2">
                            <button onclick="SettingsManager.editMMDConfiguration('${config.id}', '${config.type_id || config.category_id || ''}', '${config.make_id || ''}', '${config.model_id || ''}')" 
                                    class="text-blue-600 hover:text-blue-800" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="SettingsManager.deleteMMDConfiguration('${config.id}')" 
                                    class="text-red-600 hover:text-red-800" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    editMMDConfiguration(configId, typeId, makeId, modelId) {
        // Open unified modal with pre-populated values
        if (typeof openUnifiedMMDModal === 'function') {
            openUnifiedMMDModal({
                config_id: configId,
                type_id: typeId,
                make_id: makeId,
                model_id: modelId
            });
        } else {
            alert('MMD Modal not loaded. Please refresh the page.');
        }
    },

    async deleteMMDConfiguration(configId) {
        if (!confirm('Are you sure you want to delete this MMD configuration? This action cannot be undone.')) {
            return;
        }

        if (!this.supabaseClient) return;

        try {
            const { error } = await this.supabaseClient
                .from('device_configurations')
                .update({ is_active: false })
                .eq('id', configId);

            if (error) throw error;

            this.showToast('MMD configuration deleted successfully', 'success');
            this.loadMMDConfigurations();
            this.loadMasterDatabaseStats();
        } catch (error) {
            console.error('Error deleting MMD configuration:', error);
            this.showToast(`Error: ${error.message}`, 'error');
        }
    },

    // ==================== Utility Functions ====================
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    showToast(message, type = 'info') {
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            alert(message);
        }
    }
};

// Expose globally for refresh from other modules
window.refreshMMDStats = function() {
    if (SettingsManager && SettingsManager.loadMasterDatabaseStats) {
        SettingsManager.loadMasterDatabaseStats();
    }
};

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        SettingsManager.init();
    });
} else {
    SettingsManager.init();
}


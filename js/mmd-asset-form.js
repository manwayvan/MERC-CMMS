/**
 * MMD Asset Form Manager
 * Handles Master Model Device (MMD) relationship for asset creation
 * Enforces Type → Make → Model → PM Frequency hierarchy
 */

class MMDAssetFormManager {
    constructor() {
        this.supabaseClient = window.supabaseClient || window.sharedSupabaseClient;
        this.mmdData = {
            types: [],
            makes: [],
            models: [],
            frequencies: []
        };
        this.selectedType = null;
        this.selectedMake = null;
        this.selectedModel = null;
        this.selectedPMFrequency = null;
    }

    async init() {
        if (!this.supabaseClient) {
            console.error('Supabase client not initialized');
            return;
        }

        await this.loadMMDHierarchy();
        this.setupEventListeners();
    }

    /**
     * Load complete MMD hierarchy efficiently using RPC function
     */
    async loadMMDHierarchy() {
        try {
            const { data, error } = await this.supabaseClient.rpc('get_mmd_hierarchy');
            
            if (error) {
                // Fallback to individual queries if RPC fails
                console.warn('RPC failed, using fallback queries:', error);
                await this.loadMMDHierarchyFallback();
                return;
            }

            if (data && data.length > 0) {
                const result = data[0];
                this.mmdData = {
                    types: result.types || [],
                    makes: result.makes || [],
                    models: result.models || [],
                    frequencies: result.frequencies || []
                };
            }

            this.populateTypeDropdown();
        } catch (error) {
            console.error('Error loading MMD hierarchy:', error);
            this.showError('Failed to load equipment data. Please refresh the page.');
        }
    }

    /**
     * Fallback method to load hierarchy using individual queries
     */
    async loadMMDHierarchyFallback() {
        try {
            const [typesResult, makesResult, modelsResult, frequenciesResult] = await Promise.all([
                this.supabaseClient.from('equipment_types').select('*').is('deleted_at', null).order('name'),
                this.supabaseClient.from('equipment_makes').select('*').is('deleted_at', null).order('name'),
                this.supabaseClient.from('equipment_models').select('*').is('deleted_at', null).order('name'),
                this.supabaseClient.from('pm_frequencies').select('*').eq('is_active', true).order('sort_order', { ascending: true })
            ]);

            this.mmdData = {
                types: typesResult.data || [],
                makes: makesResult.data || [],
                models: modelsResult.data || [],
                frequencies: frequenciesResult.data || []
            };

            this.populateTypeDropdown();
        } catch (error) {
            console.error('Error loading MMD hierarchy (fallback):', error);
            this.showError('Failed to load equipment data. Please refresh the page.');
        }
    }

    /**
     * Populate Type dropdown
     */
    populateTypeDropdown() {
        const typeSelect = document.getElementById('mmd-type-select');
        if (!typeSelect) return;

        typeSelect.innerHTML = '<option value="">-- Select Equipment Type --</option>';
        
        this.mmdData.types
            .filter(t => t.is_active !== false)
            .forEach(type => {
                const option = document.createElement('option');
                option.value = type.id;
                option.textContent = type.name;
                if (type.description) {
                    option.title = type.description;
                }
                typeSelect.appendChild(option);
            });
    }

    /**
     * Populate Make dropdown based on selected Type
     */
    populateMakeDropdown(typeId) {
        const makeSelect = document.getElementById('mmd-make-select');
        if (!makeSelect) return;

        makeSelect.innerHTML = '<option value="">-- Select Make --</option>';
        makeSelect.disabled = !typeId;

        if (!typeId) {
            this.clearModelDropdown();
            this.clearPMFrequency();
            this.updateSummary();
            return;
        }

        const makes = this.mmdData.makes.filter(
            make => make.type_id === typeId && make.is_active !== false
        );

        makes.forEach(make => {
            const option = document.createElement('option');
            option.value = make.id;
            option.textContent = make.name;
            if (make.description) {
                option.title = make.description;
            }
            makeSelect.appendChild(option);
        });

        this.clearModelDropdown();
        this.clearPMFrequency();
        this.updateSummary();
    }

    /**
     * Populate Model dropdown based on selected Make
     */
    async populateModelDropdown(makeId) {
        const modelSelect = document.getElementById('mmd-model-select');
        if (!modelSelect) return;

        modelSelect.innerHTML = '<option value="">-- Select Model --</option>';
        modelSelect.disabled = !makeId;

        if (!makeId) {
            this.clearPMFrequency();
            this.updateSummary();
            return;
        }

        // Try RPC function first for efficiency
        try {
            const { data, error } = await this.supabaseClient.rpc('get_models_by_make', {
                make_id_param: makeId
            });

            if (!error && data) {
                data.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.id;
                    option.textContent = model.name;
                    option.dataset.pmFrequencyId = model.pm_frequency_id || '';
                    option.dataset.pmFrequencyName = model.pm_frequency_name || '';
                    option.dataset.pmFrequencyDays = model.pm_frequency_days || '';
                    if (model.description) {
                        option.title = model.description;
                    }
                    modelSelect.appendChild(option);
                });
            } else {
                // Fallback to client-side filtering
                const models = this.mmdData.models.filter(
                    model => model.make_id === makeId && model.is_active !== false
                );
                models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.id;
                    option.textContent = model.name;
                    option.dataset.pmFrequencyId = model.pm_frequency_id || '';
                    modelSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading models:', error);
            // Fallback to client-side filtering
            const models = this.mmdData.models.filter(
                model => model.make_id === makeId && model.is_active !== false
            );
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.id;
                option.textContent = model.name;
                option.dataset.pmFrequencyId = model.pm_frequency_id || '';
                modelSelect.appendChild(option);
            });
        }

        this.clearPMFrequency();
        this.updateSummary();
    }

    /**
     * Clear Model dropdown
     */
    clearModelDropdown() {
        const modelSelect = document.getElementById('mmd-model-select');
        if (modelSelect) {
            modelSelect.innerHTML = '<option value="">-- Select Model --</option>';
            modelSelect.disabled = true;
        }
    }

    /**
     * Update PM Frequency display when Model is selected
     */
    updatePMFrequency(modelId) {
        const pmFrequencyDisplay = document.getElementById('mmd-pm-frequency-display');
        const modelSelect = document.getElementById('mmd-model-select');
        
        if (!pmFrequencyDisplay || !modelSelect) return;

        if (!modelId) {
            this.clearPMFrequency();
            return;
        }

        const selectedOption = modelSelect.options[modelSelect.selectedIndex];
        const pmFrequencyId = selectedOption.dataset.pmFrequencyId;
        const pmFrequencyName = selectedOption.dataset.pmFrequencyName;
        const pmFrequencyDays = selectedOption.dataset.pmFrequencyDays;

        if (pmFrequencyId && pmFrequencyName) {
            pmFrequencyDisplay.innerHTML = `
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div class="flex items-center justify-between">
                        <div>
                            <span class="text-sm font-semibold text-blue-900">PM Frequency:</span>
                            <span class="text-sm text-blue-800 ml-2">${this.escapeHtml(pmFrequencyName)}</span>
                            ${pmFrequencyDays ? `<span class="text-xs text-blue-600 ml-2">(${pmFrequencyDays} days)</span>` : ''}
                        </div>
                        <i class="fas fa-lock text-blue-600"></i>
                    </div>
                    <p class="text-xs text-blue-600 mt-1">Auto-populated from selected model</p>
                </div>
            `;
            this.selectedPMFrequency = {
                id: pmFrequencyId,
                name: pmFrequencyName,
                days: parseInt(pmFrequencyDays) || null
            };
            
            // Store PM frequency days in hidden field for form submission
            const pmFrequencyDaysInput = document.getElementById('mmd-pm-frequency-days');
            if (pmFrequencyDaysInput) {
                pmFrequencyDaysInput.value = pmFrequencyDays || '';
            }
            
            // Trigger next maintenance calculation if last maintenance is set
            if (typeof calculateNextMaintenance === 'function') {
                calculateNextMaintenance();
            }
        } else {
            pmFrequencyDisplay.innerHTML = `
                <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <div class="flex items-center">
                        <i class="fas fa-exclamation-triangle text-amber-600 mr-2"></i>
                        <span class="text-sm text-amber-800">No PM frequency assigned to this model</span>
                    </div>
                </div>
            `;
            this.selectedPMFrequency = null;
        }

        this.updateSummary();
    }

    /**
     * Clear PM Frequency display
     */
    clearPMFrequency() {
        const pmFrequencyDisplay = document.getElementById('mmd-pm-frequency-display');
        if (pmFrequencyDisplay) {
            pmFrequencyDisplay.innerHTML = '<p class="text-sm text-gray-500">Select a model to see PM frequency</p>';
        }
        this.selectedPMFrequency = null;
    }

    /**
     * Update summary preview
     */
    updateSummary() {
        const summaryDiv = document.getElementById('mmd-summary');
        if (!summaryDiv) return;

        const typeName = this.selectedType ? this.mmdData.types.find(t => t.id === this.selectedType)?.name : null;
        const makeName = this.selectedMake ? this.mmdData.makes.find(m => m.id === this.selectedMake)?.name : null;
        const modelName = this.selectedModel ? 
            (document.getElementById('mmd-model-select')?.options[document.getElementById('mmd-model-select').selectedIndex]?.textContent) : null;
        const pmFrequencyName = this.selectedPMFrequency?.name || null;

        if (typeName && makeName && modelName) {
            summaryDiv.innerHTML = `
                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 class="text-sm font-semibold text-green-900 mb-2">Selected Configuration:</h4>
                    <div class="space-y-1 text-sm">
                        <div class="flex items-center">
                            <span class="font-medium text-green-800 w-20">Type:</span>
                            <span class="text-green-700">${this.escapeHtml(typeName)}</span>
                        </div>
                        <div class="flex items-center">
                            <span class="font-medium text-green-800 w-20">Make:</span>
                            <span class="text-green-700">${this.escapeHtml(makeName)}</span>
                        </div>
                        <div class="flex items-center">
                            <span class="font-medium text-green-800 w-20">Model:</span>
                            <span class="text-green-700">${this.escapeHtml(modelName)}</span>
                        </div>
                        ${pmFrequencyName ? `
                        <div class="flex items-center">
                            <span class="font-medium text-green-800 w-20">PM:</span>
                            <span class="text-green-700">${this.escapeHtml(pmFrequencyName)}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
        } else {
            summaryDiv.innerHTML = `
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p class="text-sm text-gray-500">Complete the Type → Make → Model selection to see preview</p>
                </div>
            `;
        }
    }

    /**
     * Setup event listeners for cascading dropdowns
     */
    setupEventListeners() {
        const typeSelect = document.getElementById('mmd-type-select');
        const makeSelect = document.getElementById('mmd-make-select');
        const modelSelect = document.getElementById('mmd-model-select');

        if (typeSelect) {
            typeSelect.addEventListener('change', (e) => {
                this.selectedType = e.target.value;
                this.selectedMake = null;
                this.selectedModel = null;
                this.populateMakeDropdown(this.selectedType);
            });
        }

        if (makeSelect) {
            makeSelect.addEventListener('change', async (e) => {
                this.selectedMake = e.target.value;
                this.selectedModel = null;
                await this.populateModelDropdown(this.selectedMake);
            });
        }

        if (modelSelect) {
            modelSelect.addEventListener('change', (e) => {
                this.selectedModel = e.target.value;
                this.updatePMFrequency(this.selectedModel);
            });
        }
    }

    /**
     * Validate MMD selection before asset creation
     */
    validateMMDSelection() {
        if (!this.selectedType) {
            return { valid: false, message: 'Please select an Equipment Type' };
        }
        if (!this.selectedMake) {
            return { valid: false, message: 'Please select a Make' };
        }
        if (!this.selectedModel) {
            return { valid: false, message: 'Please select a Model' };
        }
        return { valid: true, message: 'Valid' };
    }

    /**
     * Get selected MMD data for asset creation
     */
    getSelectedMMDData() {
        return {
            type_id: this.selectedType,
            make_id: this.selectedMake,
            model_id: this.selectedModel,
            pm_frequency_id: this.selectedPMFrequency?.id || null,
            pm_frequency_days: this.selectedPMFrequency?.days || null
        };
    }

    /**
     * Reset form
     */
    reset() {
        this.selectedType = null;
        this.selectedMake = null;
        this.selectedModel = null;
        this.selectedPMFrequency = null;

        const typeSelect = document.getElementById('mmd-type-select');
        const makeSelect = document.getElementById('mmd-make-select');
        const modelSelect = document.getElementById('mmd-model-select');

        if (typeSelect) typeSelect.value = '';
        if (makeSelect) {
            makeSelect.value = '';
            makeSelect.disabled = true;
        }
        if (modelSelect) {
            modelSelect.value = '';
            modelSelect.disabled = true;
        }

        this.clearPMFrequency();
        this.updateSummary();
    }

    /**
     * Show error message
     */
    showError(message) {
        if (typeof window.showToast === 'function') {
            window.showToast(message, 'error');
        } else {
            alert(message);
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.MMDAssetFormManager = new MMDAssetFormManager();
        window.MMDAssetFormManager.init();
    });
} else {
    window.MMDAssetFormManager = new MMDAssetFormManager();
    window.MMDAssetFormManager.init();
}


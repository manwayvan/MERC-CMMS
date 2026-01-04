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

            // Handle RPC response - it returns an array with one object
            let result = null;
            if (data && Array.isArray(data) && data.length > 0) {
                result = data[0];
            } else if (data && !Array.isArray(data)) {
                // In case RPC returns a single object instead of array
                result = data;
            }

            if (result) {
                this.mmdData = {
                    types: result.types || [],
                    makes: result.makes || [],
                    models: result.models || [],
                    frequencies: result.frequencies || []
                };
                console.log('MMD Asset Form loaded:', {
                    types: this.mmdData.types.length,
                    makes: this.mmdData.makes.length,
                    models: this.mmdData.models.length
                });
            } else {
                // If no data, use fallback
                console.warn('RPC returned no data, using fallback queries');
                await this.loadMMDHierarchyFallback();
                return;
            }

            this.populateTypeDropdown();
        } catch (error) {
            console.error('Error loading MMD hierarchy:', error);
            this.showError('Failed to load equipment data. Please refresh the page.');
            // Try fallback on error
            await this.loadMMDHierarchyFallback();
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
        
        // Update visual state - make dropdown is now enabled
        const makeContainer = document.getElementById('mmd-make-container');
        if (makeContainer && typeId) {
            makeContainer.classList.remove('border-gray-200');
            makeContainer.classList.add('border-blue-200');
            const label = makeContainer.querySelector('label span');
            if (label) {
                label.classList.remove('bg-gray-400');
                label.classList.add('bg-blue-600');
            }
        }
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
        
        // Update visual state - model dropdown is now enabled
        const modelContainer = document.getElementById('mmd-model-container');
        if (modelContainer && makeId) {
            modelContainer.classList.remove('border-gray-200');
            modelContainer.classList.add('border-blue-200');
            const label = modelContainer.querySelector('label span');
            if (label) {
                label.classList.remove('bg-gray-400');
                label.classList.add('bg-blue-600');
            }
        }
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
        // Update visual state
        const modelContainer = document.getElementById('mmd-model-container');
        if (modelContainer) {
            modelContainer.classList.remove('border-blue-200');
            modelContainer.classList.add('border-gray-200');
            const label = modelContainer.querySelector('label span');
            if (label) {
                label.classList.remove('bg-blue-600');
                label.classList.add('bg-gray-400');
            }
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
                <div class="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                    <div class="flex items-center justify-between">
                        <div>
                            <span class="text-sm font-bold text-green-900">PM Frequency:</span>
                            <span class="text-sm font-semibold text-green-800 ml-2">${this.escapeHtml(pmFrequencyName)}</span>
                            ${pmFrequencyDays ? `<span class="text-xs text-green-600 ml-2">(${pmFrequencyDays} days)</span>` : ''}
                        </div>
                        <i class="fas fa-check-circle text-green-600 text-xl"></i>
                    </div>
                    <p class="text-xs text-green-700 mt-2">✓ Auto-populated from selected model</p>
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
            
            // Update visual state - PM frequency is now set
            const pmContainer = document.getElementById('mmd-pm-container');
            if (pmContainer) {
                pmContainer.classList.remove('border-gray-200');
                pmContainer.classList.add('border-green-200');
                const label = pmContainer.querySelector('label span');
                if (label) {
                    label.classList.remove('bg-gray-400');
                    label.classList.add('bg-green-600');
                }
            }
            
            // Trigger next maintenance calculation if last maintenance is set
            if (typeof calculateNextMaintenance === 'function') {
                calculateNextMaintenance();
            }
        } else {
            pmFrequencyDisplay.innerHTML = `
                <div class="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
                    <div class="flex items-center">
                        <i class="fas fa-exclamation-triangle text-amber-600 mr-2 text-xl"></i>
                        <div>
                            <span class="text-sm font-semibold text-amber-800 block">No PM frequency assigned</span>
                            <span class="text-xs text-amber-700">This model needs a PM frequency. Please assign one in Settings.</span>
                        </div>
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
        const pmFrequencyDays = this.selectedPMFrequency?.days || null;

        if (typeName && makeName && modelName) {
            summaryDiv.innerHTML = `
                <div class="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-5">
                    <div class="flex items-center mb-3">
                        <i class="fas fa-check-circle text-green-600 text-xl mr-2"></i>
                        <h4 class="text-base font-bold text-green-900">Configuration Complete</h4>
                    </div>
                    <div class="bg-white rounded-lg p-4 space-y-2">
                        <div class="flex items-center text-sm">
                            <span class="font-bold text-gray-700 w-24 flex-shrink-0">Type:</span>
                            <span class="text-gray-900 font-semibold">${this.escapeHtml(typeName)}</span>
                            <i class="fas fa-arrow-right text-gray-400 mx-2"></i>
                        </div>
                        <div class="flex items-center text-sm">
                            <span class="font-bold text-gray-700 w-24 flex-shrink-0">Make:</span>
                            <span class="text-gray-900 font-semibold">${this.escapeHtml(makeName)}</span>
                            <i class="fas fa-arrow-right text-gray-400 mx-2"></i>
                        </div>
                        <div class="flex items-center text-sm">
                            <span class="font-bold text-gray-700 w-24 flex-shrink-0">Model:</span>
                            <span class="text-gray-900 font-semibold">${this.escapeHtml(modelName)}</span>
                            ${pmFrequencyName ? '<i class="fas fa-arrow-right text-gray-400 mx-2"></i>' : ''}
                        </div>
                        ${pmFrequencyName ? `
                        <div class="flex items-center text-sm pt-2 border-t border-gray-200">
                            <span class="font-bold text-gray-700 w-24 flex-shrink-0">PM Frequency:</span>
                            <span class="text-green-700 font-semibold">${this.escapeHtml(pmFrequencyName)}</span>
                            ${pmFrequencyDays ? `<span class="text-xs text-green-600 ml-2">(${pmFrequencyDays} days)</span>` : ''}
                        </div>
                        ` : `
                        <div class="pt-2 border-t border-amber-200">
                            <p class="text-xs text-amber-700 flex items-center">
                                <i class="fas fa-exclamation-triangle mr-1"></i>
                                No PM frequency assigned to this model
                            </p>
                        </div>
                        `}
                    </div>
                </div>
            `;
        } else {
            const progress = [];
            if (typeName) progress.push('Type');
            if (makeName) progress.push('Make');
            if (modelName) progress.push('Model');
            
            summaryDiv.innerHTML = `
                <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p class="text-sm text-gray-500 text-center mb-2">Complete the selection above to see your configuration</p>
                    ${progress.length > 0 ? `
                    <p class="text-xs text-gray-400 text-center">Progress: ${progress.join(' → ')}</p>
                    ` : ''}
                </div>
            `;
        }
    }

    /**
     * Setup event listeners for cascading dropdowns
     * Note: We use inline onchange handlers now for better integration with visual feedback
     */
    setupEventListeners() {
        const typeSelect = document.getElementById('mmd-type-select');
        const makeSelect = document.getElementById('mmd-make-select');
        const modelSelect = document.getElementById('mmd-model-select');

        if (typeSelect) {
            // Remove old listener if exists and add new one
            typeSelect.removeEventListener('change', this._typeChangeHandler);
            this._typeChangeHandler = (e) => {
                this.selectedType = e.target.value;
                this.selectedMake = null;
                this.selectedModel = null;
                this.populateMakeDropdown(this.selectedType);
                // Visual feedback is handled by handleMMDTypeChange
            };
            typeSelect.addEventListener('change', this._typeChangeHandler);
        }

        if (makeSelect) {
            makeSelect.removeEventListener('change', this._makeChangeHandler);
            this._makeChangeHandler = async (e) => {
                this.selectedMake = e.target.value;
                this.selectedModel = null;
                await this.populateModelDropdown(this.selectedMake);
                // Visual feedback is handled by handleMMDMakeChange
            };
            makeSelect.addEventListener('change', this._makeChangeHandler);
        }

        if (modelSelect) {
            modelSelect.removeEventListener('change', this._modelChangeHandler);
            this._modelChangeHandler = (e) => {
                this.selectedModel = e.target.value;
                this.updatePMFrequency(this.selectedModel);
                // Visual feedback is handled by handleMMDModelChange
            };
            modelSelect.addEventListener('change', this._modelChangeHandler);
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


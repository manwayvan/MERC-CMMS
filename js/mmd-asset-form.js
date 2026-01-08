/**
 * MMD Asset Form Manager
 * Handles Master Model Device (MMD) relationship for asset creation
 * Enforces Type → Make → Model → PM Frequency hierarchy
 */

class MMDAssetFormManager {
    constructor() {
        this.supabaseClient = window.supabaseClient || window.sharedSupabaseClient;
        this.referenceManager = null;
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

        // Initialize reference manager (single source of truth)
        if (window.MMDReferenceManager) {
            this.referenceManager = new window.MMDReferenceManager(this.supabaseClient);
            // Register for cache invalidation
            this.referenceManager.onCacheInvalidate(() => {
                this.loadMMDHierarchy();
            });
        }

        await this.loadMMDHierarchy();
        await this.loadPMFrequencies();
        this.setupEventListeners();
    }

    /**
     * Load complete MMD hierarchy using unified reference manager
     */
    async loadMMDHierarchy() {
        try {
            // Use reference manager if available (single source of truth)
            if (this.referenceManager) {
                const data = await this.referenceManager.loadAll();
                this.mmdData = {
                    types: data.types || [],
                    makes: data.makes || [],
                    models: data.models || [],
                    frequencies: data.frequencies || []
                };
                console.log('MMD Asset Form loaded from Reference Manager:', {
                    types: this.mmdData.types.length,
                    makes: this.mmdData.makes.length,
                    models: this.mmdData.models.length
                });
                this.populateTypeDropdown();
                return;
            }

            // Fallback to RPC if reference manager not available
            const { data, error } = await this.supabaseClient.rpc('get_mmd_hierarchy');
            
            if (error) {
                console.warn('RPC failed, using fallback queries:', error);
                await this.loadMMDHierarchyFallback();
                return;
            }

            // Handle RPC response - it returns an array with one object
            let result = null;
            if (data && Array.isArray(data) && data.length > 0) {
                result = data[0];
            } else if (data && !Array.isArray(data)) {
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
                console.warn('RPC returned no data, using fallback queries');
                await this.loadMMDHierarchyFallback();
                return;
            }

            this.populateTypeDropdown();
        } catch (error) {
            console.error('Error loading MMD hierarchy:', error);
            this.showError('Failed to load equipment data. Please refresh the page.');
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
        
        // Visual state updates removed - using standard form styling now
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
                    option.dataset.depreciationProfileId = model.depreciation_profile_id || '';
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
                    option.dataset.depreciationProfileId = model.depreciation_profile_id || '';
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
                option.dataset.depreciationProfileId = model.depreciation_profile_id || '';
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
     * Load PM Frequencies into dropdown
     */
    async loadPMFrequencies() {
        const pmFrequencySelect = document.getElementById('mmd-pm-frequency-select');
        if (!pmFrequencySelect || !this.supabaseClient) return;

        try {
            const { data: frequencies, error } = await this.supabaseClient
                .from('pm_frequencies')
                .select('id, name, days')
                .eq('is_active', true)
                .order('sort_order', { ascending: true });

            if (error) throw error;

            // Clear and populate dropdown
            pmFrequencySelect.innerHTML = '<option value="">-- Select PM Frequency --</option>';
            if (frequencies && frequencies.length > 0) {
                frequencies.forEach(freq => {
                    const option = document.createElement('option');
                    option.value = freq.id;
                    option.textContent = `${freq.name} (${freq.days} days)`;
                    option.dataset.days = freq.days;
                    pmFrequencySelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading PM frequencies:', error);
        }
    }

    /**
     * Update PM Frequency dropdown when Model is selected
     */
    async updatePMFrequency(modelId) {
        const pmFrequencySelect = document.getElementById('mmd-pm-frequency-select');
        const modelSelect = document.getElementById('mmd-model-select');
        
        if (!pmFrequencySelect || !modelSelect) return;

        // Ensure PM frequencies are loaded
        if (pmFrequencySelect.options.length <= 1) {
            await this.loadPMFrequencies();
        }

        if (!modelId) {
            pmFrequencySelect.value = '';
            const pmFrequencyDaysInput = document.getElementById('mmd-pm-frequency-days');
            if (pmFrequencyDaysInput) pmFrequencyDaysInput.value = '';
            this.selectedPMFrequency = null;
            return;
        }

        const selectedOption = modelSelect.options[modelSelect.selectedIndex];
        const pmFrequencyId = selectedOption.dataset.pmFrequencyId;
        const pmFrequencyName = selectedOption.dataset.pmFrequencyName;
        const pmFrequencyDays = selectedOption.dataset.pmFrequencyDays;
        const depreciationProfileId = selectedOption.dataset.depreciationProfileId;

        // Auto-assign depreciation profile from model
        if (depreciationProfileId && window.assetDepreciationHandler) {
            window.assetDepreciationHandler.setProfileForAsset(null, depreciationProfileId);
        } else if (window.assetDepreciationHandler && modelId) {
            // Try to load from database if not in option data
            await window.assetDepreciationHandler.loadProfileForModel(modelId);
        }

        // Set PM frequency dropdown value if model has one
        if (pmFrequencyId) {
            pmFrequencySelect.value = pmFrequencyId;
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
            // Model doesn't have PM frequency, clear selection
            pmFrequencySelect.value = '';
            this.selectedPMFrequency = null;
        }

        // Update days when user manually changes PM frequency
        pmFrequencySelect.addEventListener('change', () => {
            const selectedFreqOption = pmFrequencySelect.options[pmFrequencySelect.selectedIndex];
            const days = selectedFreqOption.dataset.days;
            const pmFrequencyDaysInput = document.getElementById('mmd-pm-frequency-days');
            if (pmFrequencyDaysInput && days) {
                pmFrequencyDaysInput.value = days;
            }
            if (typeof calculateNextMaintenance === 'function') {
                calculateNextMaintenance();
            }
        });

        this.updateSummary();
    }

    /**
     * Clear PM Frequency
     */
    clearPMFrequency() {
        const pmFrequencySelect = document.getElementById('mmd-pm-frequency-select');
        if (pmFrequencySelect) {
            pmFrequencySelect.value = '';
        }
        const pmFrequencyDaysInput = document.getElementById('mmd-pm-frequency-days');
        if (pmFrequencyDaysInput) {
            pmFrequencyDaysInput.value = '';
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
            this._modelChangeHandler = async (e) => {
                this.selectedModel = e.target.value;
                await this.updatePMFrequency(this.selectedModel);
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

// Expose the class globally so it can be instantiated
window.MMDAssetFormManager = MMDAssetFormManager;


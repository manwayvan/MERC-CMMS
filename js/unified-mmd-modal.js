/**
 * Unified MMD Management Modal
 * Combines Type → Make → Model → PM Frequency → PM Checklist creation
 * Works from both Settings and Asset Modal
 * Prevents modal from closing when clicking inside
 */

class UnifiedMMDModal {
    constructor(supabaseClient) {
        this.supabaseClient = supabaseClient;
        this.modal = null;
        this.currentStep = 'type'; // type, make, model, complete
        this.formData = {
            type_id: null,
            type_name: '',
            make_id: null,
            make_name: '',
            model_id: null,
            model_name: '',
            pm_frequency_id: null,
            checklist_id: null,
            description: ''
        };
        this.init();
    }

    init() {
        this.createModal();
        this.setupEventListeners();
    }

    createModal() {
        // Remove existing modal if any
        const existing = document.getElementById('unified-mmd-modal');
        if (existing) existing.remove();

        const modalHTML = `
            <div id="unified-mmd-modal" class="modal">
                <div class="modal-content" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
                    <div class="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div class="flex justify-between items-center">
                            <div>
                                <h2 class="text-2xl font-bold text-gray-900">Create Equipment Configuration</h2>
                                <p class="text-sm text-gray-600 mt-1">Add Type → Make → Model → PM Frequency → PM Checklist</p>
                            </div>
                            <button id="unified-mmd-close" class="text-gray-400 hover:text-gray-600 text-2xl">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="p-6">
                        <!-- Progress Indicator -->
                        <div class="mb-6">
                            <div class="flex items-center justify-between mb-2">
                                <div class="flex items-center space-x-2">
                                    <div id="step-type" class="step-indicator active">
                                        <span class="step-number">1</span>
                                        <span class="step-label">Type</span>
                                    </div>
                                    <div class="step-arrow">→</div>
                                    <div id="step-make" class="step-indicator">
                                        <span class="step-number">2</span>
                                        <span class="step-label">Make</span>
                                    </div>
                                    <div class="step-arrow">→</div>
                                    <div id="step-model" class="step-indicator">
                                        <span class="step-number">3</span>
                                        <span class="step-label">Model</span>
                                    </div>
                                    <div class="step-arrow">→</div>
                                    <div id="step-pm" class="step-indicator">
                                        <span class="step-number">4</span>
                                        <span class="step-label">PM Frequency</span>
                                    </div>
                                    <div class="step-arrow">→</div>
                                    <div id="step-checklist" class="step-indicator">
                                        <span class="step-number">5</span>
                                        <span class="step-label">Checklist</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <form id="unified-mmd-form">
                            <!-- Step 1: Equipment Type -->
                            <div id="step-type-content" class="step-content active">
                                <div class="bg-white border-2 border-blue-200 rounded-lg p-6">
                                    <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <i class="fas fa-tag text-blue-600 mr-2"></i>
                                        Equipment Type <span class="text-red-500">*</span>
                                    </h3>
                                    <div class="space-y-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Select Existing Type</label>
                                            <select id="unified-type-select" class="form-input">
                                                <option value="">-- Select Existing Type --</option>
                                            </select>
                                        </div>
                                        <div class="text-center text-gray-500 text-sm">OR</div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Create New Type</label>
                                            <input type="text" id="unified-type-new" class="form-input" placeholder="Enter new type name">
                                            <textarea id="unified-type-desc" class="form-input mt-2" rows="2" placeholder="Description (optional)"></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Step 2: Make -->
                            <div id="step-make-content" class="step-content" style="display: none;">
                                <div class="bg-white border-2 border-gray-200 rounded-lg p-6">
                                    <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <i class="fas fa-industry text-gray-600 mr-2"></i>
                                        Make <span class="text-red-500">*</span>
                                    </h3>
                                    <div class="space-y-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Select Existing Make</label>
                                            <select id="unified-make-select" class="form-input" disabled>
                                                <option value="">-- Select Type First --</option>
                                            </select>
                                        </div>
                                        <div class="text-center text-gray-500 text-sm">OR</div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Create New Make</label>
                                            <input type="text" id="unified-make-new" class="form-input" placeholder="Enter new make name" disabled>
                                            <textarea id="unified-make-desc" class="form-input mt-2" rows="2" placeholder="Description (optional)" disabled></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Step 3: Model -->
                            <div id="step-model-content" class="step-content" style="display: none;">
                                <div class="bg-white border-2 border-gray-200 rounded-lg p-6">
                                    <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <i class="fas fa-cube text-gray-600 mr-2"></i>
                                        Model <span class="text-red-500">*</span>
                                    </h3>
                                    <div class="space-y-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Select Existing Model</label>
                                            <select id="unified-model-select" class="form-input" disabled>
                                                <option value="">-- Select Make First --</option>
                                            </select>
                                        </div>
                                        <div class="text-center text-gray-500 text-sm">OR</div>
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 mb-2">Create New Model</label>
                                            <input type="text" id="unified-model-new" class="form-input" placeholder="Enter new model name" disabled>
                                            <textarea id="unified-model-desc" class="form-input mt-2" rows="2" placeholder="Description (optional)" disabled></textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Step 4: PM Frequency -->
                            <div id="step-pm-content" class="step-content" style="display: none;">
                                <div class="bg-white border-2 border-gray-200 rounded-lg p-6">
                                    <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <i class="fas fa-calendar-alt text-gray-600 mr-2"></i>
                                        PM Frequency <span class="text-red-500">*</span>
                                    </h3>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Select PM Frequency</label>
                                        <select id="unified-pm-frequency-select" class="form-input" required disabled>
                                            <option value="">-- Select Model First --</option>
                                        </select>
                                        <p class="text-xs text-gray-500 mt-1">PM Frequency is required for all models</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Step 5: PM Checklist (Optional) -->
                            <div id="step-checklist-content" class="step-content" style="display: none;">
                                <div class="bg-white border-2 border-gray-200 rounded-lg p-6">
                                    <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                        <i class="fas fa-clipboard-check text-gray-600 mr-2"></i>
                                        PM Checklist (Optional)
                                    </h3>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">Select PM Checklist</label>
                                        <select id="unified-checklist-select" class="form-input">
                                            <option value="">-- No Checklist --</option>
                                        </select>
                                        <p class="text-xs text-gray-500 mt-1">Optional: Link a checklist for this model</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Navigation Buttons -->
                            <div class="flex justify-between mt-6">
                                <button type="button" id="unified-mmd-prev" class="btn btn-secondary" style="display: none;">
                                    <i class="fas fa-arrow-left mr-2"></i>Previous
                                </button>
                                <div class="flex gap-3 ml-auto">
                                    <button type="button" id="unified-mmd-cancel" class="btn btn-secondary">Cancel</button>
                                    <button type="button" id="unified-mmd-next" class="btn btn-primary">
                                        Next <i class="fas fa-arrow-right ml-2"></i>
                                    </button>
                                    <button type="submit" id="unified-mmd-save" class="btn btn-primary" style="display: none;">
                                        <i class="fas fa-save mr-2"></i>Save Configuration
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.getElementById('unified-mmd-modal');
        this.addModalStyles();
    }

    addModalStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .step-indicator {
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 8px 16px;
                border-radius: 8px;
                transition: all 0.3s;
            }
            .step-indicator.active {
                background: #3b82f6;
                color: white;
            }
            .step-indicator:not(.active) {
                background: #e5e7eb;
                color: #6b7280;
            }
            .step-number {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                margin-bottom: 4px;
                background: rgba(255,255,255,0.3);
            }
            .step-indicator.active .step-number {
                background: rgba(255,255,255,0.9);
                color: #3b82f6;
            }
            .step-label {
                font-size: 12px;
                font-weight: 600;
            }
            .step-arrow {
                color: #9ca3af;
                font-weight: bold;
                margin: 0 8px;
            }
            .step-content {
                animation: fadeIn 0.3s;
            }
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            #unified-mmd-modal .modal-content {
                pointer-events: auto;
            }
            #unified-mmd-modal .modal-content * {
                pointer-events: auto;
            }
        `;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        // Close button
        const closeBtn = document.getElementById('unified-mmd-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.close();
            });
        }
        
        const cancelBtn = document.getElementById('unified-mmd-cancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.close();
            });
        }
        
        // Navigation - CRITICAL: Must stop propagation and use capture phase
        const nextBtn = document.getElementById('unified-mmd-next');
        if (nextBtn) {
            nextBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                console.log('Next button clicked');
                await this.nextStep();
            }, true); // Use capture phase to ensure it fires before stopPropagation
        }
        
        const prevBtn = document.getElementById('unified-mmd-prev');
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                this.prevStep();
            }, true);
        }
        
        // Form submission
        const form = document.getElementById('unified-mmd-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.save();
            });
        }

        // Type selection
        document.getElementById('unified-type-select').addEventListener('change', (e) => {
            this.formData.type_id = e.target.value || null;
            this.loadMakes();
        });

        // Make selection
        document.getElementById('unified-make-select').addEventListener('change', (e) => {
            this.formData.make_id = e.target.value || null;
            this.loadModels();
        });

        // Model selection
        document.getElementById('unified-model-select').addEventListener('change', (e) => {
            this.formData.model_id = e.target.value || null;
            this.loadPMFrequencies();
        });

        // Prevent modal from closing when clicking inside - BUT allow buttons to work
        const modalContent = this.modal.querySelector('.modal-content');
        if (modalContent) {
            ['click', 'mousedown', 'mouseup'].forEach(eventType => {
                modalContent.addEventListener(eventType, (e) => {
                    // Don't stop propagation for buttons - they need to work
                    const target = e.target;
                    const isButton = target.tagName === 'BUTTON' || 
                                   target.closest('button') !== null ||
                                   target.id === 'unified-mmd-next' ||
                                   target.id === 'unified-mmd-prev' ||
                                   target.id === 'unified-mmd-save' ||
                                   target.id === 'unified-mmd-cancel' ||
                                   target.id === 'unified-mmd-close';
                    
                    if (!isButton) {
                        e.stopPropagation();
                    }
                }, false); // Use bubble phase, not capture
            });
        }

        // Prevent backdrop clicks from closing - only close on direct backdrop click
        this.modal.addEventListener('click', (e) => {
            // Only close if clicking directly on the modal backdrop (not children)
            if (e.target === this.modal) {
                this.close();
            }
        }, false);
    }

    async open(context = {}) {
        // Reset form
        this.reset();
        
        // Load initial data
        await this.loadTypes();
        await this.loadPMFrequencies();
        await this.loadChecklists();
        
        // If context has pre-selected values, populate them
        if (context.type_id) {
            document.getElementById('unified-type-select').value = context.type_id;
            this.formData.type_id = context.type_id;
            await this.loadMakes();
        }
        if (context.make_id) {
            document.getElementById('unified-make-select').value = context.make_id;
            this.formData.make_id = context.make_id;
            await this.loadModels();
        }
        if (context.model_id) {
            document.getElementById('unified-model-select').value = context.model_id;
            this.formData.model_id = context.model_id;
        }

        this.modal.classList.add('active');
        this.updateStep('type');
    }

    close() {
        this.modal.classList.remove('active');
        this.reset();
    }

    reset() {
        this.currentStep = 'type';
        this.formData = {
            type_id: null,
            type_name: '',
            make_id: null,
            make_name: '',
            model_id: null,
            model_name: '',
            pm_frequency_id: null,
            checklist_id: null,
            description: ''
        };
        document.getElementById('unified-mmd-form').reset();
        this.updateStep('type');
    }

    updateStep(step) {
        const steps = ['type', 'make', 'model', 'pm', 'checklist'];
        const currentIndex = steps.indexOf(this.currentStep);
        const stepIndex = steps.indexOf(step);
        
        // Hide all steps
        steps.forEach(s => {
            document.getElementById(`step-${s}-content`).style.display = 'none';
            document.getElementById(`step-${s}`).classList.remove('active');
        });

        // Show current step
        document.getElementById(`step-${step}-content`).style.display = 'block';
        document.getElementById(`step-${step}`).classList.add('active');

        // Update navigation buttons
        document.getElementById('unified-mmd-prev').style.display = stepIndex > 0 ? 'block' : 'none';
        document.getElementById('unified-mmd-next').style.display = stepIndex < steps.length - 1 ? 'block' : 'none';
        document.getElementById('unified-mmd-save').style.display = stepIndex === steps.length - 1 ? 'block' : 'none';

        this.currentStep = step;
    }

    async nextStep() {
        console.log('nextStep called, current step:', this.currentStep);
        try {
            // Validate current step
            const isValid = await this.validateCurrentStep();
            console.log('Validation result:', isValid);
            if (!isValid) {
                return;
            }

            // Process current step
            console.log('Processing current step...');
            await this.processCurrentStep();

            // Move to next step
            const steps = ['type', 'make', 'model', 'pm', 'checklist'];
            const currentIndex = steps.indexOf(this.currentStep);
            console.log('Current index:', currentIndex, 'of', steps.length);
            
            if (currentIndex < steps.length - 1) {
                const nextStepName = steps[currentIndex + 1];
                console.log('Moving to next step:', nextStepName);
                this.updateStep(nextStepName);
                
                // Load dependent data
                if (this.currentStep === 'make') {
                    console.log('Loading makes...');
                    await this.loadMakes();
                } else if (this.currentStep === 'model') {
                    console.log('Loading models...');
                    await this.loadModels();
                } else if (this.currentStep === 'pm') {
                    console.log('Loading PM frequencies...');
                    await this.loadPMFrequencies();
                }
            } else {
                console.log('Already at last step');
            }
        } catch (error) {
            console.error('Error in nextStep:', error);
            alert(`Error: ${error.message}`);
        }
    }

    prevStep() {
        const steps = ['type', 'make', 'model', 'pm', 'checklist'];
        const currentIndex = steps.indexOf(this.currentStep);
        if (currentIndex > 0) {
            this.updateStep(steps[currentIndex - 1]);
        }
    }

    async validateCurrentStep() {
        if (this.currentStep === 'type') {
            const typeSelect = document.getElementById('unified-type-select').value;
            const typeNew = document.getElementById('unified-type-new').value.trim();
            if (!typeSelect && !typeNew) {
                alert('Please select an existing type or enter a new type name');
                return false;
            }
        } else if (this.currentStep === 'make') {
            if (!this.formData.type_id) {
                alert('Please complete the Type step first');
                return false;
            }
            const makeSelect = document.getElementById('unified-make-select').value;
            const makeNew = document.getElementById('unified-make-new').value.trim();
            if (!makeSelect && !makeNew) {
                alert('Please select an existing make or enter a new make name');
                return false;
            }
        } else if (this.currentStep === 'model') {
            if (!this.formData.make_id) {
                alert('Please complete the Make step first');
                return false;
            }
            const modelSelect = document.getElementById('unified-model-select').value;
            const modelNew = document.getElementById('unified-model-new').value.trim();
            if (!modelSelect && !modelNew) {
                alert('Please select an existing model or enter a new model name');
                return false;
            }
        } else if (this.currentStep === 'pm') {
            if (!this.formData.model_id) {
                alert('Please complete the Model step first');
                return false;
            }
            const pmSelect = document.getElementById('unified-pm-frequency-select').value;
            if (!pmSelect) {
                alert('PM Frequency is required');
                return false;
            }
        }
        return true;
    }

    async processCurrentStep() {
        if (this.currentStep === 'type') {
            const typeSelect = document.getElementById('unified-type-select').value;
            const typeNew = document.getElementById('unified-type-new').value.trim();
            
            if (typeSelect) {
                this.formData.type_id = typeSelect;
            } else if (typeNew) {
                // Create new type
                const { data, error } = await this.supabaseClient
                    .from('equipment_types')
                    .insert([{
                        name: typeNew,
                        description: document.getElementById('unified-type-desc').value.trim() || null,
                        is_active: true
                    }])
                    .select()
                    .single();
                
                if (error) throw error;
                this.formData.type_id = data.id;
                await this.loadTypes();
                document.getElementById('unified-type-select').value = data.id;
            }
        } else if (this.currentStep === 'make') {
            const makeSelect = document.getElementById('unified-make-select').value;
            const makeNew = document.getElementById('unified-make-new').value.trim();
            
            if (makeSelect) {
                this.formData.make_id = makeSelect;
            } else if (makeNew) {
                // Create new make
                const { data, error } = await this.supabaseClient
                    .from('equipment_makes')
                    .insert([{
                        name: makeNew,
                        type_id: this.formData.type_id,
                        description: document.getElementById('unified-make-desc').value.trim() || null,
                        is_active: true
                    }])
                    .select()
                    .single();
                
                if (error) throw error;
                this.formData.make_id = data.id;
                await this.loadMakes();
                document.getElementById('unified-make-select').value = data.id;
            }
        } else if (this.currentStep === 'model') {
            const modelSelect = document.getElementById('unified-model-select').value;
            const modelNew = document.getElementById('unified-model-new').value.trim();
            
            if (modelSelect) {
                this.formData.model_id = modelSelect;
            } else if (modelNew) {
                // We'll create the model in the save step since we need PM frequency
                this.formData.model_name = modelNew;
                this.formData.description = document.getElementById('unified-model-desc').value.trim() || null;
            }
        } else if (this.currentStep === 'pm') {
            this.formData.pm_frequency_id = document.getElementById('unified-pm-frequency-select').value;
        } else if (this.currentStep === 'checklist') {
            this.formData.checklist_id = document.getElementById('unified-checklist-select').value || null;
        }
    }

    async loadTypes() {
        const { data, error } = await this.supabaseClient
            .from('equipment_types')
            .select('id, name')
            .eq('is_active', true)
            .is('deleted_at', null)
            .order('name');
        
        if (error) {
            console.error('Error loading types:', error);
            return;
        }

        const select = document.getElementById('unified-type-select');
        select.innerHTML = '<option value="">-- Select Existing Type --</option>';
        data.forEach(type => {
            const option = document.createElement('option');
            option.value = type.id;
            option.textContent = type.name;
            select.appendChild(option);
        });
    }

    async loadMakes() {
        if (!this.formData.type_id) {
            document.getElementById('unified-make-select').disabled = true;
            document.getElementById('unified-make-new').disabled = true;
            document.getElementById('unified-make-desc').disabled = true;
            return;
        }

        const { data, error } = await this.supabaseClient
            .from('equipment_makes')
            .select('id, name')
            .eq('type_id', this.formData.type_id)
            .eq('is_active', true)
            .is('deleted_at', null)
            .order('name');
        
        if (error) {
            console.error('Error loading makes:', error);
            return;
        }

        const select = document.getElementById('unified-make-select');
        select.innerHTML = '<option value="">-- Select Existing Make --</option>';
        data.forEach(make => {
            const option = document.createElement('option');
            option.value = make.id;
            option.textContent = make.name;
            select.appendChild(option);
        });
        
        select.disabled = false;
        document.getElementById('unified-make-new').disabled = false;
        document.getElementById('unified-make-desc').disabled = false;
    }

    async loadModels() {
        if (!this.formData.make_id) {
            document.getElementById('unified-model-select').disabled = true;
            document.getElementById('unified-model-new').disabled = true;
            document.getElementById('unified-model-desc').disabled = true;
            return;
        }

        const { data, error } = await this.supabaseClient
            .from('equipment_models')
            .select('id, name')
            .eq('make_id', this.formData.make_id)
            .eq('is_active', true)
            .is('deleted_at', null)
            .order('name');
        
        if (error) {
            console.error('Error loading models:', error);
            return;
        }

        const select = document.getElementById('unified-model-select');
        select.innerHTML = '<option value="">-- Select Existing Model --</option>';
        data.forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = model.name;
            select.appendChild(option);
        });
        
        select.disabled = false;
        document.getElementById('unified-model-new').disabled = false;
        document.getElementById('unified-model-desc').disabled = false;
    }

    async loadPMFrequencies() {
        const { data, error } = await this.supabaseClient
            .from('pm_frequencies')
            .select('id, name, days')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });
        
        if (error) {
            console.error('Error loading PM frequencies:', error);
            return;
        }

        const select = document.getElementById('unified-pm-frequency-select');
        select.innerHTML = '<option value="">-- Select PM Frequency --</option>';
        data.forEach(freq => {
            const option = document.createElement('option');
            option.value = freq.id;
            option.textContent = `${freq.name} (${freq.days} days)`;
            select.appendChild(option);
        });
        
        if (this.formData.model_id) {
            select.disabled = false;
        }
    }

    async loadChecklists() {
        const { data, error } = await this.supabaseClient
            .from('checklists')
            .select('id, name')
            .eq('is_active', true)
            .order('name');
        
        if (error) {
            console.error('Error loading checklists:', error);
            return;
        }

        const select = document.getElementById('unified-checklist-select');
        select.innerHTML = '<option value="">-- No Checklist --</option>';
        if (data) {
            data.forEach(checklist => {
                const option = document.createElement('option');
                option.value = checklist.id;
                option.textContent = checklist.name;
                select.appendChild(option);
            });
        }
    }

    async save() {
        try {
            // Validate all steps
            if (!this.formData.type_id || !this.formData.make_id) {
                alert('Please complete all required steps');
                return;
            }

            // Create model if needed
            if (!this.formData.model_id && this.formData.model_name) {
                if (!this.formData.pm_frequency_id) {
                    alert('PM Frequency is required to create a model');
                    return;
                }

                const { data, error } = await this.supabaseClient
                    .from('equipment_models')
                    .insert([{
                        name: this.formData.model_name,
                        make_id: this.formData.make_id,
                        pm_frequency_id: this.formData.pm_frequency_id,
                        description: this.formData.description || null,
                        is_active: true
                    }])
                    .select()
                    .single();
                
                if (error) throw error;
                this.formData.model_id = data.id;
            }

            // Update model with PM frequency if it was selected
            if (this.formData.model_id && this.formData.pm_frequency_id) {
                await this.supabaseClient
                    .from('equipment_models')
                    .update({ pm_frequency_id: this.formData.pm_frequency_id })
                    .eq('id', this.formData.model_id);
            }

            // Get type and make names for device configuration
            const typeName = document.getElementById('unified-type-select')?.selectedOptions[0]?.textContent || 
                            document.getElementById('unified-type-new').value || 'Type';
            const makeName = document.getElementById('unified-make-select')?.selectedOptions[0]?.textContent || 
                            document.getElementById('unified-make-new').value || 'Make';
            const modelName = document.getElementById('unified-model-select')?.selectedOptions[0]?.textContent || 
                            this.formData.model_name || 'Model';

            // Create device configuration (optional - links everything together)
            // Note: device_configurations uses category_id which maps to equipment_types
            try {
                const { data: existing } = await this.supabaseClient
                    .from('device_configurations')
                    .select('id')
                    .eq('category_id', this.formData.type_id)
                    .eq('make_id', this.formData.make_id)
                    .eq('model_id', this.formData.model_id)
                    .maybeSingle();

                if (!existing) {
                    await this.supabaseClient
                        .from('device_configurations')
                        .insert([{
                            name: `${typeName} - ${makeName} - ${modelName}`,
                            category_id: this.formData.type_id,
                            make_id: this.formData.make_id,
                            model_id: this.formData.model_id,
                            pm_frequency_id: this.formData.pm_frequency_id,
                            checklist_id: this.formData.checklist_id || null,
                            is_active: true
                        }]);
                } else if (this.formData.checklist_id) {
                    // Update existing configuration with checklist if provided
                    await this.supabaseClient
                        .from('device_configurations')
                        .update({ checklist_id: this.formData.checklist_id })
                        .eq('id', existing.id);
                }
            } catch (configError) {
                // Device configuration is optional - don't fail if it errors
                console.warn('Could not create device configuration:', configError);
            }

            // Invalidate caches
            if (window.MMDReferenceManager) {
                window.MMDReferenceManager.invalidateCache();
            }

            // Refresh dropdowns if asset modal is open
            if (window.mmdAssetFormManager) {
                await window.mmdAssetFormManager.loadMMDHierarchy();
                
                // Update dropdowns with new values
                if (this.formData.type_id) {
                    const typeSelect = document.getElementById('mmd-type-select');
                    if (typeSelect) {
                        typeSelect.value = this.formData.type_id;
                        if (window.handleMMDTypeChange) window.handleMMDTypeChange();
                    }
                }
                if (this.formData.make_id) {
                    const makeSelect = document.getElementById('mmd-make-select');
                    if (makeSelect) {
                        setTimeout(() => {
                            makeSelect.value = this.formData.make_id;
                            if (window.handleMMDMakeChange) window.handleMMDMakeChange();
                        }, 100);
                    }
                }
                if (this.formData.model_id) {
                    const modelSelect = document.getElementById('mmd-model-select');
                    if (modelSelect) {
                        setTimeout(() => {
                            modelSelect.value = this.formData.model_id;
                            if (window.handleMMDModelChange) window.handleMMDModelChange();
                        }, 200);
                    }
                }
            }

            // Show success message
            if (window.showToast) {
                window.showToast('Equipment configuration created successfully!', 'success');
            } else {
                alert('Equipment configuration created successfully!');
            }

            this.close();
        } catch (error) {
            console.error('Error saving configuration:', error);
            if (window.showToast) {
                window.showToast(`Error: ${error.message}`, 'error');
            } else {
                alert(`Error: ${error.message}`);
            }
        }
    }
}

// Expose globally
window.UnifiedMMDModal = UnifiedMMDModal;

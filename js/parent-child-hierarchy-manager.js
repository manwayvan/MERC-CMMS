/**
 * Parent-Child Hierarchy Manager
 * Manages the strict hierarchy: device_types → manufacturers → device_models → pm_programs → pm_checklists → pm_checklist_items
 * All operations use MCP Supabase connector
 * No free-text entry, all relationships enforced at database level
 */

class ParentChildHierarchyManager {
    constructor(supabaseClient) {
        this.supabaseClient = supabaseClient;
        this.hierarchy = {
            deviceTypes: [],
            manufacturers: [],
            deviceModels: [],
            pmPrograms: [],
            pmChecklists: [],
            pmChecklistItems: []
        };
    }

    // ============================================================================
    // LOAD HIERARCHY DATA (via MCP Supabase)
    // ============================================================================

    async loadFullHierarchy() {
        try {
            // Load all device types (handle case where table doesn't exist yet)
            const { data: types, error: typesError } = await this.supabaseClient
                .from('device_types')
                .select('*')
                .is('deleted_at', null)
                .eq('is_active', true)
                .order('name');

            if (typesError) {
                // If table doesn't exist, initialize with empty arrays
                if (typesError.code === '42P01' || typesError.message?.includes('does not exist')) {
                    console.warn('device_types table does not exist yet. Please run the database migrations.');
                    this.hierarchy.deviceTypes = [];
                    this.hierarchy.manufacturers = [];
                    this.hierarchy.deviceModels = [];
                    this.hierarchy.pmPrograms = [];
                    this.hierarchy.pmChecklists = [];
                    this.hierarchy.pmChecklistItems = [];
                    return this.hierarchy;
                }
                throw typesError;
            }
            this.hierarchy.deviceTypes = types || [];

            // Load all manufacturers with their device types
            const { data: manufacturers, error: mfgError } = await this.supabaseClient
                .from('manufacturers')
                .select('*, device_types(*)')
                .is('deleted_at', null)
                .eq('is_active', true)
                .order('name');

            if (mfgError) {
                if (mfgError.code === '42P01' || mfgError.message?.includes('does not exist')) {
                    this.hierarchy.manufacturers = [];
                } else {
                    throw mfgError;
                }
            } else {
                this.hierarchy.manufacturers = manufacturers || [];
            }

            // Load all device models with their manufacturers
            const { data: models, error: modelsError } = await this.supabaseClient
                .from('device_models')
                .select('*, manufacturers(*, device_types(*))')
                .is('deleted_at', null)
                .eq('is_active', true)
                .order('name');

            if (modelsError) {
                if (modelsError.code === '42P01' || modelsError.message?.includes('does not exist')) {
                    this.hierarchy.deviceModels = [];
                } else {
                    throw modelsError;
                }
            } else {
                this.hierarchy.deviceModels = models || [];
            }

            // Load all PM programs with their models and frequencies
            const { data: pmPrograms, error: pmError } = await this.supabaseClient
                .from('pm_programs')
                .select('*, device_models(*, manufacturers(*, device_types(*))), pm_frequencies(*)')
                .is('deleted_at', null)
                .eq('is_active', true)
                .order('name');

            if (pmError) {
                if (pmError.code === '42P01' || pmError.message?.includes('does not exist')) {
                    this.hierarchy.pmPrograms = [];
                } else {
                    throw pmError;
                }
            } else {
                this.hierarchy.pmPrograms = pmPrograms || [];
            }

            // Load all PM checklists with their programs
            const { data: checklists, error: chkError } = await this.supabaseClient
                .from('pm_checklists')
                .select('*, pm_programs(*)')
                .is('deleted_at', null)
                .eq('is_active', true)
                .order('name');

            if (chkError) {
                if (chkError.code === '42P01' || chkError.message?.includes('does not exist')) {
                    this.hierarchy.pmChecklists = [];
                } else {
                    throw chkError;
                }
            } else {
                this.hierarchy.pmChecklists = checklists || [];
            }

            // Load all checklist items
            const { data: items, error: itemsError } = await this.supabaseClient
                .from('pm_checklist_items')
                .select('*, pm_checklists(*)')
                .is('deleted_at', null)
                .order('sort_order');

            if (itemsError) {
                if (itemsError.code === '42P01' || itemsError.message?.includes('does not exist')) {
                    this.hierarchy.pmChecklistItems = [];
                } else {
                    throw itemsError;
                }
            } else {
                this.hierarchy.pmChecklistItems = items || [];
            }

            return this.hierarchy;
        } catch (error) {
            console.error('Error loading hierarchy:', error);
            throw error;
        }
    }

    // ============================================================================
    // CREATE OPERATIONS (via MCP Supabase)
    // ============================================================================

    async createDeviceType(name, description = '') {
        if (!name || name.trim() === '') {
            throw new Error('Device type name is required');
        }

        const { data, error } = await this.supabaseClient
            .from('device_types')
            .insert([{
                name: name.trim(),
                description: description.trim(),
                is_active: true
            }])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Unique violation
                throw new Error(`Device type "${name}" already exists`);
            }
            throw error;
        }

        await this.loadFullHierarchy();
        return data;
    }

    async createManufacturer(name, deviceTypeId, description = '') {
        if (!name || name.trim() === '') {
            throw new Error('Manufacturer name is required');
        }
        if (!deviceTypeId) {
            throw new Error('Device type must be selected first');
        }

        // Validate device type exists
        const { data: deviceType, error: typeError } = await this.supabaseClient
            .from('device_types')
            .select('id')
            .eq('id', deviceTypeId)
            .is('deleted_at', null)
            .single();

        if (typeError || !deviceType) {
            throw new Error('Selected device type does not exist');
        }

        const { data, error } = await this.supabaseClient
            .from('manufacturers')
            .insert([{
                name: name.trim(),
                device_type_id: deviceTypeId,
                description: description.trim(),
                is_active: true
            }])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Unique violation
                throw new Error(`Manufacturer "${name}" already exists for this device type`);
            }
            if (error.code === '23503') { // Foreign key violation
                throw new Error('Invalid device type selected');
            }
            throw error;
        }

        await this.loadFullHierarchy();
        return data;
    }

    async createDeviceModel(name, manufacturerId, description = '', riskClass = 'medium') {
        if (!name || name.trim() === '') {
            throw new Error('Device model name is required');
        }
        if (!manufacturerId) {
            throw new Error('Manufacturer must be selected first');
        }

        // Validate manufacturer exists
        const { data: manufacturer, error: mfgError } = await this.supabaseClient
            .from('manufacturers')
            .select('id')
            .eq('id', manufacturerId)
            .is('deleted_at', null)
            .single();

        if (mfgError || !manufacturer) {
            throw new Error('Selected manufacturer does not exist');
        }

        const { data, error } = await this.supabaseClient
            .from('device_models')
            .insert([{
                name: name.trim(),
                manufacturer_id: manufacturerId,
                description: description.trim(),
                risk_class: riskClass,
                is_active: true
            }])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Unique violation
                throw new Error(`Device model "${name}" already exists for this manufacturer`);
            }
            if (error.code === '23503') { // Foreign key violation
                throw new Error('Invalid manufacturer selected');
            }
            throw error;
        }

        await this.loadFullHierarchy();
        return data;
    }

    async createPMProgram(name, deviceModelId, pmFrequencyId, description = '') {
        if (!name || name.trim() === '') {
            throw new Error('PM program name is required');
        }
        if (!deviceModelId) {
            throw new Error('Device model must be selected first');
        }
        if (!pmFrequencyId) {
            throw new Error('PM frequency is required');
        }

        // Validate device model exists
        const { data: model, error: modelError } = await this.supabaseClient
            .from('device_models')
            .select('id')
            .eq('id', deviceModelId)
            .is('deleted_at', null)
            .single();

        if (modelError || !model) {
            throw new Error('Selected device model does not exist');
        }

        // Validate PM frequency exists
        const { data: frequency, error: freqError } = await this.supabaseClient
            .from('pm_frequencies')
            .select('id')
            .eq('id', pmFrequencyId)
            .is('deleted_at', null)
            .eq('is_active', true)
            .single();

        if (freqError || !frequency) {
            throw new Error('Selected PM frequency does not exist');
        }

        const { data, error } = await this.supabaseClient
            .from('pm_programs')
            .insert([{
                name: name.trim(),
                device_model_id: deviceModelId,
                pm_frequency_id: pmFrequencyId,
                description: description.trim(),
                is_active: true
            }])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Unique violation
                throw new Error('This device model already has an active PM program');
            }
            if (error.code === '23503') { // Foreign key violation
                throw new Error('Invalid device model or PM frequency selected');
            }
            throw error;
        }

        await this.loadFullHierarchy();
        return data;
    }

    async createPMChecklist(name, pmProgramId, description = '', category = 'PM') {
        if (!name || name.trim() === '') {
            throw new Error('PM checklist name is required');
        }
        if (!pmProgramId) {
            throw new Error('PM program must be selected first');
        }

        // Validate PM program exists
        const { data: program, error: progError } = await this.supabaseClient
            .from('pm_programs')
            .select('id')
            .eq('id', pmProgramId)
            .is('deleted_at', null)
            .single();

        if (progError || !program) {
            throw new Error('Selected PM program does not exist');
        }

        const { data, error } = await this.supabaseClient
            .from('pm_checklists')
            .insert([{
                name: name.trim(),
                pm_program_id: pmProgramId,
                description: description.trim(),
                category: category,
                is_active: true
            }])
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Unique violation
                throw new Error('This PM program already has an active checklist');
            }
            if (error.code === '23503') { // Foreign key violation
                throw new Error('Invalid PM program selected');
            }
            throw error;
        }

        await this.loadFullHierarchy();
        return data;
    }

    async createPMChecklistItem(pmChecklistId, name, description = '', itemType = 'checkbox', isRequired = false, sortOrder = 0) {
        if (!name || name.trim() === '') {
            throw new Error('Checklist item name is required');
        }
        if (!pmChecklistId) {
            throw new Error('PM checklist must be selected first');
        }

        // Validate checklist exists
        const { data: checklist, error: chkError } = await this.supabaseClient
            .from('pm_checklists')
            .select('id')
            .eq('id', pmChecklistId)
            .is('deleted_at', null)
            .single();

        if (chkError || !checklist) {
            throw new Error('Selected PM checklist does not exist');
        }

        const { data, error } = await this.supabaseClient
            .from('pm_checklist_items')
            .insert([{
                pm_checklist_id: pmChecklistId,
                name: name.trim(),
                description: description.trim(),
                item_type: itemType,
                is_required: isRequired,
                sort_order: sortOrder
            }])
            .select()
            .single();

        if (error) {
            if (error.code === '23503') { // Foreign key violation
                throw new Error('Invalid PM checklist selected');
            }
            throw error;
        }

        await this.loadFullHierarchy();
        return data;
    }

    // ============================================================================
    // GET FILTERED DATA (for cascading dropdowns)
    // ============================================================================

    getManufacturersByDeviceType(deviceTypeId) {
        if (!deviceTypeId) return [];
        return this.hierarchy.manufacturers.filter(m => 
            m.device_type_id === deviceTypeId && 
            m.is_active && 
            !m.deleted_at
        );
    }

    getDeviceModelsByManufacturer(manufacturerId) {
        if (!manufacturerId) return [];
        return this.hierarchy.deviceModels.filter(m => 
            m.manufacturer_id === manufacturerId && 
            m.is_active && 
            !m.deleted_at
        );
    }

    getPMProgramByDeviceModel(deviceModelId) {
        if (!deviceModelId) return null;
        return this.hierarchy.pmPrograms.find(p => 
            p.device_model_id === deviceModelId && 
            p.is_active && 
            !p.deleted_at
        ) || null;
    }

    getPMChecklistByPMProgram(pmProgramId) {
        if (!pmProgramId) return null;
        return this.hierarchy.pmChecklists.find(c => 
            c.pm_program_id === pmProgramId && 
            c.is_active && 
            !c.deleted_at
        ) || null;
    }

    getPMChecklistItemsByChecklist(pmChecklistId) {
        if (!pmChecklistId) return [];
        return this.hierarchy.pmChecklistItems.filter(i => 
            i.pm_checklist_id === pmChecklistId && 
            !i.deleted_at
        ).sort((a, b) => a.sort_order - b.sort_order);
    }

    // ============================================================================
    // VALIDATION METHODS
    // ============================================================================

    async validateHierarchyComplete(deviceTypeId, manufacturerId, deviceModelId) {
        const errors = [];

        if (!deviceTypeId) {
            errors.push('Device type is required');
        } else {
            const type = this.hierarchy.deviceTypes.find(t => t.id === deviceTypeId);
            if (!type) errors.push('Selected device type does not exist');
        }

        if (!manufacturerId) {
            errors.push('Manufacturer is required');
        } else {
            const manufacturer = this.hierarchy.manufacturers.find(m => m.id === manufacturerId);
            if (!manufacturer) {
                errors.push('Selected manufacturer does not exist');
            } else if (manufacturer.device_type_id !== deviceTypeId) {
                errors.push('Selected manufacturer does not belong to selected device type');
            }
        }

        if (!deviceModelId) {
            errors.push('Device model is required');
        } else {
            const model = this.hierarchy.deviceModels.find(m => m.id === deviceModelId);
            if (!model) {
                errors.push('Selected device model does not exist');
            } else if (model.manufacturer_id !== manufacturerId) {
                errors.push('Selected device model does not belong to selected manufacturer');
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    async getPMProgramForAsset(deviceModelId) {
        const pmProgram = this.getPMProgramByDeviceModel(deviceModelId);
        if (!pmProgram) {
            return {
                valid: false,
                error: 'No PM program found for selected device model. Please create a PM program in Settings first.'
            };
        }

        const checklist = this.getPMChecklistByPMProgram(pmProgram.id);
        const items = checklist ? this.getPMChecklistItemsByChecklist(checklist.id) : [];

        return {
            valid: true,
            pmProgram: pmProgram,
            pmChecklist: checklist,
            pmChecklistItems: items
        };
    }
}

// Expose globally
window.ParentChildHierarchyManager = ParentChildHierarchyManager;

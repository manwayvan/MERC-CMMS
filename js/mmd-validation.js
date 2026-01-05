/**
 * MMD Hierarchy Validation Module
 * Enforces strict hierarchy rules for Medical Device Asset Management
 * 
 * Rules:
 * - Make cannot exist without Type
 * - Model cannot exist without Make
 * - PM Frequency is REQUIRED at Model level
 * - No duplicate Makes under same Type
 * - No duplicate Models under same Make
 * - Assets inherit PM Frequency from Model
 */

class MMDValidation {
    constructor(supabaseClient) {
        this.supabaseClient = supabaseClient;
    }

    /**
     * Validate Make creation
     * @param {string} makeName - Name of the Make
     * @param {string} typeId - ID of the parent Type
     * @returns {Promise<{valid: boolean, error?: string}>}
     */
    async validateMakeCreation(makeName, typeId) {
        try {
            // Rule: Cannot create Make without Type
            if (!typeId || typeId.trim() === '') {
                return {
                    valid: false,
                    error: 'Make must belong to an MMD Type. Please select a Type first.'
                };
            }

            // Rule: Make name is required
            if (!makeName || makeName.trim() === '') {
                return {
                    valid: false,
                    error: 'Make name is required.'
                };
            }

            // Rule: Prevent duplicate Makes under same Type
            const { data: existing, error } = await this.supabaseClient
                .from('equipment_makes')
                .select('id, name')
                .eq('name', makeName.trim())
                .eq('type_id', typeId)
                .is('deleted_at', null)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
                throw error;
            }

            if (existing) {
                return {
                    valid: false,
                    error: `Make "${makeName}" already exists for this MMD Type. Please select it from the dropdown or choose a different name.`
                };
            }

            // Verify Type exists and is active
            const { data: type, error: typeError } = await this.supabaseClient
                .from('equipment_types')
                .select('id, name, is_active')
                .eq('id', typeId)
                .is('deleted_at', null)
                .maybeSingle();

            if (typeError) {
                throw typeError;
            }

            if (!type) {
                return {
                    valid: false,
                    error: 'Selected MMD Type does not exist. Please refresh and try again.'
                };
            }

            if (!type.is_active) {
                return {
                    valid: false,
                    error: `MMD Type "${type.name}" is inactive. Please select an active Type.`
                };
            }

            return { valid: true };
        } catch (error) {
            console.error('Error validating Make creation:', error);
            return {
                valid: false,
                error: `Validation error: ${error.message}`
            };
        }
    }

    /**
     * Validate Model creation
     * @param {string} modelName - Name of the Model
     * @param {string} makeId - ID of the parent Make
     * @param {string} pmFrequencyId - ID of the PM Frequency (REQUIRED)
     * @returns {Promise<{valid: boolean, error?: string}>}
     */
    async validateModelCreation(modelName, makeId, pmFrequencyId) {
        try {
            // Rule: Cannot create Model without Make
            if (!makeId || makeId.trim() === '') {
                return {
                    valid: false,
                    error: 'Model must belong to a Make. Please select a Make first.'
                };
            }

            // Rule: Model name is required
            if (!modelName || modelName.trim() === '') {
                return {
                    valid: false,
                    error: 'Model name is required.'
                };
            }

            // Rule: PM Frequency is REQUIRED
            if (!pmFrequencyId || pmFrequencyId.trim() === '') {
                return {
                    valid: false,
                    error: 'PM Frequency is REQUIRED for Model. This is the source of truth for all assets using this model.'
                };
            }

            // Rule: Prevent duplicate Models under same Make
            const { data: existing, error } = await this.supabaseClient
                .from('equipment_models')
                .select('id, name')
                .eq('name', modelName.trim())
                .eq('make_id', makeId)
                .is('deleted_at', null)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            if (existing) {
                return {
                    valid: false,
                    error: `Model "${modelName}" already exists for this Make. Please select it from the dropdown or choose a different name.`
                };
            }

            // Verify Make exists and trace back to Type
            const { data: make, error: makeError } = await this.supabaseClient
                .from('equipment_makes')
                .select('id, name, type_id, is_active, equipment_types:type_id(id, name, is_active)')
                .eq('id', makeId)
                .is('deleted_at', null)
                .maybeSingle();

            if (makeError) {
                throw makeError;
            }

            if (!make) {
                return {
                    valid: false,
                    error: 'Selected Make does not exist. Please refresh and try again.'
                };
            }

            if (!make.is_active) {
                return {
                    valid: false,
                    error: `Make "${make.name}" is inactive. Please select an active Make.`
                };
            }

            // Verify PM Frequency exists and is active
            const { data: pmFreq, error: pmError } = await this.supabaseClient
                .from('pm_frequencies')
                .select('id, name, code, days, is_active')
                .eq('id', pmFrequencyId)
                .maybeSingle();

            if (pmError) {
                throw pmError;
            }

            if (!pmFreq) {
                return {
                    valid: false,
                    error: 'Selected PM Frequency does not exist. Please select a valid PM Frequency.'
                };
            }

            if (!pmFreq.is_active) {
                return {
                    valid: false,
                    error: `PM Frequency "${pmFreq.name}" is inactive. Please select an active PM Frequency.`
                };
            }

            return { valid: true };
        } catch (error) {
            console.error('Error validating Model creation:', error);
            return {
                valid: false,
                error: `Validation error: ${error.message}`
            };
        }
    }

    /**
     * Validate asset has complete MMD hierarchy
     * @param {string} modelId - ID of the Model
     * @returns {Promise<{valid: boolean, error?: string, pmFrequency?: object}>}
     */
    async validateAssetMMDHierarchy(modelId) {
        try {
            if (!modelId || modelId.trim() === '') {
                return {
                    valid: false,
                    error: 'Asset must have a Model selected. Please complete the MMD hierarchy (Type → Make → Model).'
                };
            }

            // Verify Model exists and has PM Frequency
            const { data: model, error } = await this.supabaseClient
                .from('equipment_models')
                .select(`
                    id,
                    name,
                    pm_frequency_id,
                    pm_frequencies:pm_frequency_id(id, name, code, days),
                    equipment_makes:make_id(
                        id,
                        name,
                        type_id,
                        equipment_types:type_id(id, name)
                    )
                `)
                .eq('id', modelId)
                .is('deleted_at', null)
                .maybeSingle();

            if (error) {
                throw error;
            }

            if (!model) {
                return {
                    valid: false,
                    error: 'Selected Model does not exist. Please refresh and select a valid Model.'
                };
            }

            if (!model.pm_frequency_id) {
                return {
                    valid: false,
                    error: `Model "${model.name}" is missing PM Frequency. This is a data integrity issue. Please contact an administrator.`
                };
            }

            if (!model.pm_frequencies) {
                return {
                    valid: false,
                    error: `PM Frequency for Model "${model.name}" is invalid. Please contact an administrator.`
                };
            }

            return {
                valid: true,
                pmFrequency: model.pm_frequencies,
                model: {
                    id: model.id,
                    name: model.name
                },
                make: model.equipment_makes,
                type: model.equipment_makes?.equipment_types
            };
        } catch (error) {
            console.error('Error validating asset MMD hierarchy:', error);
            return {
                valid: false,
                error: `Validation error: ${error.message}`
            };
        }
    }

    /**
     * Get PM Frequency for an asset (with override support)
     * @param {string} assetId - ID of the asset
     * @returns {Promise<{frequency: object, source: string, reason?: string}>}
     */
    async getAssetPMFrequency(assetId) {
        try {
            const { data: asset, error } = await this.supabaseClient
                .from('assets')
                .select(`
                    id,
                    model_id,
                    pm_frequency_override,
                    pm_frequency_override_id,
                    pm_frequency_override_reason,
                    equipment_models:model_id(
                        id,
                        pm_frequency_id,
                        pm_frequencies:pm_frequency_id(id, name, code, days)
                    )
                `)
                .eq('id', assetId)
                .is('deleted_at', null)
                .maybeSingle();

            if (error) {
                throw error;
            }

            if (!asset) {
                throw new Error('Asset not found');
            }

            // Admin override takes precedence
            if (asset.pm_frequency_override && asset.pm_frequency_override_id) {
                const { data: overrideFreq, error: freqError } = await this.supabaseClient
                    .from('pm_frequencies')
                    .select('*')
                    .eq('id', asset.pm_frequency_override_id)
                    .maybeSingle();

                if (freqError) {
                    throw freqError;
                }

                if (!overrideFreq) {
                    throw new Error('Override PM Frequency not found');
                }

                return {
                    frequency: overrideFreq,
                    source: 'override',
                    reason: asset.pm_frequency_override_reason,
                    modelId: asset.model_id
                };
            }

            // Default: Inherit from Model
            if (asset.equipment_models?.pm_frequencies) {
                return {
                    frequency: asset.equipment_models.pm_frequencies,
                    source: 'model',
                    modelId: asset.model_id
                };
            }

            throw new Error('Asset has no PM Frequency assigned (Model missing PM Frequency)');
        } catch (error) {
            console.error('Error getting asset PM frequency:', error);
            throw error;
        }
    }

    /**
     * Check if user can override PM Frequency (admin only)
     * @returns {Promise<boolean>}
     */
    async canOverridePMFrequency() {
        try {
            // Check if current user is admin
            // This would typically check user_profiles.role
            const { data: { user } } = await this.supabaseClient.auth.getUser();
            if (!user) return false;

            const { data: profile } = await this.supabaseClient
                .from('user_profiles')
                .select('role')
                .eq('id', user.id)
                .maybeSingle();

            return profile?.role === 'admin';
        } catch (error) {
            console.error('Error checking admin status:', error);
            return false;
        }
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.MMDValidation = MMDValidation;
}

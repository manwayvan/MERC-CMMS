/**
 * MMD Reference Data Manager
 * Single source of truth for MMD Types, Makes, and Models
 * Implements caching and invalidation for performance
 */
class MMDReferenceManager {
    constructor(supabaseClient) {
        this.supabaseClient = supabaseClient;
        this.cache = {
            types: null,
            makes: null,
            models: null,
            frequencies: null,
            lastFetched: null,
            cacheKey: 'mmd_reference_cache'
        };
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.listeners = new Set(); // For cache invalidation notifications
    }

    /**
     * Load all MMD reference data with caching
     */
    async loadAll() {
        // Check cache first
        if (this.isCacheValid()) {
            return this.cache;
        }

        try {
            const [typesResult, makesResult, modelsResult, frequenciesResult] = await Promise.all([
                this.supabaseClient
                    .from('equipment_types')
                    .select('id, name, description, is_active, created_at, updated_at')
                    .is('deleted_at', null)
                    .order('name'),
                this.supabaseClient
                    .from('equipment_makes')
                    .select('id, name, type_id, description, is_active, created_at, updated_at')
                    .is('deleted_at', null)
                    .order('name'),
                this.supabaseClient
                    .from('equipment_models')
                    .select('id, name, make_id, pm_frequency_id, depreciation_profile_id, description, is_active, created_at, updated_at')
                    .is('deleted_at', null)
                    .order('name'),
                this.supabaseClient
                    .from('pm_frequencies')
                    .select('id, name, code, days, description, is_active, sort_order')
                    .eq('is_active', true)
                    .order('sort_order')
            ]);

            this.cache = {
                types: typesResult.data || [],
                makes: makesResult.data || [],
                models: modelsResult.data || [],
                frequencies: frequenciesResult.data || [],
                lastFetched: Date.now()
            };

            // Store in localStorage for persistence across page loads
            try {
                localStorage.setItem(this.cache.cacheKey, JSON.stringify({
                    data: this.cache,
                    timestamp: Date.now()
                }));
            } catch (e) {
                console.warn('Could not store cache in localStorage:', e);
            }

            return this.cache;
        } catch (error) {
            console.error('Error loading MMD reference data:', error);
            // Try to load from localStorage as fallback
            return this.loadFromLocalStorage();
        }
    }

    /**
     * Check if cache is still valid
     */
    isCacheValid() {
        if (!this.cache.lastFetched) {
            // Try to load from localStorage
            const stored = this.loadFromLocalStorage();
            if (stored) {
                this.cache = stored;
                return true;
            }
            return false;
        }

        const age = Date.now() - this.cache.lastFetched;
        return age < this.cacheTimeout;
    }

    /**
     * Load from localStorage fallback
     */
    loadFromLocalStorage() {
        try {
            const stored = localStorage.getItem(this.cache.cacheKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                const age = Date.now() - parsed.timestamp;
                if (age < this.cacheTimeout) {
                    return parsed.data;
                }
            }
        } catch (e) {
            console.warn('Could not load cache from localStorage:', e);
        }
        return null;
    }

    /**
     * Invalidate cache (call when MMD data changes)
     * Static method to invalidate all instances
     */
    static invalidateAllCaches() {
        try {
            localStorage.removeItem('mmd_reference_cache');
        } catch (e) {
            console.warn('Could not clear localStorage cache:', e);
        }
        // Notify all global instances
        if (window.mmdAssetFormManager && window.mmdAssetFormManager.referenceManager) {
            window.mmdAssetFormManager.referenceManager.invalidateCache();
        }
    }

    /**
     * Invalidate cache (call when MMD data changes)
     */
    invalidateCache() {
        this.cache = {
            types: null,
            makes: null,
            models: null,
            frequencies: null,
            lastFetched: null
        };
        try {
            localStorage.removeItem(this.cache.cacheKey);
        } catch (e) {
            console.warn('Could not clear localStorage cache:', e);
        }
        // Notify all listeners
        this.listeners.forEach(listener => {
            try {
                listener();
            } catch (e) {
                console.error('Error notifying cache listener:', e);
            }
        });
    }

    /**
     * Register a listener for cache invalidation
     */
    onCacheInvalidate(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    /**
     * Get Types only
     */
    async getTypes() {
        const data = await this.loadAll();
        return data.types.filter(t => t.is_active !== false);
    }

    /**
     * Get Makes for a specific Type
     */
    async getMakesForType(typeId) {
        const data = await this.loadAll();
        return data.makes.filter(m => 
            m.type_id === typeId && m.is_active !== false
        );
    }

    /**
     * Get Models for a specific Make
     */
    async getModelsForMake(makeId) {
        const data = await this.loadAll();
        return data.models.filter(m => 
            m.make_id === makeId && m.is_active !== false
        );
    }

    /**
     * Get PM Frequency for a Model
     */
    async getPMFrequencyForModel(modelId) {
        const data = await this.loadAll();
        const model = data.models.find(m => m.id === modelId);
        if (!model || !model.pm_frequency_id) {
            return null;
        }
        return data.frequencies.find(f => f.id === model.pm_frequency_id);
    }

    /**
     * Validate MMD hierarchy completeness
     */
    async validateHierarchy(typeId, makeId, modelId) {
        const data = await this.loadAll();
        
        if (!typeId) {
            return { valid: false, error: 'Equipment Type is required' };
        }

        const type = data.types.find(t => t.id === typeId);
        if (!type || type.is_active === false) {
            return { valid: false, error: 'Selected Equipment Type is invalid or inactive' };
        }

        if (!makeId) {
            return { valid: false, error: 'Make is required' };
        }

        const make = data.makes.find(m => m.id === makeId && m.type_id === typeId);
        if (!make || make.is_active === false) {
            return { valid: false, error: 'Selected Make is invalid or inactive' };
        }

        if (!modelId) {
            return { valid: false, error: 'Model is required' };
        }

        const model = data.models.find(m => m.id === modelId && m.make_id === makeId);
        if (!model || model.is_active === false) {
            return { valid: false, error: 'Selected Model is invalid or inactive' };
        }

        if (!model.pm_frequency_id) {
            return { valid: false, error: 'Selected Model is missing PM Frequency' };
        }

        return { valid: true, model, make, type };
    }
}

// Export globally
if (typeof window !== 'undefined') {
    window.MMDReferenceManager = MMDReferenceManager;
}

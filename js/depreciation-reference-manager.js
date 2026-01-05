/**
 * Depreciation Reference Manager
 * Single source of truth for depreciation profiles with caching
 */
class DepreciationReferenceManager {
    constructor(supabaseClient) {
        this.supabaseClient = supabaseClient;
        this.cache = {
            profiles: null,
            lastFetched: null,
            cacheKey: 'depreciation_profiles_cache'
        };
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.listeners = new Set();
    }

    async loadAll() {
        // Check cache first
        if (this.isCacheValid()) {
            return this.cache;
        }

        try {
            const { data, error } = await this.supabaseClient
                .from('depreciation_profiles')
                .select('id, name, method, useful_life_years, salvage_value, start_date_rule, description, is_active')
                .is('deleted_at', null)
                .eq('is_active', true)
                .order('name');

            if (error) throw error;

            this.cache = {
                profiles: data || [],
                lastFetched: Date.now()
            };

            // Store in localStorage
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
            console.error('Error loading depreciation profiles:', error);
            return this.loadFromLocalStorage();
        }
    }

    isCacheValid() {
        if (!this.cache.lastFetched) {
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

    invalidateCache() {
        this.cache = {
            profiles: null,
            lastFetched: null
        };
        try {
            localStorage.removeItem(this.cache.cacheKey);
        } catch (e) {
            console.warn('Could not clear localStorage cache:', e);
        }
        this.listeners.forEach(listener => {
            try {
                listener();
            } catch (e) {
                console.error('Error notifying cache listener:', e);
            }
        });
    }

    static invalidateAllCaches() {
        try {
            localStorage.removeItem('depreciation_profiles_cache');
        } catch (e) {
            console.warn('Could not clear localStorage cache:', e);
        }
        if (window.depreciationReferenceManager) {
            window.depreciationReferenceManager.invalidateCache();
        }
    }

    onCacheInvalidate(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    async getProfiles() {
        const data = await this.loadAll();
        return data.profiles || [];
    }

    async getProfileById(profileId) {
        const profiles = await this.getProfiles();
        return profiles.find(p => p.id === profileId);
    }
}

if (typeof window !== 'undefined') {
    window.DepreciationReferenceManager = DepreciationReferenceManager;
}

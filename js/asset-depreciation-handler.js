/**
 * Asset Depreciation Handler
 * Manages depreciation profile selection and calculation preview
 */
class AssetDepreciationHandler {
    constructor(supabaseClient) {
        this.supabaseClient = supabaseClient;
        this.profiles = [];
        this.referenceManager = null;
    }

    async init() {
        // Initialize reference manager
        if (!window.DepreciationReferenceManager) {
            console.error('DepreciationReferenceManager not loaded');
            return;
        }
        this.referenceManager = new window.DepreciationReferenceManager(this.supabaseClient);
        
        // Load profiles
        await this.loadProfiles();
        
        // Populate dropdown
        this.populateProfileDropdown();
    }

    async loadProfiles() {
        try {
            this.profiles = await this.referenceManager.getProfiles();
        } catch (error) {
            console.error('Error loading depreciation profiles:', error);
            this.profiles = [];
        }
    }

    populateProfileDropdown() {
        const select = document.getElementById('depreciation-profile-select');
        if (!select) return;

        // Clear existing options except first
        select.innerHTML = '<option value="">-- Select Profile --</option>';

        // Add profiles
        this.profiles.forEach(profile => {
            const option = document.createElement('option');
            option.value = profile.id;
            option.textContent = `${profile.name} (${this.formatMethod(profile.method)}, ${profile.useful_life_years} years)`;
            select.appendChild(option);
        });
    }

    formatMethod(method) {
        const methods = {
            'straight-line': 'Straight-Line',
            'declining-balance': 'Declining Balance',
            'sum-of-years': 'Sum of Years',
            'units-of-production': 'Units of Production',
            'none': 'None'
        };
        return methods[method] || method;
    }

    async updatePreview() {
        const profileId = document.getElementById('depreciation-profile-select')?.value;
        const purchaseCost = parseFloat(document.getElementById('purchase-cost')?.value) || 0;
        const purchaseDate = document.getElementById('purchase-date')?.value;
        const previewDiv = document.getElementById('depreciation-preview');

        if (!previewDiv) return;

        if (!profileId) {
            previewDiv.innerHTML = '<p class="text-slate-500">Select a depreciation profile and enter purchase cost to see calculation.</p>';
            return;
        }

        if (!purchaseCost || purchaseCost <= 0) {
            previewDiv.innerHTML = '<p class="text-amber-600">Enter purchase cost to see depreciation calculation.</p>';
            return;
        }

        const profile = this.profiles.find(p => p.id === profileId);
        if (!profile) {
            previewDiv.innerHTML = '<p class="text-red-600">Profile not found.</p>';
            return;
        }

        // Calculate preview (simplified client-side calculation)
        const salvageValue = profile.salvage_value || 0;
        const usefulLife = profile.useful_life_years;
        const annualDepreciation = (purchaseCost - salvageValue) / usefulLife;
        const monthlyDepreciation = annualDepreciation / 12;

        // Calculate for current date
        let yearsElapsed = 0;
        if (purchaseDate) {
            const startDate = new Date(purchaseDate);
            const today = new Date();
            yearsElapsed = (today - startDate) / (1000 * 60 * 60 * 24 * 365.25);
            if (yearsElapsed < 0) yearsElapsed = 0;
            if (yearsElapsed > usefulLife) yearsElapsed = usefulLife;
        }

        const accumulatedDepreciation = annualDepreciation * yearsElapsed;
        const currentValue = Math.max(purchaseCost - accumulatedDepreciation, salvageValue);
        const remainingLife = Math.max(usefulLife - yearsElapsed, 0);

        // Display preview
        previewDiv.innerHTML = `
            <div class="space-y-2">
                <div class="flex justify-between">
                    <span class="font-semibold">Profile:</span>
                    <span>${profile.name}</span>
                </div>
                <div class="flex justify-between">
                    <span>Method:</span>
                    <span>${this.formatMethod(profile.method)}</span>
                </div>
                <div class="flex justify-between">
                    <span>Useful Life:</span>
                    <span>${usefulLife} years</span>
                </div>
                <div class="flex justify-between">
                    <span>Salvage Value:</span>
                    <span>$${salvageValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <hr class="border-blue-300">
                <div class="flex justify-between">
                    <span class="font-semibold">Annual Depreciation:</span>
                    <span class="font-semibold">$${annualDepreciation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div class="flex justify-between">
                    <span>Monthly Depreciation:</span>
                    <span>$${monthlyDepreciation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                ${purchaseDate ? `
                <hr class="border-blue-300">
                <div class="flex justify-between">
                    <span>Years Elapsed:</span>
                    <span>${yearsElapsed.toFixed(2)}</span>
                </div>
                <div class="flex justify-between">
                    <span>Accumulated Depreciation:</span>
                    <span>$${accumulatedDepreciation.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div class="flex justify-between">
                    <span class="font-semibold">Current Book Value:</span>
                    <span class="font-semibold">$${currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div class="flex justify-between">
                    <span>Remaining Life:</span>
                    <span>${remainingLife.toFixed(2)} years</span>
                </div>
                ` : ''}
            </div>
        `;
    }

    async getCalculatedDepreciation(assetId) {
        if (!assetId) return null;

        try {
            const { data, error } = await this.supabaseClient.rpc('calculate_asset_depreciation', {
                asset_id_param: assetId
            });

            if (error) throw error;
            return data && data.length > 0 ? data[0] : null;
        } catch (error) {
            console.error('Error calculating depreciation:', error);
            return null;
        }
    }

    setProfileForAsset(assetId, profileId) {
        const select = document.getElementById('depreciation-profile-select');
        if (select) {
            select.value = profileId || '';
            this.updatePreview();
        }
    }
}

// Global function for backward compatibility
async function updateDepreciationPreview() {
    if (window.assetDepreciationHandler) {
        await window.assetDepreciationHandler.updatePreview();
    }
}

if (typeof window !== 'undefined') {
    window.AssetDepreciationHandler = AssetDepreciationHandler;
    window.updateDepreciationPreview = updateDepreciationPreview;
}

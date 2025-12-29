// Asset UI - Rendering and UI Components

let currentView = 'list';
let currentFilters = {};
let currentSearchTerm = '';

// Render assets (grid or list view)
function renderAssets(assetsToRender = assets) {
    if (currentView === 'grid') {
        renderAssetsGrid(assetsToRender);
    } else {
        renderAssetsList(assetsToRender);
    }
    updateStatistics();
}

// Render assets in grid view
function renderAssetsGrid(assetsToRender) {
    const grid = document.getElementById('assets-grid');
    const listView = document.getElementById('assets-list');
    
    grid.classList.remove('hidden');
    listView.classList.add('hidden');

    if (assetsToRender.length === 0) {
        grid.innerHTML = `
            <div class="col-span-3 text-center py-12">
                <i class="fas fa-box-open text-6xl text-slate-300 mb-4"></i>
                <h3 class="text-xl font-semibold text-slate-700 mb-2">No assets found</h3>
                <p class="text-slate-500 mb-6">Add your first asset to get started</p>
                <button onclick="showAddAssetModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
                    <i class="fas fa-plus mr-2"></i>Add Asset
                </button>
            </div>
        `;
        return;
    }

    grid.innerHTML = assetsToRender.map(asset => createAssetCard(asset)).join('');
}

// Create asset card HTML
function createAssetCard(asset) {
    const compliance = getComplianceStatus(asset.next_maintenance);
    const pmInfo = getPMScheduleInfo(asset);
    const daysUntil = calculateDaysUntil(asset.next_maintenance);
    
    const statusColors = {
        active: 'bg-green-100 text-green-800',
        maintenance: 'bg-yellow-100 text-yellow-800',
        retired: 'bg-gray-100 text-gray-800'
    };

    const complianceColors = {
        overdue: 'border-red-500 bg-red-50',
        urgent: 'border-orange-500 bg-orange-50',
        attention: 'border-yellow-500 bg-yellow-50',
        compliant: 'border-green-500 bg-white'
    };

    return `
        <div class="asset-card ${complianceColors[compliance.status]} border-2 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div class="flex justify-between items-start mb-4">
                <div class="flex-1">
                    <h3 class="text-xl font-bold text-slate-800 mb-1">${asset.name || 'Unnamed Asset'}</h3>
                    <p class="text-sm text-slate-600">${asset.id || ''}</p>
                </div>
                <span class="px-3 py-1 rounded-full text-xs font-medium ${statusColors[asset.status] || 'bg-gray-100 text-gray-800'}">
                    ${asset.status ? asset.status.charAt(0).toUpperCase() + asset.status.slice(1) : 'Unknown'}
                </span>
            </div>

            <div class="space-y-2 mb-4 text-sm">
                ${asset.customers?.name ? `
                    <div class="flex items-center text-slate-600">
                        <i class="fas fa-building w-5 text-slate-400"></i>
                        <span>${asset.customers.name}</span>
                    </div>
                ` : ''}
                ${asset.locations?.name ? `
                    <div class="flex items-center text-slate-600">
                        <i class="fas fa-map-marker-alt w-5 text-slate-400"></i>
                        <span>${asset.locations.name}</span>
                    </div>
                ` : ''}
                ${asset.serial_number ? `
                    <div class="flex items-center text-slate-600">
                        <i class="fas fa-barcode w-5 text-slate-400"></i>
                        <span>${asset.serial_number}</span>
                    </div>
                ` : ''}
                ${asset.category ? `
                    <div class="flex items-center text-slate-600">
                        <i class="fas fa-tag w-5 text-slate-400"></i>
                        <span class="capitalize">${asset.category}</span>
                    </div>
                ` : ''}
            </div>

            <div class="border-t border-slate-200 pt-4 mb-4">
                <div class="grid grid-cols-2 gap-2 text-sm">
                    <div>
                        <span class="text-slate-500">Last PM:</span>
                        <span class="font-medium">${formatDate(asset.last_maintenance)}</span>
                    </div>
                    <div>
                        <span class="text-slate-500">Next PM:</span>
                        <span class="font-medium">${formatDate(asset.next_maintenance)}</span>
                    </div>
                </div>
                ${daysUntil !== null ? `
                    <div class="mt-2 text-sm">
                        <span class="text-slate-500">Days until PM:</span>
                        <span class="font-bold ${daysUntil < 0 ? 'text-red-600' : daysUntil <= 7 ? 'text-orange-600' : 'text-green-600'}">
                            ${daysUntil < 0 ? `${Math.abs(daysUntil)} days OVERDUE` : `${daysUntil} days`}
                        </span>
                    </div>
                ` : ''}
            </div>

            <div class="flex items-center justify-between mb-4">
                <span class="px-3 py-1 rounded-full text-xs font-medium bg-${compliance.color}-100 text-${compliance.color}-800">
                    ${compliance.text}
                </span>
                <span class="text-xs text-slate-600">
                    ${pmInfo.text}
                </span>
            </div>

            <div class="flex gap-2">
                <button onclick="viewAssetDetails('${asset.id}')" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors">
                    <i class="fas fa-eye mr-1"></i>View
                </button>
                <button onclick="showEditAssetModal('${asset.id}')" class="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-3 py-2 rounded text-sm transition-colors">
                    <i class="fas fa-edit mr-1"></i>Edit
                </button>
                <button onclick="showPMScheduleModal('${asset.id}')" class="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm transition-colors">
                    <i class="fas fa-calendar-check mr-1"></i>PM
                </button>
            </div>
        </div>
    `;
}

// Update statistics
function updateStatistics() {
    const total = assets.length;
    const compliant = assets.filter(a => getComplianceStatus(a.next_maintenance).status === 'compliant').length;
    const attention = assets.filter(a => getComplianceStatus(a.next_maintenance).status === 'attention').length;
    const overdue = assets.filter(a => getComplianceStatus(a.next_maintenance).status === 'overdue').length;

    document.getElementById('total-assets').textContent = total;
    document.getElementById('compliant-assets').textContent = compliant;
    document.getElementById('attention-assets').textContent = attention;
    document.getElementById('overdue-assets').textContent = overdue;
}

// Switch view
function switchView(view) {
    currentView = view;
    document.getElementById('grid-view-btn').classList.toggle('active', view === 'grid');
    document.getElementById('list-view-btn').classList.toggle('active', view === 'list');
    renderAssets(filterAndSearchAssets());
}

// Filter and search assets
function filterAndSearchAssets() {
    let filtered = [...assets];
    
    if (currentSearchTerm) {
        filtered = searchAssets(currentSearchTerm);
    }
    
    if (Object.keys(currentFilters).length > 0) {
        filtered = filterAssets(currentFilters);
    }
    
    return filtered;
}
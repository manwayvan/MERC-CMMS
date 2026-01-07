// MERC-CMMS Enterprise JavaScript Application
// Comprehensive functionality for Medical Device Management System

// Utility function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize Supabase Client
const supabaseUrl = typeof CONFIG !== 'undefined' && CONFIG.SUPABASE_URL
    ? CONFIG.SUPABASE_URL
    : 'https://hmdemsbqiqlqcggwblvl.supabase.co';
const supabaseKey = typeof CONFIG !== 'undefined' && CONFIG.SUPABASE_ANON_KEY
    ? CONFIG.SUPABASE_ANON_KEY
    : 'sb_publishable_Z9oNxTGDCCz3EZnh6NqySg_QzF6amCN';
let supabaseClient = null;
let supabaseInitPromise = null;

const MOCK_DATA_ENABLED = typeof CONFIG !== 'undefined' && CONFIG.ENABLE_MOCK_DATA === true;

function shouldUseMockData() {
    return MOCK_DATA_ENABLED;
}

function loadSupabaseClient() {
    // Prioritize shared client to avoid multiple instances
    if (window.sharedSupabaseClient) {
        supabaseClient = window.sharedSupabaseClient;
        return Promise.resolve(supabaseClient);
    }

    if (supabaseClient) {
        return Promise.resolve(supabaseClient);
    }

    if (supabaseInitPromise) {
        return supabaseInitPromise;
    }

    supabaseInitPromise = new Promise((resolve) => {
        const initialize = () => {
            if (window.supabase) {
                supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
                resolve(supabaseClient);
            } else {
                console.warn('Supabase library failed to load.');
                resolve(null);
            }
        };

        if (window.supabase) {
            initialize();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.async = true;
        script.onload = initialize;
        script.onerror = () => {
            console.warn('Unable to load Supabase library.');
            resolve(null);
        };
        document.head.appendChild(script);
    });

    return supabaseInitPromise;
}

// Global Application State
const AppState = {
    currentPage: '',
    assets: [],
    technicians: [],
    workOrders: [],
    workOrderTypes: [],
    compliance: {},
    user: {
        name: 'System Admin',
        role: 'Super Administrator',
        avatar: 'SA'
    }
};

// Mock Data Generation
const MockData = {
    // Generate mock assets data
    generateAssets: () => {
        const categories = ['diagnostic', 'therapeutic', 'surgical', 'monitoring', 'imaging', 'laboratory'];
        const statuses = ['active', 'inactive', 'maintenance', 'retired'];
        const locations = ['ICU', 'Emergency', 'Surgery', 'Radiology', 'Laboratory', 'Cardiology', 'Oncology', 'Pediatrics'];
        const manufacturers = ['GE Healthcare', 'Siemens', 'Philips', 'Medtronic', 'Johnson & Johnson', 'Abbott', 'Stryker'];

        const assets = [];
        for (let i = 1; i <= 50; i++) {
            const category = categories[Math.floor(Math.random() * categories.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const location = locations[Math.floor(Math.random() * locations.length)];
            const manufacturer = manufacturers[Math.floor(Math.random() * manufacturers.length)];

            assets.push({
                id: `AST-${String(i).padStart(4, '0')}`,
                name: `${category.charAt(0).toUpperCase() + category.slice(1)} Equipment ${i}`,
                category: category,
                status: status,
                location: location,
                manufacturer: manufacturer,
                model: `Model-${Math.floor(Math.random() * 900) + 100}`,
                serial_number: `SN${Math.floor(Math.random() * 900000) + 100000}`,
                warranty_expiry: new Date(2025 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
                purchase_date: new Date(2020 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
                purchase_cost: Math.floor(Math.random() * 500000) + 10000,
                last_maintenance: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
                next_maintenance: new Date(2025, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1).toISOString(),
                compliance_status: Math.random() > 0.1 ? 'compliant' : 'needs-attention'
            });
        }
        return assets;
    },

    // Generate mock work orders data
    generateWorkOrders: () => {
        const types = ['preventive_maintenance', 'corrective_maintenance', 'inspection', 'calibration'];
        const priorities = ['critical', 'high', 'medium', 'low'];
        const statuses = ['open', 'in-progress', 'completed', 'cancelled'];
        const technicians = ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Lisa Wilson', 'Robert Brown'];

        const workOrders = [];
        for (let i = 1; i <= 100; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            const priority = priorities[Math.floor(Math.random() * priorities.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const technician = technicians[Math.floor(Math.random() * technicians.length)];

            workOrders.push({
                id: `WO-${String(i).padStart(4, '0')}`,
                asset_id: `AST-${String(Math.floor(Math.random() * 50) + 1).padStart(4, '0')}`,
                type: type,
                priority: priority,
                status: status,
                technician: technician,
                due_date: new Date(2025, Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1).toISOString(),
                created_date: new Date(2024, 11, Math.floor(Math.random() * 31) + 1).toISOString(),
                completed_date: status === 'completed' ? new Date(2024, 11, Math.floor(Math.random() * 31) + 1).toISOString() : null,
                estimated_hours: Math.floor(Math.random() * 8) + 1,
                actual_hours: status === 'completed' ? Math.floor(Math.random() * 8) + 1 : 0,
                description: `${type} for medical equipment`,
                cost: Math.floor(Math.random() * 5000) + 500
            });
        }
        return workOrders;
    },

    // Generate compliance data
    generateComplianceData: () => {
        return {
            fda: {
                name: 'FDA 21 CFR Part 820',
                status: 'compliant',
                percentage: 98.5,
                last_audit: new Date(2024, 10, 15).toISOString(),
                next_audit: new Date(2025, 4, 15).toISOString()
            },
            jointCommission: {
                name: 'Joint Commission Standards',
                status: 'compliant',
                percentage: 97.8,
                last_audit: new Date(2024, 9, 20).toISOString(),
                next_audit: new Date(2025, 3, 20).toISOString()
            },
            iso13485: {
                name: 'ISO 13485',
                status: 'needs-attention',
                percentage: 89.2,
                last_audit: new Date(2024, 8, 10).toISOString(),
                next_audit: new Date(2025, 2, 10).toISOString()
            },
            osha: {
                name: 'OSHA Compliance',
                status: 'compliant',
                percentage: 99.1,
                last_audit: new Date(2024, 11, 5).toISOString(),
                next_audit: new Date(2025, 6, 5).toISOString()
            }
        };
    }
};

const DefaultWorkOrderTypes = [
    { code: 'preventive_maintenance', label: 'Preventive Maintenance', description: 'Scheduled maintenance tasks', sort_order: 1 },
    { code: 'corrective_maintenance', label: 'Corrective Maintenance', description: 'Unplanned repairs and fixes', sort_order: 2 },
    { code: 'inspection', label: 'Inspection', description: 'Safety and compliance inspections', sort_order: 3 },
    { code: 'calibration', label: 'Calibration', description: 'Calibration and verification', sort_order: 4 },
    { code: 'installation', label: 'Installation', description: 'New equipment install work', sort_order: 5 },
    { code: 'repair', label: 'Repair', description: 'Component replacement or repair', sort_order: 6 }
];

const DefaultPartsCatalog = [
    { name: 'Filter' },
    { name: 'Fuse' },
    { name: 'Battery Pack' },
    { name: 'O-Ring Kit' },
    { name: 'Sensor Module' },
    { name: 'Valve Assembly' }
];

async function fetchWorkOrderTypes() {
    if (!supabaseClient) {
        return null;
    }

    const { data, error } = await supabaseClient
        .from('work_order_types')
        .select('id, code, label, description, is_active, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('label', { ascending: true });

    if (error) {
        console.error('Error loading work order types:', error);
        return null;
    }

    return data || [];
}

// Dashboard Management
const DashboardManager = {
    async init() {
        await this.loadDashboardData();
        this.updateStatistics();
        this.updateCharts();
        this.updateRecentActivity();
        ChartManager.initializeCharts();
    },

    async loadDashboardData() {
        // Ensure Supabase client is loaded
        await loadSupabaseClient();
        
        // Load assets
        await this.loadAssets();
        
        // Load work orders
        await this.loadWorkOrders();
        
        // Load customers if needed
        if (!AppState.customers || AppState.customers.length === 0) {
            await this.loadCustomers();
        }
    },
    
    async loadAssets() {
        // Try to get Supabase client from various sources
        let client = supabaseClient;
        if (!client && window.sharedSupabaseClient) {
            client = window.sharedSupabaseClient;
            supabaseClient = client;
        }
        
        if (!client) {
            console.warn('Supabase client not available, using empty assets');
            AppState.assets = [];
            return;
        }
        
        try {
            console.log('Loading assets from Supabase...');
            const { data, error } = await client
                .from('assets')
                .select('*')
                .is('deleted_at', null) // Only load assets that haven't been soft deleted
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('Error loading assets:', error);
                AppState.assets = [];
            } else {
                AppState.assets = data || [];
                console.log(`Loaded ${AppState.assets.length} assets (excluding soft-deleted)`);
            }
        } catch (err) {
            console.error('Error loading assets:', err);
            AppState.assets = [];
        }
    },
    
    async loadWorkOrders() {
        // Try to get Supabase client from various sources
        let client = supabaseClient;
        if (!client && window.sharedSupabaseClient) {
            client = window.sharedSupabaseClient;
            supabaseClient = client;
        }
        
        if (!client) {
            console.warn('Supabase client not available, using empty work orders');
            AppState.workOrders = [];
            return;
        }
        
        try {
            console.log('Loading work orders from Supabase...');
            // Load work orders with related data
            const { data, error } = await client
                .from('work_orders')
                .select('*')
                .order('created_date', { ascending: false })
                .limit(1000); // Limit to recent 1000 work orders
            
            if (error) {
                console.error('Error loading work orders:', error);
                AppState.workOrders = [];
            } else {
                AppState.workOrders = data || [];
                console.log(`Loaded ${AppState.workOrders.length} work orders`);
                
                // Calculate total costs for each work order
                for (const wo of AppState.workOrders) {
                    let totalCost = 0;
                    
                    // Get parts costs
                    try {
                        const { data: partsData } = await client
                            .from('work_order_parts')
                            .select('quantity, unit_cost')
                            .eq('work_order_id', wo.id);
                        
                        if (partsData) {
                            partsData.forEach(part => {
                                totalCost += (parseFloat(part.quantity || 0) * parseFloat(part.unit_cost || 0));
                            });
                        }
                    } catch (e) {
                        console.warn('Error loading parts for work order:', wo.id, e);
                    }
                    
                    // Get labor costs
                    try {
                        const { data: laborData } = await client
                            .from('work_order_labor')
                            .select('hours, hourly_rate')
                            .eq('work_order_id', wo.id);
                        
                        if (laborData) {
                            laborData.forEach(labor => {
                                totalCost += (parseFloat(labor.hours || 0) * parseFloat(labor.hourly_rate || 0));
                            });
                        }
                    } catch (e) {
                        console.warn('Error loading labor for work order:', wo.id, e);
                    }
                    
                    // Get additional costs
                    try {
                        const { data: additionalCostsData } = await client
                            .from('work_order_additional_costs')
                            .select('amount')
                            .eq('work_order_id', wo.id);
                        
                        if (additionalCostsData) {
                            additionalCostsData.forEach(cost => {
                                totalCost += parseFloat(cost.amount || 0);
                            });
                        }
                    } catch (e) {
                        console.warn('Error loading additional costs for work order:', wo.id, e);
                    }
                    
                    wo.cost = totalCost;
                }
            }
        } catch (err) {
            console.error('Error loading work orders:', err);
            AppState.workOrders = [];
        }
    },

    async loadCustomers() {
        // Try to get Supabase client from various sources
        let client = supabaseClient;
        if (!client && window.sharedSupabaseClient) {
            client = window.sharedSupabaseClient;
            supabaseClient = client;
        }
        
        if (!client) {
            AppState.customers = [];
            return;
        }

        const { data, error } = await client
            .from('customers')
            .select('id, name, created_at')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Error loading customers:', error);
            AppState.customers = [];
        } else {
            AppState.customers = data || [];
        }
    },

    updateStatistics() {
        const assets = AppState.assets || [];
        const workOrders = AppState.workOrders || [];
        
        console.log('Updating statistics. Assets:', assets.length, 'Work Orders:', workOrders.length);
        
        // Total Assets
        const totalAssets = assets.length;
        const totalAssetsEl = document.getElementById('total-assets');
        if (totalAssetsEl) {
            totalAssetsEl.textContent = totalAssets.toLocaleString();
        }

        // Active Work Orders
        const activeWorkOrders = workOrders.filter(wo => 
            wo.status === 'open' || wo.status === 'in-progress'
        ).length;
        const overdueWorkOrders = workOrders.filter(wo => {
            if (!wo.due_date || wo.status === 'closed' || wo.status === 'completed') return false;
            return new Date(wo.due_date) < new Date();
        }).length;
        const activeWOEl = document.getElementById('active-work-orders');
        if (activeWOEl) {
            activeWOEl.textContent = activeWorkOrders;
        }
        // Update overdue count in subtitle if element exists
        const overdueEl = activeWOEl?.parentElement?.querySelector('.text-amber-600');
        if (overdueEl && overdueWorkOrders > 0) {
            overdueEl.innerHTML = `<i class="fas fa-exclamation-triangle mr-1"></i>${overdueWorkOrders} overdue`;
        }

        // Compliance Rate
        const totalAssetsWithCompliance = assets.filter(a => a.compliance_status).length;
        const compliantAssets = assets.filter(a => 
            a.compliance_status === 'compliant' || a.compliance_status === 'in-compliance'
        ).length;
        const complianceRate = totalAssetsWithCompliance > 0 
            ? ((compliantAssets / totalAssetsWithCompliance) * 100).toFixed(1)
            : 0;
        const complianceEl = document.getElementById('compliance-rate');
        if (complianceEl) {
            complianceEl.textContent = complianceRate + '%';
        }

        // Maintenance Due
        const maintenanceDue = assets.filter(a => {
            if (!a.next_maintenance) return false;
            const nextMaintenance = new Date(a.next_maintenance);
            const today = new Date();
            return nextMaintenance <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000); // Within 30 days
        }).length;
        const criticalMaintenance = assets.filter(a => {
            if (!a.next_maintenance) return false;
            return new Date(a.next_maintenance) < new Date();
        }).length;
        const maintenanceEl = document.getElementById('maintenance-due');
        if (maintenanceEl) {
            maintenanceEl.textContent = maintenanceDue;
        }
        // Update critical count in subtitle if element exists
        const criticalEl = maintenanceEl?.parentElement?.querySelector('.text-red-600');
        if (criticalEl && criticalMaintenance > 0) {
            criticalEl.innerHTML = `<i class="fas fa-clock mr-1"></i>${criticalMaintenance} critical`;
        }
    },

    updateCharts() {
        // Update asset distribution chart
        if (ChartManager.charts.assetDistribution) {
            const assets = AppState.assets || [];
            const categoryCounts = {};
            
            assets.forEach(asset => {
                // Try multiple possible category fields
                let category = 'Uncategorized';
                if (asset.category) {
                    category = asset.category;
                } else if (asset.category_id) {
                    category = asset.category_id;
                } else if (asset.equipment_type_id) {
                    // Try to get equipment type name if we have it
                    category = asset.equipment_type_id;
                } else if (asset.type) {
                    category = asset.type;
                }
                categoryCounts[category] = (categoryCounts[category] || 0) + 1;
            });

            const chartData = Object.entries(categoryCounts).map(([name, value]) => ({
                value,
                name: name.charAt(0).toUpperCase() + name.slice(1)
            }));

            ChartManager.charts.assetDistribution.setOption({
                series: [{
                    data: chartData.length > 0 ? chartData : [{ value: 0, name: 'No Data' }]
                }]
            });
        }

        // Update work order trends chart
        if (ChartManager.charts.workOrderTrends) {
            const workOrders = AppState.workOrders || [];
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            
            const monthlyData = {};
            const months = [];
            for (let i = 5; i >= 0; i--) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
                months.push(monthKey);
                monthlyData[monthKey] = {
                    preventive: 0,
                    corrective: 0,
                    inspection: 0,
                    calibration: 0
                };
            }

            workOrders.forEach(wo => {
                if (!wo.created_date) return;
                const woDate = new Date(wo.created_date);
                if (woDate < sixMonthsAgo) return;
                
                const monthKey = woDate.toLocaleDateString('en-US', { month: 'short' });
                const woType = (wo.type || '').toLowerCase();
                
                if (monthlyData[monthKey]) {
                    // Match work order types more accurately
                    if (woType.includes('preventive') || woType.includes('pm') || woType === 'preventive_maintenance') {
                        monthlyData[monthKey].preventive++;
                    } else if (woType.includes('corrective') || woType.includes('repair') || woType === 'corrective_maintenance') {
                        monthlyData[monthKey].corrective++;
                    } else if (woType.includes('inspection') || woType === 'inspection') {
                        monthlyData[monthKey].inspection++;
                    } else if (woType.includes('calibration') || woType === 'calibration') {
                        monthlyData[monthKey].calibration++;
                    } else {
                        // Default uncategorized work orders to corrective
                        monthlyData[monthKey].corrective++;
                    }
                }
            });

            ChartManager.charts.workOrderTrends.setOption({
                xAxis: { data: months },
                series: [
                    {
                        name: 'Preventive',
                        data: months.map(m => monthlyData[m].preventive)
                    },
                    {
                        name: 'Corrective',
                        data: months.map(m => monthlyData[m].corrective)
                    },
                    {
                        name: 'Inspection',
                        data: months.map(m => monthlyData[m].inspection)
                    },
                    {
                        name: 'Calibration',
                        data: months.map(m => monthlyData[m].calibration)
                    }
                ]
            });
        }

        // Update maintenance cost chart
        if (ChartManager.charts.maintenanceCost) {
            const workOrders = AppState.workOrders || [];
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            
            const monthlyCosts = {};
            const months = [];
            for (let i = 5; i >= 0; i--) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
                months.push(monthKey);
                monthlyCosts[monthKey] = 0;
            }

            workOrders.forEach(wo => {
                if (!wo.created_date) return;
                const woDate = new Date(wo.created_date);
                if (woDate < sixMonthsAgo) return;
                
                const monthKey = woDate.toLocaleDateString('en-US', { month: 'short' });
                const cost = parseFloat(wo.cost || 0);
                
                if (monthlyCosts[monthKey] !== undefined) {
                    monthlyCosts[monthKey] += cost;
                }
            });

            ChartManager.charts.maintenanceCost.setOption({
                xAxis: { data: months },
                series: [{
                    data: months.map(m => Math.round(monthlyCosts[m] || 0))
                }]
            });
        }

        // Update equipment status heatmap
        if (ChartManager.charts.equipmentStatus) {
            const assets = AppState.assets || [];
            const locationStatus = {};
            
            assets.forEach(asset => {
                // Try multiple possible location fields
                let location = 'Unknown';
                if (asset.location) {
                    location = asset.location;
                } else if (asset.location_id) {
                    location = asset.location_id;
                } else if (asset.location_name) {
                    location = asset.location_name;
                }
                const status = asset.status || 'unknown';
                
                if (!locationStatus[location]) {
                    locationStatus[location] = { active: 0, maintenance: 0, down: 0 };
                }
                
                if (status === 'active') {
                    locationStatus[location].active++;
                } else if (status === 'maintenance') {
                    locationStatus[location].maintenance++;
                } else if (status === 'inactive' || status === 'retired') {
                    locationStatus[location].down++;
                }
            });

            const locations = Object.keys(locationStatus).slice(0, 5); // Top 5 locations
            const statuses = ['Active', 'Maintenance', 'Down'];
            const heatmapData = [];
            
            locations.forEach((loc, locIdx) => {
                statuses.forEach((stat, statIdx) => {
                    const count = locationStatus[loc][stat.toLowerCase()] || 0;
                    heatmapData.push([locIdx, statIdx, count]);
                });
            });

            ChartManager.charts.equipmentStatus.setOption({
                xAxis: { data: locations },
                yAxis: { data: statuses },
                series: [{
                    data: heatmapData
                }]
            });
        }
    },

    updateRecentActivity() {
        const activityContainer = document.getElementById('recent-activity');
        if (!activityContainer) return;

        const activities = [];
        const workOrders = AppState.workOrders || [];
        const assets = AppState.assets || [];

        // Get recent work orders (sorted by created_date)
        const sortedWorkOrders = [...workOrders].sort((a, b) => {
            const dateA = a.created_date ? new Date(a.created_date) : new Date(0);
            const dateB = b.created_date ? new Date(b.created_date) : new Date(0);
            return dateB - dateA;
        });
        
        sortedWorkOrders.slice(0, 5).forEach(wo => {
            const asset = assets.find(a => a.id === wo.asset_id);
            const assetName = asset ? (asset.name || 'Unknown Asset') : 'Unknown Asset';
            const date = wo.created_date ? new Date(wo.created_date).toLocaleDateString() : 'Unknown date';
            
            activities.push({
                type: 'work-order',
                icon: 'fa-clipboard-list',
                color: 'text-blue-600',
                message: `Work order ${wo.id || 'N/A'} created for ${assetName}`,
                date: wo.created_date || new Date().toISOString(),
                status: wo.status
            });
        });

        // Get recent assets (sorted by created_at)
        const sortedAssets = [...assets].sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
            const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
            return dateB - dateA;
        });
        
        sortedAssets.slice(0, 3).forEach(asset => {
            const date = asset.created_at ? new Date(asset.created_at).toLocaleDateString() : 'Unknown date';
            activities.push({
                type: 'asset',
                icon: 'fa-heartbeat',
                color: 'text-green-600',
                message: `Asset ${asset.name || 'Unnamed'} added`,
                date: asset.created_at || new Date().toISOString(),
                status: asset.status
            });
        });

        // Sort by date (most recent first) and take top 10
        activities.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB - dateA;
        });

        if (activities.length === 0) {
            activityContainer.innerHTML = `
                <div class="text-center py-8 text-slate-500">
                    <i class="fas fa-inbox text-4xl mb-4"></i>
                    <p>No recent activity</p>
                </div>
            `;
            return;
        }

        activityContainer.innerHTML = activities.slice(0, 10).map(activity => `
            <div class="flex items-start space-x-3 p-3 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-shadow">
                <div class="flex-shrink-0 mt-1">
                    <i class="fas ${activity.icon} ${activity.color}"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm text-slate-800">${activity.message}</p>
                    <p class="text-xs text-slate-500 mt-1">${activity.date}</p>
                </div>
                ${activity.status ? `<span class="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-600">${activity.status}</span>` : ''}
            </div>
        `).join('');
    }
};

// Chart Initialization and Management
const ChartManager = {
    charts: {},

    // Initialize all charts on the current page
    initializeCharts: () => {
        const currentPage = AppState.currentPage;

        if (currentPage === 'dashboard') {
            ChartManager.initDashboardCharts();
        } else if (currentPage === 'assets') {
            ChartManager.initAssetCharts();
        } else if (currentPage === 'workorders') {
            ChartManager.initWorkOrderCharts();
        } else if (currentPage === 'compliance') {
            ChartManager.initComplianceCharts();
        }
    },

    // Initialize dashboard charts
    initDashboardCharts: () => {
        // Asset Distribution Donut Chart
        const assetChartEl = document.getElementById('asset-distribution-chart');
        if (assetChartEl) {
            const assetChart = echarts.init(assetChartEl);
        const assetOption = {
            tooltip: { trigger: 'item' },
            legend: { bottom: '0%', left: 'center' },
            series: [{
                type: 'pie',
                radius: ['40%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
                label: { show: false, position: 'center' },
                emphasis: { label: { show: true, fontSize: 20, fontWeight: 'bold' } },
                labelLine: { show: false },
                data: [
                    { value: 456, name: 'Diagnostic' },
                    { value: 892, name: 'Therapeutic' },
                    { value: 234, name: 'Surgical' },
                    { value: 567, name: 'Monitoring' },
                    { value: 189, name: 'Imaging' },
                    { value: 509, name: 'Laboratory' }
                ],
                color: ['#2563eb', '#059669', '#dc2626', '#d97706', '#7c3aed', '#0891b2']
            }]
        };
        assetChart.setOption(assetOption);
        ChartManager.charts.assetDistribution = assetChart;
        }

        // Work Order Trends Line Chart
        const trendsChartEl = document.getElementById('work-order-trends-chart');
        if (trendsChartEl) {
            const trendsChart = echarts.init(trendsChartEl);
        const trendsOption = {
            tooltip: { trigger: 'axis' },
            legend: { data: ['Preventive', 'Corrective', 'Inspection', 'Calibration'] },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            },
            yAxis: { type: 'value' },
            series: [
                {
                    name: 'Preventive',
                    type: 'line',
                    stack: 'Total',
                    data: [45, 52, 48, 61, 58, 67],
                    itemStyle: { color: '#2563eb' }
                },
                {
                    name: 'Corrective',
                    type: 'line',
                    stack: 'Total',
                    data: [23, 28, 25, 32, 29, 35],
                    itemStyle: { color: '#dc2626' }
                },
                {
                    name: 'Inspection',
                    type: 'line',
                    stack: 'Total',
                    data: [18, 22, 20, 25, 23, 28],
                    itemStyle: { color: '#059669' }
                },
                {
                    name: 'Calibration',
                    type: 'line',
                    stack: 'Total',
                    data: [12, 15, 13, 18, 16, 20],
                    itemStyle: { color: '#d97706' }
                }
            ]
        };
        trendsChart.setOption(trendsOption);
        ChartManager.charts.workOrderTrends = trendsChart;
        }

        // Compliance Gauge Charts
        ChartManager.initComplianceGauges();

        // Maintenance Cost Chart
        const costChartEl = document.getElementById('maintenance-cost-chart');
        if (costChartEl) {
            const costChart = echarts.init(costChartEl);
        const costOption = {
            tooltip: { trigger: 'axis' },
            xAxis: {
                type: 'category',
                data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
            },
            yAxis: { type: 'value' },
            series: [{
                data: [45000, 52000, 48000, 61000, 58000, 67000],
                type: 'bar',
                itemStyle: { color: '#2563eb' }
            }]
        };
        costChart.setOption(costOption);
        ChartManager.charts.maintenanceCost = costChart;
        }

        // Equipment Status Heatmap
        const heatmapChartEl = document.getElementById('equipment-status-heatmap');
        if (heatmapChartEl) {
            const heatmapChart = echarts.init(heatmapChartEl);
        const heatmapOption = {
            tooltip: { position: 'top' },
            grid: { height: '50%', top: '10%' },
            xAxis: {
                type: 'category',
                data: ['ICU', 'Emergency', 'Surgery', 'Radiology', 'Lab'],
                splitArea: { show: true }
            },
            yAxis: {
                type: 'category',
                data: ['Active', 'Maintenance', 'Down'],
                splitArea: { show: true }
            },
            visualMap: {
                min: 0,
                max: 100,
                calculable: true,
                orient: 'horizontal',
                left: 'center',
                bottom: '15%',
                inRange: { color: ['#e8f4fd', '#2563eb'] }
            },
            series: [{
                name: 'Equipment Status',
                type: 'heatmap',
                data: [
                    [0, 0, 85], [0, 1, 12], [0, 2, 3],
                    [1, 0, 78], [1, 1, 18], [1, 2, 4],
                    [2, 0, 92], [2, 1, 6], [2, 2, 2],
                    [3, 0, 88], [3, 1, 10], [3, 2, 2],
                    [4, 0, 95], [4, 1, 4], [4, 2, 1]
                ],
                label: { show: true }
            }]
        };
        heatmapChart.setOption(heatmapOption);
        ChartManager.charts.equipmentStatus = heatmapChart;
        }
    },

    // Initialize compliance gauges
    initComplianceGauges: () => {
        const gaugeData = [
            { name: 'FDA', value: 98.5 },
            { name: 'Joint Commission', value: 97.8 },
            { name: 'ISO 13485', value: 89.2 },
            { name: 'OSHA', value: 99.1 }
        ];

        gaugeData.forEach((item, index) => {
            const gaugeElement = document.getElementById(`${item.name.toLowerCase().replace(' ', '-')}-gauge`);
            if (gaugeElement) {
                const gauge = echarts.init(gaugeElement);
                const option = {
                    series: [{
                        type: 'gauge',
                        startAngle: 180,
                        endAngle: 0,
                        min: 0,
                        max: 100,
                        splitNumber: 5,
                        itemStyle: { color: item.value > 95 ? '#059669' : item.value > 85 ? '#d97706' : '#dc2626' },
                        progress: { show: true, width: 8 },
                        pointer: { show: false },
                        axisLine: { lineStyle: { width: 8 } },
                        axisTick: { distance: -15, splitNumber: 2, lineStyle: { width: 2, color: '#999' } },
                        splitLine: { distance: -20, length: 14, lineStyle: { width: 3, color: '#999' } },
                        axisLabel: { distance: -20, color: '#999', fontSize: 10 },
                        anchor: { show: false },
                        title: { show: false },
                        detail: { valueAnimation: true, width: '60%', lineHeight: 40, borderRadius: 8, offsetCenter: [0, '-15%'], fontSize: 16, fontWeight: 'bolder', formatter: '{value}%', color: 'inherit' },
                        data: [{ value: item.value }]
                    }]
                };
                gauge.setOption(option);
                ChartManager.charts[`${item.name.toLowerCase().replace(' ', '')}Gauge`] = gauge;
            }
        });
    },

    // Initialize asset page charts
    initAssetCharts: () => {
        // No specific charts for assets page, table-based interface
    },

    // Initialize work order page charts
    initWorkOrderCharts: () => {
        if (!window.echarts) {
            console.warn('ECharts unavailable: skipping work order charts.');
            return;
        }

        const chartEl = document.getElementById('technician-performance-chart');
        if (!chartEl) {
            return;
        }

        const performanceChart = echarts.init(chartEl);
        const performanceOption = {
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            legend: { data: ['Completed', 'In Progress', 'Overdue'] },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: {
                type: 'category',
                data: ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Lisa Wilson', 'Robert Brown']
            },
            yAxis: { type: 'value' },
            series: [
                {
                    name: 'Completed',
                    type: 'bar',
                    stack: 'total',
                    data: [45, 38, 42, 35, 40],
                    itemStyle: { color: '#059669' }
                },
                {
                    name: 'In Progress',
                    type: 'bar',
                    stack: 'total',
                    data: [8, 12, 6, 15, 9],
                    itemStyle: { color: '#d97706' }
                },
                {
                    name: 'Overdue',
                    type: 'bar',
                    stack: 'total',
                    data: [2, 3, 1, 4, 2],
                    itemStyle: { color: '#dc2626' }
                }
            ]
        };
        performanceChart.setOption(performanceOption);
        ChartManager.charts.technicianPerformance = performanceChart;
    },

    // Initialize compliance page charts
    initComplianceCharts: () => {
        // Compliance gauges are initialized separately

        // Compliance Trend Chart
        const trendChart = echarts.init(document.getElementById('compliance-trend-chart'));
        const trendOption = {
            tooltip: { trigger: 'axis' },
            legend: { data: ['FDA', 'Joint Commission', 'ISO 13485', 'OSHA'] },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            },
            yAxis: { type: 'value', min: 80, max: 100 },
            series: [
                {
                    name: 'FDA',
                    type: 'line',
                    data: [95, 96, 97, 98, 98.5, 99, 98.5, 98.8, 99.1, 98.5, 98.7, 98.5],
                    itemStyle: { color: '#2563eb' }
                },
                {
                    name: 'Joint Commission',
                    type: 'line',
                    data: [94, 95, 96, 97, 97.5, 98, 97.8, 98.2, 98.5, 97.8, 97.8, 97.8],
                    itemStyle: { color: '#059669' }
                },
                {
                    name: 'ISO 13485',
                    type: 'line',
                    data: [85, 86, 87, 88, 89, 90, 89.2, 89.5, 89.8, 89.2, 89.2, 89.2],
                    itemStyle: { color: '#d97706' }
                },
                {
                    name: 'OSHA',
                    type: 'line',
                    data: [96, 97, 98, 98.5, 99, 99.2, 99.1, 99.3, 99.5, 99.1, 99.1, 99.1],
                    itemStyle: { color: '#7c3aed' }
                }
            ]
        };
        trendChart.setOption(trendOption);
        ChartManager.charts.complianceTrend = trendChart;

        // Cost Analysis Chart
        const costChart = echarts.init(document.getElementById('cost-analysis-chart'));
        const costOption = {
            tooltip: { trigger: 'item' },
            series: [{
                type: 'pie',
                radius: '70%',
                data: [
                    { value: 125000, name: 'Preventive Maintenance' },
                    { value: 85000, name: 'Corrective Maintenance' },
                    { value: 45000, name: 'Parts & Materials' },
                    { value: 35000, name: 'External Services' }
                ],
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }]
        };
        costChart.setOption(costOption);
        ChartManager.charts.costAnalysis = costChart;

        // Budget Comparison Chart
        const budgetChart = echarts.init(document.getElementById('budget-comparison-chart'));
        const budgetOption = {
            tooltip: { trigger: 'axis' },
            legend: { data: ['Budget', 'Actual'] },
            xAxis: {
                type: 'category',
                data: ['Q1', 'Q2', 'Q3', 'Q4']
            },
            yAxis: { type: 'value' },
            series: [
                {
                    name: 'Budget',
                    type: 'bar',
                    data: [300000, 320000, 340000, 360000],
                    itemStyle: { color: '#2563eb' }
                },
                {
                    name: 'Actual',
                    type: 'bar',
                    data: [285000, 335000, 325000, 380000],
                    itemStyle: { color: '#059669' }
                }
            ]
        };
        budgetChart.setOption(budgetOption);
        ChartManager.charts.budgetComparison = budgetChart;
    },

    // Resize charts on window resize
    resizeCharts: () => {
        Object.values(ChartManager.charts).forEach(chart => {
            if (chart && chart.resize) {
                chart.resize();
            }
        });
    }
};

// Asset Management Class
class AssetManager {
    constructor() {
        this.assets = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
    }

    // Load and display assets
    async loadAssets() {
        if (!supabaseClient) {
            console.warn('Loading demo asset data.');
            this.assets = MockData.generateAssets();
            showToast('Database unavailable, using demo assets', 'warning');
        } else {
            const { data, error } = await supabaseClient
                .from('assets')
                .select('*')
                .is('deleted_at', null); // Only load assets that haven't been soft deleted

            if (error) {
                console.error('Error loading assets:', error);
                this.assets = MockData.generateAssets();
                showToast('Database error, using demo assets', 'warning');
            } else {
                this.assets = data;
            }
        }

        this.renderAssetTable();
        this.updateStatistics();
    }

    // Render asset table with pagination
    renderAssetTable() {
        const tableBody = document.getElementById('asset-table-body');
        if (!tableBody) return;

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedAssets = this.assets.slice(startIndex, endIndex);

        tableBody.innerHTML = paginatedAssets.map(asset => `
            <tr class="table-row">
                <td class="px-6 py-4 whitespace-nowrap">
                    <input type="checkbox" class="rounded border-slate-300">
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">${asset.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">${asset.name}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ${asset.category.charAt(0).toUpperCase() + asset.category.slice(1)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${asset.location}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getStatusColor(asset.status)}">
                        <span class="status-indicator status-${asset.status}"></span>
                        ${asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${new Date(asset.warranty_expiry).toLocaleDateString()}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button class="text-blue-600 hover:text-blue-900 mr-3" onclick="assetManager.viewAsset('${asset.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="text-green-600 hover:text-green-900 mr-3" onclick="assetManager.editAsset('${asset.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-900" onclick="assetManager.deleteAsset('${asset.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        this.renderPagination();
    }

    // Add pagination controls
    renderPagination() {
        const totalPages = Math.ceil(this.assets.length / this.itemsPerPage);
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) return;

        paginationContainer.innerHTML = `
            <div class="flex justify-center mt-4">
                ${Array.from({ length: totalPages }, (_, i) => `
                    <button
                        class="px-3 py-1 mx-1 rounded ${this.currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}"
                        onclick="assetManager.goToPage(${i + 1})"
                    >
                        ${i + 1}
                    </button>
                `).join('')}
            </div>
        `;
    }

    // Navigate to a specific page
    goToPage(page) {
        this.currentPage = page;
        this.renderAssetTable();
    }

    // Get status color class
    getStatusColor(status) {
        const colors = {
            active: 'bg-green-100 text-green-800',
            inactive: 'bg-gray-100 text-gray-800',
            maintenance: 'bg-amber-100 text-amber-800',
            retired: 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    }

    // Update asset statistics
    updateStatistics() {
        const stats = {
            total: this.assets.length,
            active: this.assets.filter(a => a.status === 'active').length,
            maintenance: this.assets.filter(a => a.status === 'maintenance').length,
            overdue: this.assets.filter(a => new Date(a.next_maintenance) < new Date()).length
        };

        const statElements = document.querySelectorAll('.text-2xl.font-bold');
        if (statElements.length >= 4) {
            statElements[0].textContent = stats.total.toLocaleString();
            statElements[1].textContent = stats.active.toLocaleString();
            statElements[2].textContent = stats.maintenance.toLocaleString();
            statElements[3].textContent = stats.overdue.toLocaleString();
        }
    }

    // Setup event listeners
    setupEventListeners() {
        const searchInput = document.getElementById('asset-search');
        if (searchInput) {
            let debounceTimer;
            searchInput.addEventListener('input', (event) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this.handleSearch(event);
                }, 300);
            });
        }

        const filterChips = document.querySelectorAll('.filter-chip');
        filterChips.forEach(chip => {
            chip.addEventListener('click', () => this.handleCategoryFilter(chip));
        });
    }

    // Handle search
    handleSearch(event) {
        const query = event.target.value.toLowerCase();
        const filteredAssets = this.assets.filter(asset =>
            asset.name.toLowerCase().includes(query) ||
            asset.id.toLowerCase().includes(query) ||
            asset.location.toLowerCase().includes(query) ||
            asset.serial_number.toLowerCase().includes(query)
        );
        this.renderFilteredAssets(filteredAssets);
    }

    // Handle category filter
    handleCategoryFilter(chip) {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        const category = chip.dataset.category;
        let filteredAssets = this.assets;

        if (category !== 'all') {
            filteredAssets = this.assets.filter(asset => asset.category === category);
        }

        this.renderFilteredAssets(filteredAssets);
    }

    // Render filtered assets
    renderFilteredAssets(assets) {
        const tableBody = document.getElementById('asset-table-body');
        if (!tableBody) return;

        const displayAssets = assets.slice(0, this.itemsPerPage);

        tableBody.innerHTML = displayAssets.map(asset => `
            <tr class="table-row">
                <td class="px-6 py-4 whitespace-nowrap">
                    <input type="checkbox" class="rounded border-slate-300">
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">${asset.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">${asset.name}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ${asset.category.charAt(0).toUpperCase() + asset.category.slice(1)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${asset.location}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getStatusColor(asset.status)}">
                        <span class="status-indicator status-${asset.status}"></span>
                        ${asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${new Date(asset.warranty_expiry).toLocaleDateString()}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button class="text-blue-600 hover:text-blue-900 mr-3" onclick="assetManager.viewAsset('${asset.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="text-green-600 hover:text-green-900 mr-3" onclick="assetManager.editAsset('${asset.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-900" onclick="assetManager.deleteAsset('${asset.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        const showingElement = document.getElementById('showing-end');
        if (showingElement) {
            showingElement.textContent = Math.min(this.itemsPerPage, assets.length);
        }
        const totalElement = document.getElementById('total-assets');
        if (totalElement) {
            totalElement.textContent = assets.length.toLocaleString();
        }
    }

    // Asset actions
    viewAsset(assetId) {
        showToast('Viewing asset details', 'info');
    }

    editAsset(assetId) {
        showToast('Opening asset editor', 'info');
    }

    async deleteAsset(assetId) {
        if (confirm('Are you sure you want to delete this asset?')) {
            if (!supabaseClient) {
                this.assets = this.assets.filter(asset => asset.id !== assetId);
                this.renderAssetTable();
                this.updateStatistics();
                showToast('Asset deleted (demo mode)', 'success');
                return;
            }

            const { error } = await supabaseClient
                .from('assets')
                .delete()
                .eq('id', assetId);

            if (error) {
                console.error('Error deleting asset:', error);
                showToast('Failed to delete asset', 'error');
            } else {
                this.assets = this.assets.filter(asset => asset.id !== assetId);
                this.renderAssetTable();
                this.updateStatistics();
                showToast('Asset deleted successfully', 'success');
            }
        }
    }
}

// Initialize AssetManager
const assetManager = new AssetManager();

// Work Order Management Functions
const WorkOrderManager = {
    pendingAssetId: null,
    currentWorkOrderId: null,
    // Temporary storage for create mode
    createModeData: {
        labor: [],
        additionalCosts: [],
        links: [],
        files: []
    },
    partsUsedItems: [],
    // Initialize work order management
    init: async () => {
        await WorkOrderManager.loadAssets();
        await WorkOrderManager.loadTechnicians();
        // Load assets first so we can map asset names to work orders
        await WorkOrderManager.loadAssets();
        await WorkOrderManager.loadWorkOrderTypes();
        await WorkOrderManager.loadWorkOrders();
        WorkOrderManager.renderWorkOrders();
        WorkOrderManager.renderRecentWorkOrders();
        WorkOrderManager.updateSummaryCounts();
        WorkOrderManager.setupEventListeners();
        WorkOrderManager.initView();
        await WorkOrderManager.loadWorkOrderAssets();
        // Populate filter dropdowns
        await WorkOrderManager.populateFilters();
        WorkOrderManager.setupSearchAndFilters();
    },

    getTechnicianLabel: (technicianId) => {
        if (!technicianId) return 'Unassigned';
        const label = WorkOrderManager.technicianMap?.get(technicianId);
        return label || 'Unassigned';
    },

    toDatabaseWorkOrderType: (type) => {
        if (!type) return '';
        return type
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '_');
    },

    loadAssets: async () => {
        if (!supabaseClient) {
            if (shouldUseMockData()) {
                AppState.assets = MockData.generateAssets();
            } else {
                AppState.assets = [];
                showToast('Supabase is not connected. Assets could not be loaded.', 'warning');
            }
            return;
        }

        const { data, error } = await supabaseClient
            .from('assets')
            .select('id, name, category, serial_number')
            .is('deleted_at', null) // Only load assets that haven't been soft deleted
            .order('name', { ascending: true });

        if (error) {
            console.error('Error loading assets:', error);
            if (shouldUseMockData()) {
                AppState.assets = MockData.generateAssets();
            } else {
                AppState.assets = [];
                showToast('Unable to load assets from Supabase. Check RLS/policies and credentials.', 'warning');
            }
            return;
        }

        AppState.assets = data || [];
    },

    loadTechnicians: async () => {
        if (!supabaseClient) {
            if (shouldUseMockData()) {
                const mockTechnicians = ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Lisa Wilson', 'Robert Brown'];
                AppState.technicians = mockTechnicians.map((name, index) => ({
                    id: `demo-tech-${index + 1}`,
                    full_name: name
                }));
            } else {
                AppState.technicians = [];
                showToast('Supabase is not connected. Technicians could not be loaded.', 'warning');
            }
            return;
        }

        const { data, error } = await supabaseClient
            .from('technicians')
            .select('id, full_name')
            .eq('is_active', true)
            .order('full_name', { ascending: true });

        if (error) {
            console.error('Error loading technicians:', error);
            AppState.technicians = [];
            showToast('Unable to load technicians from Supabase. Check RLS/policies and credentials.', 'warning');
            return;
        }

        AppState.technicians = data || [];
    },

    loadWorkOrders: async () => {
        if (!supabaseClient) {
            if (shouldUseMockData()) {
                AppState.workOrders = MockData.generateWorkOrders();
            } else {
                AppState.workOrders = [];
                showToast('Supabase is not connected. Work orders could not be loaded.', 'warning');
            }
            return;
        }

        // Start with essential fields only - don't include assigned_technician_id initially
        const selectFields = [
            'id',
            'asset_id',
            'type',
            'priority',
            'status',
            'due_date',
            'created_date',
            'completed_date',
            'estimated_hours',
            'actual_hours',
            'cost',
            'description'
        ];

        let { data, error } = await supabaseClient
            .from('work_orders')
            .select(selectFields.join(', '))
            .order('created_date', { ascending: false });

        if (error) {
            console.error('Error loading work orders:', error);
            // If error is about missing column, try with minimal fields
            if (/column.*does not exist|42703/i.test(error.message || '')) {
                const essentialFields = ['id', 'asset_id', 'type', 'priority', 'status', 'due_date', 'created_date', 'description'];
                ({ data, error } = await supabaseClient
                    .from('work_orders')
                    .select(essentialFields.join(', '))
                    .order('created_date', { ascending: false }));
            }
            
            if (error) {
                if (shouldUseMockData()) {
                    AppState.workOrders = MockData.generateWorkOrders();
                } else {
                    AppState.workOrders = [];
                    showToast('Unable to load work orders from Supabase. Check RLS/policies and credentials.', 'warning');
                }
                return;
            }
        }

        // Try to get assigned_technician_id separately if column exists
        // This is optional - if it doesn't exist, we'll just show "Unassigned"
        let technicianIdMap = new Map();
        if (data && data.length > 0) {
            try {
                const { data: techData, error: techError } = await supabaseClient
                    .from('work_orders')
                    .select('id, assigned_technician_id')
                    .in('id', data.map(wo => wo.id));
                
                if (!techError && techData) {
                    techData.forEach(wo => {
                        if (wo.assigned_technician_id) {
                            technicianIdMap.set(wo.id, wo.assigned_technician_id);
                        }
                    });
                }
            } catch (e) {
                // Column doesn't exist, that's fine - we'll just not show technician names
                console.warn('assigned_technician_id column does not exist in work_orders table');
            }
        }

        // Map technician ID to name for display
        const technicianMap = new Map(AppState.technicians.map(tech => [tech.id, tech.full_name]));
        
        // Map asset IDs to asset names for display - ensure assets are loaded
        let assetMap = new Map();
        if (AppState.assets && AppState.assets.length > 0) {
            assetMap = new Map(AppState.assets.map(asset => [asset.id, asset.name || asset.id]));
        } else {
            // If assets not loaded, try to load them now
            console.warn('Assets not loaded, attempting to load now for work order display');
            await WorkOrderManager.loadAssets();
            if (AppState.assets && AppState.assets.length > 0) {
                assetMap = new Map(AppState.assets.map(asset => [asset.id, asset.name || asset.id]));
            }
        }
        
        AppState.workOrders = (data || []).map(order => {
            const techId = technicianIdMap.get(order.id);
            const assetName = assetMap.get(order.asset_id) || order.asset_id || 'Unknown Asset';
            return {
                ...order,
                assigned_technician_id: techId || null,
                technician: techId 
                    ? (technicianMap.get(techId) || 'Unassigned')
                    : 'Unassigned',
                asset_name: assetName
            };
        });
    },

    loadWorkOrderAssets: async () => {
        // Ensure assets are loaded before populating options
        if (AppState.assets.length === 0) {
            await WorkOrderManager.loadAssets();
        }
        WorkOrderManager.populateAssetOptions();
    },

    // Render work orders in kanban board
    renderWorkOrders: () => {
        const filteredOrders = WorkOrderManager.getFilteredWorkOrders();
        const columns = ['open', 'progress', 'completed', 'cancelled'];

        columns.forEach(status => {
            const container = document.getElementById(`${status === 'progress' ? 'progress' : status}-workorders`);
            if (!container) return;

            const workOrders = filteredOrders.filter(wo => {
                const woStatus = wo.status === 'completed' ? 'closed' : 
                                wo.status === 'cancelled' ? 'incomplete' : 
                                wo.status;
                return (status === 'open' && (woStatus === 'open' || woStatus === 'in-progress')) ||
                       (status === 'progress' && wo.status === 'in-progress') ||
                       (status === 'completed' && (wo.status === 'completed' || woStatus === 'closed')) ||
                       (status === 'cancelled' && (wo.status === 'cancelled' || woStatus === 'incomplete'));
            });

            container.innerHTML = workOrders.map(wo => `
                <div class="workorder-card priority-${wo.priority}" onclick="WorkOrderManager.viewWorkOrder('${wo.id}')">
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="font-medium text-slate-800">${wo.id}</h4>
                        <span class="text-xs px-2 py-1 rounded-full ${WorkOrderManager.getPriorityColor(wo.priority)}">
                            ${wo.priority.toUpperCase()}
                        </span>
                    </div>
                    <p class="text-sm text-slate-600 mb-2">${WorkOrderManager.formatWorkOrderType(wo.type)}</p>
                    <p class="text-xs text-slate-500 mb-3">Asset: ${wo.asset_name || wo.asset_id || 'Unknown Asset'}</p>
                    <div class="flex justify-between items-center">
                        <div class="flex items-center">
                            <div class="technician-avatar">${WorkOrderManager.getTechnicianInitials(wo.technician)}</div>
                            <span class="text-xs text-slate-500">${wo.technician || 'Unassigned'}</span>
                        </div>
                        <span class="text-xs text-slate-500">${WorkOrderManager.formatDate(wo.due_date)}</span>
                    </div>
                </div>
            `).join('');

            // Update count
            const countElement = document.getElementById(`${status === 'progress' ? 'progress' : status}-count`);
            if (countElement) {
                countElement.textContent = workOrders.length;
            }
        });
    },

    // Get priority color class
    getPriorityColor: (priority) => {
        const colors = {
            critical: 'bg-red-100 text-red-800',
            high: 'bg-amber-100 text-amber-800',
            medium: 'bg-blue-100 text-blue-800',
            low: 'bg-gray-100 text-gray-800'
        };
        return colors[priority] || 'bg-gray-100 text-gray-800';
    },

    // Render recent work orders table
    renderRecentWorkOrders: () => {
        const tableBody = document.getElementById('recent-workorders-table');
        if (!tableBody) return;

        const recentWorkOrders = AppState.workOrders
            .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
            .slice(0, 10);

        tableBody.innerHTML = recentWorkOrders.map(wo => `
            <tr class="border-b border-slate-100 hover:bg-slate-50">
                <td class="py-3 px-4 text-sm font-medium text-slate-900">${wo.id}</td>
                <td class="py-3 px-4 text-sm text-slate-600">${wo.asset_name || wo.asset_id || 'Unknown Asset'}</td>
                <td class="py-3 px-4 text-sm text-slate-600">${WorkOrderManager.formatWorkOrderType(wo.type)}</td>
                <td class="py-3 px-4">
                    <span class="text-xs px-2 py-1 rounded-full ${WorkOrderManager.getPriorityColor(wo.priority)}">
                        ${wo.priority.toUpperCase()}
                    </span>
                </td>
                <td class="py-3 px-4 text-sm text-slate-600">${wo.technician || 'Unassigned'}</td>
                <td class="py-3 px-4 text-sm text-slate-600">${WorkOrderManager.formatDate(wo.due_date)}</td>
                <td class="py-3 px-4">
                    <span class="text-xs px-2 py-1 rounded-full ${WorkOrderManager.getStatusColor(wo.status)}">
                        ${wo.status === 'completed' ? 'CLOSED' : wo.status === 'cancelled' ? 'INCOMPLETE' : wo.status === 'open' ? 'OPEN' : wo.status.toUpperCase()}
                    </span>
                </td>
            </tr>
        `).join('');
    },

    // Get status color class
    getStatusColor: (status) => {
        const colors = {
            open: 'bg-blue-100 text-blue-800',
            'in-progress': 'bg-amber-100 text-amber-800',
            completed: 'bg-green-100 text-green-800',
            closed: 'bg-green-100 text-green-800',
            cancelled: 'bg-gray-100 text-gray-800',
            incomplete: 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    },

    // Setup event listeners
    setupEventListeners: () => {
        // Unified work order form handler
        const workOrderForm = document.getElementById('workorder-form');
        if (workOrderForm) {
            workOrderForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const mode = document.getElementById('workorder-mode')?.value || 'create';
                if (mode === 'create') {
                await WorkOrderManager.handleCreateWorkOrder();
                } else {
                    await WorkOrderManager.handleUpdateWorkOrder();
                }
            });
        }

        const workOrderModal = document.getElementById('workorder-modal');
        if (workOrderModal) {
            workOrderModal.addEventListener('click', (event) => {
                if (event.target === workOrderModal) {
                    WorkOrderManager.closeWorkOrderModal();
                }
            });
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                hideCreateWorkOrderModal();
                WorkOrderManager.closeWorkOrderModal();
            }
        });
    },

    // View work order (using unified modal)
    viewWorkOrder: async (workOrderId) => {
        const workOrder = AppState.workOrders.find(wo => wo.id === workOrderId);
        if (!workOrder) {
            showToast('Work order not found', 'error');
            return;
        }

        // Open unified modal in view mode
        WorkOrderManager.openWorkOrderModal('view', workOrderId);
        WorkOrderManager.currentWorkOrderId = workOrderId;

        // Set title with work order ID and asset name
        const titleEl = document.getElementById('workorder-modal-title');
        if (titleEl) {
            const asset = AppState.assets.find(a => a.id === workOrder.asset_id);
            const assetName = asset ? asset.name : 'Unknown Asset';
            titleEl.textContent = `${workOrder.id} - ${assetName}`;
        }

        // Show view-only elements
        document.getElementById('workorder-header-actions')?.classList.remove('hidden');
        document.getElementById('workorder-action-menu-container')?.classList.remove('hidden');
        document.getElementById('workorder-edit-btn')?.classList.remove('hidden');
        document.getElementById('workorder-delete-btn')?.classList.remove('hidden');
        document.getElementById('workorder-tabs')?.classList.remove('hidden');
        document.getElementById('workorder-wo-id-container')?.classList.remove('hidden');
        
        // Set status header dropdown
        const statusHeader = document.getElementById('workorder-status-header');
        if (statusHeader) {
            statusHeader.value = workOrder.status === 'completed' ? 'closed' : 
                                                                  workOrder.status === 'cancelled' ? 'incomplete' : 
                                                                  workOrder.status || 'open';
        }

        // Populate dropdowns
        WorkOrderManager.populateWorkOrderAssetOptions(workOrder.asset_id || null);
        WorkOrderManager.populateWorkOrderTechnicianOptions(workOrder.assigned_technician_id || '');
        WorkOrderManager.populateWorkOrderTypeOptions(workOrder.type || '');

        // Set form values
        document.getElementById('workorder-id').value = workOrder.id;
        document.getElementById('workorder-wo-id').value = workOrder.id;
        document.getElementById('workorder-status').value = workOrder.status === 'completed' ? 'closed' : 
                                                          workOrder.status === 'cancelled' ? 'incomplete' : 
                                                          workOrder.status || 'open';
        document.getElementById('workorder-priority-select').value = workOrder.priority || 'medium';
        
        // Format date for input
        if (workOrder.due_date) {
            const dueDate = new Date(workOrder.due_date);
            const formattedDate = dueDate.toISOString().split('T')[0];
            document.getElementById('workorder-due-date').value = formattedDate;
        }
        
        document.getElementById('workorder-estimated-hours').value = workOrder.estimated_hours || '';
        document.getElementById('workorder-description').value = workOrder.description || '';

        // Update submit button
        const submitBtn = document.getElementById('workorder-submit-btn');
        const cancelBtn = document.getElementById('workorder-cancel-btn');
        if (submitBtn) submitBtn.textContent = 'Update Work Order';
        if (cancelBtn) cancelBtn.textContent = 'Close';

        // Reset timer
        if (WorkOrderManager.timerInterval) {
            clearInterval(WorkOrderManager.timerInterval);
            WorkOrderManager.timerInterval = null;
        }
        WorkOrderManager.timerElapsed = 0;
        const timerDisplay = document.getElementById('wo-timer-display');
        if (timerDisplay) {
            timerDisplay.textContent = '0:00';
        }

        // Load and display parts
        if (typeof WorkOrderParts !== 'undefined') {
            WorkOrderParts.renderWorkOrderParts(workOrder.id, 'view');
        }
        
        // Show PDF button for existing work orders
        const pdfBtn = document.getElementById('workorder-pdf-btn');
        if (pdfBtn) {
            pdfBtn.classList.remove('hidden');
        }

        // Load additional data
        await WorkOrderManager.loadLaborCosts(workOrderId);
        await WorkOrderManager.loadAdditionalCosts(workOrderId);
        await WorkOrderManager.loadLinks(workOrderId);
        await WorkOrderManager.loadFiles(workOrderId);
        await WorkOrderManager.loadUpdates(workOrderId);

        // Reset to details tab
        WorkOrderManager.switchWOTab('details');

        // Close action menu if open
        const actionMenu = document.getElementById('wo-action-menu');
        if (actionMenu) {
            actionMenu.classList.add('hidden');
        }
    },
    
    // Helper functions for populating dropdowns (unified)
    populateWorkOrderAssetOptions: (valueToSet = null) => {
        // Store assets for search functionality
        if (!WorkOrderManager.assetSearchData) {
            WorkOrderManager.assetSearchData = AppState.assets.map(asset => ({
                id: asset.id,
                name: asset.name || 'Unnamed Asset',
                serial_number: asset.serial_number || '',
                status: asset.status || 'active',
                category: asset.category || '',
                searchText: `${asset.name || ''} ${asset.serial_number || ''} ${asset.id || ''} ${asset.category || ''}`.toLowerCase()
            }));
        }
        
        // Setup searchable asset input
        const assetSearch = document.getElementById('workorder-asset-search');
        const assetSelect = document.getElementById('workorder-asset-select');
        const assetDropdown = document.getElementById('workorder-asset-dropdown');
        const assetDropdownList = document.getElementById('workorder-asset-dropdown-list');
        
        if (!assetSearch || !assetSelect || !assetDropdown || !assetDropdownList) return;
        
        // Set initial value if provided, otherwise clear
        if (valueToSet !== null && valueToSet !== '') {
            const selectedAsset = WorkOrderManager.assetSearchData.find(a => a.id === valueToSet);
            if (selectedAsset) {
                assetSearch.value = `${selectedAsset.name}${selectedAsset.serial_number ? ' (' + selectedAsset.serial_number + ')' : ''}`;
                assetSelect.value = selectedAsset.id;
            } else {
                assetSearch.value = '';
                assetSelect.value = '';
            }
        } else {
            // Clear fields for create mode
            assetSearch.value = '';
            assetSelect.value = '';
        }
        
        // Search functionality
        let searchTimeout;
        assetSearch.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const searchTerm = e.target.value.toLowerCase().trim();
            
            if (searchTerm.length === 0) {
                assetDropdown.classList.add('hidden');
                assetSelect.value = '';
                return;
            }
            
            searchTimeout = setTimeout(() => {
                const filtered = WorkOrderManager.assetSearchData.filter(asset => 
                    asset.searchText.includes(searchTerm)
                ).slice(0, 20); // Limit to 20 results for performance
                
                if (filtered.length === 0) {
                    assetDropdownList.innerHTML = '<div class="px-4 py-2 text-sm text-slate-500">No assets found</div>';
                    assetDropdown.classList.remove('hidden');
                    return;
                }
                
                assetDropdownList.innerHTML = filtered.map(asset => {
                    const statusColor = asset.status === 'active' ? 'text-green-600' : 
                                      asset.status === 'maintenance' ? 'text-amber-600' : 
                                      asset.status === 'inactive' ? 'text-gray-600' : 'text-red-600';
                    return `
                        <div class="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-b-0 asset-option" 
                             data-asset-id="${asset.id}"
                             data-asset-name="${escapeHtml(asset.name)}"
                             data-asset-serial="${escapeHtml(asset.serial_number)}">
                            <div class="flex items-center justify-between">
                                <div class="flex-1">
                                    <div class="font-medium text-slate-900">${escapeHtml(asset.name)}</div>
                                    <div class="text-xs text-slate-500">
                                        ${asset.serial_number ? `Serial: ${escapeHtml(asset.serial_number)} • ` : ''}
                                        <span class="${statusColor}">${asset.status || 'active'}</span>
                                        ${asset.category ? ` • ${escapeHtml(asset.category)}` : ''}
                                    </div>
                                </div>
                                <i class="fas fa-chevron-right text-slate-400 ml-2"></i>
                            </div>
                        </div>
                    `;
                }).join('');
                
                // Add click handlers to options
                assetDropdownList.querySelectorAll('.asset-option').forEach(option => {
                    option.addEventListener('click', () => {
                        const assetId = option.dataset.assetId;
                        const assetName = option.dataset.assetName;
                        const assetSerial = option.dataset.assetSerial;
                        
                        assetSelect.value = assetId;
                        assetSearch.value = `${assetName}${assetSerial ? ' (' + assetSerial + ')' : ''}`;
                        assetDropdown.classList.add('hidden');
                    });
                });
                
                assetDropdown.classList.remove('hidden');
            }, 200);
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!assetSearch.contains(e.target) && !assetDropdown.contains(e.target)) {
                assetDropdown.classList.add('hidden');
            }
        });
        
        // Handle focus - show recent/popular assets
        assetSearch.addEventListener('focus', () => {
            if (assetSearch.value.trim().length === 0) {
                // Show first 10 assets as suggestions
                const suggestions = WorkOrderManager.assetSearchData.slice(0, 10);
                assetDropdownList.innerHTML = suggestions.map(asset => {
                    const statusColor = asset.status === 'active' ? 'text-green-600' : 
                                      asset.status === 'maintenance' ? 'text-amber-600' : 
                                      asset.status === 'inactive' ? 'text-gray-600' : 'text-red-600';
                    return `
                        <div class="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-b-0 asset-option" 
                             data-asset-id="${asset.id}"
                             data-asset-name="${escapeHtml(asset.name)}"
                             data-asset-serial="${escapeHtml(asset.serial_number)}">
                            <div class="flex items-center justify-between">
                                <div class="flex-1">
                                    <div class="font-medium text-slate-900">${escapeHtml(asset.name)}</div>
                                    <div class="text-xs text-slate-500">
                                        ${asset.serial_number ? `Serial: ${escapeHtml(asset.serial_number)} • ` : ''}
                                        <span class="${statusColor}">${asset.status || 'active'}</span>
                                        ${asset.category ? ` • ${escapeHtml(asset.category)}` : ''}
                                    </div>
                                </div>
                                <i class="fas fa-chevron-right text-slate-400 ml-2"></i>
                            </div>
                        </div>
                    `;
                }).join('');
                
                // Add click handlers
                assetDropdownList.querySelectorAll('.asset-option').forEach(option => {
                    option.addEventListener('click', () => {
                        const assetId = option.dataset.assetId;
                        const assetName = option.dataset.assetName;
                        const assetSerial = option.dataset.assetSerial;
                        
                        assetSelect.value = assetId;
                        assetSearch.value = `${assetName}${assetSerial ? ' (' + assetSerial + ')' : ''}`;
                        assetDropdown.classList.add('hidden');
                    });
                });
                
                assetDropdown.classList.remove('hidden');
            }
        });
    },
    
    populateWorkOrderTechnicianOptions: (valueToSet = null) => {
        const techSelect = document.getElementById('workorder-technician-select');
        if (!techSelect) return;
        const currentValue = valueToSet !== null ? valueToSet : techSelect.value;
        techSelect.innerHTML = '<option value="">Select technician</option>';
        AppState.technicians.forEach(tech => {
            const option = document.createElement('option');
            option.value = tech.id;
            option.textContent = tech.full_name || 'Unnamed Technician';
            if (tech.id === currentValue) option.selected = true;
            techSelect.appendChild(option);
        });
    },
    
    populateWorkOrderTypeOptions: (valueToSet = null) => {
        const typeSelect = document.getElementById('workorder-type-select');
        if (!typeSelect) return;
        const currentValue = valueToSet !== null ? valueToSet : typeSelect.value;
        typeSelect.innerHTML = '<option value="">Select type</option>';
        AppState.workOrderTypes.forEach(type => {
            const option = document.createElement('option');
            // WorkOrderTypes are stored as {value, label} from loadWorkOrderTypes
            // value is the code, label is the display name
            const typeCode = type.value || type.code || type.name;
            const typeLabel = type.label || type.name || typeCode;
            option.value = typeCode;
            option.textContent = typeLabel;
            // Match by code (work orders store code in type field)
            if (typeCode === currentValue) option.selected = true;
            typeSelect.appendChild(option);
        });
    },

    toggleActionMenu: () => {
        const menu = document.getElementById('wo-action-menu');
        if (menu) {
            menu.classList.toggle('hidden');
            // Close menu when clicking outside
            if (!menu.classList.contains('hidden')) {
                setTimeout(() => {
                    document.addEventListener('click', function closeMenuOnOutsideClick(e) {
                        if (!menu.contains(e.target) && !document.getElementById('wo-action-menu-btn').contains(e.target)) {
                            menu.classList.add('hidden');
                            document.removeEventListener('click', closeMenuOnOutsideClick);
                        }
                    });
                }, 100);
            }
        }
    },

    populateViewAssetOptions: (valueToSet = null) => {
        const assetSelect = document.getElementById('view-workorder-asset-select');
        if (!assetSelect) return;

        const currentValue = valueToSet !== null ? valueToSet : assetSelect.value;
        assetSelect.innerHTML = '<option value="">Select Asset</option>';
        AppState.assets.forEach(asset => {
            const option = document.createElement('option');
            option.value = asset.id;
            
            // Show only Category and Asset Name - NO Asset ID (since it's read-only in database)
            const category = asset.category 
                ? `[${asset.category.charAt(0).toUpperCase() + asset.category.slice(1)}]` 
                : '';
            const assetName = asset.name || 'Unnamed Asset';
            
            // Format: [Category] Asset Name (no Asset ID)
            option.textContent = category ? `${category} ${assetName}`.trim() : assetName;
            
            assetSelect.appendChild(option);
        });
        
        // Restore selected value
        if (currentValue) {
            assetSelect.value = currentValue;
        }
    },

    populateViewTechnicianOptions: (valueToSet = null) => {
        const techSelect = document.getElementById('view-workorder-technician-select');
        if (!techSelect) return;

        const currentValue = valueToSet !== null ? valueToSet : techSelect.value;
        techSelect.innerHTML = '<option value="">Select technician</option>';
        AppState.technicians.forEach(tech => {
            const option = document.createElement('option');
            option.value = tech.id;
            option.textContent = tech.full_name || 'Unnamed Technician';
            techSelect.appendChild(option);
        });
        
        // Restore selected value
        if (currentValue) {
            techSelect.value = currentValue;
        }
    },

    populateViewWorkOrderTypes: (valueToSet = null) => {
        const typeSelect = document.getElementById('view-workorder-type-select');
        if (!typeSelect) return;

        const currentValue = valueToSet !== null ? valueToSet : typeSelect.value;
        typeSelect.innerHTML = '<option value="">Select type</option>';
        AppState.workOrderTypes.forEach(type => {
            const option = document.createElement('option');
            // AppState.workOrderTypes uses 'value' and 'label', not 'code'
            option.value = type.value || type.code;
            option.textContent = type.label || type.value || type.code;
            typeSelect.appendChild(option);
        });
        
        // Restore selected value - ensure we match the stored type code
        if (currentValue) {
            // Try exact match first
            typeSelect.value = currentValue;
            // If no match, try to find by normalized value
            if (!typeSelect.value && currentValue) {
                const normalized = WorkOrderManager.toDatabaseWorkOrderType(currentValue);
                const match = AppState.workOrderTypes.find(t => 
                    (t.value || t.code) === normalized || 
                    (t.value || t.code) === currentValue
                );
                if (match) {
                    typeSelect.value = match.value || match.code;
                }
            }
        }
    },

    handleUpdateWorkOrder: async () => {
        const workOrderIdInput = document.getElementById('workorder-id');
        const workOrderId = workOrderIdInput?.value || workOrderIdInput?.textContent?.trim();
        
        if (!workOrderId) {
            console.error('Work order ID missing. Available elements:', {
                idInput: document.getElementById('workorder-id'),
                woIdInput: document.getElementById('workorder-wo-id')
            });
            showToast('Work order ID is missing', 'error');
            return;
        }

        console.log('🔄 Updating work order:', workOrderId);

        const assetId = document.getElementById('workorder-asset-select')?.value || '';
        const type = WorkOrderManager.toDatabaseWorkOrderType(document.getElementById('workorder-type-select')?.value || '');
        const priority = document.getElementById('workorder-priority-select')?.value || 'medium';
        const status = document.getElementById('workorder-status')?.value || 'open';
        const technicianId = document.getElementById('workorder-technician-select')?.value || null;
        const dueDate = document.getElementById('workorder-due-date')?.value || '';
        const estimatedHours = document.getElementById('workorder-estimated-hours')?.value ? Number(document.getElementById('workorder-estimated-hours').value) : null;
        const description = document.getElementById('workorder-description')?.value?.trim() || '';

        if (!assetId || !type || !dueDate || !description) {
            showToast('Please complete all required fields.', 'warning');
            return;
        }

        // Map status back to database values
        const dbStatus = status === 'closed' ? 'completed' : 
                        status === 'incomplete' ? 'cancelled' : 
                        status === 'open' ? 'open' : 'in-progress';

        const updatePayload = {
            asset_id: assetId,
            type,
            priority,
            status: dbStatus,
            due_date: new Date(dueDate).toISOString(),
            estimated_hours: estimatedHours,
            description: description
        };

        // Add technician if provided and column exists
        if (technicianId) {
            updatePayload.assigned_technician_id = technicianId;
        }

        console.log('📤 Update payload:', updatePayload);

        if (!supabaseClient) {
            // Demo mode
            const workOrderIndex = AppState.workOrders.findIndex(wo => wo.id === workOrderId);
            if (workOrderIndex !== -1) {
                AppState.workOrders[workOrderIndex] = {
                    ...AppState.workOrders[workOrderIndex],
                    ...updatePayload,
                    technician: WorkOrderManager.resolveTechnicianName(technicianId)
                };
                WorkOrderManager.renderWorkOrders();
                WorkOrderManager.renderWorkOrdersList();
                WorkOrderManager.renderRecentWorkOrders();
                WorkOrderManager.updateSummaryCounts();
                WorkOrderManager.closeWorkOrderModal();
                showToast('Work order updated (demo mode).', 'success');
            }
            return;
        }

        // Update in Supabase
        let error = null;
        let updateSucceeded = false;
        
        try {
            // Clean up payload - remove null/empty technician ID, ensure proper types
            const cleanPayload = { ...updatePayload };
            
            // Handle technician ID - only include if it's a valid UUID
            if (technicianId) {
                // Validate UUID format
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (uuidRegex.test(technicianId)) {
                    cleanPayload.assigned_technician_id = technicianId;
                } else {
                    console.warn('Invalid technician ID format, skipping:', technicianId);
                    delete cleanPayload.assigned_technician_id;
                }
            } else {
                // Explicitly set to null if no technician selected
                cleanPayload.assigned_technician_id = null;
            }

            // Check if status is being changed to completed
            const isCompleting = dbStatus === 'completed';
            const oldWorkOrder = AppState.workOrders.find(wo => wo.id === workOrderId);
            const wasCompleted = oldWorkOrder?.status === 'completed';
            
            // If completing, add completed_date
            if (isCompleting && !wasCompleted) {
                cleanPayload.completed_date = new Date().toISOString();
            } else if (!isCompleting && wasCompleted) {
                cleanPayload.completed_date = null;
            }

            // First attempt: update WITHOUT select to avoid trigger issues
            let updateResult = await supabaseClient
                .from('work_orders')
                .update(cleanPayload)
                .eq('id', workOrderId);

            error = updateResult.error;

            // If error is about assigned_technician_id, retry without it
            if (error && (/assigned_technician_id.*does not exist|42703|PGRST204|column.*assigned_technician_id/i.test(error.message || '') || 
                          (error.code && (error.code === '42703' || error.code === 'PGRST204')))) {
                console.warn('assigned_technician_id column issue, retrying without it');
                const retryPayload = { ...cleanPayload };
                delete retryPayload.assigned_technician_id;
                updateResult = await supabaseClient
                    .from('work_orders')
                    .update(retryPayload)
                    .eq('id', workOrderId);
                error = updateResult.error;
            }

            // If error is about updated_at trigger or other trigger issues, try with minimal fields
            if (error && (/updated_at|trigger|42703|PGRST/i.test(error.message || '') || 
                         (error.code && (error.code === '42703' || error.code === 'PGRST')))) {
                console.warn('Trigger error detected, retrying with minimal fields');
                const minimalPayload = {
                    asset_id: assetId,
                    type,
                    priority,
                    status: dbStatus,
                    due_date: new Date(dueDate).toISOString(),
                    description: description
                };
                if (estimatedHours !== null && estimatedHours !== undefined) {
                    minimalPayload.estimated_hours = estimatedHours;
                }
                // Don't include assigned_technician_id in minimal payload
                updateResult = await supabaseClient
                    .from('work_orders')
                    .update(minimalPayload)
                    .eq('id', workOrderId);
                error = updateResult.error;
            }
                
                // Verify update succeeded by fetching the record
                if (!error) {
                    const verifyResult = await supabaseClient
                        .from('work_orders')
                    .select('id, status, asset_id, type, priority')
                        .eq('id', workOrderId)
                        .single();
                    
                    if (!verifyResult.error && verifyResult.data) {
                        // Check if the update actually took effect
                        if (verifyResult.data.status === dbStatus && verifyResult.data.asset_id === assetId) {
                            updateSucceeded = true;
                            console.log('✅ Update verified successfully');
                        
                        // If we had to skip assigned_technician_id, try to update it separately
                        if (technicianId && !cleanPayload.assigned_technician_id) {
                            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                            if (uuidRegex.test(technicianId)) {
                                try {
                                    await supabaseClient
                                        .from('work_orders')
                                        .update({ assigned_technician_id: technicianId })
                                        .eq('id', workOrderId);
                                    console.log('✅ Technician assignment updated separately');
                                } catch (techError) {
                                    console.warn('Could not update technician assignment:', techError);
                                }
                            }
                        }
                        } else {
                            console.warn('⚠️ Update may not have taken effect');
                            error = new Error('Update verification failed - changes may not have been saved');
                        }
                } else if (verifyResult.error) {
                    console.warn('Could not verify update:', verifyResult.error);
                    // Assume success if we got no error from update
                updateSucceeded = true;
                }
            }

        } catch (e) {
            console.error('Exception during update:', e);
            error = e;
        }

        if (error && !updateSucceeded) {
            console.error('❌ Error updating work order:', error);
            let errorMessage = 'Failed to update work order.';
            if (error.message) {
                if (error.message.includes('updated_at')) {
                    errorMessage = 'Failed to update work order. Database trigger error - please contact administrator.';
                } else if (error.message.includes('foreign key') || error.message.includes('violates foreign key')) {
                    errorMessage = 'Failed to update work order. Invalid asset or technician selected.';
                } else {
                    errorMessage = 'Failed to update work order. ' + error.message;
                }
            }
            showToast(errorMessage, 'error');
            return;
        }

        // Reload work orders from database
        console.log('🔄 Reloading work orders...');
        try {
            await WorkOrderManager.loadWorkOrders();
            console.log('✅ Work orders reloaded, count:', AppState.workOrders.length);
            
            // Re-render all views
            WorkOrderManager.renderWorkOrders();
            WorkOrderManager.renderWorkOrdersList();
            WorkOrderManager.renderRecentWorkOrders();
            WorkOrderManager.updateSummaryCounts();
            
            console.log('✅ UI refreshed');
            
            // If work order was completed and is a PM work order, update asset PM dates
            const workOrderId = document.getElementById('view-workorder-id')?.value;
            if (workOrderId && (dbStatus === 'completed' || status === 'completed' || status === 'closed')) {
                try {
                    const { data: wo } = await supabaseClient
                        .from('work_orders')
                        .select('asset_id, type, completed_date')
                        .eq('id', workOrderId)
                        .single();
                    
                    // Check for PM work order (both 'PM' and 'preventive_maintenance' types)
                    if (wo && (wo.type === 'PM' || wo.type === 'preventive_maintenance') && wo.asset_id) {
                        const completionDate = wo.completed_date || cleanPayload.completed_date || new Date().toISOString();
                        
                        // Use PMAutomation if available, otherwise fall back to manual update
                        if (window.PMAutomation && typeof window.PMAutomation.updatePMAfterWorkOrderCompletion === 'function') {
                            await window.PMAutomation.updatePMAfterWorkOrderCompletion(workOrderId, completionDate);
                        } else {
                            // Fallback: Update asset PM dates manually
                            const { data: asset } = await supabaseClient
                                .from('assets')
                                .select('pm_schedule_type, pm_interval_days, last_maintenance')
                                .eq('id', wo.asset_id)
                                .single();
                            
                            if (asset && asset.pm_schedule_type) {
                                const lastMaintenance = completionDate;
                                
                                // Calculate next maintenance date
                                let nextMaintenance = null;
                                if (asset.pm_schedule_type === 'custom' && asset.pm_interval_days) {
                                    nextMaintenance = new Date(completionDate);
                                    nextMaintenance.setDate(nextMaintenance.getDate() + asset.pm_interval_days);
                                } else {
                                    const intervals = {
                                        daily: 1, weekly: 7, biweekly: 14, monthly: 30,
                                        quarterly: 90, semiannually: 180, annually: 365
                                    };
                                    const days = intervals[asset.pm_schedule_type] || 30;
                                    nextMaintenance = new Date(completionDate);
                                    nextMaintenance.setDate(nextMaintenance.getDate() + days);
                                }
                                
                                await supabaseClient
                                    .from('assets')
                                    .update({
                                        last_maintenance: lastMaintenance,
                                        next_maintenance: nextMaintenance.toISOString(),
                                        compliance_status: 'compliant'
                                    })
                                    .eq('id', wo.asset_id);
                                
                                console.log('✅ Asset PM dates updated after work order completion');
                            }
                        }
                    }
                } catch (pmError) {
                    console.warn('Failed to update PM dates:', pmError);
                }
            }
            
            // Close modal
            WorkOrderManager.closeWorkOrderModal();
            
            // Show success message
            showToast('Work order updated successfully.', 'success');
        } catch (reloadError) {
            console.error('❌ Error reloading work orders:', reloadError);
            showToast('Work order updated, but failed to refresh display. Please reload the page.', 'warning');
            WorkOrderManager.closeWorkOrderModal();
        }
    },

    handleCreateWorkOrder: async () => {
        const assetSelect = document.getElementById('workorder-asset-select');
        const typeSelect = document.getElementById('workorder-type-select');
        const prioritySelect = document.getElementById('workorder-priority-select');
        const technicianSelect = document.getElementById('workorder-technician-select');
        const checklistSelect = document.getElementById('workorder-checklist-select');
        const dueDateInput = document.getElementById('workorder-due-date');
        const estimatedHoursInput = document.getElementById('workorder-estimated-hours');
        const descriptionInput = document.getElementById('workorder-description');

        const assetId = assetSelect?.value || '';
        const type = WorkOrderManager.toDatabaseWorkOrderType(typeSelect?.value || '');
        const priority = prioritySelect?.value || 'medium';
        const technicianId = technicianSelect?.value || null;
        const checklistId = checklistSelect?.value || null;
        const dueDate = dueDateInput?.value || '';
        const estimatedHours = estimatedHoursInput?.value ? Number(estimatedHoursInput.value) : null;
        const description = descriptionInput?.value?.trim() || '';

        if (!assetId || !type || !dueDate || !description) {
            showToast('Please complete asset, type, due date, and description.', 'warning');
            return;
        }

        if (!supabaseClient) {
            const newWorkOrder = {
                id: `WO-DEMO-${Date.now()}`,
                asset_id: assetId,
                type,
                priority,
                status: 'open',
                assigned_technician_id: technicianId,
                technician: WorkOrderManager.resolveTechnicianName(technicianId),
                due_date: new Date(dueDate).toISOString(),
                created_date: new Date().toISOString(),
                completed_date: null,
                estimated_hours: estimatedHours,
                actual_hours: null,
                description: description
            };
            AppState.workOrders = [newWorkOrder, ...AppState.workOrders];
            WorkOrderManager.renderWorkOrders();
            WorkOrderManager.renderRecentWorkOrders();
            WorkOrderManager.updateSummaryCounts();
            hideCreateWorkOrderModal();
            showToast('Work order created (demo mode).', 'success');
            return;
        }

        // Generate work order ID client-side to match database format
        // Format: WO-YYYYMMDD-#### (matching the database DEFAULT function)
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const dateStr = `${year}${month}${day}`;
        
        // Track created_date for work order creation
        const createdDate = new Date().toISOString();
        
        // Use timestamp milliseconds for uniqueness (last 4 digits)
        const seqNum = String(Date.now()).slice(-4).padStart(4, '0');
        const workOrderId = `WO-${dateStr}-${seqNum}`;
        
        const payload = {
            id: workOrderId,
            asset_id: assetId,
            type,
            priority,
            status: 'open',
            due_date: new Date(dueDate).toISOString(),
            created_date: createdDate, // Track work order creation date
            estimated_hours: estimatedHours,
            description: description
        };

        // Use assigned_technician_id instead of technician field (which doesn't exist in schema)
        if (technicianId) {
            payload.assigned_technician_id = technicianId;
        }

        if (supabaseClient?.auth?.getSession) {
            try {
                const { data } = await supabaseClient.auth.getSession();
                const userId = data?.session?.user?.id;
                if (userId) {
                    // Some schemas use assigned_to to reference the auth user.
                    payload.assigned_to = userId;
                }
            } catch (error) {
                console.warn('Unable to read auth session for work order creation.', error);
            }
        }

        // Select fields - don't include assigned_technician_id in select if it doesn't exist
        let selectFields = [
            'id',
            'asset_id',
            'type',
            'priority',
            'status',
            'due_date',
            'created_date',
            'completed_date',
            'estimated_hours',
            'actual_hours',
            'cost',
            'description'
        ];

        // Try to insert, but handle case where assigned_technician_id column doesn't exist
        let { data, error } = await supabaseClient
            .from('work_orders')
            .insert(payload)
            .select(selectFields.join(', '))
            .single();

        // If error is about assigned_technician_id not existing, retry without it
        if (error && (/assigned_technician_id.*does not exist|42703|PGRST204/i.test(error.message || '') || 
                      (error.code && (error.code === '42703' || error.code === 'PGRST204')))) {
            console.warn('assigned_technician_id column does not exist, retrying without it');
            // Remove assigned_technician_id from payload and retry
            const retryPayload = { ...payload };
            delete retryPayload.assigned_technician_id;
            
            ({ data, error } = await supabaseClient
                .from('work_orders')
                .insert(retryPayload)
                .select(selectFields.join(', '))
                .single());
        }

        if (error) {
            console.error('Error creating work order:', error);
            let message = 'Failed to create work order.';
            
            if (/row-level security|permission|jwt|unauthorized/i.test(error.message || '')) {
                message = 'Failed to create work order. Please sign in again.';
            } else if (/foreign key|asset_id|constraint/i.test(error.message || '')) {
                message = 'Invalid asset selected. Please choose a valid asset.';
            } else if (/null value|required/i.test(error.message || '')) {
                message = 'Missing required fields. Please check all fields are filled.';
            } else {
                message = `Failed to create work order: ${error.message || 'Unknown error'}`;
            }
            
            showToast(message, 'error');
            return;
        }

        // Resolve technician name for display
        const technicianName = WorkOrderManager.resolveTechnicianName(data.assigned_technician_id);
        const newOrder = {
            ...data,
            technician: technicianName || 'Unassigned'
        };
        AppState.workOrders = [newOrder, ...AppState.workOrders];
        // Link checklist if selected
        if (checklistId && data && data.id) {
            try {
                const { error: linkError } = await supabaseClient
                    .from('work_order_checklists')
                    .insert({
                        work_order_id: data.id,
                        checklist_id: checklistId
                    });
                
                if (linkError) {
                    console.warn('Failed to link checklist to work order:', linkError);
                    // Don't fail the whole operation if checklist linking fails
                }
            } catch (err) {
                console.warn('Error linking checklist:', err);
            }
        }

        // Save parts if any were added
        if (data && data.id && typeof WorkOrderParts !== 'undefined') {
            try {
                // Get the temporary work order ID used during creation
                const tempIds = Object.keys(WorkOrderParts.workOrderParts || {});
                const tempId = tempIds.find(id => id.startsWith('temp-'));
                
                if (tempId && WorkOrderParts.workOrderParts[tempId] && WorkOrderParts.workOrderParts[tempId].length > 0) {
                    // Transfer parts from temp ID to actual work order ID
                    WorkOrderParts.workOrderParts[data.id] = WorkOrderParts.workOrderParts[tempId];
                    delete WorkOrderParts.workOrderParts[tempId];
                    
                    // Save parts to database
                    await WorkOrderParts.saveWorkOrderParts(data.id);
                    showToast(`Work order created with ${WorkOrderParts.workOrderParts[data.id].length} part(s).`, 'success');
                }
            } catch (err) {
                console.warn('Error saving work order parts:', err);
                showToast('Work order created, but parts could not be saved. Please add them manually.', 'warning');
            }
        }

        WorkOrderManager.renderWorkOrders();
        WorkOrderManager.renderRecentWorkOrders();
        WorkOrderManager.updateSummaryCounts();
        hideCreateWorkOrderModal();
        showToast('Work order created successfully.', 'success');
    },

    resolveTechnicianName: (technicianId) => {
        if (!technicianId) return 'Unassigned';
        const match = AppState.technicians.find(tech => tech.id === technicianId);
        return match ? match.full_name : 'Unassigned';
    },

    getTechnicianInitials: (name) => {
        if (!name) return 'UN';
        return name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
    },

    resetPartsUsedItems: () => {
        WorkOrderManager.partsUsedItems = [];
        const partsUsedInput = document.getElementById('workorder-parts-used');
        if (partsUsedInput) partsUsedInput.value = '';
    },

    // View switching (Grid/List)
    currentView: 'list',
    switchView: (view) => {
        // Force list view only - ignore grid view requests
        WorkOrderManager.currentView = 'list';
        const gridView = document.getElementById('workorders-grid-view');
        const listView = document.getElementById('workorders-list-view');
        const gridBtn = document.getElementById('grid-view-btn');
        const listBtn = document.getElementById('list-view-btn');

        // Always show list view, hide grid view
        if (gridView) gridView.classList.add('hidden');
        if (listView) listView.classList.remove('hidden');
        if (gridBtn) {
            gridBtn.classList.remove('active');
            gridBtn.style.display = 'none'; // Hide grid button
        }
        if (listBtn) listBtn.classList.add('active');
        WorkOrderManager.renderWorkOrdersList();
    },

    // Initialize default view on page load
    initView: () => {
        // Force list view only - hide grid view button
        const gridView = document.getElementById('workorders-grid-view');
        const listView = document.getElementById('workorders-list-view');
        const gridBtn = document.getElementById('grid-view-btn');
        const listBtn = document.getElementById('list-view-btn');
        
        // Set initial view state
        if (gridView) gridView.classList.add('hidden');
        if (listView) listView.classList.remove('hidden');
        if (gridBtn) {
            gridBtn.classList.remove('active');
            gridBtn.style.display = 'none'; // Hide grid view button
        }
        if (listBtn) listBtn.classList.add('active');
        WorkOrderManager.currentView = 'list';
        
        WorkOrderManager.currentView = 'list';
        // Render list view
        WorkOrderManager.renderWorkOrdersList();
    },

    // Render work orders in list view
    renderWorkOrdersList: () => {
        const tableBody = document.getElementById('workorders-list-table');
        if (!tableBody) return;

        const filteredOrders = WorkOrderManager.getFilteredWorkOrders();
        
        if (filteredOrders.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="px-6 py-8 text-center text-slate-500">
                        <i class="fas fa-inbox text-4xl mb-4 text-slate-300"></i>
                        <p>No work orders found</p>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = filteredOrders.map(wo => `
            <tr class="hover:bg-slate-50 cursor-pointer" onclick="WorkOrderManager.viewWorkOrder('${wo.id}')">
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-xs px-2 py-1 rounded-full ${WorkOrderManager.getStatusColor(wo.status)}">
                        ${wo.status === 'completed' ? 'CLOSED' : wo.status === 'cancelled' ? 'INCOMPLETE' : wo.status === 'open' ? 'OPEN' : wo.status.toUpperCase()}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">${wo.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">${wo.asset_name || wo.asset_id || 'Unknown Asset'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">${WorkOrderManager.formatWorkOrderType(wo.type)}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="text-xs px-2 py-1 rounded-full ${WorkOrderManager.getPriorityColor(wo.priority)}">
                        ${wo.priority.toUpperCase()}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">${wo.technician || 'Unassigned'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">${WorkOrderManager.formatDate(wo.due_date)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                    <button onclick="event.stopPropagation(); WorkOrderManager.viewWorkOrder('${wo.id}')" class="text-blue-600 hover:text-blue-900 mr-3">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },

    // Get filtered work orders based on search and filters
    getFilteredWorkOrders: () => {
        let filtered = [...AppState.workOrders];
        
        // Search filter
        const searchInput = document.getElementById('workorder-search');
        if (searchInput && searchInput.value.trim()) {
            const searchTerm = searchInput.value.toLowerCase();
            filtered = filtered.filter(wo => 
                wo.id.toLowerCase().includes(searchTerm) ||
                wo.asset_id.toLowerCase().includes(searchTerm) ||
                WorkOrderManager.formatWorkOrderType(wo.type).toLowerCase().includes(searchTerm) ||
                (wo.technician && wo.technician.toLowerCase().includes(searchTerm)) ||
                (wo.description && wo.description.toLowerCase().includes(searchTerm))
            );
        }

        // Status filter
        const statusFilter = document.getElementById('status-filter');
        if (statusFilter && statusFilter.value) {
            filtered = filtered.filter(wo => wo.status === statusFilter.value);
        }

        // Priority filter
        const priorityFilter = document.getElementById('priority-filter');
        if (priorityFilter && priorityFilter.value) {
            filtered = filtered.filter(wo => wo.priority === priorityFilter.value);
        }

        // Technician filter
        const technicianFilter = document.getElementById('technician-filter');
        if (technicianFilter && technicianFilter.value) {
            filtered = filtered.filter(wo => {
                const tech = AppState.technicians.find(t => t.id === technicianFilter.value);
                return tech && wo.technician === tech.full_name;
            });
        }

        // Customer filter
        const customerFilter = document.getElementById('customer-filter');
        if (customerFilter && customerFilter.value) {
            filtered = filtered.filter(wo => {
                // Get asset to find customer
                const asset = AppState.assets.find(a => a.id === wo.asset_id);
                if (asset && asset.customer_id) {
                    return asset.customer_id === customerFilter.value;
                }
                return false;
            });
        }

        // Work Type filter
        const workTypeFilter = document.getElementById('worktype-filter');
        if (workTypeFilter && workTypeFilter.value) {
            filtered = filtered.filter(wo => wo.type === workTypeFilter.value);
        }

        return filtered;
    },

    // Reset all filters
    resetAllFilters: () => {
        const searchInput = document.getElementById('workorder-search');
        const statusFilter = document.getElementById('status-filter');
        const priorityFilter = document.getElementById('priority-filter');
        const technicianFilter = document.getElementById('technician-filter');
        const customerFilter = document.getElementById('customer-filter');
        const workTypeFilter = document.getElementById('worktype-filter');
        
        if (searchInput) searchInput.value = '';
        if (statusFilter) statusFilter.value = '';
        if (priorityFilter) priorityFilter.value = '';
        if (technicianFilter) technicianFilter.value = '';
        if (customerFilter) customerFilter.value = '';
        if (workTypeFilter) workTypeFilter.value = '';
        
        // Re-render work orders
        if (WorkOrderManager.currentView === 'list') {
            WorkOrderManager.renderWorkOrdersList();
        } else {
            WorkOrderManager.renderWorkOrders();
        }
        
        showToast('All filters have been reset', 'success');
    },

    // Setup search and filter event listeners
    setupSearchAndFilters: () => {
        const searchInput = document.getElementById('workorder-search');
        const statusFilter = document.getElementById('status-filter');
        const priorityFilter = document.getElementById('priority-filter');
        const technicianFilter = document.getElementById('technician-filter');
        const customerFilter = document.getElementById('customer-filter');
        const workTypeFilter = document.getElementById('worktype-filter');

        const applyFilters = () => {
            if (WorkOrderManager.currentView === 'list') {
                WorkOrderManager.renderWorkOrdersList();
            } else {
                WorkOrderManager.renderWorkOrders();
            }
        };

        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(applyFilters, 300);
            });
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', applyFilters);
        }

        if (priorityFilter) {
            priorityFilter.addEventListener('change', applyFilters);
        }

        if (technicianFilter) {
            technicianFilter.addEventListener('change', applyFilters);
        }

        if (customerFilter) {
            customerFilter.addEventListener('change', applyFilters);
        }

        if (workTypeFilter) {
            workTypeFilter.addEventListener('change', applyFilters);
        }
    },

    // Populate filter dropdowns
    populateFilters: async () => {
        // Populate technicians filter
        const technicianFilter = document.getElementById('technician-filter');
        if (technicianFilter && AppState.technicians && AppState.technicians.length > 0) {
            technicianFilter.innerHTML = '<option value="">All Technicians</option>';
            AppState.technicians.forEach(tech => {
                const option = document.createElement('option');
                option.value = tech.id;
                option.textContent = tech.full_name || tech.name || 'Unknown';
                technicianFilter.appendChild(option);
            });
        }

        // Populate customers filter
        const customerFilter = document.getElementById('customer-filter');
        if (customerFilter) {
            try {
                if (supabaseClient) {
                    const { data: customers, error } = await supabaseClient
                        .from('customers')
                        .select('id, name')
                        .order('name');
                    
                    if (!error && customers) {
                        customerFilter.innerHTML = '<option value="">All Customers</option>';
                        customers.forEach(customer => {
                            const option = document.createElement('option');
                            option.value = customer.id;
                            option.textContent = customer.name || 'Unknown';
                            customerFilter.appendChild(option);
                        });
                    }
                } else if (AppState.customers && AppState.customers.length > 0) {
                    customerFilter.innerHTML = '<option value="">All Customers</option>';
                    AppState.customers.forEach(customer => {
                        const option = document.createElement('option');
                        option.value = customer.id;
                        option.textContent = customer.name || 'Unknown';
                        customerFilter.appendChild(option);
                    });
                }
            } catch (error) {
                console.error('Error loading customers for filter:', error);
            }
        }

        // Populate work type filter
        const workTypeFilter = document.getElementById('worktype-filter');
        if (workTypeFilter) {
            try {
                if (supabaseClient) {
                    const { data: workOrderTypes, error } = await supabaseClient
                        .from('work_order_types')
                        .select('code, name')
                        .order('name');
                    
                    if (!error && workOrderTypes) {
                        workTypeFilter.innerHTML = '<option value="">All Work Types</option>';
                        workOrderTypes.forEach(type => {
                            const option = document.createElement('option');
                            option.value = type.code;
                            option.textContent = type.name || type.code;
                            workTypeFilter.appendChild(option);
                        });
                    }
                } else {
                    // Fallback to common work order types
                    const commonTypes = [
                        { code: 'preventive', name: 'Preventive Maintenance' },
                        { code: 'corrective', name: 'Corrective Maintenance' },
                        { code: 'inspection', name: 'Inspection' },
                        { code: 'repair', name: 'Repair' },
                        { code: 'calibration', name: 'Calibration' }
                    ];
                    workTypeFilter.innerHTML = '<option value="">All Work Types</option>';
                    commonTypes.forEach(type => {
                        const option = document.createElement('option');
                        option.value = type.code;
                        option.textContent = type.name;
                        workTypeFilter.appendChild(option);
                    });
                }
            } catch (error) {
                console.error('Error loading work order types for filter:', error);
            }
        }
    },

    // Tasks Management
    loadTasks: async (workOrderId) => {
        if (!supabaseClient) return [];

        const { data, error } = await supabaseClient
            .from('work_order_tasks')
            .select('*')
            .eq('work_order_id', workOrderId)
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error loading tasks:', error);
            return [];
        }

        return data || [];
    },

    loadTaskAttachments: async (taskId) => {
        if (!supabaseClient) return [];

        const { data, error } = await supabaseClient
            .from('work_order_task_attachments')
            .select('*')
            .eq('task_id', taskId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error loading task attachments:', error);
            return [];
        }

        return data || [];
    },

    uploadTaskFile: async (taskId, file, fileType = 'file') => {
        if (!supabaseClient) {
            showToast('Supabase not connected', 'error');
            return null;
        }

        try {
            // Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${taskId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `work-order-tasks/${fileName}`;

            const { data: uploadData, error: uploadError } = await supabaseClient.storage
                .from('work-order-files')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabaseClient.storage
                .from('work-order-files')
                .getPublicUrl(filePath);

            // Save attachment record
            const { data: attachmentData, error: attachmentError } = await supabaseClient
                .from('work_order_task_attachments')
                .insert({
                    task_id: taskId,
                    file_name: file.name,
                    file_url: urlData.publicUrl,
                    file_type: fileType,
                    file_size: file.size,
                    mime_type: file.type
                })
                .select()
                .single();

            if (attachmentError) throw attachmentError;

            return attachmentData;
        } catch (error) {
            console.error('Error uploading file:', error);
            showToast(`Failed to upload file: ${error.message}`, 'error');
            return null;
        }
    },

    createTask: async (workOrderId, taskData) => {
        if (!supabaseClient) {
            showToast('Supabase not connected', 'error');
            return null;
        }

        try {
            const { data, error } = await supabaseClient
                .from('work_order_tasks')
                .insert({
                    work_order_id: workOrderId,
                    title: taskData.title,
                    description: taskData.description,
                    status: taskData.status || 'pending',
                    due_date: taskData.due_date || null,
                    sort_order: taskData.sort_order || 0
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating task:', error);
            showToast(`Failed to create task: ${error.message}`, 'error');
            return null;
        }
    },

    updateSummaryCounts: () => {
        const openCount = AppState.workOrders.filter(order => order.status === 'open').length;
        const progressCount = AppState.workOrders.filter(order => order.status === 'in-progress').length;
        const completedCount = AppState.workOrders.filter(order => order.status === 'completed').length;
        const overdueCount = AppState.workOrders.filter(order => {
            if (!order.due_date) return false;
            const due = new Date(order.due_date);
            return due < new Date() && !['completed', 'cancelled'].includes(order.status);
        }).length;

        const openStat = document.getElementById('open-stat');
        const progressStat = document.getElementById('progress-stat');
        const completedStat = document.getElementById('completed-stat');
        const overdueStat = document.getElementById('overdue-stat');
        const lastRefresh = document.getElementById('workorders-last-refresh');

        if (openStat) openStat.textContent = openCount.toLocaleString();
        if (progressStat) progressStat.textContent = progressCount.toLocaleString();
        if (completedStat) completedStat.textContent = completedCount.toLocaleString();
        if (overdueStat) overdueStat.textContent = overdueCount.toLocaleString();
        if (lastRefresh) lastRefresh.textContent = new Date().toLocaleString();
    },

    loadWorkOrderTypes: async () => {
        const dbTypes = supabaseClient ? await fetchWorkOrderTypes() : null;
        const normalizedDbTypes = (dbTypes || [])
            .filter(type => type?.code && type?.label)
            .map(type => ({
                value: type.code,
                label: type.label
            }));

        if (normalizedDbTypes.length) {
            AppState.workOrderTypes = normalizedDbTypes;
        } else if (shouldUseMockData()) {
            AppState.workOrderTypes = (DefaultWorkOrderTypes || []).map(type => ({
                value: type.code,
                label: type.label
            }));
        } else {
            AppState.workOrderTypes = [];
            if (supabaseClient) {
                showToast('No work order types found (or unable to read them). Check Supabase table + RLS.', 'warning');
            } else {
                showToast('Supabase is not connected. Work order types could not be loaded.', 'warning');
            }
        }

        WorkOrderManager.populateAssetOptions();
        WorkOrderManager.populateTechnicianOptions();
        WorkOrderManager.populateWorkOrderTypes();
        await WorkOrderManager.populateChecklistOptions();
    },

    populateAssetOptions: () => {
        const assetSelect = document.getElementById('workorder-asset-select');
        if (!assetSelect) return;

        assetSelect.innerHTML = '<option value="">Select Asset</option>';
        AppState.assets.forEach(asset => {
            const option = document.createElement('option');
            option.value = asset.id;
            
            // Show only Category and Asset Name - NO Asset ID (since it's read-only in database)
            const category = asset.category 
                ? `[${asset.category.charAt(0).toUpperCase() + asset.category.slice(1)}]` 
                : '';
            const assetName = asset.name || 'Unnamed Asset';
            
            // Format: [Category] Asset Name (no Asset ID)
            option.textContent = category ? `${category} ${assetName}`.trim() : assetName;
            
            assetSelect.appendChild(option);
        });
    },

    populateTechnicianOptions: () => {
        const technicianSelect = document.getElementById('workorder-technician-select');
        const technicianFilter = document.getElementById('technician-filter');
        if (technicianSelect) {
            technicianSelect.innerHTML = '<option value="">Select technician</option>';
        }
        if (technicianFilter) {
            technicianFilter.innerHTML = '<option value="">All Technicians</option>';
        }

        AppState.technicians.forEach(tech => {
            const option = document.createElement('option');
            option.value = tech.id;
            option.textContent = tech.full_name;
            if (technicianSelect) technicianSelect.appendChild(option.cloneNode(true));
            if (technicianFilter) technicianFilter.appendChild(option);
        });
    },

    populateWorkOrderTypes: () => {
        const typeSelect = document.getElementById('workorder-type-select');
        if (!typeSelect) return;

        typeSelect.innerHTML = '<option value="">Select type</option>';
        AppState.workOrderTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.value;
            option.textContent = type.label;
            typeSelect.appendChild(option);
        });
    },

    populateChecklistOptions: async () => {
        const checklistSelect = document.getElementById('workorder-checklist-select');
        if (!checklistSelect) return;

        checklistSelect.innerHTML = '<option value="">No checklist</option>';

        if (!supabaseClient) return;

        try {
            const { data: checklists, error } = await supabaseClient
                .from('checklists')
                .select('id, name, category')
                .eq('is_active', true)
                .order('name', { ascending: true });

            if (error) throw error;

            if (checklists && checklists.length > 0) {
                checklists.forEach(checklist => {
                    const option = document.createElement('option');
                    option.value = checklist.id;
                    const displayName = checklist.category 
                        ? `${checklist.name} [${checklist.category}]`
                        : checklist.name;
                    option.textContent = displayName;
                    checklistSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading checklists:', error);
        }
    },

    formatWorkOrderType: (type) => {
        const normalized = WorkOrderManager.toDatabaseWorkOrderType(type);
        if (!normalized) return 'General';
        const match = AppState.workOrderTypes.find(entry => entry.value === normalized);
        if (match?.label) return match.label;
        return normalized.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
    },

    formatDate: (dateValue) => {
        if (!dateValue) return '--';
        const parsed = new Date(dateValue);
        if (Number.isNaN(parsed.getTime())) return '--';
        return parsed.toLocaleDateString();
    },

    // Enhanced Work Order Modal Functions
    currentWorkOrderId: null,
    timerInterval: null,
    timerStartTime: null,
    timerElapsed: 0,
    currentTab: 'details',

    switchWOTab: (tab) => {
        WorkOrderManager.currentTab = tab;
        const detailsTab = document.getElementById('wo-details-tab');
        const updatesTab = document.getElementById('wo-updates-tab');
        const detailsContent = document.getElementById('wo-details-content');
        const updatesContent = document.getElementById('wo-updates-content');

        if (tab === 'details') {
            detailsTab.classList.add('border-blue-600', 'text-blue-600');
            detailsTab.classList.remove('border-transparent', 'text-slate-600');
            updatesTab.classList.remove('border-blue-600', 'text-blue-600');
            updatesTab.classList.add('border-transparent', 'text-slate-600');
            detailsContent.classList.remove('hidden');
            updatesContent.classList.add('hidden');
        } else {
            updatesTab.classList.add('border-blue-600', 'text-blue-600');
            updatesTab.classList.remove('border-transparent', 'text-slate-600');
            detailsTab.classList.remove('border-blue-600', 'text-blue-600');
            detailsTab.classList.add('border-transparent', 'text-slate-600');
            updatesContent.classList.remove('hidden');
            detailsContent.classList.add('hidden');
        }
    },

    toggleTimer: () => {
        const btn = document.getElementById('wo-timer-btn');
        const display = document.getElementById('wo-timer-display');
        
        if (WorkOrderManager.timerInterval) {
            // Stop timer
            clearInterval(WorkOrderManager.timerInterval);
            WorkOrderManager.timerInterval = null;
            btn.innerHTML = '<i class="fas fa-play mr-2"></i>Run Timer - <span id="wo-timer-display">' + WorkOrderManager.formatTimer(WorkOrderManager.timerElapsed) + '</span>';
            btn.classList.remove('bg-red-600');
            btn.classList.add('bg-blue-600');
        } else {
            // Start timer
            WorkOrderManager.timerStartTime = Date.now() - WorkOrderManager.timerElapsed;
            WorkOrderManager.timerInterval = setInterval(() => {
                WorkOrderManager.timerElapsed = Date.now() - WorkOrderManager.timerStartTime;
                display.textContent = WorkOrderManager.formatTimer(WorkOrderManager.timerElapsed);
            }, 1000);
            btn.innerHTML = '<i class="fas fa-stop mr-2"></i>Stop Timer - <span id="wo-timer-display">0:00</span>';
            btn.classList.remove('bg-blue-600');
            btn.classList.add('bg-red-600');
        }
    },

    formatTimer: (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        if (hours > 0) {
            return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
        return `${minutes}:${String(seconds).padStart(2, '0')}`;
    },


    showAddTimeModal: (mode = 'view') => {
        const workOrderId = mode === 'create' ? 'CREATE' : WorkOrderManager.currentWorkOrderId;
        if (!workOrderId && mode !== 'create') {
            showToast('No work order selected', 'error');
            return;
        }

        document.getElementById('add-time-wo-id').value = workOrderId || '';
        document.getElementById('add-time-mode').value = mode;
        document.getElementById('add-time-date').value = new Date().toISOString().split('T')[0];
        
        // Populate technician dropdown
        const techSelect = document.getElementById('add-time-technician');
        if (techSelect) {
            techSelect.innerHTML = '<option value="">Select Technician</option>';
            AppState.technicians.forEach(tech => {
                const option = document.createElement('option');
                option.value = tech.id;
                option.textContent = tech.full_name || 'Unnamed Technician';
                techSelect.appendChild(option);
            });
        }

        // Calculate total when hours or rate changes
        const hoursInput = document.getElementById('add-time-hours');
        const rateInput = document.getElementById('add-time-rate');
        const totalInput = document.getElementById('add-time-total');
        
        const calculateTotal = () => {
            const hours = parseFloat(hoursInput.value) || 0;
            const rate = parseFloat(rateInput.value) || 0;
            if (rate > 0) {
                const total = hours * rate;
                totalInput.value = '$' + total.toFixed(2);
            } else {
                totalInput.value = hours > 0 ? `${hours} hour(s) - No rate specified` : '--';
            }
        };
        
        hoursInput.addEventListener('input', calculateTotal);
        rateInput.addEventListener('input', calculateTotal);

        openModal('add-time-modal');
    },

    showAddCostModal: (mode = 'view') => {
        const workOrderId = mode === 'create' ? 'CREATE' : WorkOrderManager.currentWorkOrderId;
        if (!workOrderId && mode !== 'create') {
            showToast('No work order selected', 'error');
            return;
        }

        document.getElementById('add-cost-wo-id').value = workOrderId || '';
        document.getElementById('add-cost-mode').value = mode;
        document.getElementById('add-cost-date').value = new Date().toISOString().split('T')[0];
        openModal('add-cost-modal');
    },

    showLinkWorkOrdersModal: (mode = 'view') => {
        const workOrderId = mode === 'create' ? 'CREATE' : WorkOrderManager.currentWorkOrderId;
        if (!workOrderId && mode !== 'create') {
            showToast('No work order selected', 'error');
            return;
        }

        document.getElementById('link-wo-id').value = workOrderId || '';
        document.getElementById('link-wo-mode').value = mode;
        
        // Populate work orders dropdown (exclude current work order)
        const woSelect = document.getElementById('link-wo-select');
        if (woSelect) {
            woSelect.innerHTML = '<option value="">Select Work Order</option>';
            AppState.workOrders.forEach(wo => {
                if (wo.id !== workOrderId) {
                    const option = document.createElement('option');
                    option.value = wo.id;
                    const asset = AppState.assets.find(a => a.id === wo.asset_id);
                    const assetName = asset ? asset.name : 'Unknown Asset';
                    option.textContent = `${wo.id} - ${assetName}`;
                    woSelect.appendChild(option);
                }
            });
        }

        openModal('link-workorders-modal');
    },

    showAddFileModal: (mode = 'view') => {
        const workOrderId = mode === 'create' ? 'CREATE' : WorkOrderManager.currentWorkOrderId;
        if (!workOrderId && mode !== 'create') {
            showToast('No work order selected', 'error');
            return;
        }

        document.getElementById('add-file-wo-id').value = workOrderId || '';
        document.getElementById('add-file-mode').value = mode;
        document.getElementById('add-file-input').value = '';
        document.getElementById('add-file-description').value = '';
        document.getElementById('add-file-progress').classList.add('hidden');
        openModal('add-file-modal');
    },

    linkWorkOrders: () => {
        WorkOrderManager.toggleActionMenu();
        WorkOrderManager.showLinkWorkOrdersModal();
    },

    exportPDFReport: async () => {
        // Redirect to new PDF generation function
        if (typeof generateWorkOrderPDF === 'function') {
            generateWorkOrderPDF();
        } else {
            showToast('PDF generation not available', 'error');
        }
    },
    
    // Legacy function - redirects to new PDF generator
    generatePDF: async () => {
        WorkOrderManager.toggleActionMenu();
        const workOrderId = WorkOrderManager.currentWorkOrderId;
        if (!workOrderId) {
            showToast('No work order selected', 'error');
            return;
        }

        const workOrder = AppState.workOrders.find(wo => wo.id === workOrderId);
        if (!workOrder) {
            showToast('Work order not found', 'error');
            return;
        }

        // Generate PDF report
        try {
            const asset = AppState.assets.find(a => a.id === workOrder.asset_id);
            const technician = AppState.technicians.find(t => t.id === workOrder.assigned_technician_id);
            
            // Create PDF content
            const pdfContent = `
                <html>
                <head>
                    <title>Work Order Report - ${workOrder.id}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        h1 { color: #2563eb; }
                        .section { margin: 20px 0; }
                        .label { font-weight: bold; }
                        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f8fafc; }
                    </style>
                </head>
                <body>
                    <h1>Work Order Report</h1>
                    <div class="section">
                        <p><span class="label">Work Order ID:</span> ${workOrder.id}</p>
                        <p><span class="label">Status:</span> ${workOrder.status}</p>
                        <p><span class="label">Priority:</span> ${workOrder.priority}</p>
                        <p><span class="label">Asset:</span> ${asset ? asset.name : 'N/A'}</p>
                        <p><span class="label">Technician:</span> ${technician ? technician.full_name : 'Unassigned'}</p>
                        <p><span class="label">Due Date:</span> ${WorkOrderManager.formatDate(workOrder.due_date)}</p>
                        <p><span class="label">Created Date:</span> ${WorkOrderManager.formatDate(workOrder.created_date)}</p>
                    </div>
                    <div class="section">
                        <h2>Description</h2>
                        <p>${workOrder.description || 'No description provided'}</p>
                    </div>
                    <div class="section">
                        <h2>Cost Summary</h2>
                        <p><span class="label">Total Cost:</span> $${parseFloat(workOrder.cost || 0).toFixed(2)}</p>
                    </div>
                </body>
                </html>
            `;

            // Open in new window for printing
            const printWindow = window.open('', '_blank');
            printWindow.document.write(pdfContent);
            printWindow.document.close();
            printWindow.print();
            
            showToast('PDF report generated. Use browser print to save as PDF.', 'success');
        } catch (error) {
            console.error('Error generating PDF:', error);
            showToast('Failed to generate PDF report', 'error');
        }
    },

    archiveWorkOrder: async () => {
        WorkOrderManager.toggleActionMenu();
        const workOrderId = WorkOrderManager.currentWorkOrderId;
        if (!workOrderId) {
            showToast('No work order selected', 'error');
            return;
        }

        if (!confirm('Are you sure you want to archive this work order?')) {
            return;
        }

        if (!supabaseClient) {
            showToast('Database not connected', 'error');
            return;
        }

        try {
            const { error } = await supabaseClient
                .from('work_orders')
                .update({ status: 'archived' })
                .eq('id', workOrderId);

            if (error) throw error;

            showToast('Work order archived successfully', 'success');
            await WorkOrderManager.loadWorkOrders();
            WorkOrderManager.renderWorkOrders();
            WorkOrderManager.renderWorkOrdersList();
            WorkOrderManager.closeWorkOrderModal();
        } catch (error) {
            console.error('Error archiving work order:', error);
            showToast('Failed to archive work order', 'error');
        }
    },

    editWorkOrder: () => {
        // Enable editing mode
        const form = document.getElementById('view-workorder-form');
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.id !== 'view-workorder-wo-id') {
                input.disabled = false;
                input.classList.remove('bg-slate-100');
            }
        });
        showToast('Edit mode enabled', 'info');
    },

    deleteWorkOrder: async () => {
        const workOrderId = WorkOrderManager.currentWorkOrderId;
        if (!workOrderId) {
            showToast('No work order selected', 'error');
            return;
        }

        if (!confirm('Are you sure you want to delete this work order? This action cannot be undone.')) {
            return;
        }

        if (!supabaseClient) {
            showToast('Database not connected', 'error');
            return;
        }

        try {
            const { error } = await supabaseClient
                .from('work_orders')
                .delete()
                .eq('id', workOrderId);

            if (error) throw error;

            showToast('Work order deleted successfully', 'success');
            await WorkOrderManager.loadWorkOrders();
            WorkOrderManager.renderWorkOrders();
            WorkOrderManager.renderWorkOrdersList();
            WorkOrderManager.closeWorkOrderModal();
        } catch (error) {
            console.error('Error deleting work order:', error);
            showToast('Failed to delete work order', 'error');
        }
    },

    addUpdate: async () => {
        const updateText = document.getElementById('wo-update-text').value.trim();
        if (!updateText) {
            showToast('Please enter an update', 'warning');
            return;
        }

        const workOrderId = WorkOrderManager.currentWorkOrderId;
        if (!workOrderId) {
            showToast('No work order selected', 'error');
            return;
        }

        if (!supabaseClient) {
            showToast('Database not connected', 'error');
            return;
        }

        try {
            const { error } = await supabaseClient
                .from('work_order_updates')
                .insert({
                    work_order_id: workOrderId,
                    update_text: updateText,
                    update_type: 'note'
                });

            if (error) throw error;

            showToast('Update added successfully', 'success');
            document.getElementById('wo-update-text').value = '';
            await WorkOrderManager.loadUpdates(workOrderId);
        } catch (error) {
            console.error('Error adding update:', error);
            showToast('Failed to add update', 'error');
        }
    },

    loadUpdates: async (workOrderId) => {
        const timeline = document.getElementById('wo-updates-timeline');
        if (!timeline) return;

        if (!supabaseClient) {
            timeline.innerHTML = '<p class="text-xs text-slate-500 italic">No updates yet</p>';
            return;
        }

        try {
            const { data, error } = await supabaseClient
                .from('work_order_updates')
                .select('*')
                .eq('work_order_id', workOrderId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!data || data.length === 0) {
                timeline.innerHTML = '<p class="text-xs text-slate-500 italic">No updates yet</p>';
                return;
            }

            timeline.innerHTML = data.map(update => {
                const date = new Date(update.created_at);
                const dateStr = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                return `
                    <div class="flex gap-3 p-3 bg-white rounded-lg border border-slate-200">
                        <div class="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        <div class="flex-1">
                            <p class="text-sm text-slate-800">${update.update_text}</p>
                            <p class="text-xs text-slate-500 mt-1">${dateStr}</p>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Error loading updates:', error);
            timeline.innerHTML = '<p class="text-xs text-red-500 italic">Error loading updates</p>';
        }
    },

    loadLaborCosts: async (workOrderId) => {
        const list = document.getElementById('wo-labor-costs-list');
        const totalEl = document.getElementById('wo-labor-total');
        const totalAmountEl = document.getElementById('wo-labor-total-amount');
        
        if (!list) return;

        if (!supabaseClient) {
            list.innerHTML = '<p class="text-xs text-slate-500 italic">No labor costs have been added yet. They\'ll show up here when a user logs time.</p>';
            return;
        }

        try {
            // First, get all labor records
            const { data: laborData, error: laborError } = await supabaseClient
                .from('work_order_labor')
                .select('*')
                .eq('work_order_id', workOrderId)
                .order('date', { ascending: false });

            if (laborError) throw laborError;

            if (!laborData || laborData.length === 0) {
                list.innerHTML = '<p class="text-xs text-slate-500 italic">No labor costs have been added yet. They\'ll show up here when a user logs time.</p>';
                if (totalEl) totalEl.classList.add('hidden');
                return;
            }

            // Get unique technician IDs (filter out null/empty)
            const techIds = [...new Set(laborData.map(item => item.technician_id).filter(id => id))];
            
            // Fetch technician names if we have IDs
            let techniciansMap = new Map();
            if (techIds.length > 0) {
                // Fetch all technicians and match by converting IDs to strings
                const { data: techData, error: techError } = await supabaseClient
                    .from('technicians')
                    .select('id, full_name');
                
                if (!techError && techData) {
                    techData.forEach(tech => {
                        // Store both UUID and string versions for matching
                        techniciansMap.set(String(tech.id), tech.full_name);
                        techniciansMap.set(tech.id, tech.full_name);
                    });
                }
            }

            let total = 0;
            list.innerHTML = laborData.map(item => {
                const cost = parseFloat(item.total_cost || 0);
                total += cost;
                
                // Get technician name - try both UUID and text matching
                let techName = 'Unknown Technician';
                if (item.technician_id) {
                    // Try direct match first
                    if (techniciansMap.has(item.technician_id)) {
                        techName = techniciansMap.get(item.technician_id);
                    } else {
                        // Try to find by converting to UUID or matching as text
                        for (const [techId, name] of techniciansMap.entries()) {
                            if (String(techId) === String(item.technician_id)) {
                                techName = name;
                                break;
                            }
                        }
                    }
                }
                
                const date = new Date(item.date).toLocaleDateString();
                const hourlyRate = parseFloat(item.hourly_rate || 0);
                const rateDisplay = hourlyRate > 0 ? `@ $${hourlyRate.toFixed(2)}/hr` : '(No rate specified)';
                const costDisplay = cost > 0 ? `$${cost.toFixed(2)}` : 'No cost';
                return `
                    <div class="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                        <div class="flex-1">
                            <p class="text-sm font-medium text-slate-800">${techName}</p>
                            <p class="text-xs text-slate-500">${item.hours} hours ${rateDisplay} • ${date}</p>
                            ${item.notes ? `<p class="text-xs text-slate-600 mt-1">${escapeHtml(item.notes)}</p>` : ''}
                        </div>
                        <div class="flex items-center gap-3">
                            <span class="text-sm font-semibold text-slate-800">${costDisplay}</span>
                            <button onclick="WorkOrderManager.deleteLaborCost('${item.id}')" class="text-red-600 hover:text-red-800">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            if (totalEl && totalAmountEl) {
                if (total > 0) {
                    totalEl.classList.remove('hidden');
                    totalAmountEl.textContent = '$' + total.toFixed(2);
                } else {
                    totalEl.classList.add('hidden');
                }
            }
        } catch (error) {
            console.error('Error loading labor costs:', error);
            list.innerHTML = '<p class="text-xs text-red-500 italic">Error loading labor costs</p>';
        }
    },

    loadAdditionalCosts: async (workOrderId) => {
        const list = document.getElementById('wo-additional-costs-list');
        const totalEl = document.getElementById('wo-additional-total');
        const totalAmountEl = document.getElementById('wo-additional-total-amount');
        
        if (!list) return;

        if (!supabaseClient) {
            list.innerHTML = '<p class="text-xs text-slate-500 italic">No additional costs have been added yet</p>';
            return;
        }

        try {
            const { data: costsData, error: costsError } = await supabaseClient
                .from('work_order_additional_costs')
                .select('*')
                .eq('work_order_id', workOrderId)
                .order('date', { ascending: false });

            if (costsError) throw costsError;

            if (!costsData || costsData.length === 0) {
                list.innerHTML = '<p class="text-xs text-slate-500 italic">No additional costs have been added yet</p>';
                if (totalEl) totalEl.classList.add('hidden');
                if (totalAmountEl) totalAmountEl.textContent = '$0.00';
                return;
            }

            let total = 0;
            list.innerHTML = costsData.map(item => {
                const amount = parseFloat(item.amount || 0);
                total += amount;
                
                const date = new Date(item.date).toLocaleDateString();
                const amountDisplay = amount > 0 ? `$${amount.toFixed(2)}` : 'No cost';
                return `
                    <div class="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                        <div class="flex-1">
                            <p class="text-sm font-medium text-slate-800">${escapeHtml(item.description || 'No description')}</p>
                            <p class="text-xs text-slate-500">${item.category ? escapeHtml(item.category) + ' • ' : ''}${date}</p>
                        </div>
                        <div class="flex items-center gap-3">
                            <span class="text-sm font-semibold text-slate-800">${amountDisplay}</span>
                            <button onclick="WorkOrderManager.deleteAdditionalCost('${item.id}')" class="text-red-600 hover:text-red-800">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');

            if (totalEl && totalAmountEl) {
                if (total > 0) {
                    totalEl.classList.remove('hidden');
                    totalAmountEl.textContent = '$' + total.toFixed(2);
                } else {
                    totalEl.classList.add('hidden');
                    totalAmountEl.textContent = '$0.00';
                }
            }
            
            // Update total cost after loading additional costs
            WorkOrderManager.updateTotalCost();
        } catch (error) {
            console.error('Error loading additional costs:', error);
            list.innerHTML = '<p class="text-xs text-red-500 italic">Error loading additional costs</p>';
        }
    },

    loadLinks: async (workOrderId) => {
        // TODO: Load linked work orders from database
        const list = document.getElementById('wo-links-list');
        if (list) {
            list.innerHTML = '<p class="text-xs text-slate-500 italic">No work orders linked</p>';
        }
    },

    loadFiles: async (workOrderId) => {
        // TODO: Load files from database/storage
        const list = document.getElementById('wo-files-list');
        if (list) {
            list.innerHTML = '<p class="text-xs text-slate-500 italic">No file attached to this work order</p>';
        }
    },

    updateTotalCost: () => {
        const partsTotal = parseFloat(document.getElementById('view-wo-parts-total-amount')?.textContent.replace('$', '') || 0);
        const laborTotal = parseFloat(document.getElementById('wo-labor-total-amount')?.textContent.replace('$', '') || 0);
        const additionalTotal = parseFloat(document.getElementById('wo-additional-total-amount')?.textContent.replace('$', '') || 0);
        const total = partsTotal + laborTotal + additionalTotal;
        const totalEl = document.getElementById('wo-total-cost');
        if (totalEl) {
            totalEl.textContent = '$' + total.toFixed(2);
        }
    },

    updateStatusFromHeader: () => {
        const statusHeader = document.getElementById('workorder-status-header');
        const statusSelect = document.getElementById('workorder-status');
        if (statusHeader && statusSelect) {
            statusSelect.value = statusHeader.value;
        }
    },
    
    switchWOTab: (tab) => {
        // Hide all tab contents
        document.getElementById('wo-details-content')?.classList.add('hidden');
        document.getElementById('wo-updates-content')?.classList.add('hidden');
        
        // Remove active state from all tabs
        document.getElementById('wo-details-tab')?.classList.remove('border-blue-600', 'text-blue-600');
        document.getElementById('wo-details-tab')?.classList.add('border-transparent', 'text-slate-600');
        document.getElementById('wo-updates-tab')?.classList.remove('border-blue-600', 'text-blue-600');
        document.getElementById('wo-updates-tab')?.classList.add('border-transparent', 'text-slate-600');
        
        if (tab === 'details') {
            document.getElementById('wo-details-content')?.classList.remove('hidden');
            document.getElementById('wo-details-tab')?.classList.remove('border-transparent', 'text-slate-600');
            document.getElementById('wo-details-tab')?.classList.add('border-blue-600', 'text-blue-600');
        } else if (tab === 'updates') {
            document.getElementById('wo-updates-content')?.classList.remove('hidden');
            document.getElementById('wo-updates-tab')?.classList.remove('border-transparent', 'text-slate-600');
            document.getElementById('wo-updates-tab')?.classList.add('border-blue-600', 'text-blue-600');
        }
    }
};

// SettingsManager moved to js/settings-manager.js to avoid duplicate declaration
// SettingsManager has been moved to js/settings-manager.js
// This legacy code is kept for reference but should not be used
// Commented out to prevent duplicate declaration errors
/*
const SettingsManagerLegacy = {
    elements: {
        technicianForm: null,
        technicianList: null,
        workOrderTypeForm: null,
        workOrderTypeTable: null,
        workOrderTypeCode: null,
        workOrderTypeLabel: null,
        workOrderTypeDescription: null,
        workOrderTypeSort: null,
        workOrderTypeActive: null,
        workOrderTypeSubmit: null,
        workOrderTypeCancel: null
    },
    workOrderTypeEditId: null,

    init: async () => {
        SettingsManagerLegacy.cacheElements();
        SettingsManagerLegacy.bindEvents();
        await SettingsManagerLegacy.loadTechnicians();
        await SettingsManagerLegacy.loadWorkOrderTypes();
    },

    cacheElements: () => {
        SettingsManager.elements.technicianForm = document.getElementById('technician-form');
        SettingsManager.elements.technicianList = document.getElementById('technician-list');
        SettingsManager.elements.workOrderTypeForm = document.getElementById('work-order-type-form');
        SettingsManager.elements.workOrderTypeTable = document.getElementById('work-order-types-table');
        SettingsManager.elements.workOrderTypeCode = document.getElementById('work-order-type-code');
        SettingsManager.elements.workOrderTypeLabel = document.getElementById('work-order-type-label');
        SettingsManager.elements.workOrderTypeDescription = document.getElementById('work-order-type-description');
        SettingsManager.elements.workOrderTypeSort = document.getElementById('work-order-type-sort');
        SettingsManager.elements.workOrderTypeActive = document.getElementById('work-order-type-active');
        SettingsManager.elements.workOrderTypeSubmit = document.getElementById('work-order-type-submit');
        SettingsManager.elements.workOrderTypeCancel = document.getElementById('work-order-type-cancel');
    },

    bindEvents: () => {
        if (SettingsManager.elements.technicianForm) {
            SettingsManager.elements.technicianForm.addEventListener('submit', SettingsManager.handleTechnicianSubmit);
        }
        if (SettingsManager.elements.workOrderTypeForm) {
            SettingsManager.elements.workOrderTypeForm.addEventListener('submit', SettingsManager.handleWorkOrderTypeSubmit);
        }
        if (SettingsManager.elements.workOrderTypeCancel) {
            SettingsManager.elements.workOrderTypeCancel.addEventListener('click', SettingsManager.resetWorkOrderTypeForm);
        }
    },

    loadTechnicians: async () => {
        if (!supabaseClient) {
            SettingsManager.renderTechnicians([]);
            return;
        }

        try {
            const { data, error } = await supabaseClient
                .from('technicians')
                .select('id, full_name, role, email, phone, is_active')
                .order('full_name', { ascending: true });

            if (error) throw error;

            SettingsManager.renderTechnicians(data || []);
        } catch (error) {
            console.error('Error loading technicians:', error);
            SettingsManager.renderTechnicians([]);
        }
    },

    renderTechnicians: (technicians) => {
        const list = SettingsManager.elements.technicianList;
        if (!list) return;

        list.innerHTML = '';

        if (!technicians.length) {
            const emptyItem = document.createElement('li');
            emptyItem.className = 'text-slate-500';
            emptyItem.textContent = 'No technicians found.';
            list.appendChild(emptyItem);
            return;
        }

        technicians.forEach(tech => {
            const item = document.createElement('li');
            item.className = 'flex items-start justify-between gap-4 bg-slate-50 border border-slate-200 rounded-lg p-3';

            const details = document.createElement('div');
            const nameRow = document.createElement('div');
            nameRow.className = 'flex items-center gap-2';
            nameRow.innerHTML = `
                <span class="font-medium text-slate-800">${tech.full_name}</span>
                <span class="text-xs uppercase tracking-wide text-slate-500">${tech.role}</span>
            `;

            const meta = document.createElement('div');
            meta.className = 'text-xs text-slate-500 mt-1';
            const email = tech.email ? `Email: ${tech.email}` : 'Email: —';
            const phone = tech.phone ? `Phone: ${tech.phone}` : 'Phone: —';
            meta.textContent = `${email} · ${phone}`;

            details.appendChild(nameRow);
            details.appendChild(meta);

            const status = document.createElement('span');
            status.className = `status-badge ${tech.is_active ? 'status-active' : 'status-inactive'}`;
            status.innerHTML = `${tech.is_active ? '<span class="badge-pulse"></span>Active' : 'Inactive'}`;

            item.appendChild(details);
            item.appendChild(status);
            list.appendChild(item);
        });
    },

    setWorkOrderTypeFormEnabled: (isEnabled) => {
        const {
            workOrderTypeCode,
            workOrderTypeLabel,
            workOrderTypeDescription,
            workOrderTypeSort,
            workOrderTypeActive,
            workOrderTypeSubmit,
            workOrderTypeCancel
        } = SettingsManager.elements;

        [workOrderTypeCode, workOrderTypeLabel, workOrderTypeDescription, workOrderTypeSort, workOrderTypeActive].forEach(input => {
            if (input) input.disabled = !isEnabled;
        });
        if (workOrderTypeSubmit) workOrderTypeSubmit.disabled = !isEnabled;
        if (workOrderTypeCancel) workOrderTypeCancel.disabled = !isEnabled;
    },

    loadWorkOrderTypes: async () => {
        if (!SettingsManager.elements.workOrderTypeTable) return;

        if (!supabaseClient) {
            showToast('Supabase is not connected. Unable to manage work order types.', 'warning');
            SettingsManager.setWorkOrderTypeFormEnabled(false);
            if (shouldUseMockData()) {
                SettingsManager.renderWorkOrderTypes(DefaultWorkOrderTypes.map(type => ({
                    id: type.code,
                    code: type.code,
                    label: type.label,
                    description: type.description,
                    is_active: true,
                    sort_order: type.sort_order
                })));
            } else {
                SettingsManager.renderWorkOrderTypes([]);
            }
            return;
        }

        SettingsManager.setWorkOrderTypeFormEnabled(true);

        const { data, error } = await supabaseClient
            .from('work_order_types')
            .select('id, code, label, description, is_active, sort_order')
            .order('sort_order', { ascending: true })
            .order('label', { ascending: true });

        if (error) {
            console.error('Error loading work order types:', error);
            showToast('Unable to load work order types from database.', 'warning');
            SettingsManager.renderWorkOrderTypes([]);
            return;
        }

        SettingsManager.renderWorkOrderTypes(data || []);
    },

    renderWorkOrderTypes: (types) => {
        const table = SettingsManager.elements.workOrderTypeTable;
        if (!table) return;

        if (!types.length) {
            table.innerHTML = `
                <tr>
                    <td class="py-3 px-4 text-sm text-slate-500" colspan="6">No work order types found.</td>
                </tr>
            `;
            return;
        }

        table.innerHTML = types.map(type => `
            <tr class="border-b border-slate-100">
                <td class="py-3 px-4 text-sm text-slate-700">${type.label}</td>
                <td class="py-3 px-4 text-sm text-slate-500">${type.code}</td>
                <td class="py-3 px-4 text-sm text-slate-500">${type.description || '--'}</td>
                <td class="py-3 px-4 text-sm text-slate-500">${type.is_active ? 'Active' : 'Inactive'}</td>
                <td class="py-3 px-4 text-sm text-slate-500">${type.sort_order ?? 0}</td>
                <td class="py-3 px-4 text-right">
                    <button class="text-blue-600 hover:text-blue-800 text-sm font-semibold mr-3" data-action="edit" data-id="${type.id}">
                        Edit
                    </button>
                    <button class="text-red-600 hover:text-red-800 text-sm font-semibold" data-action="delete" data-id="${type.id}">
                        Delete
                    </button>
                </td>
            </tr>
        `).join('');

        table.querySelectorAll('button[data-action="edit"]').forEach(button => {
            button.addEventListener('click', () => {
                const match = types.find(type => type.id === button.dataset.id);
                if (match) {
                    SettingsManager.populateWorkOrderTypeForm(match);
                }
            });
        });

        table.querySelectorAll('button[data-action="delete"]').forEach(button => {
            button.addEventListener('click', () => SettingsManager.handleWorkOrderTypeDelete(button.dataset.id));
        });
    },

    populateWorkOrderTypeForm: (type) => {
        SettingsManager.workOrderTypeEditId = type.id;
        if (SettingsManager.elements.workOrderTypeCode) SettingsManager.elements.workOrderTypeCode.value = type.code || '';
        if (SettingsManager.elements.workOrderTypeLabel) SettingsManager.elements.workOrderTypeLabel.value = type.label || '';
        if (SettingsManager.elements.workOrderTypeDescription) SettingsManager.elements.workOrderTypeDescription.value = type.description || '';
        if (SettingsManager.elements.workOrderTypeSort) SettingsManager.elements.workOrderTypeSort.value = type.sort_order ?? 0;
        if (SettingsManager.elements.workOrderTypeActive) SettingsManager.elements.workOrderTypeActive.checked = !!type.is_active;
        if (SettingsManager.elements.workOrderTypeSubmit) {
            SettingsManager.elements.workOrderTypeSubmit.innerHTML = '<i class="fas fa-save"></i>Save Changes';
        }
    },

    resetWorkOrderTypeForm: () => {
        SettingsManager.workOrderTypeEditId = null;
        if (SettingsManager.elements.workOrderTypeForm) {
            SettingsManager.elements.workOrderTypeForm.reset();
        }
        if (SettingsManager.elements.workOrderTypeSort) SettingsManager.elements.workOrderTypeSort.value = 0;
        if (SettingsManager.elements.workOrderTypeActive) SettingsManager.elements.workOrderTypeActive.checked = true;
        if (SettingsManager.elements.workOrderTypeSubmit) {
            SettingsManager.elements.workOrderTypeSubmit.innerHTML = '<i class="fas fa-plus"></i>Add Type';
        }
    },

    handleWorkOrderTypeSubmit: async (event) => {
        event.preventDefault();

        if (!supabaseClient) {
            showToast('Supabase is not connected. Unable to save work order types.', 'warning');
            return;
        }

        const code = SettingsManager.elements.workOrderTypeCode?.value?.trim() || '';
        const label = SettingsManager.elements.workOrderTypeLabel?.value?.trim() || '';
        const description = SettingsManager.elements.workOrderTypeDescription?.value?.trim() || '';
        const sortOrder = SettingsManager.elements.workOrderTypeSort?.value ? Number(SettingsManager.elements.workOrderTypeSort.value) : 0;
        const isActive = SettingsManager.elements.workOrderTypeActive?.checked ?? true;

        if (!code || !label) {
            showToast('Please provide both a type code and label.', 'warning');
            return;
        }

        const payload = {
            code,
            label,
            description: description || null,
            sort_order: Number.isNaN(sortOrder) ? 0 : sortOrder,
            is_active: isActive
        };

        let result;
        if (SettingsManager.workOrderTypeEditId) {
            result = await supabaseClient
                .from('work_order_types')
                .update(payload)
                .eq('id', SettingsManager.workOrderTypeEditId)
                .select('id')
                .single();
        } else {
            result = await supabaseClient
                .from('work_order_types')
                .insert(payload)
                .select('id')
                .single();
        }

        if (result.error) {
            console.error('Error saving work order type:', result.error);
            showToast('Unable to save work order type.', 'error');
            return;
        }

        SettingsManager.resetWorkOrderTypeForm();
        await SettingsManager.loadWorkOrderTypes();
        showToast('Work order type saved successfully.', 'success');
    },

    handleWorkOrderTypeDelete: async (typeId) => {
        if (!supabaseClient) {
            showToast('Supabase is not connected. Unable to delete work order types.', 'warning');
            return;
        }

        if (!typeId) return;
        const confirmDelete = window.confirm('Delete this work order type? This cannot be undone.');
        if (!confirmDelete) return;

        const { error } = await supabaseClient
            .from('work_order_types')
            .delete()
            .eq('id', typeId);

        if (error) {
            console.error('Error deleting work order type:', error);
            showToast('Unable to delete work order type.', 'error');
            return;
        }

        if (SettingsManager.workOrderTypeEditId === typeId) {
            SettingsManager.resetWorkOrderTypeForm();
        }

        await SettingsManager.loadWorkOrderTypes();
        showToast('Work order type deleted.', 'success');
    },

    handleTechnicianSubmit: async (event) => {
        event.preventDefault();
        if (!supabaseClient) {
            return;
        }

        const form = event.target;
        const formData = new FormData(form);
        const payload = {
            full_name: formData.get('full_name')?.toString().trim(),
            role: formData.get('role') || 'technician',
            phone: formData.get('phone')?.toString().trim() || null,
            email: formData.get('email')?.toString().trim() || null,
            is_active: formData.get('is_active') === 'on'
        };

        if (!payload.full_name) {
            showToast('Please provide a technician name.', 'warning');
            return;
        }

        try {
            const { error } = await supabaseClient
                .from('technicians')
                .insert([payload]);

            if (error) throw error;

            form.reset();
            const activeToggle = form.querySelector('input[name="is_active"]');
            if (activeToggle) activeToggle.checked = true;

            showToast('Technician added successfully.', 'success');
            await SettingsManager.loadTechnicians();
        } catch (error) {
            console.error('Error adding technician:', error);
            showToast('Failed to add technician.', 'error');
        }
    }
};
*/

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) {
        // Create toast container if it doesn't exist
        const newContainer = document.createElement('div');
        newContainer.id = 'toast-container';
        newContainer.className = 'fixed bottom-4 right-4 z-50';
        document.body.appendChild(newContainer);
        return showToast(message, type); // Retry with new container
    }

    const toast = document.createElement('div');
    const typeStyles = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        warning: 'bg-amber-500',
        info: 'bg-blue-600'
    };

    toast.className = `text-white px-4 py-3 rounded-lg shadow-lg mb-3 flex items-center space-x-3 ${typeStyles[type] || typeStyles.info}`;
    toast.innerHTML = `
        <span class="font-semibold">${message}</span>
        <button class="ml-auto text-white/80 hover:text-white" aria-label="Close notification">
            <i class="fas fa-times"></i>
        </button>
    `;

    const closeButton = toast.querySelector('button');
    if (closeButton) {
        closeButton.addEventListener('click', () => toast.remove());
    }

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 4000);
}

// Expose showToast globally for all pages
window.showToast = showToast;

function switchTab(tabId) {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.classList.toggle('active', button.dataset.tab === tabId);
    });

    tabContents.forEach(content => {
        const isActive = content.id === tabId;
        content.classList.toggle('active', isActive);
        content.style.display = isActive ? 'block' : 'none';
    });
}

function toggleSetting(toggleButton) {
    if (!toggleButton) return;
    const isActive = toggleButton.classList.toggle('active');
    toggleButton.setAttribute('aria-checked', String(isActive));
}

function showComingSoon() {
    showToast('This feature is coming soon.', 'info');
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

function showAddCustomerModal() {
    openModal('customer-modal');
}

function hideCustomerModal() {
    closeModal('customer-modal');
}

function showLocationModal() {
    openModal('location-modal');
}

function hideLocationModal() {
    closeModal('location-modal');
}

// Unified Work Order Modal Functions
function showCreateWorkOrderModal() {
    if (typeof WorkOrderManager !== 'undefined' && WorkOrderManager.openWorkOrderModal) {
        WorkOrderManager.openWorkOrderModal('create');
    } else {
        console.error('WorkOrderManager.openWorkOrderModal is not available');
        if (typeof showToast === 'function') {
            showToast('Work order system is initializing. Please try again.', 'warning');
        }
    }
}

// Expose to window for global access
window.showCreateWorkOrderModal = showCreateWorkOrderModal;

function hideCreateWorkOrderModal() {
    WorkOrderManager.closeWorkOrderModal();
}

function hideViewWorkOrderModal() {
    WorkOrderManager.closeWorkOrderModal();
}

// Add unified modal management to WorkOrderManager
if (typeof WorkOrderManager !== 'undefined') {
    WorkOrderManager.openWorkOrderModal = function(mode, workOrderId = null) {
        const modal = document.getElementById('workorder-modal');
        const modeInput = document.getElementById('workorder-mode');
        const titleEl = document.getElementById('workorder-modal-title');
        const submitBtn = document.getElementById('workorder-submit-btn');
        const cancelBtn = document.getElementById('workorder-cancel-btn');
        
        if (!modal) {
            console.error('Work order modal not found');
            return;
        }
        
        // Set mode
        if (modeInput) modeInput.value = mode;
        
        // Configure modal based on mode
        if (mode === 'create') {
            if (titleEl) titleEl.textContent = 'Create New Work Order';
            if (submitBtn) submitBtn.textContent = 'Create Work Order';
            if (cancelBtn) cancelBtn.textContent = 'Cancel';
            
            // Hide view-only elements
            document.getElementById('workorder-header-actions')?.classList.add('hidden');
            document.getElementById('workorder-action-menu-container')?.classList.add('hidden');
            document.getElementById('workorder-edit-btn')?.classList.add('hidden');
            document.getElementById('workorder-delete-btn')?.classList.add('hidden');
            document.getElementById('workorder-tabs')?.classList.add('hidden');
            document.getElementById('workorder-wo-id-container')?.classList.add('hidden');
            document.getElementById('wo-updates-content')?.classList.add('hidden');
            
            // Show details tab content
            document.getElementById('wo-details-content')?.classList.remove('hidden');
            
            // Reset form
            const form = document.getElementById('workorder-form');
            if (form) form.reset();
            
            // Populate dropdowns for create mode
            WorkOrderManager.populateWorkOrderAssetOptions();
            WorkOrderManager.populateWorkOrderTechnicianOptions();
            WorkOrderManager.populateWorkOrderTypeOptions();
            
            // Reset status to 'open'
            const statusSelect = document.getElementById('workorder-status');
            if (statusSelect) statusSelect.value = 'open';
            
            // Reset priority to 'medium'
            const prioritySelect = document.getElementById('workorder-priority-select');
            if (prioritySelect) prioritySelect.value = 'medium';
            
            // Initialize parts list
            if (typeof WorkOrderParts !== 'undefined') {
                const tempId = 'temp-' + Date.now();
                WorkOrderParts.workOrderParts[tempId] = [];
                const partsList = document.getElementById('wo-parts-list');
                if (partsList) {
                    partsList.innerHTML = '<p class="text-xs text-slate-500 italic">No parts added yet</p>';
                }
            }
            
            // Reset create mode data
            WorkOrderManager.createModeData = {
                labor: [],
                additionalCosts: [],
                links: [],
                files: []
            };
            
            // Reset total cost display
            const totalCostEl = document.getElementById('wo-total-cost');
            if (totalCostEl) totalCostEl.textContent = '$0.00';
        } else if (mode === 'view' && workOrderId) {
            // Will be populated by viewWorkOrder function
            WorkOrderManager.currentWorkOrderId = workOrderId;
        }
        
        openModal('workorder-modal');
    };
    
    WorkOrderManager.closeWorkOrderModal = function() {
        // Stop timer if running
        if (WorkOrderManager.timerInterval) {
            clearInterval(WorkOrderManager.timerInterval);
            WorkOrderManager.timerInterval = null;
        }
        WorkOrderManager.currentWorkOrderId = null;
        WorkOrderManager.timerElapsed = 0;
    
        // Close modal
        const modal = document.getElementById('workorder-modal');
        if (modal) {
            modal.classList.remove('active');
        }
        
        // Reset forms if they exist (don't throw error if they don't)
        try {
            const form = document.getElementById('workorder-form');
            if (form) form.reset();
            
            const viewForm = document.getElementById('view-workorder-form');
            if (viewForm) viewForm.reset();
        } catch (error) {
            console.warn('Error resetting forms:', error);
        }
    };
} // Close the if (typeof WorkOrderManager !== 'undefined') block

function showCustomReportModal() {
    showToast('Custom reporting is coming soon.', 'info');
}

function filterByCategory(category) {
    if (!assetManager || !assetManager.assets.length) {
        showToast('Assets are still loading. Please try again.', 'warning');
        return;
    }

    const filteredAssets = category === 'all'
        ? assetManager.assets
        : assetManager.assets.filter(asset => asset.category === category);

    const showingStart = document.getElementById('showing-start');
    if (showingStart) {
        showingStart.textContent = filteredAssets.length ? '1' : '0';
    }

    assetManager.renderFilteredAssets(filteredAssets);
}

function changePage(direction) {
    if (!assetManager || !assetManager.assets.length) {
        showToast('Assets are still loading. Please try again.', 'warning');
        return;
    }

    const totalPages = Math.ceil(assetManager.assets.length / assetManager.itemsPerPage);
    let nextPage = assetManager.currentPage;

    if (direction === 'prev') {
        nextPage = Math.max(1, assetManager.currentPage - 1);
    } else if (direction === 'next') {
        nextPage = Math.min(totalPages, assetManager.currentPage + 1);
    }

    if (nextPage !== assetManager.currentPage) {
        assetManager.goToPage(nextPage);
    }
}

function initCustomerPage() {
    const customerForm = document.getElementById('customer-form');
    if (customerForm) {
        customerForm.addEventListener('submit', (event) => {
            event.preventDefault();
            hideCustomerModal();
            showToast('Customer saved successfully', 'success');
        });
    }

    const locationForm = document.getElementById('location-form');
    if (locationForm) {
        locationForm.addEventListener('submit', (event) => {
            event.preventDefault();
            hideLocationModal();
            showToast('Location saved successfully', 'success');
        });
    }
}

function setupMobileMenu() {
    const button = document.getElementById('mobile-menu-button');
    const menu = document.getElementById('mobile-menu');

    if (!button || !menu) {
        console.warn('Mobile menu elements not found');
        return;
    }

    // Remove any existing event listeners by cloning and replacing
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    const newMenu = menu.cloneNode(true);
    menu.parentNode.replaceChild(newMenu, menu);

    const toggleMenu = () => {
        const isHidden = newMenu.classList.toggle('hidden');
        newButton.setAttribute('aria-expanded', String(!isHidden));
    };

    newButton.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu();
    });

    // Close menu when clicking links
    newMenu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (!newMenu.classList.contains('hidden')) {
                toggleMenu();
            }
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!newMenu.classList.contains('hidden') && 
            !newMenu.contains(e.target) && 
            !newButton.contains(e.target)) {
            toggleMenu();
        }
    });

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !newMenu.classList.contains('hidden')) {
            toggleMenu();
        }
    });
}

// Make function globally available
window.setupMobileMenu = setupMobileMenu;

function normalizePageName(pageName) {
    if (!pageName || pageName === 'index') {
        return 'dashboard';
    }

    if (pageName === 'work-orders') {
        return 'workorders';
    }

    return pageName;
}

// Checklist Management System
const ChecklistManager = {
    currentChecklistId: null,
    currentItems: [],
    currentTab: 'edit',

    init: async () => {
        ChecklistManager.bindEvents();
        await ChecklistManager.loadChecklists();
    },

    bindEvents: () => {
        const form = document.getElementById('checklist-form');
        if (form) {
            form.addEventListener('submit', ChecklistManager.handleSubmit);
        }
    },

    switchTab: (tab) => {
        ChecklistManager.currentTab = tab;
        const editTab = document.getElementById('checklist-edit-tab');
        const previewTab = document.getElementById('checklist-preview-tab');
        const form = document.getElementById('checklist-form');
        const previewContainer = document.getElementById('checklist-preview-container');
        
        if (tab === 'edit') {
            if (editTab) {
                editTab.classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
                editTab.classList.remove('text-slate-500');
            }
            if (previewTab) {
                previewTab.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
                previewTab.classList.add('text-slate-500');
            }
            if (form) form.style.display = 'block';
            if (previewContainer) previewContainer.style.display = 'none';
        } else {
            if (previewTab) {
                previewTab.classList.add('text-blue-600', 'border-b-2', 'border-blue-600');
                previewTab.classList.remove('text-slate-500');
            }
            if (editTab) {
                editTab.classList.remove('text-blue-600', 'border-b-2', 'border-blue-600');
                editTab.classList.add('text-slate-500');
            }
            if (form) form.style.display = 'none';
            if (previewContainer) previewContainer.style.display = 'block';
            ChecklistManager.renderPreview();
        }
    },

    showCreateModal: () => {
        ChecklistManager.currentChecklistId = null;
        ChecklistManager.currentItems = [];
        const title = document.getElementById('checklist-modal-title');
        if (title) title.textContent = 'Create Checklist';
        const form = document.getElementById('checklist-form');
        if (form) form.reset();
        const idInput = document.getElementById('checklist-id');
        if (idInput) idInput.value = '';
        const container = document.getElementById('checklist-items-container');
        if (container) container.innerHTML = '';
        ChecklistManager.switchTab('edit');
        openModal('checklist-modal');
    },

    showEditModal: async (checklistId) => {
        ChecklistManager.currentChecklistId = checklistId;
        const title = document.getElementById('checklist-modal-title');
        if (title) title.textContent = 'Edit Checklist';
        
        if (!supabaseClient) {
            showToast('Supabase is not connected.', 'error');
            return;
        }

        const { data: checklist, error } = await supabaseClient
            .from('checklists')
            .select('*')
            .eq('id', checklistId)
            .single();

        if (error || !checklist) {
            showToast('Failed to load checklist.', 'error');
            return;
        }

        const idInput = document.getElementById('checklist-id');
        if (idInput) idInput.value = checklist.id;
        const nameInput = document.getElementById('checklist-name');
        if (nameInput) nameInput.value = checklist.name || '';
        const descInput = document.getElementById('checklist-description');
        if (descInput) descInput.value = checklist.description || '';
        const catInput = document.getElementById('checklist-category');
        if (catInput) catInput.value = checklist.category || '';

        const { data: items } = await supabaseClient
            .from('checklist_items')
            .select('*')
            .eq('checklist_id', checklistId)
            .order('sort_order', { ascending: true });

        ChecklistManager.currentItems = items || [];
        ChecklistManager.renderItems();
        ChecklistManager.switchTab('edit');
        openModal('checklist-modal');
    },

    hideModal: () => {
        closeModal('checklist-modal');
        ChecklistManager.currentChecklistId = null;
        ChecklistManager.currentItems = [];
    },

    addChecklistItem: () => {
        const itemId = 'item-' + Date.now();
        ChecklistManager.currentItems.push({
            id: itemId,
            task_name: '',
            task_description: '',
            task_type: 'checkbox',
            sort_order: ChecklistManager.currentItems.length,
            is_required: false
        });
        ChecklistManager.renderItems();
    },

    removeChecklistItem: (index) => {
        ChecklistManager.currentItems.splice(index, 1);
        ChecklistManager.renderItems();
    },

    updateChecklistItem: (index, field, value) => {
        if (ChecklistManager.currentItems[index]) {
            ChecklistManager.currentItems[index][field] = value;
        }
    },

    renderItems: () => {
        const container = document.getElementById('checklist-items-container');
        if (!container) return;

        if (ChecklistManager.currentItems.length === 0) {
            container.innerHTML = '<p class="text-sm text-slate-500 text-center py-4">No items yet. Click "+ Task" to add items.</p>';
            return;
        }

        container.innerHTML = ChecklistManager.currentItems.map((item, index) => `
            <div class="bg-slate-50 rounded-lg p-4 border border-slate-200" data-index="${index}">
                <div class="flex items-start gap-3">
                    <div class="flex items-center gap-2 mt-2">
                        <i class="fas fa-grip-vertical text-slate-400 cursor-move"></i>
                    </div>
                    <div class="flex-1 space-y-3">
                        <div>
                            <input type="text" 
                                   value="${(item.task_name || '').replace(/"/g, '&quot;')}" 
                                   placeholder="Task name"
                                   onchange="ChecklistManager.updateChecklistItem(${index}, 'task_name', this.value)"
                                   class="form-input">
                        </div>
                        <div>
                            <textarea 
                                placeholder="Task description (optional)"
                                onchange="ChecklistManager.updateChecklistItem(${index}, 'task_description', this.value)"
                                class="form-input" rows="2">${(item.task_description || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
                        </div>
                        <div class="flex items-center gap-4">
                            <div class="flex-1">
                                <label class="text-xs text-slate-600 mb-1 block">Task Type</label>
                                <select onchange="ChecklistManager.updateChecklistItem(${index}, 'task_type', this.value)" class="form-input text-sm">
                                    <option value="checkbox" ${item.task_type === 'checkbox' ? 'selected' : ''}>Checkbox</option>
                                    <option value="text" ${item.task_type === 'text' ? 'selected' : ''}>Text Field</option>
                                    <option value="number" ${item.task_type === 'number' ? 'selected' : ''}>Number Field</option>
                                    <option value="inspection" ${item.task_type === 'inspection' ? 'selected' : ''}>Inspection Check</option>
                                    <option value="multiple_choice" ${item.task_type === 'multiple_choice' ? 'selected' : ''}>Multiple Choices</option>
                                    <option value="meter_reading" ${item.task_type === 'meter_reading' ? 'selected' : ''}>Meter Reading</option>
                                </select>
                            </div>
                            <div class="flex items-center gap-2 pt-6">
                                <input type="checkbox" 
                                       ${item.is_required ? 'checked' : ''}
                                       onchange="ChecklistManager.updateChecklistItem(${index}, 'is_required', this.checked)"
                                       class="rounded border-slate-300">
                                <label class="text-xs text-slate-600">Required</label>
                            </div>
                        </div>
                    </div>
                    <button onclick="ChecklistManager.removeChecklistItem(${index})" class="text-red-500 hover:text-red-700 mt-2">
                        <i class="fas fa-minus-circle"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },

    renderPreview: () => {
        const container = document.getElementById('checklist-preview-content');
        if (!container) {
            console.error('Preview container not found');
            return;
        }

        const name = document.getElementById('checklist-name')?.value || 'Untitled Checklist';
        const description = document.getElementById('checklist-description')?.value || '';
        const category = document.getElementById('checklist-category')?.value || '';

        if (ChecklistManager.currentItems.length === 0) {
            container.innerHTML = `
                <div class="bg-slate-50 rounded-lg p-6 border border-slate-200">
                    <p class="text-sm text-slate-500 text-center py-4">No items added yet. Add items in the Edit tab.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="bg-white rounded-lg border border-slate-200 p-6">
                <div class="mb-4">
                    <h4 class="text-lg font-semibold text-slate-800">${name || 'Untitled Checklist'}</h4>
                    ${description ? `<p class="text-sm text-slate-600 mt-1">${description}</p>` : ''}
                    ${category ? `<span class="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">${category}</span>` : ''}
                </div>
                <div class="space-y-3">
                    ${ChecklistManager.currentItems.map((item, index) => {
                        const taskTypeLabels = {
                            'checkbox': 'Checkbox',
                            'text': 'Text Field',
                            'number': 'Number Field',
                            'inspection': 'Inspection Check',
                            'multiple_choice': 'Multiple Choices',
                            'meter_reading': 'Meter Reading'
                        };
                        return `
                            <div class="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                <div class="flex-shrink-0 mt-1">
                                    <span class="text-xs font-semibold text-slate-500">${index + 1}</span>
                                </div>
                                <div class="flex-1">
                                    <div class="flex items-center justify-between mb-1">
                                        <h5 class="text-sm font-medium text-slate-800">${item.task_name || 'Untitled Task'}</h5>
                                        <span class="text-xs px-2 py-1 rounded bg-slate-200 text-slate-700">${taskTypeLabels[item.task_type] || item.task_type}</span>
                                    </div>
                                    ${item.task_description ? `<p class="text-xs text-slate-600">${item.task_description}</p>` : ''}
                                    ${item.is_required ? `<span class="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">Required</span>` : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="mt-4 pt-4 border-t border-slate-200">
                    <p class="text-xs text-slate-500">Total Items: ${ChecklistManager.currentItems.length}</p>
                </div>
            </div>
        `;
    },

    handleSubmit: async (event) => {
        event.preventDefault();
        
        const nameInput = document.getElementById('checklist-name');
        if (!nameInput) return;
        const name = nameInput.value.trim();
        if (!name) {
            const errorEl = document.getElementById('checklist-name-error');
            if (errorEl) errorEl.classList.remove('hidden');
            return;
        }
        const errorEl = document.getElementById('checklist-name-error');
        if (errorEl) errorEl.classList.add('hidden');

        if (!supabaseClient) {
            showToast('Supabase is not connected.', 'error');
            return;
        }

        if (ChecklistManager.currentItems.length === 0) {
            showToast('Please add at least one checklist item.', 'warning');
            return;
        }

        try {
            const descInput = document.getElementById('checklist-description');
            const catInput = document.getElementById('checklist-category');
            const checklistPayload = {
                name,
                description: descInput?.value.trim() || null,
                category: catInput?.value || null,
                is_active: true
            };

            let checklistId = ChecklistManager.currentChecklistId;

            if (checklistId) {
                const { error } = await supabaseClient
                    .from('checklists')
                    .update(checklistPayload)
                    .eq('id', checklistId);
                if (error) throw error;
            } else {
                const { data, error } = await supabaseClient
                    .from('checklists')
                    .insert(checklistPayload)
                    .select('id')
                    .single();
                
                // If table doesn't exist, provide helpful error message
                if (error && /does not exist|not found|schema cache/i.test(error.message || '')) {
                    showToast('The checklists table does not exist. Please run checklists_schema.sql in your Supabase SQL Editor.', 'error');
                    return;
                }
                
                if (error) throw error;
                checklistId = data.id;
            }

            if (ChecklistManager.currentChecklistId) {
                await supabaseClient
                    .from('checklist_items')
                    .delete()
                    .eq('checklist_id', checklistId);
            }

            const itemsToSave = ChecklistManager.currentItems
                .filter(item => item.task_name.trim())
                .map((item, index) => ({
                    checklist_id: checklistId,
                    task_name: item.task_name.trim(),
                    task_description: item.task_description?.trim() || null,
                    task_type: item.task_type || 'checkbox',
                    sort_order: index,
                    is_required: item.is_required || false
                }));

            if (itemsToSave.length > 0) {
                const { error } = await supabaseClient
                    .from('checklist_items')
                    .insert(itemsToSave);
                if (error) throw error;
            }

            showToast('Checklist saved successfully.', 'success');
            ChecklistManager.hideModal();
            await ChecklistManager.loadChecklists();
        } catch (error) {
            console.error('Error saving checklist:', error);
            let errorMessage = 'Failed to save checklist.';
            if (error.message) {
                if (/does not exist|not found|schema cache/i.test(error.message)) {
                    errorMessage = 'The checklists table does not exist. Please run checklists_schema.sql in your Supabase SQL Editor.';
                } else {
                    errorMessage = 'Failed to save checklist. ' + error.message;
                }
            }
            showToast(errorMessage, 'error');
        }
    },

    loadChecklists: async () => {
        const tbody = document.getElementById('checklists-table-body');
        if (!tbody) return;

        if (!supabaseClient) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-slate-500">Supabase not connected</td></tr>';
            return;
        }

        try {
            const { data: checklists, error } = await supabaseClient
                .from('checklists')
                .select('*')
                .order('created_at', { ascending: false });

            // If table doesn't exist, show helpful message
            if (error && /does not exist|not found|schema cache/i.test(error.message || '')) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="px-6 py-8 text-center">
                            <div class="flex flex-col items-center gap-3">
                                <i class="fas fa-exclamation-triangle text-4xl text-amber-500"></i>
                                <p class="text-slate-700 font-semibold">Checklists table not found</p>
                                <p class="text-sm text-slate-600 max-w-md text-center">Please run the <code class="bg-slate-100 px-2 py-1 rounded text-xs">checklists_schema.sql</code> file in your Supabase SQL Editor to create the required tables.</p>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }

            if (error) throw error;

            if (!checklists || checklists.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="px-6 py-8 text-center text-slate-500">
                            <i class="fas fa-clipboard-list text-4xl mb-4 text-slate-300"></i>
                            <p>No checklists found. Create your first checklist!</p>
                        </td>
                    </tr>
                `;
                return;
            }

            const checklistIds = checklists.map(c => c.id);
            const { data: itemCounts } = await supabaseClient
                .from('checklist_items')
                .select('checklist_id')
                .in('checklist_id', checklistIds);

            const countMap = new Map();
            itemCounts?.forEach(item => {
                countMap.set(item.checklist_id, (countMap.get(item.checklist_id) || 0) + 1);
            });

            tbody.innerHTML = checklists.map(checklist => `
                <tr class="hover:bg-slate-50">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">${checklist.name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">${checklist.category || 'N/A'}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600">${countMap.get(checklist.id) || 0} items</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="text-xs px-2 py-1 rounded-full ${checklist.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                            ${checklist.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                        <button onclick="ChecklistManager.showEditModal('${checklist.id}')" class="text-blue-600 hover:text-blue-900 mr-3">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="ChecklistManager.deleteChecklist('${checklist.id}')" class="text-red-600 hover:text-red-900">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        } catch (error) {
            console.error('Error loading checklists:', error);
            tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-red-500">Error loading checklists</td></tr>';
        }
    },

    deleteChecklist: async (checklistId) => {
        if (!confirm('Are you sure you want to delete this checklist? This cannot be undone.')) {
            return;
        }

        if (!supabaseClient) {
            showToast('Supabase is not connected.', 'error');
            return;
        }

        try {
            const { error } = await supabaseClient
                .from('checklists')
                .delete()
                .eq('id', checklistId);

            if (error) throw error;

            showToast('Checklist deleted successfully.', 'success');
            await ChecklistManager.loadChecklists();
        } catch (error) {
            console.error('Error deleting checklist:', error);
            showToast('Failed to delete checklist.', 'error');
        }
    },

    showImportArea(format) {
        const importArea = document.getElementById('checklist-import-area');
        const importData = document.getElementById('checklist-import-data');
        if (importArea && importData) {
            importArea.style.display = 'block';
            if (format === 'csv') {
                importData.placeholder = 'Paste CSV data (comma-separated). Format: Task Name, Description, Required (true/false), Type (checkbox/text/number)\nExample:\nCheck battery voltage, Measure and record voltage, true, checkbox\nInspect cables, Check for damage or wear, true, checkbox';
            } else if (format === 'xml') {
                importData.placeholder = 'Paste XML data. Format:\n<checklist>\n  <item>\n    <name>Task Name</name>\n    <description>Description</description>\n    <required>true</required>\n    <type>checkbox</type>\n  </item>\n</checklist>';
            }
            importData.value = '';
            importData.focus();
        }
    },

    hideImportArea() {
        const importArea = document.getElementById('checklist-import-area');
        const importData = document.getElementById('checklist-import-data');
        if (importArea) importArea.style.display = 'none';
        if (importData) importData.value = '';
    },

    parseAndImportItems() {
        const importData = document.getElementById('checklist-import-data');
        if (!importData) {
            alert('Import area not found');
            return;
        }

        const data = importData.value.trim();
        if (!data) {
            alert('Please paste data to import');
            return;
        }

        try {
            let items = [];
            
            // Try CSV first
            if (data.includes(',') || data.includes('\t')) {
                items = ChecklistManager.parseCSV(data);
            } else if (data.trim().startsWith('<')) {
                // Try XML
                items = ChecklistManager.parseXML(data);
            } else {
                // Try line-by-line (simple format)
                items = ChecklistManager.parseSimpleFormat(data);
            }

            if (items.length === 0) {
                alert('No items could be parsed from the data. Please check the format.');
                return;
            }

            // Add items to checklist
            items.forEach(item => {
                const checklistItem = {
                    id: 'item-' + Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    task_name: item.name || item.task_name || '',
                    task_description: item.description || item.task_description || '',
                    task_type: item.type || item.task_type || 'checkbox',
                    is_required: item.required === true || item.required === 'true' || item.is_required === true,
                    sort_order: ChecklistManager.currentItems.length
                };
                ChecklistManager.currentItems.push(checklistItem);
            });

            ChecklistManager.renderItems();
            ChecklistManager.hideImportArea();
            
            if (typeof showToast === 'function') {
                showToast(`Imported ${items.length} checklist item(s)`, 'success');
            } else {
                alert(`Imported ${items.length} checklist item(s)`);
            }
        } catch (error) {
            console.error('Error parsing import data:', error);
            alert(`Error parsing data: ${error.message}`);
        }
    },

    parseCSV(data) {
        const lines = data.split('\n').filter(line => line.trim());
        const items = [];
        
        // Skip header if present
        let startIndex = 0;
        const firstLine = lines[0].toLowerCase();
        if (firstLine.includes('task') || firstLine.includes('name') || firstLine.includes('description')) {
            startIndex = 1;
        }

        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Parse CSV line (handle quoted fields)
            const fields = ChecklistManager.parseCSVLine(line);
            
            if (fields.length >= 1) {
                items.push({
                    name: fields[0] || '',
                    description: fields[1] || '',
                    required: fields[2] === 'true' || fields[2] === '1' || fields[2] === 'yes',
                    type: fields[3] || 'checkbox'
                });
            }
        }

        return items;
    },

    parseCSVLine(line) {
        const fields = [];
        let currentField = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                fields.push(currentField.trim());
                currentField = '';
            } else {
                currentField += char;
            }
        }
        fields.push(currentField.trim()); // Add last field

        return fields;
    },

    parseXML(data) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, 'text/xml');
        
        // Check for parsing errors
        const parseError = xmlDoc.querySelector('parsererror');
        if (parseError) {
            throw new Error('Invalid XML format: ' + parseError.textContent);
        }

        const items = [];
        const itemNodes = xmlDoc.querySelectorAll('item, checklist-item, task');
        
        itemNodes.forEach(node => {
            const name = node.querySelector('name, task-name, title')?.textContent || '';
            const description = node.querySelector('description, desc, task-description')?.textContent || '';
            const required = node.querySelector('required, is-required')?.textContent || 'false';
            const type = node.querySelector('type, task-type')?.textContent || 'checkbox';
            
            if (name) {
                items.push({
                    name: name.trim(),
                    description: description.trim(),
                    required: required.toLowerCase() === 'true' || required === '1',
                    type: type.trim() || 'checkbox'
                });
            }
        });

        return items;
    },

    parseSimpleFormat(data) {
        const lines = data.split('\n').filter(line => line.trim());
        return lines.map(line => ({
            name: line.trim(),
            description: '',
            required: false,
            type: 'checkbox'
        }));
    }
};

async function requireAuth() {
    if (AppState.currentPage === 'login') {
        return true;
    }

    await loadSupabaseClient();

    if (!supabaseClient?.auth?.getSession) {
        return false;
    }

    try {
        const { data } = await supabaseClient.auth.getSession();
        if (!data?.session) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error checking auth session:', error);
        window.location.href = 'login.html';
        return false;
    }
}

function setupLogout() {
    const logoutButton = document.getElementById('logout-button');
    if (!logoutButton) return;

    logoutButton.addEventListener('click', async () => {
        if (supabaseClient?.auth?.signOut) {
            try {
                await supabaseClient.auth.signOut();
            } catch (error) {
                console.error('Error signing out:', error);
            }
        }
        window.location.href = 'login.html';
    });
}

// Initialize the application
async function initApp() {
    const pageName = window.location.pathname.split('/').pop().replace('.html', '');
    AppState.currentPage = normalizePageName(pageName);
    setupMobileMenu();

    await loadSupabaseClient();

    if (AppState.currentPage === 'dashboard') {
        await DashboardManager.init();
    } else if (AppState.currentPage === 'assets') {
        // Assets page handles its own initialization in assets.html
    } else if (AppState.currentPage === 'workorders') {
        await WorkOrderManager.init();
    } else if (AppState.currentPage === 'settings') {
        // SettingsManager.init() is now handled in js/settings-manager.js
        await ChecklistManager.init();
    } else if (AppState.currentPage === 'customers') {
        // Customers page handles its own initialization in customers.html
    } else if (AppState.currentPage === 'inventory') {
        // InventoryManager.init() is handled in inventory.html
    } else if (AppState.currentPage === 'compliance') {
        // ComplianceManager.init() is handled in compliance.html
    }
}

// Work Order Enhancement Modal Functions
function closeAddTimeModal() {
    closeModal('add-time-modal');
    document.getElementById('add-time-form').reset();
}

function closeAddCostModal() {
    closeModal('add-cost-modal');
    document.getElementById('add-cost-form').reset();
}

function closeLinkWorkOrdersModal() {
    closeModal('link-workorders-modal');
    document.getElementById('link-workorders-form').reset();
}

function closeAddFileModal() {
    closeModal('add-file-modal');
    document.getElementById('add-file-form').reset();
}

// Form Handlers
document.addEventListener('DOMContentLoaded', () => {
    // Add Time Form
    const addTimeForm = document.getElementById('add-time-form');
    if (addTimeForm) {
        addTimeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const workOrderId = document.getElementById('add-time-wo-id').value;
            const technicianId = document.getElementById('add-time-technician').value;
            const hours = parseFloat(document.getElementById('add-time-hours').value);
            const hourlyRateInput = document.getElementById('add-time-rate').value;
            const hourlyRate = hourlyRateInput ? parseFloat(hourlyRateInput) : 0;
            const date = document.getElementById('add-time-date').value;
            const notes = document.getElementById('add-time-notes').value;

            if (!supabaseClient) {
                showToast('Database not connected', 'error');
                return;
            }

            const mode = document.getElementById('add-time-mode')?.value || 'view';
            
            // If in create mode, store temporarily
            if (mode === 'create') {
                const laborEntry = {
                    technician_id: technicianId,
                    hours: hours,
                    hourly_rate: hourlyRate,
                    date: date,
                    notes: notes || null,
                    total_cost: hours * hourlyRate
                };
                WorkOrderManager.createModeData.labor.push(laborEntry);
                showToast('Labor time added (will be saved when work order is created)', 'success');
                closeAddTimeModal();
                WorkOrderManager.renderCreateModeLabor();
                WorkOrderManager.updateCreateModeTotalCost();
                return;
            }

            try {
                const { error } = await supabaseClient
                    .from('work_order_labor')
                    .insert({
                        work_order_id: workOrderId,
                        technician_id: technicianId,
                        hours: hours,
                        hourly_rate: hourlyRate,
                        date: date,
                        notes: notes || null
                    });

                if (error) throw error;

                showToast('Labor time added successfully', 'success');
                closeAddTimeModal();
                await WorkOrderManager.loadLaborCosts(workOrderId);
                WorkOrderManager.updateTotalCost();
            } catch (error) {
                console.error('Error adding labor time:', error);
                showToast('Failed to add labor time', 'error');
            }
        });
    }

    // Add Cost Form
    const addCostForm = document.getElementById('add-cost-form');
    if (addCostForm) {
        addCostForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const workOrderId = document.getElementById('add-cost-wo-id').value;
            const description = document.getElementById('add-cost-description').value;
            const amount = parseFloat(document.getElementById('add-cost-amount').value);
            const category = document.getElementById('add-cost-category').value;
            const date = document.getElementById('add-cost-date').value;

            if (!supabaseClient) {
                showToast('Database not connected', 'error');
                return;
            }

            const mode = document.getElementById('add-cost-mode')?.value || 'view';
            
            // If in create mode, store temporarily
            if (mode === 'create') {
                const costEntry = {
                    description: description,
                    amount: amount,
                    category: category || null,
                    date: date
                };
                WorkOrderManager.createModeData.additionalCosts.push(costEntry);
                showToast('Additional cost added (will be saved when work order is created)', 'success');
                closeAddCostModal();
                WorkOrderManager.renderCreateModeAdditionalCosts();
                WorkOrderManager.updateCreateModeTotalCost();
                return;
            }

            try {
                const { error } = await supabaseClient
                    .from('work_order_additional_costs')
                    .insert({
                        work_order_id: workOrderId,
                        description: description,
                        amount: amount,
                        category: category || null,
                        date: date
                    });

                if (error) throw error;

                showToast('Additional cost added successfully', 'success');
                closeAddCostModal();
                await WorkOrderManager.loadAdditionalCosts(workOrderId);
                WorkOrderManager.updateTotalCost();
            } catch (error) {
                console.error('Error adding additional cost:', error);
                showToast('Failed to add additional cost', 'error');
            }
        });
    }

    // Link Work Orders Form
    const linkWOForm = document.getElementById('link-workorders-form');
    if (linkWOForm) {
        linkWOForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const workOrderId = document.getElementById('link-wo-id').value;
            const linkedWorkOrderId = document.getElementById('link-wo-select').value;
            const linkType = document.getElementById('link-wo-type').value;
            const notes = document.getElementById('link-wo-notes').value;

            if (!supabaseClient) {
                showToast('Database not connected', 'error');
                return;
            }

            const mode = document.getElementById('link-wo-mode')?.value || 'view';
            
            // If in create mode, store temporarily
            if (mode === 'create') {
                const linkEntry = {
                    linked_work_order_id: linkedWorkOrderId,
                    link_type: linkType,
                    notes: notes || null
                };
                WorkOrderManager.createModeData.links.push(linkEntry);
                showToast('Link added (will be saved when work order is created)', 'success');
                closeLinkWorkOrdersModal();
                WorkOrderManager.renderCreateModeLinks();
                return;
            }

            try {
                const { error } = await supabaseClient
                    .from('work_order_links')
                    .insert({
                        work_order_id: workOrderId,
                        linked_work_order_id: linkedWorkOrderId,
                        link_type: linkType,
                        notes: notes || null
                    });

                if (error) throw error;

                showToast('Work orders linked successfully', 'success');
                closeLinkWorkOrdersModal();
                await WorkOrderManager.loadLinks(workOrderId);
            } catch (error) {
                console.error('Error linking work orders:', error);
                if (error.message.includes('unique')) {
                    showToast('These work orders are already linked', 'warning');
                } else {
                    showToast('Failed to link work orders', 'error');
                }
            }
        });
    }

    // Add File Form
    const addFileForm = document.getElementById('add-file-form');
    if (addFileForm) {
        addFileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const workOrderId = document.getElementById('add-file-wo-id').value;
            const fileInput = document.getElementById('add-file-input');
            const description = document.getElementById('add-file-description').value;
            const progressDiv = document.getElementById('add-file-progress');
            const progressBar = document.getElementById('add-file-progress-bar');
            const progressText = document.getElementById('add-file-progress-text');

            if (!fileInput.files || fileInput.files.length === 0) {
                showToast('Please select a file', 'warning');
                return;
            }

            const file = fileInput.files[0];
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                showToast('File size exceeds 10MB limit', 'error');
                return;
            }

            if (!supabaseClient) {
                showToast('Database not connected', 'error');
                return;
            }

            const mode = document.getElementById('add-file-mode')?.value || 'view';
            
            try {
                progressDiv.classList.remove('hidden');
                progressBar.style.width = '0%';
                progressText.textContent = '0%';

                // Upload to Supabase Storage
                const fileExt = file.name.split('.').pop();
                const tempId = mode === 'create' ? 'CREATE' : workOrderId;
                const fileName = `${tempId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `work-orders/${fileName}`;

                const { data: uploadData, error: uploadError } = await supabaseClient.storage
                    .from('work-order-files')
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: false
                    });

                if (uploadError) {
                    // Try to create bucket if it doesn't exist
                    if (uploadError.message.includes('Bucket not found')) {
                        showToast('Storage bucket not configured. Please configure Supabase Storage.', 'error');
                    } else {
                        throw uploadError;
                    }
                    return;
                }

                progressBar.style.width = '100%';
                progressText.textContent = '100%';

                // Get public URL
                const { data: urlData } = supabaseClient.storage
                    .from('work-order-files')
                    .getPublicUrl(filePath);

                // Save file record to database
                const { error: dbError } = await supabaseClient
                    .from('work_order_files')
                    .insert({
                        work_order_id: workOrderId,
                        file_name: file.name,
                        file_path: urlData.publicUrl,
                        file_size: file.size,
                        file_type: file.type,
                        description: description || null
                    });

                if (dbError) throw dbError;

                showToast('File uploaded successfully', 'success');
                closeAddFileModal();
                await WorkOrderManager.loadFiles(workOrderId);
            } catch (error) {
                console.error('Error uploading file:', error);
                showToast('Failed to upload file', 'error');
            } finally {
                progressDiv.classList.add('hidden');
            }
        });
    }
});

// Delete Functions
WorkOrderManager.deleteLaborCost = async (laborId) => {
    if (!confirm('Are you sure you want to delete this labor entry?')) return;

    if (!supabaseClient) {
        showToast('Database not connected', 'error');
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('work_order_labor')
            .delete()
            .eq('id', laborId);

        if (error) throw error;

        showToast('Labor entry deleted', 'success');
        await WorkOrderManager.loadLaborCosts(WorkOrderManager.currentWorkOrderId);
        WorkOrderManager.updateTotalCost();
    } catch (error) {
        console.error('Error deleting labor entry:', error);
        showToast('Failed to delete labor entry', 'error');
    }
};

WorkOrderManager.deleteAdditionalCost = async (costId) => {
    if (!confirm('Are you sure you want to delete this cost entry?')) return;

    if (!supabaseClient) {
        showToast('Database not connected', 'error');
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('work_order_additional_costs')
            .delete()
            .eq('id', costId);

        if (error) throw error;

        showToast('Cost entry deleted', 'success');
        await WorkOrderManager.loadAdditionalCosts(WorkOrderManager.currentWorkOrderId);
        WorkOrderManager.updateTotalCost();
    } catch (error) {
        console.error('Error deleting cost entry:', error);
        showToast('Failed to delete cost entry', 'error');
    }
};

WorkOrderManager.deleteLink = async (linkId) => {
    if (!confirm('Are you sure you want to unlink these work orders?')) return;

    if (!supabaseClient) {
        showToast('Database not connected', 'error');
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('work_order_links')
            .delete()
            .eq('id', linkId);

        if (error) throw error;

        showToast('Work orders unlinked', 'success');
        await WorkOrderManager.loadLinks(WorkOrderManager.currentWorkOrderId);
    } catch (error) {
        console.error('Error deleting link:', error);
        showToast('Failed to unlink work orders', 'error');
    }
};

WorkOrderManager.deleteFile = async (fileId, filePath) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    if (!supabaseClient) {
        showToast('Database not connected', 'error');
        return;
    }

    try {
        // Delete from storage (extract path from URL)
        const pathMatch = filePath.match(/work-order-files\/(.+)/);
        if (pathMatch) {
            const { error: storageError } = await supabaseClient.storage
                .from('work-order-files')
                .remove([pathMatch[1]]);
            
            if (storageError) {
                console.warn('Error deleting file from storage:', storageError);
            }
        }

        // Delete from database
        const { error } = await supabaseClient
            .from('work_order_files')
            .delete()
            .eq('id', fileId);

        if (error) throw error;

        showToast('File deleted', 'success');
        await WorkOrderManager.loadFiles(WorkOrderManager.currentWorkOrderId);
    } catch (error) {
        console.error('Error deleting file:', error);
        showToast('Failed to delete file', 'error');
    }
};

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

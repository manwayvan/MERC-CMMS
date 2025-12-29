// MERC-CMMS Enterprise JavaScript Application
// Comprehensive functionality for Medical Device Management System

// Initialize Supabase Client
const supabaseUrl = typeof CONFIG !== 'undefined' && CONFIG.SUPABASE_URL
    ? CONFIG.SUPABASE_URL
    : 'https://hmdemsbqiqlqcggwblvl.supabase.co';
const supabaseKey = typeof CONFIG !== 'undefined' && CONFIG.SUPABASE_ANON_KEY
    ? CONFIG.SUPABASE_ANON_KEY
    : 'sb_publishable_Z9oNxTGDCCz3EZnh6NqySg_QzF6amCN';
let supabaseClient = null;
let supabaseInitPromise = null;

function loadSupabaseClient() {
    if (supabaseClient) {
        return Promise.resolve(supabaseClient);
    }

    if (window.sharedSupabaseClient) {
        supabaseClient = window.sharedSupabaseClient;
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
        const types = ['Preventive Maintenance', 'Corrective Maintenance', 'Inspection', 'Calibration'];
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
        showToast('Unable to load work order types from database.', 'warning');
        return null;
    }

    return data || [];
}

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
        const assetChart = echarts.init(document.getElementById('asset-distribution-chart'));
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

        // Work Order Trends Line Chart
        const trendsChart = echarts.init(document.getElementById('work-order-trends-chart'));
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

        // Compliance Gauge Charts
        ChartManager.initComplianceGauges();

        // Maintenance Cost Chart
        const costChart = echarts.init(document.getElementById('maintenance-cost-chart'));
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

        // Equipment Status Heatmap
        const heatmapChart = echarts.init(document.getElementById('equipment-status-heatmap'));
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
            console.warn('Supabase client unavailable. Loading demo asset data.');
            this.assets = MockData.generateAssets();
            showToast('Database unavailable, using demo assets', 'warning');
        } else {
            const { data, error } = await supabaseClient
                .from('assets')
                .select('*');

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
    supportsAssignedTechnicianId: true,
    // Initialize work order management
    init: async () => {
        WorkOrderManager.updateSupabaseStatus(!!supabaseClient);
        await WorkOrderManager.loadAssets();
        await WorkOrderManager.loadTechnicians();
        await WorkOrderManager.loadWorkOrders();
        await WorkOrderManager.loadWorkOrderTypes();
        WorkOrderManager.renderWorkOrders();
        WorkOrderManager.renderRecentWorkOrders();
        WorkOrderManager.updateSummaryCounts();
        WorkOrderManager.setupEventListeners();
        await WorkOrderManager.loadWorkOrderTypes();
        await WorkOrderManager.loadWorkOrderAssets();
        WorkOrderManager.updateSupabaseStatus();
    },

    formatWorkOrderType: (type) => {
        if (!type) return '';
        return type
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    },

    getTechnicianLabel: (technicianId) => {
        if (!technicianId) return 'Unassigned';
        const label = WorkOrderManager.technicianMap?.get(technicianId);
        return label || 'Unassigned';
    },
    formatDate: (dateValue) => {
        if (!dateValue) {
            return '—';
        }
        const date = new Date(dateValue);
        if (Number.isNaN(date.getTime())) {
            return '—';
        }
        return date.toLocaleDateString();
    },

    toDatabaseWorkOrderType: (type) => {
        if (!type) return '';
        return type
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '_');
    },

    updateSupabaseStatus: (isAvailable) => {
        const statusElement = document.getElementById('supabase-status');
        if (!statusElement) return;

        statusElement.innerHTML = isAvailable
            ? 'Supabase status: <span class="font-semibold text-emerald-700">Connected</span>'
            : 'Supabase status: <span class="font-semibold text-amber-700">Offline (demo mode)</span>';
    },

    loadAssets: async () => {
        if (!supabaseClient) {
            AppState.assets = MockData.generateAssets();
            return;
        }

        const { data, error } = await supabaseClient
            .from('assets')
            .select('id, name')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error loading assets:', error);
            AppState.assets = MockData.generateAssets();
            showToast('Unable to load assets from database, using demo data.', 'warning');
            return;
        }

        AppState.assets = data || [];
    },

    loadTechnicians: async () => {
        if (!supabaseClient) {
            const mockTechnicians = ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Lisa Wilson', 'Robert Brown'];
            AppState.technicians = mockTechnicians.map((name, index) => ({
                id: `demo-tech-${index + 1}`,
                full_name: name
            }));
            return;
        }

        const { data, error } = await supabaseClient
            .from('technicians')
            .select('id, full_name')
            .eq('is_active', true)
            .order('full_name', { ascending: true });

        if (error) {
            console.error('Error loading technicians:', error);
            showToast('Unable to load technicians from database.', 'warning');
            AppState.technicians = [];
            return;
        }

        AppState.technicians = data || [];
    },

    loadWorkOrders: async () => {
        if (!supabaseClient) {
            AppState.workOrders = MockData.generateWorkOrders();
            return;
        }

        const selectFields = [
            'id',
            'asset_id',
            'type',
            'priority',
            'status',
            'assigned_technician_id',
            'due_date',
            'created_date',
            'completed_date',
            'estimated_hours',
            'actual_hours',
            'description'
        ];

        let { data, error } = await supabaseClient
            .from('work_orders')
            .select(selectFields.join(', '))
            .order('created_date', { ascending: false });

        if (error && /assigned_technician_id/i.test(error.message || '')) {
            WorkOrderManager.supportsAssignedTechnicianId = false;
            const fallbackFields = selectFields.filter(field => field !== 'assigned_technician_id');
            ({ data, error } = await supabaseClient
                .from('work_orders')
                .select(fallbackFields.join(', '))
                .order('created_date', { ascending: false }));
        }

        if (error) {
            console.error('Error loading work orders:', error);
            AppState.workOrders = MockData.generateWorkOrders();
            showToast('Unable to load work orders from database, using demo data.', 'warning');
            return;
        }

        const technicianMap = new Map(AppState.technicians.map(tech => [tech.id, tech.full_name]));

        AppState.workOrders = (data || []).map(order => ({
            ...order,
            technician: order.assigned_technician_id
                ? (technicianMap.get(order.assigned_technician_id) || 'Unassigned')
                : 'Unassigned'
        }));
    },

    loadWorkOrderAssets: async () => {
        WorkOrderManager.populateAssetOptions();
    },

    // Render work orders in kanban board
    renderWorkOrders: () => {
        const columns = ['open', 'progress', 'completed', 'cancelled'];

        columns.forEach(status => {
            const container = document.getElementById(`${status === 'progress' ? 'progress' : status}-workorders`);
            if (!container) return;

            const workOrders = AppState.workOrders.filter(wo =>
                (status === 'open' && wo.status === 'open') ||
                (status === 'progress' && wo.status === 'in-progress') ||
                (status === 'completed' && wo.status === 'completed') ||
                (status === 'cancelled' && wo.status === 'cancelled')
            );

            container.innerHTML = workOrders.map(wo => `
                <div class="workorder-card priority-${wo.priority}" onclick="WorkOrderManager.viewWorkOrder('${wo.id}')">
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="font-medium text-slate-800">${wo.id}</h4>
                        <span class="text-xs px-2 py-1 rounded-full ${WorkOrderManager.getPriorityColor(wo.priority)}">
                            ${wo.priority.toUpperCase()}
                        </span>
                    </div>
                    <p class="text-sm text-slate-600 mb-2">${WorkOrderManager.formatWorkOrderType(wo.type)}</p>
                    <p class="text-xs text-slate-500 mb-3">Asset: ${wo.asset_id}</p>
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
                <td class="py-3 px-4 text-sm text-slate-600">${wo.asset_id}</td>
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
                        ${wo.status.charAt(0).toUpperCase() + wo.status.slice(1)}
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
            cancelled: 'bg-gray-100 text-gray-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    },

    // Setup event listeners
    setupEventListeners: () => {
        const createForm = document.getElementById('create-workorder-form');
        if (createForm) {
            createForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                await WorkOrderManager.handleCreateWorkOrder();
            });
        }

        const createModal = document.getElementById('create-workorder-modal');
        if (createModal) {
            createModal.addEventListener('click', (event) => {
                if (event.target === createModal) {
                    hideCreateWorkOrderModal();
                }
            });
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                hideCreateWorkOrderModal();
            }
        });
    },

    // View work order
    viewWorkOrder: (workOrderId) => {
        showToast('Viewing work order details', 'info');
    },

    handleCreateWorkOrder: async () => {
        const assetSelect = document.getElementById('workorder-asset-select');
        const typeSelect = document.getElementById('workorder-type-select');
        const prioritySelect = document.getElementById('workorder-priority-select');
        const technicianSelect = document.getElementById('workorder-technician-select');
        const dueDateInput = document.getElementById('workorder-due-date');
        const estimatedHoursInput = document.getElementById('workorder-estimated-hours');
        const descriptionInput = document.getElementById('workorder-description');

        const assetId = assetSelect?.value || '';
        const type = typeSelect?.value || '';
        const priority = prioritySelect?.value || 'medium';
        const technicianId = technicianSelect?.value || null;
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
                description
            };
            AppState.workOrders = [newWorkOrder, ...AppState.workOrders];
            WorkOrderManager.renderWorkOrders();
            WorkOrderManager.renderRecentWorkOrders();
            WorkOrderManager.updateSummaryCounts();
            hideCreateWorkOrderModal();
            showToast('Work order created (demo mode).', 'success');
            return;
        }

        const payload = {
            asset_id: assetId,
            type,
            priority,
            status: 'open',
            due_date: new Date(dueDate).toISOString(),
            estimated_hours: estimatedHours,
            description
        };

        if (WorkOrderManager.supportsAssignedTechnicianId) {
            payload.assigned_technician_id = technicianId || null;
        }

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
            'description'
        ];

        if (WorkOrderManager.supportsAssignedTechnicianId) {
            selectFields.push('assigned_technician_id');
        }

        const { data, error } = await supabaseClient
            .from('work_orders')
            .insert(payload)
            .select(selectFields.join(', '))
            .single();

        if (error) {
            console.error('Error creating work order:', error);
            showToast('Failed to create work order.', 'error');
            return;
        }

        const newOrder = {
            ...data,
            technician: WorkOrderManager.supportsAssignedTechnicianId
                ? WorkOrderManager.resolveTechnicianName(data.assigned_technician_id)
                : 'Unassigned'
        };
        AppState.workOrders = [newOrder, ...AppState.workOrders];
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
        const baseTypes = [
            { value: 'preventive_maintenance', label: 'Preventive Maintenance' },
            { value: 'corrective_maintenance', label: 'Corrective Maintenance' },
            { value: 'inspection', label: 'Inspection' },
            { value: 'calibration', label: 'Calibration' },
            { value: 'installation', label: 'Installation' },
            { value: 'repair', label: 'Repair' }
        ];

        const typeSet = new Map(baseTypes.map(type => [type.value, type]));
        AppState.workOrders.forEach(order => {
            if (order.type && !typeSet.has(order.type)) {
                typeSet.set(order.type, { value: order.type, label: WorkOrderManager.formatWorkOrderType(order.type) });
            }
        });

        AppState.workOrderTypes = Array.from(typeSet.values());
        WorkOrderManager.populateAssetOptions();
        WorkOrderManager.populateTechnicianOptions();
        WorkOrderManager.populateWorkOrderTypes();
    },

    populateAssetOptions: () => {
        const assetSelect = document.getElementById('workorder-asset-select');
        if (!assetSelect) return;

        assetSelect.innerHTML = '<option value="">Select Asset</option>';
        AppState.assets.forEach(asset => {
            const option = document.createElement('option');
            option.value = asset.id;
            option.textContent = `${asset.id} - ${asset.name || 'Asset'}`;
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

    formatWorkOrderType: (type) => {
        if (!type) return 'General';
        const labelMap = {
            preventive_maintenance: 'Preventive Maintenance',
            corrective_maintenance: 'Corrective Maintenance',
            inspection: 'Inspection',
            calibration: 'Calibration',
            installation: 'Installation',
            repair: 'Repair'
        };
        return labelMap[type] || type.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
    },

    formatDate: (dateValue) => {
        if (!dateValue) return '--';
        const parsed = new Date(dateValue);
        if (Number.isNaN(parsed.getTime())) return '--';
        return parsed.toLocaleDateString();
    }
};

const SettingsManager = {
    elements: {
        technicianForm: null,
        technicianList: null,
        technicianSubmitButton: null,
        technicianPermissionNote: null,
        supabaseStatusBadge: null,
        supabaseStatusText: null,
        supabaseLastChecked: null,
        supabaseCheckButton: null
    },

    init: async () => {
        SettingsManager.cacheElements();
        SettingsManager.bindEvents();
        SettingsManager.updateSupabaseStatus('idle', 'Run a connectivity check to validate Supabase access.');
        await SettingsManager.loadTechnicians();
    },

    cacheElements: () => {
        SettingsManager.elements.technicianForm = document.getElementById('technician-form');
        SettingsManager.elements.technicianList = document.getElementById('technician-list');
        SettingsManager.elements.technicianSubmitButton = document.querySelector('#technician-form button[type="submit"]');
        SettingsManager.elements.technicianPermissionNote = document.getElementById('technician-permission-note');
        SettingsManager.elements.supabaseStatusBadge = document.getElementById('supabase-status-badge');
        SettingsManager.elements.supabaseStatusText = document.getElementById('supabase-status-text');
        SettingsManager.elements.supabaseLastChecked = document.getElementById('supabase-last-checked');
        SettingsManager.elements.supabaseCheckButton = document.getElementById('supabase-check-button');
    },

    bindEvents: () => {
        if (SettingsManager.elements.technicianForm) {
            SettingsManager.elements.technicianForm.addEventListener('submit', SettingsManager.handleTechnicianSubmit);
        }
        if (SettingsManager.elements.supabaseCheckButton) {
            SettingsManager.elements.supabaseCheckButton.addEventListener('click', SettingsManager.runSupabaseCheck);
        }
    },

    getAuthenticatedUser: async () => {
        if (!supabaseClient?.auth?.getUser) {
            return null;
        }

        try {
            const { data, error } = await supabaseClient.auth.getUser();
            if (error) throw error;
            return data?.user || null;
        } catch (error) {
            console.warn('Unable to fetch authenticated user:', error);
            return null;
        }
    },

    loadTechnicians: async () => {
        if (!supabaseClient) {
            showToast('Supabase is not connected. Unable to load technicians.', 'warning');
            SettingsManager.renderTechnicians([]);
            return;
        }

        try {
            const user = await SettingsManager.getAuthenticatedUser();
            if (!user) {
                SettingsManager.updateTechnicianFormState(false);
                SettingsManager.renderTechnicians([], 'Sign in to view technicians.');
                return;
            }

            SettingsManager.updateTechnicianFormState(true);
            const { data, error } = await supabaseClient
                .from('technicians')
                .select('id, full_name, role, email, phone, is_active')
                .order('full_name', { ascending: true });

            if (error) throw error;

            SettingsManager.renderTechnicians(data || []);
        } catch (error) {
            console.error('Error loading technicians:', error);
            showToast('Unable to load technicians from database.', 'warning');
            SettingsManager.renderTechnicians([], 'Unable to load technicians.');
        }
    },

    updateTechnicianFormState: (canManage) => {
        const form = SettingsManager.elements.technicianForm;
        if (!form) return;

        form.querySelectorAll('input, select, button').forEach((element) => {
            element.disabled = !canManage;
        });

        if (SettingsManager.elements.technicianPermissionNote) {
            SettingsManager.elements.technicianPermissionNote.textContent = canManage
                ? ''
                : 'Sign in with an authenticated Supabase user to add or edit technicians.';
        }
    },

    renderTechnicians: (technicians, emptyMessage = 'No technicians found.') => {
        const list = SettingsManager.elements.technicianList;
        if (!list) return;

        list.innerHTML = '';

        if (!technicians.length) {
            const emptyItem = document.createElement('li');
            emptyItem.className = 'text-slate-500';
            emptyItem.textContent = emptyMessage;
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

    handleTechnicianSubmit: async (event) => {
        event.preventDefault();
        if (!supabaseClient) {
            showToast('Supabase is not connected. Unable to save technician.', 'warning');
            return;
        }

        const user = await SettingsManager.getAuthenticatedUser();
        if (!user) {
            showToast('Sign in to add technicians.', 'warning');
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
            if (error?.status === 401 || /not authorized|permission|row-level security/i.test(error?.message || '')) {
                showToast('Permission denied. Ensure your Supabase RLS policy allows technician inserts.', 'error');
            } else {
                showToast('Failed to add technician.', 'error');
            }
        }
    },

    updateSupabaseStatus: (status, message) => {
        const badge = SettingsManager.elements.supabaseStatusBadge;
        const text = SettingsManager.elements.supabaseStatusText;
        const lastChecked = SettingsManager.elements.supabaseLastChecked;

        if (badge) {
            const isConnected = status === 'connected';
            badge.className = `status-badge ${isConnected ? 'status-active' : 'status-inactive'}`;
            badge.innerHTML = isConnected ? '<span class="badge-pulse"></span>Connected' : 'Not connected';
        }

        if (text) {
            text.textContent = message;
        }

        if (lastChecked && status !== 'idle') {
            lastChecked.textContent = new Date().toLocaleString();
        }
    },

    runSupabaseCheck: async () => {
        if (!supabaseClient) {
            SettingsManager.updateSupabaseStatus('error', 'Supabase client is not initialized.');
            showToast('Supabase is not connected.', 'warning');
            return;
        }

        SettingsManager.updateSupabaseStatus('checking', 'Checking Supabase connectivity...');

        try {
            const user = await SettingsManager.getAuthenticatedUser();
            if (!user) {
                SettingsManager.updateSupabaseStatus('error', 'Sign in required to verify Supabase access.');
                showToast('Sign in required to verify Supabase access.', 'warning');
                return;
            }

            const { error } = await supabaseClient
                .from('technicians')
                .select('id')
                .limit(1);

            if (error) throw error;

            SettingsManager.updateSupabaseStatus('connected', 'Supabase connectivity verified.');
            showToast('Supabase connectivity verified.', 'success');
        } catch (error) {
            console.error('Supabase connectivity check failed:', error);
            SettingsManager.updateSupabaseStatus('error', 'Unable to reach Supabase. Check credentials or network.');
            showToast('Supabase connectivity check failed.', 'error');
        }
    }
};

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

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

function showCreateWorkOrderModal() {
    openModal('create-workorder-modal');
}

function hideCreateWorkOrderModal() {
    closeModal('create-workorder-modal');
}

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

    if (!button || !menu) return;

    const toggleMenu = () => {
        const isHidden = menu.classList.toggle('hidden');
        button.setAttribute('aria-expanded', String(!isHidden));
    };

    button.addEventListener('click', toggleMenu);
    menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (!menu.classList.contains('hidden')) {
                toggleMenu();
            }
        });
    });
}

function normalizePageName(pageName) {
    if (!pageName || pageName === 'index') {
        return 'dashboard';
    }

    if (pageName === 'work-orders') {
        return 'workorders';
    }

    return pageName;
}

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
    ChartManager.initializeCharts();
    setupMobileMenu();

    const authed = await requireAuth();
    if (!authed) {
        return;
    }

    setupLogout();

    if (AppState.currentPage === 'assets') {
        assetManager.loadAssets();
        assetManager.setupEventLuisteners();
    } else if (AppState.currentPage === 'workorders') {
        await WorkOrderManager.init();
    } else if (AppState.currentPage === 'settings') {
        await SettingsManager.init();
    } else if (AppState.currentPage === 'customers') {
        initCustomerPage();
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

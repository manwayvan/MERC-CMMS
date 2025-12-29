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

const MOCK_DATA_ENABLED = typeof CONFIG !== 'undefined' && CONFIG.ENABLE_MOCK_DATA === true;

function shouldUseMockData() {
    return MOCK_DATA_ENABLED;
}

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
            console.warn('Loading demo asset data.');
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
        await WorkOrderManager.loadWorkOrderAssets();
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

        const viewForm = document.getElementById('view-workorder-form');
        if (viewForm) {
            viewForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                await WorkOrderManager.handleUpdateWorkOrder();
            });
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                hideCreateWorkOrderModal();
                hideViewWorkOrderModal();
            }
        });
    },

    // View work order
    viewWorkOrder: (workOrderId) => {
        const workOrder = AppState.workOrders.find(wo => wo.id === workOrderId);
        if (!workOrder) {
            showToast('Work order not found', 'error');
            return;
        }

        // Populate dropdowns FIRST (before setting values), passing the values to set
        WorkOrderManager.populateViewAssetOptions(workOrder.asset_id || '');
        WorkOrderManager.populateViewTechnicianOptions(workOrder.assigned_technician_id || '');
        WorkOrderManager.populateViewWorkOrderTypes(workOrder.type || '');

        // Now set the other values AFTER dropdowns are populated
        document.getElementById('view-workorder-id').value = workOrder.id;
        document.getElementById('view-workorder-wo-id').value = workOrder.id;
        document.getElementById('view-workorder-status').value = workOrder.status === 'completed' ? 'closed' : 
                                                                  workOrder.status === 'cancelled' ? 'incomplete' : 
                                                                  workOrder.status || 'open';
        document.getElementById('view-workorder-priority-select').value = workOrder.priority || 'medium';
        
        // Format date for input
        if (workOrder.due_date) {
            const dueDate = new Date(workOrder.due_date);
            const formattedDate = dueDate.toISOString().split('T')[0];
            document.getElementById('view-workorder-due-date').value = formattedDate;
        }
        
        document.getElementById('view-workorder-estimated-hours').value = workOrder.estimated_hours || '';
        document.getElementById('view-workorder-description').value = workOrder.description || '';

        // Show modal
        const modal = document.getElementById('view-workorder-modal');
        if (modal) {
            modal.classList.add('active');
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
        const workOrderId = document.getElementById('view-workorder-id')?.value;
        if (!workOrderId) {
            showToast('Work order ID is missing', 'error');
            return;
        }

        const assetId = document.getElementById('view-workorder-asset-select')?.value || '';
        const type = WorkOrderManager.toDatabaseWorkOrderType(document.getElementById('view-workorder-type-select')?.value || '');
        const priority = document.getElementById('view-workorder-priority-select')?.value || 'medium';
        const status = document.getElementById('view-workorder-status')?.value || 'open';
        const technicianId = document.getElementById('view-workorder-technician-select')?.value || null;
        const dueDate = document.getElementById('view-workorder-due-date')?.value || '';
        const estimatedHours = document.getElementById('view-workorder-estimated-hours')?.value ? Number(document.getElementById('view-workorder-estimated-hours').value) : null;
        const description = document.getElementById('view-workorder-description')?.value?.trim() || '';

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
                hideViewWorkOrderModal();
                showToast('Work order updated (demo mode).', 'success');
            }
            return;
        }

        // Update in Supabase - select only essential fields to avoid trigger issues
        const selectFields = ['id', 'asset_id', 'type', 'priority', 'status', 'due_date', 'created_date', 'completed_date', 'estimated_hours', 'actual_hours', 'cost', 'description'];
        
        let { data, error } = await supabaseClient
            .from('work_orders')
            .update(updatePayload)
            .eq('id', workOrderId)
            .select(selectFields.join(', '));

        // If error is about assigned_technician_id, retry without it
        if (error && (/assigned_technician_id.*does not exist|42703|PGRST204/i.test(error.message || '') || 
                      (error.code && (error.code === '42703' || error.code === 'PGRST204')))) {
            delete updatePayload.assigned_technician_id;
            ({ data, error } = await supabaseClient
                .from('work_orders')
                .update(updatePayload)
                .eq('id', workOrderId)
                .select(selectFields.join(', ')));
        }

        // If error is about updated_at trigger, try without selecting (trigger will still update it)
        if (error && /updated_at|42703/i.test(error.message || '')) {
            console.warn('updated_at trigger issue, retrying without select');
            ({ error } = await supabaseClient
                .from('work_orders')
                .update(updatePayload)
                .eq('id', workOrderId));
            
            // If update succeeded, just reload the data
            if (!error) {
                // Update was successful, just reload
                await WorkOrderManager.loadWorkOrders();
                WorkOrderManager.renderWorkOrders();
                WorkOrderManager.renderWorkOrdersList();
                WorkOrderManager.renderRecentWorkOrders();
                WorkOrderManager.updateSummaryCounts();
                hideViewWorkOrderModal();
                showToast('Work order updated successfully.', 'success');
                return;
            }
        }

        if (error) {
            console.error('Error updating work order:', error);
            let errorMessage = 'Failed to update work order.';
            if (error.message) {
                // Provide user-friendly error message
                if (error.message.includes('updated_at')) {
                    errorMessage = 'Failed to update work order. Database trigger error - please contact administrator.';
                } else {
                    errorMessage = 'Failed to update work order. ' + error.message;
                }
            }
            showToast(errorMessage, 'error');
            return;
        }

        // Reload work orders
        await WorkOrderManager.loadWorkOrders();
        WorkOrderManager.renderWorkOrders();
        WorkOrderManager.renderWorkOrdersList();
        WorkOrderManager.renderRecentWorkOrders();
        WorkOrderManager.updateSummaryCounts();
        hideViewWorkOrderModal();
        showToast('Work order updated successfully.', 'success');
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
        const type = WorkOrderManager.toDatabaseWorkOrderType(typeSelect?.value || '');
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
    currentView: 'grid',
    switchView: (view) => {
        WorkOrderManager.currentView = view;
        const gridView = document.getElementById('workorders-grid-view');
        const listView = document.getElementById('workorders-list-view');
        const gridBtn = document.getElementById('grid-view-btn');
        const listBtn = document.getElementById('list-view-btn');

        if (view === 'grid') {
            if (gridView) gridView.classList.remove('hidden');
            if (listView) listView.classList.add('hidden');
            if (gridBtn) gridBtn.classList.add('active');
            if (listBtn) listBtn.classList.remove('active');
            WorkOrderManager.renderWorkOrders();
        } else {
            if (gridView) gridView.classList.add('hidden');
            if (listView) listView.classList.remove('hidden');
            if (gridBtn) gridBtn.classList.remove('active');
            if (listBtn) listBtn.classList.add('active');
            WorkOrderManager.renderWorkOrdersList();
        }
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

        return filtered;
    },

    // Setup search and filter event listeners
    setupSearchAndFilters: () => {
        const searchInput = document.getElementById('workorder-search');
        const priorityFilter = document.getElementById('priority-filter');
        const technicianFilter = document.getElementById('technician-filter');

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

        if (priorityFilter) {
            priorityFilter.addEventListener('change', applyFilters);
        }

        if (technicianFilter) {
            technicianFilter.addEventListener('change', applyFilters);
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
    }
};

const SettingsManager = {
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
        SettingsManager.cacheElements();
        SettingsManager.bindEvents();
        await SettingsManager.loadTechnicians();
        await SettingsManager.loadWorkOrderTypes();
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
    // Reset form if needed
    const form = document.getElementById('create-workorder-form');
    if (form) form.reset();
}

function hideViewWorkOrderModal() {
    closeModal('view-workorder-modal');
    // Reset form if needed
    const form = document.getElementById('view-workorder-form');
    if (form) form.reset();
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

    await loadSupabaseClient();

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

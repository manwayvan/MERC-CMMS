// MERC-CMMS Enterprise JavaScript Application
// Comprehensive functionality for Medical Device Management System

// Global Application State
const AppState = {
    currentPage: '',
    assets: [],
    workOrders: [],
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
                serialNumber: `SN${Math.floor(Math.random() * 900000) + 100000}`,
                warrantyExpiry: new Date(2025 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
                purchaseDate: new Date(2020 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
                purchaseCost: Math.floor(Math.random() * 500000) + 10000,
                lastMaintenance: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
                nextMaintenance: new Date(2025, Math.floor(Math.random() * 6), Math.floor(Math.random() * 28) + 1),
                complianceStatus: Math.random() > 0.1 ? 'compliant' : 'needs-attention'
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
                assetId: `AST-${String(Math.floor(Math.random() * 50) + 1).padStart(4, '0')}`,
                type: type,
                priority: priority,
                status: status,
                technician: technician,
                dueDate: new Date(2025, Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1),
                createdDate: new Date(2024, 11, Math.floor(Math.random() * 31) + 1),
                completedDate: status === 'completed' ? new Date(2024, 11, Math.floor(Math.random() * 31) + 1) : null,
                estimatedHours: Math.floor(Math.random() * 8) + 1,
                actualHours: status === 'completed' ? Math.floor(Math.random() * 8) + 1 : 0,
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
                lastAudit: new Date(2024, 10, 15),
                nextAudit: new Date(2025, 4, 15)
            },
            jointCommission: {
                name: 'Joint Commission Standards',
                status: 'compliant',
                percentage: 97.8,
                lastAudit: new Date(2024, 9, 20),
                nextAudit: new Date(2025, 3, 20)
            },
            iso13485: {
                name: 'ISO 13485',
                status: 'needs-attention',
                percentage: 89.2,
                lastAudit: new Date(2024, 8, 10),
                nextAudit: new Date(2025, 2, 10)
            },
            osha: {
                name: 'OSHA Compliance',
                status: 'compliant',
                percentage: 99.1,
                lastAudit: new Date(2024, 11, 5),
                nextAudit: new Date(2025, 6, 5)
            }
        };
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
        const performanceChart = echarts.init(document.getElementById('technician-performance-chart'));
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

// Asset Management Functions
const AssetManager = {
    // Initialize asset management functionality
    init: () => {
        AssetManager.loadAssets();
        AssetManager.setupEventListeners();
    },

    // Load and display assets
    loadAssets: () => {
        AppState.assets = MockData.generateAssets();
        AssetManager.renderAssetTable();
        AssetManager.updateStatistics();
    },

    // Render asset table
    renderAssetTable: () => {
        const tableBody = document.getElementById('asset-table-body');
        if (!tableBody) return;

        const displayAssets = AppState.assets.slice(0, 10); // Show first 10 for pagination
        
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
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${AssetManager.getStatusColor(asset.status)}">
                        <span class="status-indicator status-${asset.status}"></span>
                        ${asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${asset.warrantyExpiry.toLocaleDateString()}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button class="text-blue-600 hover:text-blue-900 mr-3" onclick="AssetManager.viewAsset('${asset.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="text-green-600 hover:text-green-900 mr-3" onclick="AssetManager.editAsset('${asset.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-900" onclick="AssetManager.deleteAsset('${asset.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },

    // Get status color class
    getStatusColor: (status) => {
        const colors = {
            active: 'bg-green-100 text-green-800',
            inactive: 'bg-gray-100 text-gray-800',
            maintenance: 'bg-amber-100 text-amber-800',
            retired: 'bg-red-100 text-red-800'
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    },

    // Update asset statistics
    updateStatistics: () => {
        const stats = {
            total: AppState.assets.length,
            active: AppState.assets.filter(a => a.status === 'active').length,
            maintenance: AppState.assets.filter(a => a.status === 'maintenance').length,
            overdue: AppState.assets.filter(a => a.nextMaintenance < new Date()).length
        };

        // Update statistics display if elements exist
        const totalElement = document.querySelector('.text-2xl.font-bold.text-slate-800');
        if (totalElement) {
            // Update all statistics on the page
            const statElements = document.querySelectorAll('.text-2xl.font-bold');
            if (statElements.length >= 4) {
                statElements[0].textContent = stats.total.toLocaleString();
                statElements[1].textContent = stats.active.toLocaleString();
                statElements[2].textContent = stats.maintenance.toLocaleString();
                statElements[3].textContent = stats.overdue.toLocaleString();
            }
        }
    },

    // Setup event listeners
    setupEventListeners: () => {
        // Search functionality
        const searchInput = document.getElementById('asset-search');
        if (searchInput) {
            searchInput.addEventListener('input', AssetManager.handleSearch);
        }

        // Category filter chips
        const filterChips = document.querySelectorAll('.filter-chip');
        filterChips.forEach(chip => {
            chip.addEventListener('click', () => AssetManager.handleCategoryFilter(chip));
        });
    },

    // Handle search
    handleSearch: (event) => {
        const query = event.target.value.toLowerCase();
        const filteredAssets = AppState.assets.filter(asset => 
            asset.name.toLowerCase().includes(query) ||
            asset.id.toLowerCase().includes(query) ||
            asset.location.toLowerCase().includes(query) ||
            asset.serialNumber.toLowerCase().includes(query)
        );
        AssetManager.renderFilteredAssets(filteredAssets);
    },

    // Handle category filter
    handleCategoryFilter: (chip) => {
        // Remove active class from all chips
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        // Add active class to clicked chip
        chip.classList.add('active');

        const category = chip.dataset.category;
        let filteredAssets = AppState.assets;

        if (category !== 'all') {
            filteredAssets = AppState.assets.filter(asset => asset.category === category);
        }

        AssetManager.renderFilteredAssets(filteredAssets);
    },

    // Render filtered assets
    renderFilteredAssets: (assets) => {
        const tableBody = document.getElementById('asset-table-body');
        if (!tableBody) return;

        const displayAssets = assets.slice(0, 10);
        
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
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${AssetManager.getStatusColor(asset.status)}">
                        <span class="status-indicator status-${asset.status}"></span>
                        ${asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">${asset.warrantyExpiry.toLocaleDateString()}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button class="text-blue-600 hover:text-blue-900 mr-3" onclick="AssetManager.viewAsset('${asset.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="text-green-600 hover:text-green-900 mr-3" onclick="AssetManager.editAsset('${asset.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-900" onclick="AssetManager.deleteAsset('${asset.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        // Update showing count
        const showingElement = document.getElementById('showing-end');
        if (showingElement) {
            showingElement.textContent = Math.min(10, assets.length);
        }
        const totalElement = document.getElementById('total-assets');
        if (totalElement) {
            totalElement.textContent = assets.length.toLocaleString();
        }
    },

    // Asset actions
    viewAsset: (assetId) => {
        showToast('Viewing asset details', 'info');
    },

    editAsset: (assetId) => {
        showToast('Opening asset editor', 'info');
    },

    deleteAsset: (assetId) => {
        if (confirm('Are you sure you want to delete this asset?')) {
            AppState.assets = AppState.assets.filter(asset => asset.id !== assetId);
            AssetManager.renderAssetTable();
            AssetManager.updateStatistics();
            showToast('Asset deleted successfully', 'success');
        }
    }
};

// Work Order Management Functions
const WorkOrderManager = {
    // Initialize work order management
    init: () => {
        AppState.workOrders = MockData.generateWorkOrders();
        WorkOrderManager.renderWorkOrders();
        WorkOrderManager.renderRecentWorkOrders();
        WorkOrderManager.setupEventListeners();
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
                    <p class="text-sm text-slate-600 mb-2">${wo.type}</p>
                    <p class="text-xs text-slate-500 mb-3">Asset: ${wo.assetId}</p>
                    <div class="flex justify-between items-center">
                        <div class="flex items-center">
                            <div class="technician-avatar">${wo.technician.split(' ').map(n => n[0]).join('')}</div>
                            <span class="text-xs text-slate-500">${wo.technician}</span>
                        </div>
                        <span class="text-xs text-slate-500">${wo.dueDate.toLocaleDateString()}</span>
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
            .sort((a, b) => b.createdDate - a.createdDate)
            .slice(0, 10);

        tableBody.innerHTML = recentWorkOrders.map(wo => `
            <tr class="border-b border-slate-100 hover:bg-slate-50">
                <td class="py-3 px-4 text-sm font-medium text-slate-900">${wo.id}</td>
                <td class="py-3 px-4 text-sm text-slate-600">${wo.assetId}</td>
                <td class="py-3 px-4 text-sm text-slate-600">${wo.type}</td>
                <td class="py-3 px-4">
                    <span class="text-xs px-2 py-1 rounded-full ${WorkOrderManager.getPriorityColor(wo.priority)}">
                        ${wo.priority.toUpperCase()}
                    </span>
                </td>
                <td class="py-3 px-4 text-sm text-slate-600">${wo.technician}</td>
                <td class="py-3 px-4 text-sm text-slate-600">${wo.dueDate.toLocaleDateString()}</td>
                <td class="py-3 px-4">
                    <span class="text-xs px-2 py-1 rounded-full ${WorkOrderManager.getStatusColor(wo.status)}">
                        ${wo.status.charAt(0).toUpperCase() + wo.status.slice(1).replace('-', ' ')}
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
        // Search functionality
        const searchInput = document.getElementById('workorder-search');
        if (searchInput) {
            searchInput.addEventListener('input', WorkOrderManager.handleSearch);
        }

        // Filter functionality
        const priorityFilter = document.getElementById('priority-filter');
        const technicianFilter = document.getElementById('technician-filter');
        
        if (priorityFilter) priorityFilter.addEventListener('change', WorkOrderManager.handleFilter);
        if (technicianFilter) technicianFilter.addEventListener('change', WorkOrderManager.handleFilter);
    },

    // Handle search
    handleSearch: (event) => {
        const query = event.target.value.toLowerCase();
        // Filter work orders and re-render
        showToast(`Searching for: ${query}`, 'info');
    },

    // Handle filter
    handleFilter: () => {
        // Apply filters and re-render
        showToast('Filters applied', 'info');
    },

    // Work order actions
    viewWorkOrder: (workOrderId) => {
        showToast(`Viewing work order: ${workOrderId}`, 'info');
    }
};

// Compliance Management Functions
const ComplianceManager = {
    // Initialize compliance management
    init: () => {
        AppState.compliance = MockData.generateComplianceData();
        ComplianceManager.renderAuditTrail();
        ComplianceManager.initComplianceGauges();
    },

    // Render audit trail
    renderAuditTrail: () => {
        const container = document.getElementById('audit-trail');
        if (!container) return;

        const auditItems = [
            { user: 'John Smith', action: 'Updated asset AST-0001', timestamp: new Date(Date.now() - 300000), type: 'update' },
            { user: 'Sarah Johnson', action: 'Created work order WO-0101', timestamp: new Date(Date.now() - 600000), type: 'create' },
            { user: 'Mike Davis', action: 'Completed maintenance for MRI-001', timestamp: new Date(Date.now() - 900000), type: 'maintenance' },
            { user: 'Lisa Wilson', action: 'Updated compliance documentation', timestamp: new Date(Date.now() - 1200000), type: 'compliance' },
            { user: 'Robert Brown', action: 'Generated compliance report', timestamp: new Date(Date.now() - 1500000), type: 'report' }
        ];

        container.innerHTML = auditItems.map(item => `
            <div class="audit-trail-item">
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-sm font-medium text-slate-800">${item.action}</p>
                        <p class="text-xs text-slate-500">by ${item.user}</p>
                    </div>
                    <span class="text-xs text-slate-400">${ComplianceManager.formatTimeAgo(item.timestamp)}</span>
                </div>
            </div>
        `).join('');
    },

    // Initialize compliance gauges
    initComplianceGauges: () => {
        // Gauges are handled by ChartManager
    },

    // Format time ago
    formatTimeAgo: (date) => {
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        
        if (diffInMinutes < 60) {
            return `${diffInMinutes}m ago`;
        } else {
            const diffInHours = Math.floor(diffInMinutes / 60);
            return `${diffInHours}h ago`;
        }
    }
};

// Animation and Effects
const AnimationManager = {
    // Initialize animations
    init: () => {
        AnimationManager.initCounterAnimations();
        AnimationManager.initHeroAnimation();
        AnimationManager.initScrollAnimations();
    },

    // Initialize counter animations
    initCounterAnimations: () => {
        const counters = [
            { id: 'total-assets', target: 2847 },
            { id: 'active-work-orders', target: 156 },
            { id: 'compliance-rate', target: 98.7, suffix: '%' },
            { id: 'maintenance-due', target: 89 }
        ];

        counters.forEach(counter => {
            const element = document.getElementById(counter.id);
            if (element) {
                AnimationManager.animateCounter(element, counter.target, counter.suffix || '');
            }
        });
    },

    // Animate counter
    animateCounter: (element, target, suffix = '') => {
        let current = 0;
        const increment = target / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            
            if (suffix === '%') {
                element.textContent = current.toFixed(1) + suffix;
            } else {
                element.textContent = Math.floor(current).toLocaleString();
            }
        }, 50);
    },

    // Initialize hero animation
    initHeroAnimation: () => {
        const heroText = document.getElementById('hero-text');
        if (heroText && typeof Typed !== 'undefined') {
            new Typed('#hero-text', {
                strings: ['Enterprise Medical Device Management', 'Comprehensive CMMS Solution', 'Healthcare Compliance Platform'],
                typeSpeed: 50,
                backSpeed: 30,
                backDelay: 2000,
                loop: true
            });
        }
    },

    // Initialize scroll animations
    initScrollAnimations: () => {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe elements for scroll animation
        document.querySelectorAll('.card-hover').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }
};

// Utility Functions
const Utils = {
    // Format date
    formatDate: (date) => {
        return date.toLocaleDateString();
    },

    // Format currency
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },

    // Generate random ID
    generateId: (prefix) => {
        return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
    },

    // Debounce function
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Toast Notifications
const ToastManager = {
    // Show toast notification
    show: (message, type = 'info', duration = 3000) => {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type} bg-white border-l-4 rounded-lg shadow-lg p-4 mb-4 max-w-sm`;
        
        const colors = {
            success: 'border-green-500',
            error: 'border-red-500',
            warning: 'border-amber-500',
            info: 'border-blue-500'
        };

        toast.className += ` ${colors[type] || colors.info}`;
        
        toast.innerHTML = `
            <div class="flex items-center">
                <div class="flex-1">
                    <p class="text-sm font-medium text-slate-800">${message}</p>
                </div>
                <button class="ml-4 text-slate-400 hover:text-slate-600" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        container.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        }, 10);

        // Auto remove
        setTimeout(() => {
            ToastManager.remove(toast);
        }, duration);
    },

    // Remove toast
    remove: (toast) => {
        toast.style.transform = 'translateX(100%)';
        toast.style.opacity = '0';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
};

// Global Functions
function showToast(message, type = 'info') {
    ToastManager.show(message, type);
}

function showComingSoon() {
    showToast('Feature coming soon!', 'info');
}

function filterByCategory(category) {
    if (typeof AssetManager !== 'undefined') {
        AssetManager.handleCategoryFilter({ dataset: { category } });
    }
}

function changePage(direction) {
    showToast(`Navigating ${direction}`, 'info');
}

// Modal Functions
function showCreateWorkOrderModal() {
    const modal = document.getElementById('create-workorder-modal');
    if (modal) {
        modal.classList.add('active');
    }
}

function hideCreateWorkOrderModal() {
    const modal = document.getElementById('create-workorder-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function showCustomReportModal() {
    const modal = document.getElementById('custom-report-modal');
    if (modal) {
        modal.classList.add('active');
    }
}

function hideCustomReportModal() {
    const modal = document.getElementById('custom-report-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Application Initialization
const App = {
    // Initialize application
    init: () => {
        // Determine current page
        const path = window.location.pathname;
        if (path.includes('assets.html')) {
            AppState.currentPage = 'assets';
        } else if (path.includes('work-orders.html')) {
            AppState.currentPage = 'workorders';
        } else if (path.includes('compliance.html')) {
            AppState.currentPage = 'compliance';
        } else {
            AppState.currentPage = 'dashboard';
        }

        // Initialize components
        ChartManager.initializeCharts();
        AnimationManager.init();
        
        // Initialize page-specific functionality
        if (AppState.currentPage === 'assets') {
            AssetManager.init();
        } else if (AppState.currentPage === 'workorders') {
            WorkOrderManager.init();
        } else if (AppState.currentPage === 'compliance') {
            ComplianceManager.init();
        }

        // Setup global event listeners
        App.setupGlobalEventListeners();

        // Initialize recent activity
        App.initRecentActivity();

        showToast('MERC-CMMS System Loaded Successfully', 'success');
    },

    // Setup global event listeners
    setupGlobalEventListeners: () => {
        // Window resize for charts
        window.addEventListener('resize', Utils.debounce(() => {
            ChartManager.resizeCharts();
        }, 250));

        // Modal close on outside click
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal')) {
                event.target.classList.remove('active');
            }
        });

        // Form submissions
        document.addEventListener('submit', (event) => {
            if (event.target.id === 'create-workorder-form') {
                event.preventDefault();
                hideCreateWorkOrderModal();
                showToast('Work order created successfully!', 'success');
            } else if (event.target.id === 'custom-report-form') {
                event.preventDefault();
                hideCustomReportModal();
                showToast('Custom report generated successfully!', 'success');
            }
        });
    },

    // Initialize recent activity
    initRecentActivity: () => {
        const activityContainer = document.getElementById('recent-activity');
        if (!activityContainer) return;

        const activities = [
            { user: 'John Smith', action: 'Completed maintenance on MRI-001', time: '5 minutes ago', type: 'maintenance' },
            { user: 'Sarah Johnson', action: 'Updated compliance documentation', time: '12 minutes ago', type: 'compliance' },
            { user: 'Mike Davis', action: 'Created work order WO-0156', time: '25 minutes ago', type: 'workorder' },
            { user: 'Lisa Wilson', action: 'Added new asset AST-0285', time: '1 hour ago', type: 'asset' },
            { user: 'Robert Brown', action: 'Generated compliance report', time: '2 hours ago', type: 'report' }
        ];

        activityContainer.innerHTML = activities.map(activity => `
            <div class="flex items-start space-x-3 p-3 hover:bg-slate-50 rounded-lg transition-colors">
                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-user text-blue-600 text-sm"></i>
                </div>
                <div class="flex-1">
                    <p class="text-sm text-slate-800">
                        <span class="font-medium">${activity.user}</span> ${activity.action}
                    </p>
                    <p class="text-xs text-slate-500">${activity.time}</p>
                </div>
            </div>
        `).join('');
    }
};

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Export for global access
window.showToast = showToast;
window.showComingSoon = showComingSoon;
window.filterByCategory = filterByCategory;
window.changePage = changePage;
window.showCreateWorkOrderModal = showCreateWorkOrderModal;
window.hideCreateWorkOrderModal = hideCreateWorkOrderModal;
window.showCustomReportModal = showCustomReportModal;
window.hideCustomReportModal = hideCustomReportModal;
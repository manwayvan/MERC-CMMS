/**
 * Compliance Manager
 * Handles compliance data loading, charts, and reporting
 */

class ComplianceManager {
    constructor() {
        this.supabaseClient = window.supabaseClient;
        this.complianceStandards = [];
        this.complianceRecords = [];
        this.auditTrail = [];
        this.assets = [];
    }

    async init() {
        if (!this.supabaseClient) {
            console.error('Supabase client not initialized');
            return;
        }

        await this.loadComplianceData();
        this.renderComplianceOverview();
        this.renderComplianceGauges();
        this.renderComplianceTrend();
        this.renderComplianceMatrix();
        this.loadAuditTrail();
        this.renderFinancialCharts();
    }

    async loadComplianceData() {
        try {
            // Load compliance standards
            const { data: standards, error: standardsError } = await this.supabaseClient
                .from('compliance_standards')
                .select('*')
                .order('name');

            if (standardsError) throw standardsError;
            this.complianceStandards = standards || [];

            // Load compliance records
            const { data: records, error: recordsError } = await this.supabaseClient
                .from('compliance_records')
                .select('*, compliance_standards(*)')
                .order('created_at', { ascending: false });

            if (recordsError) throw recordsError;
            this.complianceRecords = records || [];

            // Load assets for compliance calculation
            const { data: assets, error: assetsError } = await this.supabaseClient
                .from('assets')
                .select('id, name, compliance_status, next_maintenance, last_maintenance');

            if (assetsError) throw assetsError;
            this.assets = assets || [];

            // Load audit trail
            const { data: audit, error: auditError } = await this.supabaseClient
                .from('audit_trail')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (auditError) throw auditError;
            this.auditTrail = audit || [];
        } catch (error) {
            console.error('Error loading compliance data:', error);
            this.showToast('Failed to load compliance data', 'error');
        }
    }

    calculateOverallCompliance() {
        if (!this.assets || this.assets.length === 0) return 100;

        const total = this.assets.length;
        let compliant = 0;

        this.assets.forEach(asset => {
            if (asset.compliance_status === 'compliant') {
                compliant++;
            } else if (asset.compliance_status === 'needs-attention') {
                compliant += 0.5; // Count as half compliant
            }
        });

        return total > 0 ? Math.round((compliant / total) * 100 * 10) / 10 : 100;
    }

    renderComplianceOverview() {
        const overallCompliance = this.calculateOverallCompliance();
        const activeStandards = this.complianceStandards.length;
        
        // Count pending audits (assets with next_maintenance due within 30 days)
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const pendingAudits = this.assets.filter(asset => {
            if (!asset.next_maintenance) return false;
            const nextMaint = new Date(asset.next_maintenance);
            return nextMaint <= thirtyDaysFromNow && nextMaint >= now;
        }).length;

        // Count critical issues (non-compliant assets)
        const criticalIssues = this.assets.filter(asset => 
            asset.compliance_status === 'non-compliant'
        ).length;

        // Update overview cards
        const overviewCards = document.querySelectorAll('.bg-slate-50.rounded-lg.p-4.text-center');
        if (overviewCards.length >= 4) {
            overviewCards[0].querySelector('.text-2xl').textContent = `${overallCompliance}%`;
            overviewCards[1].querySelector('.text-2xl').textContent = activeStandards;
            overviewCards[2].querySelector('.text-2xl').textContent = pendingAudits;
            overviewCards[3].querySelector('.text-2xl').textContent = criticalIssues;
        }
    }

    renderComplianceGauges() {
        if (typeof echarts === 'undefined') {
            console.warn('ECharts not loaded');
            return;
        }

        const standards = [
            { id: 'fda', name: 'FDA 21 CFR Part 820', code: 'FDA' },
            { id: 'joint-commission', name: 'Joint Commission', code: 'JOINT' },
            { id: 'iso', name: 'ISO 13485', code: 'ISO' },
            { id: 'osha', name: 'OSHA', code: 'OSHA' }
        ];

        standards.forEach(standard => {
            const gaugeElement = document.getElementById(`${standard.id}-gauge`);
            if (!gaugeElement) return;

            // Calculate compliance percentage for this standard
            const standardRecords = this.complianceRecords.filter(r => 
                r.compliance_standards?.code === standard.code
            );
            
            let compliancePercentage = 100;
            if (standardRecords.length > 0) {
                const compliantCount = standardRecords.filter(r => 
                    r.compliance_status === 'compliant'
                ).length;
                compliancePercentage = Math.round((compliantCount / standardRecords.length) * 100);
            } else {
                // If no records, calculate based on asset compliance
                const totalAssets = this.assets.length;
                if (totalAssets > 0) {
                    const compliantAssets = this.assets.filter(a => 
                        a.compliance_status === 'compliant'
                    ).length;
                    compliancePercentage = Math.round((compliantAssets / totalAssets) * 100);
                }
            }

            const chart = echarts.init(gaugeElement);
            const option = {
                series: [{
                    type: 'gauge',
                    startAngle: 180,
                    endAngle: 0,
                    min: 0,
                    max: 100,
                    splitNumber: 10,
                    itemStyle: {
                        color: compliancePercentage >= 90 ? '#059669' : 
                               compliancePercentage >= 70 ? '#d97706' : '#dc2626'
                    },
                    progress: {
                        show: true,
                        width: 18
                    },
                    pointer: {
                        show: false
                    },
                    axisLine: {
                        lineStyle: {
                            width: 18
                        }
                    },
                    axisTick: {
                        show: false
                    },
                    splitLine: {
                        show: false
                    },
                    axisLabel: {
                        show: false
                    },
                    title: {
                        show: false
                    },
                    detail: {
                        valueAnimation: true,
                        width: '60%',
                        lineHeight: 40,
                        borderRadius: 8,
                        offsetCenter: [0, '-15%'],
                        fontSize: 20,
                        fontWeight: 'bold',
                        formatter: '{value}%',
                        color: 'inherit'
                    },
                    data: [{
                        value: compliancePercentage,
                        name: 'Compliance'
                    }]
                }]
            };
            chart.setOption(option);
        });
    }

    renderComplianceTrend() {
        const chartElement = document.getElementById('compliance-trend-chart');
        if (!chartElement || typeof echarts === 'undefined') return;

        // Generate trend data for last 12 months
        const months = [];
        const complianceData = [];
        const now = new Date();

        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
            
            // Calculate compliance for this month (simplified - using current data)
            const compliance = this.calculateOverallCompliance();
            complianceData.push(compliance);
        }

        const chart = echarts.init(chartElement);
        const option = {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross'
                }
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'category',
                boundaryGap: false,
                data: months
            },
            yAxis: {
                type: 'value',
                min: 0,
                max: 100,
                axisLabel: {
                    formatter: '{value}%'
                }
            },
            series: [{
                name: 'Compliance Rate',
                type: 'line',
                smooth: true,
                data: complianceData,
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [{
                            offset: 0, color: 'rgba(37, 99, 235, 0.3)'
                        }, {
                            offset: 1, color: 'rgba(37, 99, 235, 0.1)'
                        }]
                    }
                },
                itemStyle: {
                    color: '#2563eb'
                }
            }]
        };
        chart.setOption(option);
    }

    renderComplianceMatrix() {
        // Matrix is mostly static, but we could enhance it with real data
        // For now, it's already rendered in HTML
    }

    async loadAuditTrail() {
        const auditContainer = document.getElementById('audit-trail');
        if (!auditContainer) return;

        if (this.auditTrail.length === 0) {
            auditContainer.innerHTML = '<p class="text-slate-500 text-sm">No audit trail entries found.</p>';
            return;
        }

        const auditHTML = this.auditTrail.slice(0, 10).map(entry => {
            const date = new Date(entry.created_at).toLocaleString();
            const actionIcon = this.getActionIcon(entry.action);
            return `
                <div class="audit-trail-item">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <div class="flex items-center gap-2 mb-1">
                                <i class="fas ${actionIcon} text-blue-600"></i>
                                <span class="font-semibold text-slate-800">${this.escapeHtml(entry.action)}</span>
                            </div>
                            <p class="text-sm text-slate-600">
                                ${this.escapeHtml(entry.entity_type)} #${this.escapeHtml(entry.entity_id)}
                            </p>
                            <p class="text-xs text-slate-500 mt-1">${date}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        auditContainer.innerHTML = auditHTML;
    }

    getActionIcon(action) {
        const actionLower = action.toLowerCase();
        if (actionLower.includes('create') || actionLower.includes('add')) return 'fa-plus-circle';
        if (actionLower.includes('update') || actionLower.includes('edit')) return 'fa-edit';
        if (actionLower.includes('delete') || actionLower.includes('remove')) return 'fa-trash';
        if (actionLower.includes('view') || actionLower.includes('read')) return 'fa-eye';
        return 'fa-circle';
    }

    renderFinancialCharts() {
        if (typeof echarts === 'undefined') return;

        // Cost Analysis Chart
        const costChartElement = document.getElementById('cost-analysis-chart');
        if (costChartElement) {
            this.renderCostAnalysisChart(costChartElement);
        }

        // Budget Comparison Chart
        const budgetChartElement = document.getElementById('budget-comparison-chart');
        if (budgetChartElement) {
            this.renderBudgetComparisonChart(budgetChartElement);
        }
    }

    async renderCostAnalysisChart(element) {
        try {
            // Load work order costs
            const { data: workOrders, error } = await this.supabaseClient
                .from('work_orders')
                .select('cost, type, created_date')
                .not('cost', 'is', null)
                .order('created_date', { ascending: false })
                .limit(100);

            if (error) throw error;

            // Group by type
            const costByType = {};
            (workOrders || []).forEach(wo => {
                const type = wo.type || 'Other';
                costByType[type] = (costByType[type] || 0) + parseFloat(wo.cost || 0);
            });

            const chart = echarts.init(element);
            const option = {
                tooltip: {
                    trigger: 'item',
                    formatter: '{b}: ${c} ({d}%)'
                },
                legend: {
                    orient: 'vertical',
                    left: 'left'
                },
                series: [{
                    type: 'pie',
                    radius: '50%',
                    data: Object.entries(costByType).map(([name, value]) => ({
                        value: value.toFixed(2),
                        name: name
                    })),
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                }]
            };
            chart.setOption(option);
        } catch (error) {
            console.error('Error rendering cost analysis chart:', error);
        }
    }

    async renderBudgetComparisonChart(element) {
        try {
            // Load work order costs by month
            const { data: workOrders, error } = await this.supabaseClient
                .from('work_orders')
                .select('cost, created_date')
                .not('cost', 'is', null)
                .order('created_date', { ascending: false })
                .limit(100);

            if (error) throw error;

            // Group by month
            const monthlyCosts = {};
            (workOrders || []).forEach(wo => {
                if (!wo.created_date) return;
                const date = new Date(wo.created_date);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                monthlyCosts[monthKey] = (monthlyCosts[monthKey] || 0) + parseFloat(wo.cost || 0);
            });

            const months = Object.keys(monthlyCosts).sort();
            const actual = months.map(m => monthlyCosts[m]);
            const budget = actual.map(a => a * 1.1); // Simulated budget (10% over actual)

            const chart = echarts.init(element);
            const option = {
                tooltip: {
                    trigger: 'axis'
                },
                legend: {
                    data: ['Actual', 'Budget']
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    data: months.map(m => {
                        const [year, month] = m.split('-');
                        return new Date(year, parseInt(month) - 1).toLocaleDateString('en-US', { month: 'short' });
                    })
                },
                yAxis: {
                    type: 'value',
                    axisLabel: {
                        formatter: '${value}'
                    }
                },
                series: [
                    {
                        name: 'Actual',
                        type: 'bar',
                        data: actual,
                        itemStyle: { color: '#2563eb' }
                    },
                    {
                        name: 'Budget',
                        type: 'line',
                        data: budget,
                        itemStyle: { color: '#dc2626' }
                    }
                ]
            };
            chart.setOption(option);
        } catch (error) {
            console.error('Error rendering budget comparison chart:', error);
        }
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message, type = 'info') {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// Initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.AppState?.currentPage === 'compliance' || window.location.pathname.includes('compliance')) {
            window.ComplianceManager = new ComplianceManager();
            window.ComplianceManager.init();
        }
    });
} else {
    if (window.AppState?.currentPage === 'compliance' || window.location.pathname.includes('compliance')) {
        window.ComplianceManager = new ComplianceManager();
        window.ComplianceManager.init();
    }
}


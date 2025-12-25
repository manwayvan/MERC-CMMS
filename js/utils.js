// Utility Functions

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    
    const colors = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        warning: 'bg-yellow-600',
        info: 'bg-blue-600'
    };
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    toast.className = `${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg mb-4 flex items-center space-x-3 animate-slide-in`;
    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed top-4 right-4 z-50 space-y-2';
    document.body.appendChild(container);
    return container;
}

function formatDate(date) {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatCurrency(amount) {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function calculateDaysUntil(date) {
    if (!date) return null;
    const today = new Date();
    const target = new Date(date);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

function getComplianceStatus(nextMaintenanceDate) {
    const daysUntil = calculateDaysUntil(nextMaintenanceDate);
    
    if (daysUntil === null) return { status: 'unknown', color: 'gray', text: 'Not Scheduled' };
    if (daysUntil < 0) return { status: 'overdue', color: 'red', text: 'OVERDUE', priority: 'critical' };
    if (daysUntil <= 7) return { status: 'urgent', color: 'orange', text: 'Due Soon', priority: 'high' };
    if (daysUntil <= 30) return { status: 'attention', color: 'yellow', text: 'Needs Attention', priority: 'medium' };
    return { status: 'compliant', color: 'green', text: 'Compliant', priority: 'low' };
}

function debounce(func, wait) {
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
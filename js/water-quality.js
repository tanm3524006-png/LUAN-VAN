// ===========================
// Water Quality Module
// ===========================

// Metric configurations with thresholds
const METRICS = {
    temperature: {
        label: 'Nhiệt độ',
        unit: '°C',
        min: 20, max: 35,
        good: [25, 30],
        warning: [22, 33],
        barMax: 40,
        format: (v) => v.toFixed(1)
    },
    ph: {
        label: 'pH',
        unit: '',
        min: 0, max: 14,
        good: [6.5, 8.5],
        warning: [6, 9],
        barMax: 14,
        format: (v) => v.toFixed(1)
    },
    dissolved_oxygen: {
        label: 'Oxy hòa tan',
        unit: 'mg/L',
        key: 'do',
        min: 0, max: 15,
        good: [5, 12],
        warning: [3, 14],
        barMax: 15,
        format: (v) => v.toFixed(1)
    },
    turbidity: {
        label: 'Độ đục',
        unit: 'NTU',
        min: 0, max: 100,
        good: [0, 25],
        warning: [0, 50],
        barMax: 100,
        format: (v) => Math.round(v)
    },
    ammonia: {
        label: 'Ammonia',
        unit: 'mg/L',
        min: 0, max: 0.5,
        good: [0, 0.02],
        warning: [0, 0.05],
        barMax: 0.1,
        format: (v) => v.toFixed(3)
    },
    tds: {
        label: 'TDS',
        unit: 'ppm',
        min: 0, max: 1000,
        good: [200, 500],
        warning: [100, 700],
        barMax: 1000,
        format: (v) => Math.round(v)
    }
};

// Chart data storage
let chartData = {
    labels: [],
    temperature: [],
    ph: [],
    dissolved_oxygen: [],
    turbidity: [],
    ammonia: [],
    tds: []
};

let waterQualityChart = null;
const MAX_CHART_POINTS = 30;

// Initialize water quality listeners
function initWaterQuality() {
    if (database) {
        const waterRef = database.ref('water_quality');
        waterRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                updateWaterQualityUI(data);
            }
        });
    }

    initChart();
}

function getMetricStatus(key, value) {
    const metric = METRICS[key];
    if (!metric) return 'good';

    const [goodMin, goodMax] = metric.good;
    const [warnMin, warnMax] = metric.warning;

    if (value >= goodMin && value <= goodMax) return 'good';
    if (value >= warnMin && value <= warnMax) return 'warning';
    return 'danger';
}

function getStatusLabel(status) {
    switch (status) {
        case 'good': return 'Bình thường';
        case 'warning': return 'Cảnh báo';
        case 'danger': return 'Nguy hiểm';
        default: return 'Đang tải...';
    }
}

function updateWaterQualityUI(data) {
    // Update each metric card
    Object.keys(METRICS).forEach(key => {
        const metric = METRICS[key];
        const uiKey = metric.key || key;
        const value = data[key];

        if (value === undefined || value === null) return;

        // Update value
        const valEl = document.getElementById(`val-${uiKey}`);
        if (valEl) {
            const formattedValue = metric.format(value);
            if (valEl.textContent !== formattedValue) {
                valEl.textContent = formattedValue;
                valEl.classList.add('updated');
                setTimeout(() => valEl.classList.remove('updated'), 600);
            }
        }

        // Update progress bar
        const barEl = document.getElementById(`bar-${uiKey}`);
        if (barEl) {
            const percent = Math.min(100, Math.max(0, (value / metric.barMax) * 100));
            barEl.style.width = percent + '%';

            // Color by status
            const status = getMetricStatus(key, value);
            if (status === 'good') {
                barEl.style.background = 'linear-gradient(90deg, #00d4aa, #0099ff)';
            } else if (status === 'warning') {
                barEl.style.background = 'linear-gradient(90deg, #ffb347, #ff9500)';
            } else {
                barEl.style.background = 'linear-gradient(90deg, #ff5757, #ff2d2d)';
            }
        }

        // Update status text
        const statusEl = document.getElementById(`status-${uiKey}`);
        if (statusEl) {
            const status = getMetricStatus(key, value);
            statusEl.textContent = getStatusLabel(status);
            statusEl.className = `card-status ${status}`;
        }
    });

    // Update pond overall status
    updatePondStatus(data);

    // Update last updated time
    if (data.last_updated) {
        const wqLastUpdated = document.getElementById('wqLastUpdated');
        if (wqLastUpdated) {
            const date = new Date(data.last_updated);
            wqLastUpdated.textContent = `Cập nhật: ${date.toLocaleTimeString('vi-VN')}`;
        }
    }

    // Add data to chart
    addChartData(data);
}

function updatePondStatus(data) {
    const pondStatus = document.getElementById('pondStatus');
    if (!pondStatus) return;

    const statusText = pondStatus.querySelector('.pond-status-text');
    let overallStatus = 'good';

    // Check all metrics
    Object.keys(METRICS).forEach(key => {
        const value = data[key];
        if (value === undefined) return;
        const status = getMetricStatus(key, value);
        if (status === 'danger') overallStatus = 'danger';
        else if (status === 'warning' && overallStatus !== 'danger') overallStatus = 'warning';
    });

    // Or use status from Firebase directly
    if (data.status) {
        const s = data.status.toLowerCase();
        if (s.includes('nguy') || s.includes('danger')) overallStatus = 'danger';
        else if (s.includes('cảnh') || s.includes('warn')) overallStatus = 'warning';
        else overallStatus = 'good';
    }

    pondStatus.className = `pond-status ${overallStatus}`;
    const labels = { good: '🟢 Ao cá ổn định', warning: '🟡 Cần chú ý', danger: '🔴 Cảnh báo!' };
    statusText.textContent = labels[overallStatus] || 'Đang tải...';
}

// --- Chart ---
function initChart() {
    const ctx = document.getElementById('waterQualityChart');
    if (!ctx) return;

    waterQualityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Nhiệt độ (°C)',
                    data: [],
                    borderColor: '#ff6b6b',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 2,
                    pointHoverRadius: 5,
                    borderWidth: 2
                },
                {
                    label: 'pH',
                    data: [],
                    borderColor: '#00d4aa',
                    backgroundColor: 'rgba(0, 212, 170, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 2,
                    pointHoverRadius: 5,
                    borderWidth: 2
                },
                {
                    label: 'DO (mg/L)',
                    data: [],
                    borderColor: '#0099ff',
                    backgroundColor: 'rgba(0, 153, 255, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 2,
                    pointHoverRadius: 5,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#8899b4',
                        font: { family: 'Inter', size: 12 },
                        usePointStyle: true,
                        pointStyle: 'circle',
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(10, 22, 40, 0.95)',
                    borderColor: 'rgba(0, 212, 170, 0.3)',
                    borderWidth: 1,
                    titleColor: '#e8f0fe',
                    bodyColor: '#8899b4',
                    titleFont: { family: 'Inter', weight: '600' },
                    bodyFont: { family: 'JetBrains Mono', size: 12 },
                    padding: 12,
                    cornerRadius: 10
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#4a5c7a',
                        font: { family: 'JetBrains Mono', size: 10 },
                        maxRotation: 0
                    },
                    grid: {
                        color: 'rgba(255,255,255,0.04)'
                    }
                },
                y: {
                    ticks: {
                        color: '#4a5c7a',
                        font: { family: 'JetBrains Mono', size: 10 }
                    },
                    grid: {
                        color: 'rgba(255,255,255,0.04)'
                    }
                }
            }
        }
    });
}

function addChartData(data) {
    if (!waterQualityChart) return;

    const now = new Date();
    const label = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    waterQualityChart.data.labels.push(label);
    waterQualityChart.data.datasets[0].data.push(data.temperature);
    waterQualityChart.data.datasets[1].data.push(data.ph);
    waterQualityChart.data.datasets[2].data.push(data.dissolved_oxygen);

    // Keep max points
    if (waterQualityChart.data.labels.length > MAX_CHART_POINTS) {
        waterQualityChart.data.labels.shift();
        waterQualityChart.data.datasets.forEach(ds => ds.data.shift());
    }

    waterQualityChart.update('none');
}

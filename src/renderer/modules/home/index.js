let dashboardChart = null;

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Saludo Usuario
    const userSession = JSON.parse(sessionStorage.getItem('user'));
    if (userSession && userSession.fullname) {
        document.getElementById('welcomeMsg').textContent = `Hola, ${userSession.fullname.split(' ')[0]}`;
    }

    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = new Date().toLocaleDateString('es-PE', options);
    document.getElementById("dateDisplay").textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

    await loadDashboard();
});

async function loadDashboard() {
    try {
        const data = await window.api.stats.getDashboard();
        
        if (!data) return;

        animateValue("todaySales", data.summary.money, "S/ ");
        document.getElementById("todayTrans").textContent = `${data.summary.transactions} ventas`;
        document.getElementById("alertCount").textContent = data.alerts.length;
        document.getElementById("totalProducts").textContent = data.summary.total_products;

        const predVal = document.getElementById("predictionVal");
        const trendInd = document.getElementById("trendIndicator");
        
        predVal.textContent = `S/ ${data.summary.prediction_tomorrow.toFixed(2)}`;
        
        if (data.summary.trend === 'up') {
            trendInd.innerHTML = '<span style="color:#16a34a">▲ Tendencia al Alza</span>';
        } else {
            trendInd.innerHTML = '<span style="color:#f59e0b">▼ Tendencia a la Baja</span>';
        }

        const table = document.getElementById("lowStockTable");
        table.innerHTML = "";
        if (data.alerts.length === 0) {
            table.innerHTML = "<tr><td colspan='2' class='center text-muted'>✅ Stock Óptimo</td></tr>";
        } else {
            data.alerts.slice(0, 5).forEach(p => {
                table.innerHTML += `
                    <tr>
                        <td>${p.name}</td>
                        <td style="text-align:right;"><span class="badge badge-danger">${p.stock} u.</span></td>
                    </tr>`;
            });
        }

        renderChart(data.chart);

    } catch (error) {
        console.error("Dashboard error:", error);
    }
}

function renderChart(chartData) {
    const ctx = document.getElementById('salesChart');
    if (!ctx) return;

    if (dashboardChart) dashboardChart.destroy();

    dashboardChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData.labels,
            datasets: [
                {
                    label: 'Ventas Reales',
                    data: chartData.data,
                    backgroundColor: 'rgba(37, 99, 235, 0.7)',
                    borderColor: '#2563eb',
                    borderWidth: 1,
                    borderRadius: 4,
                    order: 2
                },
                {
                    type: 'line',
                    label: 'Tendencia IA',
                    data: chartData.trend_line,
                    borderColor: '#9333ea',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    tension: 0.4,
                    order: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                x: { grid: { display: false } }
            }
        }
    });
}

function animateValue(id, end, prefix = "") {
    const obj = document.getElementById(id);
    if(!obj) return;
    const start = 0; const duration = 600; let startTime = null;
    const step = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const val = Math.floor(progress * (end - start) + start);
        obj.innerHTML = `${prefix}${val.toFixed(2)}`;
        if (progress < 1) window.requestAnimationFrame(step);
        else obj.innerHTML = `${prefix}${end.toFixed(2)}`;
    };
    window.requestAnimationFrame(step);
}
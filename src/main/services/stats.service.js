const statsRepo = require('../repositories/stats.repository');

class StatsService {

    async getDashboardData() {
        const todayStats = statsRepo.getTodaySales();
        const lowStock = statsRepo.getLowStockProducts();
        const topProducts = statsRepo.getTopProducts();
        const totalProducts = statsRepo.getTotalProductsCount();

        const history = statsRepo.getLast30DaysSales(); 

        const prediction = this.calculateLinearRegression(history);
        
        const nextDayIndex = history.length + 1;
        const predictedAmount = (prediction.slope * nextDayIndex) + prediction.intercept;
        const trend = prediction.slope > 0 ? 'up' : 'down';

        const daysToShow = history.length < 7 ? history.length : 7;
        const last7Days = history.slice(-daysToShow); 
        
        const chartLabels = [];
        const chartDataReal = [];
        const chartDataTrend = [];

        last7Days.forEach((day, index) => {
            chartLabels.push(day.date_label);
            chartDataReal.push(day.total);
            
            const x = (history.length - daysToShow) + (index + 1);
            const trendPoint = (prediction.slope * x) + prediction.intercept;
            chartDataTrend.push(trendPoint > 0 ? trendPoint : 0);
        });

        return {
            summary: {
                money: todayStats.total_money || 0,
                transactions: todayStats.total_transactions || 0,
                total_products: totalProducts || 0,
                prediction_tomorrow: predictedAmount > 0 ? predictedAmount : 0,
                trend: trend
            },
            alerts: lowStock,
            top_products: topProducts,
            chart: {
                labels: chartLabels,
                data: chartDataReal,
                trend_line: chartDataTrend
            }
        };
    }

    calculateLinearRegression(data) {
        if (!data || data.length < 2) return { slope: 0, intercept: 0 };

        const n = data.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

        for (let i = 0; i < n; i++) {
            const x = i + 1; 
            const y = data[i].total;
            sumX += x;
            sumY += y;
            sumXY += (x * y);
            sumXX += (x * x);
        }

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        return { slope, intercept };
    }
}

module.exports = new StatsService();
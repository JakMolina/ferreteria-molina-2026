const statsService = require('../services/stats.service');

const getDashboardData = async () => {
    try {
        return await statsService.getDashboardData();
    } catch (error) {
        console.error("❌ Error en Dashboard Stats:", error);
        return { 
            summary: { money: 0, transactions: 0, prediction_tomorrow: 0 }, 
            alerts: [], 
            chart: { labels: [], data: [], trend_line: [] } 
        };
    }
};

module.exports = { getDashboardData };
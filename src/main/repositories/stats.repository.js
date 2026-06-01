const { db } = require('../db');

class StatsRepository {
    getTodaySales() {
        const sql = `SELECT COALESCE(SUM(total), 0) as total_money, COUNT(id) as total_transactions FROM sales WHERE date(created_at) = date('now', 'localtime')`;
        return db.prepare(sql).get();
    }
    getLowStockProducts() {
        const sql = `SELECT id, name, stock, min_stock, provider_id FROM products WHERE stock <= min_stock AND is_active = 1 ORDER BY stock ASC LIMIT 10`;
        return db.prepare(sql).all();
    }
    getTopProducts() {
        const sql = `SELECT product_name, SUM(quantity) as total_qty FROM sale_items GROUP BY product_id ORDER BY total_qty DESC LIMIT 5`;
        return db.prepare(sql).all();
    }
    getTotalProductsCount() {
        const row = db.prepare('SELECT COUNT(id) as count FROM products WHERE is_active = 1').get();
        return row.count;
    }
    getLast30DaysSales() {
        const sql = `SELECT date(created_at) as sale_date, SUM(total) as total FROM sales WHERE created_at >= date('now', 'localtime', '-30 days') GROUP BY sale_date ORDER BY sale_date ASC`;
        const results = db.prepare(sql).all();
        return results.map(r => ({
            ...r,
            date_label: new Date(r.sale_date).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' })
        }));
    }
}
module.exports = new StatsRepository();
const { db } = require('../db');

class SaleRepository {
    
    createSaleHeader(data) {
        const sql = `
            INSERT INTO sales (invoice_number, total, payment_method, client_json, user_id, created_at)
            VALUES (@invoice_number, @total, @payment_method, @client_json, @user_id, datetime('now', 'localtime'))
        `;
        return db.prepare(sql).run(data);
    }

    createSaleItem(data) {
        const sql = `
            INSERT INTO sale_items (sale_id, product_id, product_name, quantity, price, subtotal)
            VALUES (@sale_id, @product_id, @product_name, @quantity, @price, @subtotal)
        `;
        return db.prepare(sql).run(data);
    }

    getLastSaleId() {
        const row = db.prepare('SELECT MAX(id) as id FROM sales').get();
        return row.id || 0;
    }

    logInventoryMovement(data) {
        const sql = `
            INSERT INTO inventory_logs (product_id, change_amount, current_stock_after, reason, reference_id, user_id, created_at)
            VALUES (@product_id, @change_amount, @current_stock_after, @reason, @reference_id, @user_id, datetime('now', 'localtime'))
        `;
        return db.prepare(sql).run(data);
    }

    getProductStockAndCost(id) {
        return db.prepare('SELECT stock, cost_price, name FROM products WHERE id = ?').get(id);
    }

    updateStock(id, quantityToRemove) {
        const sql = 'UPDATE products SET stock = stock - ? WHERE id = ?';
        db.prepare(sql).run(quantityToRemove, id);
        return db.prepare('SELECT stock FROM products WHERE id = ?').get(id).stock;
    }

    getDailySales() {
        const sql = `
            SELECT 
                s.id, s.invoice_number, s.total, s.created_at, u.username,
                (SELECT group_concat(quantity || 'x ' || product_name, ', ') 
                 FROM sale_items WHERE sale_id = s.id) as products_summary
            FROM sales s
            LEFT JOIN users u ON s.user_id = u.id
            WHERE date(s.created_at) = date('now', 'localtime')
            ORDER BY s.id DESC
        `;
        return db.prepare(sql).all();
    }

    getById(id) {
        const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(id);
        if (!sale) return null;
        
        const items = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(id);
        
        return { ...sale, items };
    }
}

module.exports = new SaleRepository();
const { db } = require('../db');

class ProductRepository {
    
    getAll(searchQuery = '') {
        try {
            if (searchQuery) {
                const sql = `
                    SELECT p.*, pr.name as provider_name 
                    FROM products p 
                    JOIN products_fts fts ON p.id = fts.rowid
                    LEFT JOIN providers pr ON p.provider_id = pr.id
                    WHERE products_fts MATCH ? AND p.is_active = 1
                    ORDER BY p.name ASC
                `;
                return db.prepare(sql).all(`${searchQuery}*`);
            } else {
                const sql = `
                    SELECT p.*, pr.name as provider_name 
                    FROM products p 
                    LEFT JOIN providers pr ON p.provider_id = pr.id
                    WHERE p.is_active = 1
                    ORDER BY p.id DESC
                `;
                return db.prepare(sql).all();
            }
        } catch (error) {
            console.error("SQL Error:", error);
            throw error;
        }
    }

    create(data) {
        const sql = `
            INSERT INTO products (
                name, category, type, attributes, cost_price, price, stock, min_stock, 
                description, provider_id, is_active
            ) VALUES (
                @name, @category, @type, @attributes, @cost_price, @price, @stock, @min_stock, 
                @description, @provider_id, 1
            )
        `;
        
        return db.prepare(sql).run({
            name: data.name,
            category: data.category || 'General',
            type: data.type || 'general',
            attributes: data.attributes ? JSON.stringify(data.attributes) : null,
            cost_price: data.cost_price,
            price: data.price,
            stock: data.stock,
            min_stock: data.min_stock || 5,
            description: data.description || '',
            provider_id: data.provider_id
        });
    }

    update(id, data) {
        const sql = `
            UPDATE products SET 
                name=@name, category=@category, type=@type, attributes=@attributes,
                cost_price=@cost_price, price=@price, stock=@stock, 
                description=@description, provider_id=@provider_id 
            WHERE id=@id
        `;
        return db.prepare(sql).run({ 
            ...data, 
            id,
            type: data.type || 'general',
            attributes: data.attributes ? JSON.stringify(data.attributes) : null,
            provider_id: data.provider_id 
        });
    }

    delete(id) {
        return db.prepare('UPDATE products SET is_active = 0 WHERE id = ?').run(id);
    }

    createLot(data) {
        const sql = `
            INSERT INTO product_lots (product_id, lot_number, expiration_date, initial_stock, current_stock)
            VALUES (@product_id, @lot_number, @expiration_date, @initial_stock, @current_stock)
        `;
        return db.prepare(sql).run({
            product_id: data.product_id,
            lot_number: data.lot_number,
            expiration_date: data.expiration_date || null,
            initial_stock: data.stock,
            current_stock: data.stock
        });
    }
}

module.exports = new ProductRepository();
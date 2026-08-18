const { db } = require('../db'); // Requerimos DB para la transacción
const productRepo = require('../repositories/product.repository');

class ProductService {

    getProducts(query) {
        const products = productRepo.getAll(query);
        return products.map(p => ({
            ...p,
            attributes: p.attributes ? JSON.parse(p.attributes) : {}
        }));
    }

    createProduct(data) {
        if (!data.name || data.name.trim() === "") {
            throw new Error("El nombre del producto es obligatorio.");
        }
        
        const cleanData = {
            name: data.name,
            category: data.category,
            type: data.type || 'general',
            attributes: data.attributes || {},
            price: parseFloat(data.price) || 0,
            cost_price: parseFloat(data.cost_price) || 0,
            stock: parseFloat(data.stock) || 0,
            min_stock: 5,
            description: data.description,
            provider_id: data.provider_id ? parseInt(data.provider_id) : null
        };

        if (cleanData.price < 0) throw new Error("El precio no puede ser negativo.");

        const transaction = db.transaction(() => {
            const result = productRepo.create(cleanData);
            const newProductId = result.lastInsertRowid;

            if (data.lots && Array.isArray(data.lots) && data.lots.length > 0) {
                for (const lot of data.lots) {
                    productRepo.createLot({
                        product_id: newProductId,
                        lot_number: lot.lot_number,
                        expiration_date: lot.expiration_date,
                        stock: parseFloat(lot.stock) || 0
                    });
                }
            }
            return result;
        });

        return transaction();
    }

    updateProduct(id, data) {
        const cleanData = {
            name: data.name,
            category: data.category,
            type: data.type || 'general',
            attributes: data.attributes || {},
            price: parseFloat(data.price) || 0,
            cost_price: parseFloat(data.cost_price) || 0,
            stock: parseFloat(data.stock) || 0,
            description: data.description,
            provider_id: data.provider_id ? parseInt(data.provider_id) : null
        };

        return productRepo.update(id, cleanData);
    }

    deleteProduct(id) {
        return productRepo.delete(id);
    }
}

module.exports = new ProductService();
const { db } = require('../db');
const saleRepo = require('../repositories/sale.repository');

class SaleService {

    createSale(saleData) {
        const transaction = db.transaction(() => {
            
            const nextId = saleRepo.getLastSaleId() + 1;
            
            let docPrefix = 'B001';
            try {
                if (saleData.client && saleData.client.type === 'factura') {
                    docPrefix = 'F001';
                }
            } catch (e) {}

            const invoiceNumber = `${docPrefix}-${String(nextId).padStart(6, '0')}`;

            let calculatedTotal = 0;
            const itemsToInsert = [];

            for (const item of saleData.items) {
                const product = saleRepo.getProductStockAndCost(item.product_id);

                if (!product) throw new Error(`Producto ID ${item.product_id} no existe.`);
                
                if (product.stock < item.quantity) {
                    throw new Error(`Stock insuficiente para '${product.name}'. Disponibles: ${product.stock}`);
                }

                const subtotal = item.quantity * item.price;
                calculatedTotal += subtotal;

                itemsToInsert.push({
                    ...item,
                    product_name: product.name,
                    subtotal
                });
            }

            const saleResult = saleRepo.createSaleHeader({
                invoice_number: invoiceNumber,
                total: calculatedTotal,
                payment_method: saleData.payment_method || 'EFECTIVO',
                client_json: JSON.stringify(saleData.client || {}),
                user_id: saleData.user_id || 1
            });

            const saleId = saleResult.lastInsertRowid;

            for (const item of itemsToInsert) {
                // a. Guardar detalle venta
                saleRepo.createSaleItem({
                    sale_id: saleId,
                    product_id: item.product_id,
                    product_name: item.product_name,
                    quantity: item.quantity,
                    price: item.price,
                    subtotal: item.subtotal
                });
                const finalStock = saleRepo.updateStock(item.product_id, item.quantity);

                saleRepo.logInventoryMovement({
                    product_id: item.product_id,
                    change_amount: -item.quantity,
                    current_stock_after: finalStock,
                    reason: 'VENTA',
                    reference_id: saleId
                });
            }

            return { success: true, saleId, invoiceNumber, total: calculatedTotal };
        });

        return transaction();
    }
    
    getDailySales() {
        return saleRepo.getDailySales();
    }

    getHistory() {
        return saleRepo.getAllHistory ? saleRepo.getAllHistory() : saleRepo.getDailySales();
    }

    getSaleById(id) {
        return saleRepo.getById(id);
    }

    deleteSale(saleId, userRole) {
        if (userRole && userRole !== 'admin') {
            throw new Error("⛔ ACCESO DENEGADO: Solo los administradores pueden anular ventas.");
        }

        const transaction = db.transaction(() => {
            const sale = saleRepo.getById(saleId);
            if (!sale) throw new Error("Venta no encontrada.");

            for (const item of sale.items) {
                const cantidadADevolver = -item.quantity; 
                
                const finalStock = saleRepo.updateStock(item.product_id, cantidadADevolver);

                saleRepo.logInventoryMovement({
                    product_id: item.product_id,
                    change_amount: item.quantity,
                    current_stock_after: finalStock,
                    reason: 'ANULACION',
                    reference_id: saleId
                });
            }

            db.prepare('DELETE FROM sale_items WHERE sale_id = ?').run(saleId);
            db.prepare('DELETE FROM sales WHERE id = ?').run(saleId);

            return { success: true, message: "Venta anulada y stock devuelto." };
        });

        return transaction();
    }
}

module.exports = new SaleService();
const saleService = require('../services/sale.service');

const createSale = async (data) => {
    try {
        console.log("💰 Procesando venta...", data.items.length, "items");
        const result = saleService.createSale(data);
        return result; 
    } catch (error) {
        console.error("❌ Error creando venta:", error.message);
        throw error; 
    }
};

const getHistory = async () => {
    try {
        return saleService.getHistory();
    } catch (error) {
        console.error("❌ Error obteniendo historial:", error);
        return [];
    }
};

const getDailySales = async () => {
    try {
        return saleService.getDailySales();
    } catch (error) {
        console.error("❌ Error ventas diarias:", error);
        return [];
    }
};

const getSaleById = async (id) => {
    try {
        const sale = saleService.getSaleById(id);
        if (!sale) throw new Error("Venta no encontrada");
        return sale;
    } catch (error) {
        console.error("❌ Error obteniendo venta por ID:", error);
        return null;
    }
};

const getSaleDetails = getSaleById;

const deleteSale = async (id, userId) => {
    try {
        console.log(`🗑️ Intentando anular venta #${id} por usuario ID: ${userId || 'Desconocido'}`);

        const result = saleService.deleteSale(id, userId);
        return result;
    } catch (error) {
        console.error("❌ Error anulando venta:", error.message);
        return { success: false, error: error.message };
    }
};

module.exports = { 
    createSale, 
    getHistory, 
    getDailySales, 
    getSaleById, 
    getSaleDetails,
    deleteSale 
};
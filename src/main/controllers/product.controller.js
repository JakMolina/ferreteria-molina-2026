const productService = require('../services/product.service');
const { dialog } = require('electron');

const handleRequest = async (action) => {
    try {
        return await action();
    } catch (error) {
        console.error("❌ Error en ProductController:", error.message);
        return { error: true, message: error.message };
    }
};

const getProducts = (event, query) => {
    try {
        return productService.getProducts(query);
    } catch (error) {
        console.error(error);
        return [];
    }
};

const createProduct = async (data) => {
    return handleRequest(() => productService.createProduct(data));
};

const updateProduct = async (id, data) => {
    return handleRequest(() => productService.updateProduct(id, data));
};

const deleteProduct = async (id) => {
    return handleRequest(() => productService.deleteProduct(id));
};

module.exports = { getProducts, createProduct, updateProduct, deleteProduct };
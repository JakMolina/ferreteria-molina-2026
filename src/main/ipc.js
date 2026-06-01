const { ipcMain, dialog, app } = require('electron'); 
const path = require('path');

const authController = require('./controllers/auth.controller');
const productController = require('./controllers/product.controller');
const salesController = require('./controllers/sales.controller');
const providerController = require('./controllers/provider.controller');
const userController = require('./controllers/user.controller');
const settingsController = require('./controllers/settings.controller');
const statsController = require('./controllers/stats.controller');
const pdfController = require('./controllers/pdf.controller');

let mainWindowRef = null;

function setupIPC(mainWindow) {
    mainWindowRef = mainWindow;
    console.log("🛠️ IPC Inicializado. Ventana vinculada:", !!mainWindowRef);

    ipcMain.handle('app:getPath', () => app.getAppPath());

    ipcMain.handle('navigate-to', (e, route) => {
        console.log("🔄 Navegando hacia:", route);
        if (!mainWindowRef) return false;
        try {
            const fullPath = path.join(__dirname, `../renderer/modules/${route}`);
            mainWindowRef.loadFile(fullPath);
            return true;
        } catch (error) {
            console.error("❌ Error al cargar archivo:", error);
            return false;
        }
    });

    ipcMain.handle('login', (e, creds) => authController.login(creds));
    ipcMain.handle('stats:dashboard', () => statsController.getDashboardData());

    ipcMain.handle('product:list', () => productController.getProducts());
    ipcMain.handle('products:get-all', (e, query) => productController.getProducts(e, query));
    ipcMain.handle('product:create', (e, data) => productController.createProduct(data));
    ipcMain.handle('product:update', (e, { id, data }) => productController.updateProduct(id, data));
    ipcMain.handle('product:delete', (e, id) => productController.deleteProduct(id));

    ipcMain.handle('sale:history', () => salesController.getHistory());
    ipcMain.handle('sale:create', (e, data) => salesController.createSale(data));
    
    ipcMain.handle('sale:details', (e, id) => salesController.getSaleDetails(id));
    
    ipcMain.handle('sale:daily', () => salesController.getDailySales());
    
    ipcMain.handle('sale:getById', (e, id) => salesController.getSaleById(id));
    
    ipcMain.handle('sale:save-pdf', async (e, saleId) => {
        return await pdfController.generateAndSavePDF(saleId);
    });
    ipcMain.handle('sale:delete', (e, id) => salesController.deleteSale(id, 'admin')); 

    ipcMain.handle('provider:list', () => providerController.getProviders());
    ipcMain.handle('provider:create', (e, data) => providerController.createProvider(data));
    ipcMain.handle('provider:update', (e, { id, data }) => providerController.updateProvider(id, data));
    ipcMain.handle('provider:getById', (e, id) => providerController.getProviderById(id));
    ipcMain.handle('provider:delete', (e, id) => providerController.deleteProvider(id));

    ipcMain.handle('user:list', () => userController.getUsers());
    ipcMain.handle('user:create', (e, data) => userController.createUser(data));
    ipcMain.handle('user:update', (e, { id, data }) => userController.updateUser(id, data));
    ipcMain.handle('user:delete', (e, id) => userController.deleteUser(id));

    ipcMain.handle('settings:get', () => settingsController.getSettings());
    ipcMain.handle('settings:save', (e, data) => settingsController.saveSettings(data));
    ipcMain.handle('settings:backup', async () => {
        const { canceled, filePath } = await dialog.showSaveDialog({
            title: 'Guardar Backup',
            defaultPath: `Backup_${Date.now()}.db`,
            filters: [{ name: 'Database', extensions: ['db'] }]
        });
        if (canceled || !filePath) return { cancelled: true };
        return settingsController.createBackup(filePath);
    });

    ipcMain.handle('dialog:alert', (e, { message, type }) => {
        dialog.showMessageBoxSync({ message, type, title: 'Ferretería Molina' });
    });
    
    ipcMain.handle('dialog:confirm', (e, message) => {
        return dialog.showMessageBoxSync({
            type: 'question', buttons: ['No', 'Sí'], defaultId: 1, title: 'Confirmación', message
        }) === 1;
    });

    // Abrir PDF externo
    ipcMain.handle('app:open-file', async (e, path) => {
        await pdfController.openExternal(path);
    });
}

module.exports = { setupIPC };
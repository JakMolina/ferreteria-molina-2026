const { ipcMain, dialog, app } = require('electron');
const path = require('path');
const { db } = require('./db');

const authController = require('./controllers/auth.controller');
const productController = require('./controllers/product.controller');
const salesController = require('./controllers/sales.controller');
const providerController = require('./controllers/provider.controller');
const userController = require('./controllers/user.controller');
const settingsController = require('./controllers/settings.controller');
const statsController = require('./controllers/stats.controller');
const pdfController = require('./controllers/pdf.controller');
const rolesController = require('./controllers/roles.controller');

let mainWindowRef = null;

function hasPermission(userId, codename) {
    const row = db.prepare(
        'SELECT 1 FROM role_permissions rp ' +
        'JOIN permissions p ON rp.permission_id = p.id ' +
        'JOIN users u ON u.role_id = rp.role_id ' +
        'WHERE u.id = ? AND p.codename = ?'
    ).get(userId, codename);
    return !!row;
}

function requirePermission(userId, codename) {
    if (!userId) {
        console.warn('⚠️ [IPC] Operación sin userId. Verificación de permisos omitida (modo legacy).');
        return;
    }
    if (!hasPermission(userId, codename)) {
        const err = new Error('ACCESO DENEGADO: No tienes permiso para esta operación.');
        err.code = 'FORBIDDEN';
        throw err;
    }
}

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
    ipcMain.handle('auth:permissions', (e, userId) => {
        if (!userId) return [];
        const rows = db.prepare(
            'SELECT p.codename FROM role_permissions rp ' +
            'JOIN permissions p ON rp.permission_id = p.id ' +
            'JOIN users u ON u.role_id = rp.role_id ' +
            'WHERE u.id = ?'
        ).all(userId);
        return rows.map(r => r.codename);
    });

    ipcMain.handle('stats:dashboard', () => statsController.getDashboardData());

    ipcMain.handle('product:list', () => productController.getProducts());
    ipcMain.handle('products:get-all', (e, query) => productController.getProducts(e, query));

    ipcMain.handle('product:create', (e, data) => {
        requirePermission(data.userId, 'products.create');
        return productController.createProduct(data);
    });
    ipcMain.handle('product:update', (e, { id, data, userId }) => {
        requirePermission(userId, 'products.update');
        return productController.updateProduct(id, data);
    });
    ipcMain.handle('product:delete', (e, { id, userId }) => {
        requirePermission(userId, 'products.delete');
        return productController.deleteProduct(id);
    });

    ipcMain.handle('sale:history', () => salesController.getHistory());
    ipcMain.handle('sale:create', (e, data) => {
        requirePermission(data.user_id, 'sales.pos');
        return salesController.createSale(data);
    });
    ipcMain.handle('sale:details', (e, id) => salesController.getSaleDetails(id));
    ipcMain.handle('sale:daily', () => salesController.getDailySales());
    ipcMain.handle('sale:getById', (e, id) => salesController.getSaleById(id));
    ipcMain.handle('sale:save-pdf', async (e, saleId) => {
        return await pdfController.generateAndSavePDF(saleId);
    });
    ipcMain.handle('sale:delete', (e, { id, userId }) => {
        requirePermission(userId, 'sales.delete');
        return salesController.deleteSale(id, userId);
    });

    ipcMain.handle('provider:list', () => providerController.getProviders());
    ipcMain.handle('provider:create', (e, data) => {
        requirePermission(data.userId, 'providers.create');
        return providerController.createProvider(data);
    });
    ipcMain.handle('provider:update', (e, { id, data, userId }) => {
        requirePermission(userId, 'providers.update');
        return providerController.updateProvider(id, data);
    });
    ipcMain.handle('provider:getById', (e, id) => providerController.getProviderById(id));
    ipcMain.handle('provider:delete', (e, { id, userId }) => {
        requirePermission(userId, 'providers.delete');
        return providerController.deleteProvider(id);
    });

    ipcMain.handle('user:list', (e, { userId } = {}) => {
        requirePermission(userId, 'users.read');
        return userController.getUsers();
    });
    ipcMain.handle('user:create', (e, data) => {
        requirePermission(data.userId, 'users.create');
        return userController.createUser(data);
    });
    ipcMain.handle('user:update', (e, { id, data, userId }) => {
        requirePermission(userId, 'users.update');
        return userController.updateUser(id, data);
    });
    ipcMain.handle('user:delete', (e, { id, userId }) => {
        requirePermission(userId, 'users.delete');
        return userController.deleteUser(id);
    });

    ipcMain.handle('settings:get', () => settingsController.getSettings());
    ipcMain.handle('settings:save', (e, data) => {
        requirePermission(data.userId, 'settings.update');
        return settingsController.saveSettings(data);
    });
    ipcMain.handle('settings:backup', async (e, { userId } = {}) => {
        requirePermission(userId, 'backup.create');
        const { canceled, filePath } = await dialog.showSaveDialog({
            title: 'Guardar Backup',
            defaultPath: `Backup_${Date.now()}.db`,
            filters: [{ name: 'Database', extensions: ['db'] }]
        });
        if (canceled || !filePath) return { cancelled: true };
        return settingsController.createBackup(filePath);
    });

    ipcMain.handle('roles:list', (e, { userId } = {}) => {
        return rolesController.getRoles();
    });
    ipcMain.handle('roles:getById', (e, { id, userId }) => {
        return rolesController.getRoleById(id);
    });
    ipcMain.handle('roles:create', (e, data) => {
        requirePermission(data.userId, 'roles.manage');
        return rolesController.createRole(data);
    });
    ipcMain.handle('roles:update', (e, { id, data, userId }) => {
        requirePermission(userId, 'roles.manage');
        return rolesController.updateRole(id, data);
    });
    ipcMain.handle('roles:delete', (e, { id, userId }) => {
        requirePermission(userId, 'roles.manage');
        return rolesController.deleteRole(id);
    });
    ipcMain.handle('roles:permissions-catalog', (e, { userId } = {}) => {
        requirePermission(userId, 'roles.manage');
        return rolesController.getPermissionsCatalog();
    });

    ipcMain.handle('dialog:alert', (e, { message, type }) => {
        dialog.showMessageBoxSync({ message, type, title: 'Ferretería Molina' });
    });

    ipcMain.handle('dialog:confirm', (e, message) => {
        return dialog.showMessageBoxSync({
            type: 'question', buttons: ['No', 'Sí'], defaultId: 1, title: 'Confirmación', message
        }) === 1;
    });

    ipcMain.handle('app:open-file', async (e, path) => {
        await pdfController.openExternal(path);
    });
}

module.exports = { setupIPC };
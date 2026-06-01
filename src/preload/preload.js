const { contextBridge, ipcRenderer } = require('electron');

const api = {
    app: {
        getPath: () => ipcRenderer.invoke('app:getPath'), // Para saber ruta base (necesario para boleta HTML)
        openFile: (path) => ipcRenderer.invoke('app:open-file', path) // Para abrir el PDF generado
    },

    auth: {
        login: (creds) => ipcRenderer.invoke('login', creds)
    },

    navigation: {
        goTo: (route) => ipcRenderer.invoke('navigate-to', route)
    },

    products: {
        getAll: (query) => ipcRenderer.invoke('products:get-all', query),
        list: () => ipcRenderer.invoke('product:list'),
        create: (data) => ipcRenderer.invoke('product:create', data),
        update: (id, data) => ipcRenderer.invoke('product:update', { id, data }),
        delete: (id) => ipcRenderer.invoke('product:delete', id)
    },

    providers: {
        list: () => ipcRenderer.invoke('provider:list'),
        create: (data) => ipcRenderer.invoke('provider:create', data),
        update: (id, data) => ipcRenderer.invoke('provider:update', { id, data }),
        getById: (id) => ipcRenderer.invoke('provider:getById', id),
        delete: (id) => ipcRenderer.invoke('provider:delete', id)
    },

    sale: {
        create: (data) => ipcRenderer.invoke('sale:create', data),
        history: () => ipcRenderer.invoke('sale:history'),
        daily: () => ipcRenderer.invoke('sale:daily'),
        details: (id) => ipcRenderer.invoke('sale:details', id),
        
        // 👇 ESTOS SON VITALES PARA LA BOLETA E IMPRESIÓN
        getById: (id) => ipcRenderer.invoke('sale:getById', id), // Para llenar el HTML
        savePdf: (id) => ipcRenderer.invoke('sale:save-pdf', id), // Para guardar automático
        
        delete: (id) => ipcRenderer.invoke('sale:delete', id)
    },

    users: {
        list: () => ipcRenderer.invoke('user:list'),
        create: (data) => ipcRenderer.invoke('user:create', data),
        update: (id, data) => ipcRenderer.invoke('user:update', { id, data }),
        delete: (id) => ipcRenderer.invoke('user:delete', id)
    },

    stats: {
        getDashboard: () => ipcRenderer.invoke('stats:dashboard')
    },

    settings: {
        getAll: () => ipcRenderer.invoke('settings:get'),
        save: (data) => ipcRenderer.invoke('settings:save', data),
        backup: () => ipcRenderer.invoke('settings:backup')
    },

    dialog: {
        alert: (msg, type = 'info') => ipcRenderer.invoke('dialog:alert', { message: msg, type }),
        confirm: (msg) => ipcRenderer.invoke('dialog:confirm', msg)
    }
};

contextBridge.exposeInMainWorld('api', api);
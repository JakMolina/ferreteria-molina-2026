const { contextBridge, ipcRenderer } = require('electron');

const api = {
    app: {
        getPath: () => ipcRenderer.invoke('app:getPath'),
        openFile: (path) => ipcRenderer.invoke('app:open-file', path)
    },

    auth: {
        login: (creds) => ipcRenderer.invoke('login', creds),
        getPermissions: (userId) => ipcRenderer.invoke('auth:permissions', userId)
    },

    navigation: {
        goTo: (route) => ipcRenderer.invoke('navigate-to', route)
    },

    products: {
        getAll: (query) => ipcRenderer.invoke('products:get-all', query),
        list: () => ipcRenderer.invoke('product:list'),
        create: (data) => ipcRenderer.invoke('product:create', data),
        update: (id, data, userId) => ipcRenderer.invoke('product:update', { id, data, userId }),
        delete: (id, userId) => ipcRenderer.invoke('product:delete', { id, userId })
    },

    providers: {
        list: () => ipcRenderer.invoke('provider:list'),
        create: (data) => ipcRenderer.invoke('provider:create', data),
        update: (id, data, userId) => ipcRenderer.invoke('provider:update', { id, data, userId }),
        getById: (id) => ipcRenderer.invoke('provider:getById', id),
        delete: (id, userId) => ipcRenderer.invoke('provider:delete', { id, userId })
    },

    sale: {
        create: (data) => ipcRenderer.invoke('sale:create', data),
        history: () => ipcRenderer.invoke('sale:history'),
        daily: () => ipcRenderer.invoke('sale:daily'),
        details: (id) => ipcRenderer.invoke('sale:details', id),
        getById: (id) => ipcRenderer.invoke('sale:getById', id),
        savePdf: (id) => ipcRenderer.invoke('sale:save-pdf', id),
        delete: (id, userId) => ipcRenderer.invoke('sale:delete', { id, userId })
    },

    users: {
        list: (userId) => ipcRenderer.invoke('user:list', { userId }),
        create: (data) => ipcRenderer.invoke('user:create', data),
        update: (id, data, userId) => ipcRenderer.invoke('user:update', { id, data, userId }),
        delete: (id, userId) => ipcRenderer.invoke('user:delete', { id, userId })
    },

    stats: {
        getDashboard: () => ipcRenderer.invoke('stats:dashboard')
    },

    roles: {
        list: () => ipcRenderer.invoke('roles:list'),
        getById: (id) => ipcRenderer.invoke('roles:getById', { id }),
        create: (data) => ipcRenderer.invoke('roles:create', data),
        update: (id, data, userId) => ipcRenderer.invoke('roles:update', { id, data, userId }),
        delete: (id, userId) => ipcRenderer.invoke('roles:delete', { id, userId }),
        getPermissionsCatalog: (userId) => ipcRenderer.invoke('roles:permissions-catalog', { userId })
    },

    settings: {
        getAll: () => ipcRenderer.invoke('settings:get'),
        save: (data) => ipcRenderer.invoke('settings:save', data),
        backup: (userId) => ipcRenderer.invoke('settings:backup', { userId })
    },

    dialog: {
        alert: (msg, type = 'info') => ipcRenderer.invoke('dialog:alert', { message: msg, type }),
        confirm: (msg) => ipcRenderer.invoke('dialog:confirm', msg)
    }
};

contextBridge.exposeInMainWorld('api', api);
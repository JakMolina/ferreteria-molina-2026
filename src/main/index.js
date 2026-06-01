const { app, BrowserWindow, session, dialog } = require('electron');
const path = require('path');
const log = require('electron-log'); 
const { initDB } = require('./db');
const { setupIPC } = require('./ipc');

log.transports.file.level = 'info';
console.log = log.log;

let mainWindow = null; 

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {

    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });

    const createWindow = () => {
        console.log("🖥️ Creando ventana principal...");
        mainWindow = new BrowserWindow({
            width: 1200, 
            height: 800, 
            minWidth: 1024, 
            minHeight: 768,
            title: "Ferretería Molina 2026",
            backgroundColor: '#f0f2f5', 
            show: false,
            webPreferences: {
                preload: path.join(__dirname, '../preload/preload.js'),
                contextIsolation: true,
                nodeIntegration: false,
                sandbox: false
            },
            icon: path.join(__dirname, '../../assets/icon.ico') 
        });
        session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
            callback({
                responseHeaders: {
                    ...details.responseHeaders,
                    'Content-Security-Policy': ["default-src 'self' 'unsafe-inline' data:; script-src 'self' 'unsafe-eval' 'unsafe-inline';"]
                }
            });
        });

        const loginPath = path.join(__dirname, '../renderer/modules/auth/login.html');
        mainWindow.loadFile(loginPath);

        mainWindow.once('ready-to-show', () => {
            mainWindow.maximize();
            mainWindow.show();
            console.log("✅ Ventana mostrada correctamente.");
        });
    };

    app.whenReady().then(async () => {
        try {
            log.info("Iniciando aplicación...");
            
            initDB();
            
            createWindow();
            
            if (mainWindow) {
                console.log("🔗 Conectando IPC con la Ventana...");
                setupIPC(mainWindow);
            } else {
                console.error("❌ ERROR FATAL: La ventana es NULL al configurar IPC.");
            }

            app.on('activate', () => {
                if (BrowserWindow.getAllWindows().length === 0) createWindow();
            });

        } catch (error) {
            log.error("❌ Error fatal al iniciar:", error);
            dialog.showErrorBox("Error Fatal", error.message);
            app.quit();
        }
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit();
    });
}
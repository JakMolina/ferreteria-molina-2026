const { BrowserWindow, app, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const saleRepo = require('../repositories/sale.repository');

async function generateAndSavePDF(saleId) {
    let win = null;
    try {
        console.log("[PDF] Iniciando generación DIRECTA para venta ID:", saleId);

        const sale = saleRepo.getById(saleId);
        if (!sale) throw new Error("Venta no encontrada en BD");

        const docsPath = app.getPath('documents');
        const folderPath = path.join(docsPath, 'Ferreteria_Comprobantes');
        if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

        const fileName = `${sale.invoice_number}.pdf`;
        const pdfPath = path.join(folderPath, fileName);

        win = new BrowserWindow({
            show: false, 
            width: 800,
            height: 600,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                sandbox: false 
            }
        });

        const htmlPath = path.join(app.getAppPath(), 'src', 'renderer', 'receipts', 'invoice.html');
        await win.loadURL(`file://${htmlPath}`);

        console.log("💉 [PDF] Inyectando datos al HTML...");
        
        const saleJson = JSON.stringify(sale);
        
        await win.webContents.executeJavaScript(`window.loadInvoiceData(${saleJson});`);

        await new Promise(resolve => setTimeout(resolve, 1000));

        console.log("🖨️ [PDF] Imprimiendo...");
        const data = await win.webContents.printToPDF({
            printBackground: true,
            landscape: false,
            pageSize: 'A4',
            margins: { top: 0, bottom: 0, left: 0, right: 0 } 
        });

        fs.writeFileSync(pdfPath, data);
        console.log("✅ [PDF] Guardado en:", pdfPath);

        return { success: true, path: pdfPath, fileName };

    } catch (error) {
        console.error("❌ [PDF ERROR]:", error);
        return { success: false, error: error.message };
    } finally {
        if (win) win.close();
    }
}

async function openExternal(fullPath) {
    try {
        await shell.openPath(fullPath);
    } catch (e) { console.error(e); }
}

module.exports = { generateAndSavePDF, openExternal };
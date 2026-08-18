const { db } = require('../db');

const getSettings = () => {
    try {
        const rows = db.prepare('SELECT * FROM settings').all();
        const settings = {};
        rows.forEach(r => settings[r.key] = r.value);
        return settings;
    } catch (error) {
        console.error("Error en getSettings:", error);
        return {};
    }
};

const saveSettings = (data) => {
    try {
        const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
        const transaction = db.transaction((settingsObj) => {
            for (const [key, value] of Object.entries(settingsObj)) {
                stmt.run(key, value);
            }
        });
        
        transaction(data);
        
        return { success: true };
    } catch (error) {
        console.error("Error en saveSettings:", error);
        return { success: false, message: "Error en la base de datos al guardar." };
    }
};

const createBackup = async (filePath) => {
    try {
        await db.backup(filePath);
        return { success: true, path: filePath };
    } catch (err) {
        console.error("Error en createBackup:", err);
        return { success: false, error: err.message };
    }
};

module.exports = { getSettings, saveSettings, createBackup };
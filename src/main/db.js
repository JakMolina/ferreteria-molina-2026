const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');
const fs = require('fs-extra');

let dbPath;
const userDataPath = app.getPath('userData');
const dataFolder = path.join(userDataPath, 'ferreteria_data');
fs.ensureDirSync(dataFolder);

if (app.isPackaged) {
    dbPath = path.join(dataFolder, 'ferreteria.db');
} else {
    const devDataPath = path.join(app.getAppPath(), 'dev-data');
    fs.ensureDirSync(devDataPath);
    dbPath = path.join(devDataPath, 'ferreteria_dev.db');
}

const db = new Database(dbPath, { verbose: console.log });
db.pragma('journal_mode = WAL'); 
db.pragma('foreign_keys = ON'); 

function initDB() {
    const schema = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            fullname TEXT,
            role TEXT DEFAULT 'cashier',
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT (datetime('now','localtime'))
        );

        CREATE TABLE IF NOT EXISTS providers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            address TEXT,
            created_at TEXT DEFAULT (datetime('now','localtime'))
        );

        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            barcode TEXT,
            name TEXT NOT NULL,
            category TEXT,
            cost_price REAL DEFAULT 0, 
            price REAL DEFAULT 0,      
            stock REAL DEFAULT 0,
            min_stock REAL DEFAULT 5,
            description TEXT,
            provider_id INTEGER,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT (datetime('now','localtime')),
            FOREIGN KEY(provider_id) REFERENCES providers(id)
        );

        CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(name, description, category, content='products', content_rowid='id');

        CREATE TRIGGER IF NOT EXISTS products_ai AFTER INSERT ON products BEGIN
            INSERT INTO products_fts(rowid, name, description, category) VALUES (new.id, new.name, new.description, new.category);
        END;
        CREATE TRIGGER IF NOT EXISTS products_ad AFTER DELETE ON products BEGIN
            INSERT INTO products_fts(products_fts, rowid, name, description, category) VALUES('delete', old.id, old.name, old.description, old.category);
        END;
        CREATE TRIGGER IF NOT EXISTS products_au AFTER UPDATE ON products BEGIN
            INSERT INTO products_fts(products_fts, rowid, name, description, category) VALUES('delete', old.id, old.name, old.description, old.category);
            INSERT INTO products_fts(rowid, name, description, category) VALUES (new.id, new.name, new.description, new.category);
        END;

        CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_number TEXT, 
            total REAL NOT NULL,
            payment_method TEXT,
            user_id INTEGER,
            client_json TEXT,
            created_at TEXT DEFAULT (datetime('now','localtime')),
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS sale_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sale_id INTEGER,
            product_id INTEGER,
            product_name TEXT, 
            quantity REAL,
            price REAL,
            subtotal REAL,
            FOREIGN KEY(sale_id) REFERENCES sales(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS inventory_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER,
            change_amount REAL,
            current_stock_after REAL,
            reason TEXT,
            reference_id INTEGER,
            user_id INTEGER,
            created_at TEXT DEFAULT (datetime('now','localtime'))
        );

        CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);

        INSERT OR IGNORE INTO users (username, password, fullname, role) VALUES ('admin', 'admin123', 'Administrador', 'admin');
    `;
    db.exec(schema);

    try { db.exec("ALTER TABLE products ADD COLUMN type TEXT DEFAULT 'general'"); } catch(e) {}
    try { db.exec("ALTER TABLE products ADD COLUMN attributes TEXT"); } catch(e) {}

    const lotSchema = `
        CREATE TABLE IF NOT EXISTS product_lots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            lot_number TEXT NOT NULL,
            expiration_date TEXT,
            initial_stock REAL DEFAULT 0,
            current_stock REAL DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now','localtime')),
            FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
        );
    `;
    db.exec(lotSchema);

    console.log("✅ DB Inicializada Correctamente (Migraciones de atributos dinámicos aplicadas).");
}

module.exports = { db, initDB };
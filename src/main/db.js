const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');
const fs = require('fs-extra');
const bcrypt = require('bcryptjs');

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
        CREATE TABLE IF NOT EXISTS schema_version (
            version INTEGER PRIMARY KEY,
            applied_at TEXT DEFAULT (datetime('now','localtime'))
        );

        CREATE TABLE IF NOT EXISTS permissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codename TEXT UNIQUE NOT NULL,
            description TEXT NOT NULL,
            module TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS roles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            is_protected INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now','localtime'))
        );

        CREATE TABLE IF NOT EXISTS role_permissions (
            role_id INTEGER NOT NULL,
            permission_id INTEGER NOT NULL,
            PRIMARY KEY (role_id, permission_id),
            FOREIGN KEY(role_id) REFERENCES roles(id) ON DELETE CASCADE,
            FOREIGN KEY(permission_id) REFERENCES permissions(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            fullname TEXT NOT NULL,
            role_id INTEGER NOT NULL DEFAULT 2,
            is_active INTEGER DEFAULT 1,
            last_login TEXT,
            created_at TEXT DEFAULT (datetime('now','localtime')),
            updated_at TEXT DEFAULT (datetime('now','localtime')),
            FOREIGN KEY(role_id) REFERENCES roles(id)
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
            type TEXT DEFAULT 'general',
            attributes TEXT,
            cost_price REAL DEFAULT 0 CHECK(cost_price >= 0),
            price REAL DEFAULT 0 CHECK(price >= 0),
            stock REAL DEFAULT 0 CHECK(stock >= 0),
            min_stock REAL DEFAULT 5 CHECK(min_stock >= 0),
            description TEXT,
            provider_id INTEGER,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT (datetime('now','localtime')),
            FOREIGN KEY(provider_id) REFERENCES providers(id) ON DELETE SET NULL
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

        CREATE TABLE IF NOT EXISTS product_lots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            lot_number TEXT NOT NULL,
            expiration_date TEXT,
            initial_stock REAL DEFAULT 0 CHECK(initial_stock >= 0),
            current_stock REAL DEFAULT 0 CHECK(current_stock >= 0),
            created_at TEXT DEFAULT (datetime('now','localtime')),
            FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            invoice_number TEXT,
            total REAL NOT NULL CHECK(total >= 0),
            payment_method TEXT NOT NULL DEFAULT 'EFECTIVO'
                CHECK(payment_method IN ('EFECTIVO','TARJETA','TRANSFERENCIA','MIXTO')),
            user_id INTEGER,
            client_json TEXT,
            created_at TEXT DEFAULT (datetime('now','localtime')),
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
        );
        CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);

        CREATE TABLE IF NOT EXISTS sale_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sale_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            product_name TEXT,
            quantity REAL NOT NULL CHECK(quantity > 0),
            price REAL NOT NULL CHECK(price >= 0),
            subtotal REAL NOT NULL CHECK(subtotal >= 0),
            created_at TEXT DEFAULT (datetime('now','localtime')),
            FOREIGN KEY(sale_id) REFERENCES sales(id) ON DELETE CASCADE,
            FOREIGN KEY(product_id) REFERENCES products(id)
        );
        CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
        CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);

        CREATE TABLE IF NOT EXISTS inventory_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            change_amount REAL NOT NULL,
            current_stock_after REAL NOT NULL,
            reason TEXT NOT NULL,
            reference_id INTEGER,
            user_id INTEGER,
            created_at TEXT DEFAULT (datetime('now','localtime')),
            FOREIGN KEY(product_id) REFERENCES products(id),
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
        );
        CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_id ON inventory_logs(product_id);
        CREATE INDEX IF NOT EXISTS idx_inventory_logs_created_at ON inventory_logs(created_at);

        CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
    `;
    db.exec(schema);

    migrateToV2();

    console.log("✅ DB Inicializada Correctamente (Schema v2).");
}

function migrateToV2() {
    const tableExists = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_version'"
    ).get();

    if (tableExists) {
        const currentVersion = db.prepare(
            "SELECT MAX(version) as v FROM schema_version"
        ).get();
        if (currentVersion && currentVersion.v >= 2) {
            console.log("✅ Schema ya está en v2. Migración omitida.");
            return;
        }
    }

    console.log("🔄 Iniciando migración a schema v2...");

    const migration = db.transaction(() => {

        db.exec(`CREATE TABLE IF NOT EXISTS schema_version (
            version INTEGER PRIMARY KEY,
            applied_at TEXT DEFAULT (datetime('now','localtime'))
        )`);

        db.exec(`CREATE TABLE IF NOT EXISTS permissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codename TEXT UNIQUE NOT NULL,
            description TEXT NOT NULL,
            module TEXT NOT NULL
        )`);

        const insertPerm = db.prepare(
            `INSERT OR IGNORE INTO permissions (id, codename, description, module) VALUES (?, ?, ?, ?)`
        );
        const permissionsData = [
            [1,  'dashboard.view',   'Ver panel principal',               'dashboard'],
            [2,  'products.read',    'Ver lista de productos',             'products'],
            [3,  'products.create',  'Crear productos',                   'products'],
            [4,  'products.update',  'Editar productos',                  'products'],
            [5,  'products.delete',  'Desactivar productos',              'products'],
            [6,  'products.import',  'Importar productos masivamente',    'products'],
            [7,  'providers.read',   'Ver proveedores',                   'providers'],
            [8,  'providers.create', 'Crear proveedores',                 'providers'],
            [9,  'providers.update', 'Editar proveedores',                'providers'],
            [10, 'providers.delete', 'Eliminar proveedores',              'providers'],
            [11, 'sales.pos',        'Usar punto de venta',               'sales'],
            [12, 'sales.daily',      'Ver ventas del día',                'sales'],
            [13, 'sales.history',    'Ver historial de ventas',           'sales'],
            [14, 'sales.delete',     'Anular ventas',                     'sales'],
            [15, 'sales.receipt',    'Imprimir comprobantes',             'sales'],
            [16, 'users.read',       'Ver lista de usuarios',             'users'],
            [17, 'users.create',     'Crear usuarios',                    'users'],
            [18, 'users.update',     'Editar usuarios',                   'users'],
            [19, 'users.delete',     'Eliminar usuarios',                 'users'],
            [20, 'roles.manage',     'Gestionar roles y permisos',        'roles'],
            [21, 'stats.view',       'Ver estadísticas y dashboard',      'stats'],
            [22, 'stats.export',     'Exportar reportes',                 'stats'],
            [23, 'pdf.generate',     'Generar PDFs de comprobantes',      'pdf'],
            [24, 'settings.read',    'Ver configuración del sistema',     'settings'],
            [25, 'settings.update',  'Modificar configuración',           'settings'],
            [26, 'inventory.view',   'Ver movimientos de inventario',     'inventory'],
            [27, 'inventory.adjust', 'Ajustar stock manualmente',         'inventory'],
            [28, 'backup.create',    'Crear copia de seguridad',          'backup'],
        ];
        for (const p of permissionsData) {
            insertPerm.run(...p);
        }

        db.exec(`CREATE TABLE IF NOT EXISTS roles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            is_protected INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now','localtime'))
        )`);

        db.exec(`INSERT OR IGNORE INTO roles (id, name, description, is_protected) VALUES
            (1, 'gerente',    'Administrador general del sistema. Acceso total.',             1),
            (2, 'cajero',     'Vendedor. Solo POS, ventas del día y consulta de productos.',  0),
            (3, 'supervisor', 'Supervisor de turno. Puede anular ventas y ver reportes.',     0)
        `);

        db.exec(`CREATE TABLE IF NOT EXISTS role_permissions (
            role_id INTEGER NOT NULL,
            permission_id INTEGER NOT NULL,
            PRIMARY KEY (role_id, permission_id),
            FOREIGN KEY(role_id) REFERENCES roles(id) ON DELETE CASCADE,
            FOREIGN KEY(permission_id) REFERENCES permissions(id) ON DELETE CASCADE
        )`);

        const insertRP = db.prepare(
            `INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)`
        );
        for (let i = 1; i <= 28; i++) { insertRP.run(1, i); }
        [1,2,7,11,12,15].forEach(p => insertRP.run(2, p));
        [1,2,3,4,7,11,12,13,14,15,21].forEach(p => insertRP.run(3, p));

        const userCols = db.prepare("PRAGMA table_info('users')").all()
            .map(c => c.name);

        if (!userCols.includes('password_hash')) {
            db.exec("ALTER TABLE users ADD COLUMN password_hash TEXT");
        }
        if (!userCols.includes('role_id')) {
            db.exec("ALTER TABLE users ADD COLUMN role_id INTEGER DEFAULT 2");
        }
        if (!userCols.includes('last_login')) {
            db.exec("ALTER TABLE users ADD COLUMN last_login TEXT");
        }
        if (!userCols.includes('updated_at')) {
            db.exec("ALTER TABLE users ADD COLUMN updated_at TEXT DEFAULT (datetime('now','localtime'))");
        }

        const hasLegacyPassword = userCols.includes('password');
        const hasLegacyRole = userCols.includes('role');

        if (hasLegacyPassword && hasLegacyRole) {
            const existingUsers = db.prepare("SELECT id, password, role FROM users").all();
            for (const user of existingUsers) {
                const hash = bcrypt.hashSync(user.password, 10);
                db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, user.id);

                let roleId = 2;
                if (user.role === 'admin') roleId = 1;
                db.prepare("UPDATE users SET role_id = ? WHERE id = ?").run(roleId, user.id);
            }
        }

        const pedroExists = db.prepare(
            "SELECT id FROM users WHERE username = ?"
        ).get('pedro_molina');

        if (!pedroExists) {
            const pedroHash = bcrypt.hashSync('pedro123', 10);
            db.prepare(
                `INSERT INTO users (username, password_hash, fullname, role_id, is_active)
                 VALUES (?, ?, ?, ?, 1)`
            ).run('pedro_molina', pedroHash, 'Pedro Molina', 1);
        }

        if (hasLegacyPassword) {
            migrateTable('sales', `
                CREATE TABLE sales_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    invoice_number TEXT,
                    total REAL NOT NULL CHECK(total >= 0),
                    payment_method TEXT NOT NULL DEFAULT 'EFECTIVO'
                        CHECK(payment_method IN ('EFECTIVO','TARJETA','TRANSFERENCIA','MIXTO')),
                    user_id INTEGER,
                    client_json TEXT,
                    created_at TEXT DEFAULT (datetime('now','localtime')),
                    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
                )
            `, `
                INSERT INTO sales_new (id, invoice_number, total, payment_method, user_id, client_json, created_at)
                SELECT id, invoice_number, total, COALESCE(payment_method, 'EFECTIVO'), user_id, client_json, created_at
                FROM sales
            `);
            db.exec("CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at)");

            migrateTable('sale_items', `
                CREATE TABLE sale_items_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    sale_id INTEGER NOT NULL,
                    product_id INTEGER NOT NULL,
                    product_name TEXT,
                    quantity REAL NOT NULL CHECK(quantity > 0),
                    price REAL NOT NULL CHECK(price >= 0),
                    subtotal REAL NOT NULL CHECK(subtotal >= 0),
                    created_at TEXT DEFAULT (datetime('now','localtime')),
                    FOREIGN KEY(sale_id) REFERENCES sales(id) ON DELETE CASCADE,
                    FOREIGN KEY(product_id) REFERENCES products(id)
                )
            `, `
                INSERT INTO sale_items_new (id, sale_id, product_id, product_name, quantity, price, subtotal)
                SELECT id, sale_id, product_id, product_name, quantity, price, subtotal FROM sale_items
            `);
            db.exec("CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id)");
            db.exec("CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id)");

            migrateTable('inventory_logs', `
                CREATE TABLE inventory_logs_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    product_id INTEGER NOT NULL,
                    change_amount REAL NOT NULL,
                    current_stock_after REAL NOT NULL,
                    reason TEXT NOT NULL,
                    reference_id INTEGER,
                    user_id INTEGER,
                    created_at TEXT DEFAULT (datetime('now','localtime')),
                    FOREIGN KEY(product_id) REFERENCES products(id),
                    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
                )
            `, `
                INSERT INTO inventory_logs_new (id, product_id, change_amount, current_stock_after, reason, reference_id, user_id, created_at)
                SELECT id, product_id, change_amount, current_stock_after, reason, reference_id, user_id, created_at FROM inventory_logs
            `);
            db.exec("CREATE INDEX IF NOT EXISTS idx_inventory_logs_product_id ON inventory_logs(product_id)");
            db.exec("CREATE INDEX IF NOT EXISTS idx_inventory_logs_created_at ON inventory_logs(created_at)");

            migrateTable('products', `
                CREATE TABLE products_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    barcode TEXT,
                    name TEXT NOT NULL,
                    category TEXT,
                    type TEXT DEFAULT 'general',
                    attributes TEXT,
                    cost_price REAL DEFAULT 0 CHECK(cost_price >= 0),
                    price REAL DEFAULT 0 CHECK(price >= 0),
                    stock REAL DEFAULT 0 CHECK(stock >= 0),
                    min_stock REAL DEFAULT 5 CHECK(min_stock >= 0),
                    description TEXT,
                    provider_id INTEGER,
                    is_active INTEGER DEFAULT 1,
                    created_at TEXT DEFAULT (datetime('now','localtime')),
                    FOREIGN KEY(provider_id) REFERENCES providers(id) ON DELETE SET NULL
                )
            `, `
                INSERT INTO products_new (id, barcode, name, category, type, attributes, cost_price, price, stock, min_stock, description, provider_id, is_active, created_at)
                SELECT id, barcode, name, category, COALESCE(type, 'general'), attributes, cost_price, price, stock, min_stock, description, provider_id, is_active, created_at FROM products
            `);

            db.exec("INSERT INTO products_fts(products_fts, rowid, name, description, category) VALUES('delete', 0, '', '', '')");
            db.exec(`
                INSERT INTO products_fts(rowid, name, description, category)
                SELECT id, name, description, category FROM products
            `);

            migrateTable('product_lots', `
                CREATE TABLE product_lots_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    product_id INTEGER NOT NULL,
                    lot_number TEXT NOT NULL,
                    expiration_date TEXT,
                    initial_stock REAL DEFAULT 0 CHECK(initial_stock >= 0),
                    current_stock REAL DEFAULT 0 CHECK(current_stock >= 0),
                    created_at TEXT DEFAULT (datetime('now','localtime')),
                    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
                )
            `, `
                INSERT INTO product_lots_new (id, product_id, lot_number, expiration_date, initial_stock, current_stock, created_at)
                SELECT id, product_id, lot_number, expiration_date, initial_stock, current_stock, created_at FROM product_lots
            `);
        }

        db.exec("INSERT OR REPLACE INTO schema_version (version) VALUES (2)");
    });

    try {
        migration();
        console.log("✅ Migración a schema v2 completada exitosamente.");
    } catch (error) {
        console.error("❌ Error durante migración v2:", error.message);
        console.error("La DB no fue modificada (rollback automático).");
        throw error;
    }
}

function migrateTable(tableName, createNewSQL, copyDataSQL) {
    const hasRows = db.prepare(`SELECT COUNT(*) as c FROM ${tableName}`).get().c;
    db.exec(createNewSQL);
    if (hasRows > 0) {
        db.exec(copyDataSQL);
    }
    db.exec(`DROP TABLE IF EXISTS ${tableName}`);
    db.exec(`ALTER TABLE ${tableName}_new RENAME TO ${tableName}`);
}

module.exports = { db, initDB };
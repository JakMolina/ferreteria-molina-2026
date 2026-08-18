-- permissions definition

CREATE TABLE permissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            codename TEXT UNIQUE NOT NULL,
            description TEXT NOT NULL,
            module TEXT NOT NULL
        );


-- products_fts definition

CREATE VIRTUAL TABLE products_fts USING fts5(name, description, category, content='products', content_rowid='id');


-- products_fts_config definition

CREATE TABLE 'products_fts_config'(k PRIMARY KEY, v) WITHOUT ROWID;


-- products_fts_data definition

CREATE TABLE 'products_fts_data'(id INTEGER PRIMARY KEY, block BLOB);


-- products_fts_docsize definition

CREATE TABLE 'products_fts_docsize'(id INTEGER PRIMARY KEY, sz BLOB);


-- products_fts_idx definition

CREATE TABLE 'products_fts_idx'(segid, term, pgno, PRIMARY KEY(segid, term)) WITHOUT ROWID;


-- providers definition

CREATE TABLE providers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            address TEXT,
            created_at TEXT DEFAULT (datetime('now','localtime'))
        );


-- roles definition

CREATE TABLE roles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            is_protected INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now','localtime'))
        );


-- schema_version definition

CREATE TABLE schema_version (
            version INTEGER PRIMARY KEY,
            applied_at TEXT DEFAULT (datetime('now','localtime'))
        );


-- settings definition

CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT);


-- products definition

CREATE TABLE products (
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


-- role_permissions definition

CREATE TABLE role_permissions (
            role_id INTEGER NOT NULL,
            permission_id INTEGER NOT NULL,
            PRIMARY KEY (role_id, permission_id),
            FOREIGN KEY(role_id) REFERENCES roles(id) ON DELETE CASCADE,
            FOREIGN KEY(permission_id) REFERENCES permissions(id) ON DELETE CASCADE
        );


-- users definition

CREATE TABLE users (
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


-- inventory_logs definition

CREATE TABLE inventory_logs (
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

CREATE INDEX idx_inventory_logs_product_id ON inventory_logs(product_id);
CREATE INDEX idx_inventory_logs_created_at ON inventory_logs(created_at);


-- product_lots definition

CREATE TABLE product_lots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            lot_number TEXT NOT NULL,
            expiration_date TEXT,
            initial_stock REAL DEFAULT 0 CHECK(initial_stock >= 0),
            current_stock REAL DEFAULT 0 CHECK(current_stock >= 0),
            created_at TEXT DEFAULT (datetime('now','localtime')),
            FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
        );


-- sales definition

CREATE TABLE sales (
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

CREATE INDEX idx_sales_created_at ON sales(created_at);


-- sale_items definition

CREATE TABLE sale_items (
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

CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);
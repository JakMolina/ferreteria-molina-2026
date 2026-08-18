-- ============================================================
-- FERRETERÍA MOLINA
-- Migración V1: Schema Inicial (versión <= 1.1.1)
-- ============================================================
-- Fecha:     enero 2025
-- Versión:   1.0.0 → 1.1.1
-- Descripción: Esquema base de la aplicación antes de la
--              implementación del sistema de roles, permisos
--              y seguridad (bcrypt, FKs completas, CHECKs).
-- ============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ============================================================
-- 1. USUARIOS
-- Contraseñas almacenadas en texto plano (vulnerabilidad).
-- Rol como string libre ('admin' o 'cashier').
-- is_active definido pero no usado en el login.
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    fullname TEXT,
    role TEXT DEFAULT 'cashier',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now','localtime'))
);

-- ============================================================
-- 2. PROVEEDORES
-- Sin restricción ON DELETE en la FK desde products.
-- ============================================================
CREATE TABLE IF NOT EXISTS providers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime'))
);

-- ============================================================
-- 3. PRODUCTOS
-- Sin CHECK constraints en precios, stock, min_stock.
-- Sin ON DELETE en FK provider_id.
-- Sin búsqueda FTS5 al momento de creación (agregada después).
-- ============================================================
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

-- ============================================================
-- 4. BÚSQUEDA FULL-TEXT (FTS5)
-- Tabla virtual sincronizada manualmente por triggers.
-- ============================================================
CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(
    name,
    description,
    category,
    content='products',
    content_rowid='id'
);

CREATE TRIGGER IF NOT EXISTS products_ai AFTER INSERT ON products BEGIN
    INSERT INTO products_fts(rowid, name, description, category)
    VALUES (new.id, new.name, new.description, new.category);
END;

CREATE TRIGGER IF NOT EXISTS products_ad AFTER DELETE ON products BEGIN
    INSERT INTO products_fts(products_fts, rowid, name, description, category)
    VALUES('delete', old.id, old.name, old.description, old.category);
END;

CREATE TRIGGER IF NOT EXISTS products_au AFTER UPDATE ON products BEGIN
    INSERT INTO products_fts(products_fts, rowid, name, description, category)
    VALUES('delete', old.id, old.name, old.description, old.category);
    INSERT INTO products_fts(rowid, name, description, category)
    VALUES (new.id, new.name, new.description, new.category);
END;

-- ============================================================
-- 5. VENTAS (ENCABEZADO)
-- Sin CHECK en payment_method. Sin ON DELETE en user_id.
-- ============================================================
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

-- ============================================================
-- 6. DETALLE DE VENTAS (ITEMS)
-- Sin FK a products.id. Sin CHECKs. Sin created_at.
-- product_name desnormalizado para historial inmutable.
-- ============================================================
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

-- ============================================================
-- 7. REGISTRO DE INVENTARIO (MOVIMIENTOS)
-- Sin FK a products, sin FK a users.
-- user_id definido en schema pero no insertado por el código.
-- ============================================================
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

-- ============================================================
-- 8. LOTES DE PRODUCTOS
-- Sin CHECKs en stock.
-- ============================================================
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

-- ============================================================
-- 9. CONFIGURACIÓN DEL SISTEMA (KEY-VALUE)
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- ============================================================
-- SEMILLA V1
-- ============================================================
-- Usuario administrador con contraseña en texto plano.
INSERT OR IGNORE INTO users (username, password, fullname, role)
VALUES ('admin', 'admin123', 'Administrador', 'admin');
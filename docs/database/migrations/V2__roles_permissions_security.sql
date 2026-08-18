-- ============================================================
-- FERRETERÍA MOLINA
-- Migración V2: Roles, Permisos y Seguridad (v1.2.0)
-- ============================================================
-- Fecha:     julio 2026
-- Versión:   1.1.1 → 1.2.0
-- Descripción: Implementa sistema de roles y permisos dinámicos,
--              hash bcrypt de contraseñas, integridad referencial
--              completa, CHECKs, índices y control de versiones.
--
-- PRECAUCIÓN: Esta migración recrea 5 tablas para agregar FKs
-- y CHECKs. Los datos existentes se copian íntegros.
-- Se ejecuta dentro de una transacción atómica con rollback.
-- ============================================================

BEGIN;

-- ============================================================
-- FASE 1: CONTROL DE VERSIONES
-- ============================================================
CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY,
    applied_at TEXT DEFAULT (datetime('now','localtime'))
);

-- ============================================================
-- FASE 2: TABLA PERMISSIONS
-- Catálogo fijo de 28 permisos del sistema.
-- ============================================================
CREATE TABLE IF NOT EXISTS permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codename TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    module TEXT NOT NULL
);

INSERT OR IGNORE INTO permissions (id, codename, description, module) VALUES
(1,  'dashboard.view',   'Ver panel principal',               'dashboard'),
(2,  'products.read',    'Ver lista de productos',             'products'),
(3,  'products.create',  'Crear productos',                   'products'),
(4,  'products.update',  'Editar productos',                  'products'),
(5,  'products.delete',  'Desactivar productos',              'products'),
(6,  'products.import',  'Importar productos masivamente',    'products'),
(7,  'providers.read',   'Ver proveedores',                   'providers'),
(8,  'providers.create', 'Crear proveedores',                 'providers'),
(9,  'providers.update', 'Editar proveedores',                'providers'),
(10, 'providers.delete', 'Eliminar proveedores',              'providers'),
(11, 'sales.pos',        'Usar punto de venta',               'sales'),
(12, 'sales.daily',      'Ver ventas del día',                'sales'),
(13, 'sales.history',    'Ver historial de ventas',           'sales'),
(14, 'sales.delete',     'Anular ventas',                     'sales'),
(15, 'sales.receipt',    'Imprimir comprobantes',             'sales'),
(16, 'users.read',       'Ver lista de usuarios',             'users'),
(17, 'users.create',     'Crear usuarios',                    'users'),
(18, 'users.update',     'Editar usuarios',                   'users'),
(19, 'users.delete',     'Eliminar usuarios',                 'users'),
(20, 'roles.manage',     'Gestionar roles y permisos',        'roles'),
(21, 'stats.view',       'Ver estadísticas y dashboard',      'stats'),
(22, 'stats.export',     'Exportar reportes',                 'stats'),
(23, 'pdf.generate',     'Generar PDFs de comprobantes',      'pdf'),
(24, 'settings.read',    'Ver configuración del sistema',     'settings'),
(25, 'settings.update',  'Modificar configuración',           'settings'),
(26, 'inventory.view',   'Ver movimientos de inventario',     'inventory'),
(27, 'inventory.adjust', 'Ajustar stock manualmente',         'inventory'),
(28, 'backup.create',    'Crear copia de seguridad',          'backup');

-- ============================================================
-- FASE 3: TABLA ROLES
-- Roles dinámicos. El gerente crea nuevos desde la UI.
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    is_protected INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now','localtime'))
);

INSERT OR IGNORE INTO roles (id, name, description, is_protected) VALUES
(1, 'gerente',    'Administrador general del sistema. Acceso total.',             1),
(2, 'cajero',     'Vendedor. Solo POS, ventas del día y consulta de productos.',  0),
(3, 'supervisor', 'Supervisor de turno. Puede anular ventas y ver reportes.',     0);

-- ============================================================
-- FASE 4: TABLA PIVOTE ROLE_PERMISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INTEGER NOT NULL,
    permission_id INTEGER NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY(role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY(permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- Gerente: 28 permisos
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES
(1,1),(1,2),(1,3),(1,4),(1,5),(1,6),(1,7),(1,8),(1,9),(1,10),
(1,11),(1,12),(1,13),(1,14),(1,15),(1,16),(1,17),(1,18),(1,19),(1,20),
(1,21),(1,22),(1,23),(1,24),(1,25),(1,26),(1,27),(1,28);

-- Cajero: 6 permisos
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES
(2,1),(2,2),(2,7),(2,11),(2,12),(2,15);

-- Supervisor: 11 permisos
INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES
(3,1),(3,2),(3,3),(3,4),(3,7),(3,11),(3,12),(3,13),(3,14),(3,15),(3,21);

-- ============================================================
-- FASE 5: MIGRAR USUARIOS
-- 5a. Agregar nuevas columnas
-- ============================================================
ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN role_id INTEGER;
ALTER TABLE users ADD COLUMN last_login TEXT;
ALTER TABLE users ADD COLUMN updated_at TEXT;

-- 5b. Hashear contraseñas existentes (texto plano → bcrypt)
-- En código: bcrypt.hashSync(user.password, 10)
-- Este UPDATE es conceptual; en producción lo ejecuta db.js:
-- UPDATE users SET password_hash = bcrypt_hash WHERE id = ?

-- 5c. Mapear role (string) → role_id (FK)
-- En código:
--   'admin'  → role_id = 1 (gerente)
--   'cashier' → role_id = 2 (cajero)
-- UPDATE users SET role_id = CASE WHEN role='admin' THEN 1 ELSE 2 END

-- 5d. Crear usuario Pedro Molina (gerente)
-- En código:
-- INSERT INTO users (username, password_hash, fullname, role_id, is_active)
-- VALUES ('pedro_molina', bcrypt('pedro123'), 'Pedro Molina', 1, 1);

-- ============================================================
-- FASE 6: RECREAR sales CON CHECKs + FK MEJORADA + ÍNDICE
-- ============================================================
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
);

INSERT INTO sales_new (id, invoice_number, total, payment_method, user_id, client_json, created_at)
SELECT id, invoice_number, total, COALESCE(payment_method, 'EFECTIVO'), user_id, client_json, created_at
FROM sales;

DROP TABLE sales;
ALTER TABLE sales_new RENAME TO sales;
CREATE INDEX idx_sales_created_at ON sales(created_at);

-- ============================================================
-- FASE 7: RECREAR sale_items CON FK a products + CHECKs + ÍNDICES
-- ============================================================
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
);

INSERT INTO sale_items_new (id, sale_id, product_id, product_name, quantity, price, subtotal)
SELECT id, sale_id, product_id, product_name, quantity, price, subtotal FROM sale_items;

DROP TABLE sale_items;
ALTER TABLE sale_items_new RENAME TO sale_items;
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);

-- ============================================================
-- FASE 8: RECREAR inventory_logs CON FKs + ÍNDICES
-- ============================================================
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
);

INSERT INTO inventory_logs_new (id, product_id, change_amount, current_stock_after, reason, reference_id, user_id, created_at)
SELECT id, product_id, change_amount, current_stock_after, reason, reference_id, user_id, created_at FROM inventory_logs;

DROP TABLE inventory_logs;
ALTER TABLE inventory_logs_new RENAME TO inventory_logs;
CREATE INDEX idx_inventory_logs_product_id ON inventory_logs(product_id);
CREATE INDEX idx_inventory_logs_created_at ON inventory_logs(created_at);

-- ============================================================
-- FASE 9: RECREAR products CON CHECKs + ON DELETE SET NULL
-- ============================================================
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
);

INSERT INTO products_new (id, barcode, name, category, type, attributes, cost_price, price, stock, min_stock, description, provider_id, is_active, created_at)
SELECT id, barcode, name, category, COALESCE(type, 'general'), attributes, cost_price, price, stock, min_stock, description, provider_id, is_active, created_at FROM products;

DROP TABLE products;
ALTER TABLE products_new RENAME TO products;

-- Reconstruir índice FTS5
INSERT INTO products_fts(products_fts, rowid, name, description, category)
SELECT id, name, description, category FROM products;

-- ============================================================
-- FASE 10: RECREAR product_lots CON CHECKs
-- ============================================================
CREATE TABLE product_lots_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    lot_number TEXT NOT NULL,
    expiration_date TEXT,
    initial_stock REAL DEFAULT 0 CHECK(initial_stock >= 0),
    current_stock REAL DEFAULT 0 CHECK(current_stock >= 0),
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);

INSERT INTO product_lots_new (id, product_id, lot_number, expiration_date, initial_stock, current_stock, created_at)
SELECT id, product_id, lot_number, expiration_date, initial_stock, current_stock, created_at FROM product_lots;

DROP TABLE product_lots;
ALTER TABLE product_lots_new RENAME TO product_lots;

-- ============================================================
-- FASE 11: REGISTRAR VERSIÓN
-- Si alguna operación falló, ROLLBACK automático preserva V1.
-- ============================================================
INSERT OR REPLACE INTO schema_version (version) VALUES (2);

COMMIT;
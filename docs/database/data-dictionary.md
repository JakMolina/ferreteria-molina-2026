# Diccionario de Datos - Ferretería Molina v1.2.0

> Generado a partir de `src/main/db.js` (schema v2)
> Última actualización: julio 2026

---

## schema_version

Control de versiones de migraciones del schema.

| Campo | Tipo | Nullable | Default | Descripción |
|-------|------|----------|---------|-------------|
| `version` | INTEGER | NO (PK) | - | Número de versión del schema actual (2) |
| `applied_at` | TEXT | SÍ | `datetime('now','localtime')` | Fecha en que se aplicó la migración |

---

## permissions

Catálogo fijo de permisos atómicos del sistema. No se modifica desde la UI.

| Campo | Tipo | Nullable | Default | Descripción |
|-------|------|----------|---------|-------------|
| `id` | INTEGER | NO (PK) | AUTOINCREMENT | Identificador único |
| `codename` | TEXT | NO (UNIQUE) | — | Código del permiso: `products.read`, `sales.delete`, etc. |
| `description` | TEXT | NO | — | Descripción legible: "Ver lista de productos" |
| `module` | TEXT | NO | — | Agrupador: `dashboard`, `products`, `sales`, `providers`, `users`, `roles`, `stats`, `pdf`, `settings`, `inventory`, `backup` |

**Permisos actuales (28):**

| id | codename | module |
|----|----------|--------|
| 1 | `dashboard.view` | dashboard |
| 2 | `products.read` | products |
| 3 | `products.create` | products |
| 4 | `products.update` | products |
| 5 | `products.delete` | products |
| 6 | `products.import` | products |
| 7 | `providers.read` | providers |
| 8 | `providers.create` | providers |
| 9 | `providers.update` | providers |
| 10 | `providers.delete` | providers |
| 11 | `sales.pos` | sales |
| 12 | `sales.daily` | sales |
| 13 | `sales.history` | sales |
| 14 | `sales.delete` | sales |
| 15 | `sales.receipt` | sales |
| 16 | `users.read` | users |
| 17 | `users.create` | users |
| 18 | `users.update` | users |
| 19 | `users.delete` | users |
| 20 | `roles.manage` | roles |
| 21 | `stats.view` | stats |
| 22 | `stats.export` | stats |
| 23 | `pdf.generate` | pdf |
| 24 | `settings.read` | settings |
| 25 | `settings.update` | settings |
| 26 | `inventory.view` | inventory |
| 27 | `inventory.adjust` | inventory |
| 28 | `backup.create` | backup |

---

## roles

Roles dinámicos (el gerente puede crear nuevos desde la UI).

| Campo | Tipo | Nullable | Default | Descripción |
|-------|------|----------|---------|-------------|
| `id` | INTEGER | NO (PK) | AUTOINCREMENT | Identificador único |
| `name` | TEXT | NO (UNIQUE) | — | Nombre del rol: `gerente`, `cajero`, `supervisor`, etc. |
| `description` | TEXT | SÍ (NULL) | — | Descripción del propósito del rol |
| `is_protected` | INTEGER | NO | `0` | `1` = no se puede eliminar ni renombrar |
| `created_at` | TEXT | NO | `datetime('now','localtime')` | Fecha de creación |

**Roles semilla:**

| id | name | is_protected | Permisos |
|----|------|-------------|----------|
| 1 | `gerente` | 1 | Todos (28) |
| 2 | `cajero` | 0 | dashboard.view, products.read, providers.read, sales.pos, sales.daily, sales.receipt |
| 3 | `supervisor` | 0 | dashboard.view, products.read, products.create, products.update, providers.read, sales.pos, sales.daily, sales.history, sales.delete, sales.receipt, stats.view |

---

## role_permissions

Tabla pivote: muchos-a-muchos entre roles y permisos.

| Campo | Tipo | Nullable | Default | Descripción |
|-------|------|----------|---------|-------------|
| `role_id` | INTEGER | NO (PK) | — | FK → `roles(id)`, ON DELETE CASCADE |
| `permission_id` | INTEGER | NO (PK) | — | FK → `permissions(id)`, ON DELETE CASCADE |

**Clave primaria compuesta:** (role_id, permission_id)

---

## users

Usuarios del sistema con acceso autenticado.

| Campo | Tipo | Nullable | Default | Descripción |
|-------|------|----------|---------|-------------|
| `id` | INTEGER | NO (PK) | AUTOINCREMENT | Identificador único |
| `username` | TEXT | NO (UNIQUE) | — | Nombre de usuario para login |
| `password_hash` | TEXT | NO | — | Hash bcrypt (10 rounds) de la contraseña |
| `fullname` | TEXT | NO | — | Nombre completo del usuario |
| `role_id` | INTEGER | NO | `2` (cajero) | FK → `roles.id` |
| `is_active` | INTEGER | NO | `1` | `1` = activo, `0` = desactivado (no puede loguearse) |
| `last_login` | TEXT | YES (NULL) | — | Fecha y hora del último login exitoso |
| `created_at` | TEXT | NO | `datetime('now','localtime')` | Fecha de creación |
| `updated_at` | TEXT | NO | `datetime('now','localtime')` | Última modificación |

**Foreign Keys:**
- `role_id` → `roles.id`

**Usuario semilla:**

| Username | Fullname | Role | Password |
|----------|----------|------|----------|
| `pedro_molina` | Pedro Molina | gerente (id=1) | `pedro123` (bcrypt hash) |

**Índices / Restricciones:**
- `UNIQUE(username)`

---

## providers

Proveedores de productos.

| Campo | Tipo | Nullable | Default | Descripción |
|-------|------|----------|---------|-------------|
| `id` | INTEGER | NO (PK) | AUTOINCREMENT | Identificador único |
| `name` | TEXT | NO | — | Nombre o razón social del proveedor |
| `phone` | TEXT | YES (NULL) | — | Teléfono de contacto |
| `email` | TEXT | YES (NULL) | — | Email de contacto |
| `address` | TEXT | YES (NULL) | — | Dirección física |
| `created_at` | TEXT | NO | `datetime('now','localtime')` | Fecha de registro |

**Relaciones:**
- Referenciado por `products.provider_id` (ON DELETE SET NULL)

---

## products

Catálogo de productos del inventario.

| Campo | Tipo | Nullable | Default | Descripción |
|-------|------|----------|---------|-------------|
| `id` | INTEGER | NO (PK) | AUTOINCREMENT | Identificador único |
| `barcode` | TEXT | YES (NULL) | — | Código de barras (reservado para futuro lector) |
| `name` | TEXT | NO | — | Nombre o descripción corta del producto |
| `category` | TEXT | YES (NULL) | — | Categoría: `ferretería`, `pintura`, `herramientas`... |
| `type` | TEXT | NO | `'general'` | Tipo de producto para atributos dinámicos |
| `attributes` | TEXT | YES (NULL) | — | JSON con campos dinámicos (ej: `{"color":"rojo","tamaño":"M"}`) |
| `cost_price` | REAL | NO | `0` | Precio de costo unitario (CHECK >= 0) |
| `price` | REAL | NO | `0` | Precio de venta unitario (CHECK >= 0) |
| `stock` | REAL | NO | `0` | Inventario disponible ( CHECK >= 0) |
| `min_stock` | REAL | NO | `5` | Stock mínimo para alerta de reabastecimiento (CHECK >= 0) |
| `description` | TEXT | YES (NULL) | — | Descripción larga del producto |
| `provider_id` | INTEGER | YES (NULL) | — | FK → `providers.id`, ON DELETE SET NULL |
| `is_active` | INTEGER | NO | `1` | `1` = activo (venta), `0` = descontinuado (soft delete) |
| `created_at` | TEXT | NO | `datetime('now','localtime')` | Fecha de creación |

**Relaciones:**
- `provider_id` → `providers.id`, ON DELETE SET NULL
- Referenciado por: `sale_items.product_id`, `inventory_logs.product_id`, `product_lots.product_id`

**Índices:**
- `products_fts` (tabla virtual FTS5 sincronizada por triggers sobre `name`, `description`, `category`)

**Triggers:**
- `products_ai`: Sincroniza INSERT con FTS5
- `products_ad`: Sincroniza DELETE con FTS5
- `products_au`: Sincroniza UPDATE con FTS5

---

## product_lots

Lotes de productos (control de vencimiento y número de lote).

| Campo | Tipo | Nullable | Default | Descripción |
|-------|------|----------|---------|-------------|
| `id` | INTEGER | NO (PK) | AUTOINCREMENT | Identificador único |
| `product_id` | INTEGER | NO (FK) | — | FK → `products.id`, ON DELETE CASCADE |
| `lot_number` | TEXT | NO | — | Número de lote |
| `expiration_date` | TEXT | YES (NULL) | — | Fecha de vencimiento |
| `initial_stock` | REAL | NO | `0` | Stock inicial del lote (CHECK >= 0) |
| `current_stock` | REAL | NO | `0` | Stock actual del lote (CHECK >= 0) |
| `created_at` | TEXT | NO | `datetime('now','localtime')` | Fecha de creación del lote |

**Relaciones:**
- `product_id` → `products.id`, ON DELETE CASCADE

---

## sales

Encabezado de ventas (transacciones POS).

| Campo | Tipo | Nullable | Default | Descripción |
|-------|------|----------|---------|-------------|
| `id` | INTEGER | NO (PK) | AUTOINCREMENT | Identificador único |
| `invoice_number` | TEXT | YES (NULL) | — | Número de comprobante: `B001-000001` (boleta) o `F001-000001` (factura) |
| `total` | REAL | NO | — | Monto total de la venta (CHECK >= 0) |
| `payment_method` | TEXT | NO | `'EFECTIVO'` | Medio de pago (CHECK: EFECTIVO, TARJETA, TRANSFERENCIA, MIXTO) |
| `user_id` | INTEGER | YES (NULL) | — | FK → `users.id`, ON DELETE SET NULL (usuario que realizó la venta) |
| `client_json` | TEXT | YES (NULL) | — | JSON con datos del cliente: `{type:"factura",ruc:"12345678901",name:"..."}` |
| `created_at` | TEXT | NO | `datetime('now','localtime')` | Fecha y hora de la transacción |

**Relaciones:**
- `user_id` → `users.id`, ON DELETE SET NULL
- Referenciado por `sale_items.sale_id` (ON DELETE CASCADE)

**Índices:**
- `idx_sales_created_at` ON `created_at`

---

## sale_items

Detalle de productos en cada venta.

| Campo | Tipo | Nullable | Default | Descripción |
|-------|------|----------|---------|-------------|
| `id` | INTEGER | NO (PK) | AUTOINCREMENT | Identificador único |
| `sale_id` | INTEGER | NO (FK) | — | FK → `sales.id`, ON DELETE CASCADE |
| `product_id` | INTEGER | NO (FK) | — | FK → `products.id` |
| `product_name` | TEXT | YES (NULL) | — | Nombre del producto (desnormalizado para historial inmutable) |
| `quantity` | REAL | NO | — | Cantidad vendida (CHECK > 0) |
| `price` | REAL | NO | — | Precio unitario al momento de la venta (CHECK >= 0) |
| `subtotal` | REAL | NO | — | `quantity * price` (CHECK >= 0) |
| `created_at` | TEXT | NO | `datetime('now','localtime')` | Fecha y hora de la línea de venta |

**Relaciones:**
- `sale_id` → `sales.id`, ON DELETE CASCADE
- `product_id` → `products.id`

**Índices:**
- `idx_sale_items_sale_id` ON `sale_id`
- `idx_sale_items_product_id` ON `product_id`

> **Nota de diseño:** `product_name` es una desnormalización intencionada. Permite que el historial de ventas conserve el nombre del producto aunque este sea renombrado o eliminado en el futuro.

---

## inventory_logs

Registro de auditoría de todos los movimientos de inventario.

| Campo | Tipo | Nullable | Default | Descripción |
|-------|------|----------|---------|-------------|
| `id` | INTEGER | NO (PK) | AUTOINCREMENT | Identificador único |
| `product_id` | INTEGER | NO (FK) | — | FK → `products.id` |
| `change_amount` | REAL | NO | — | Cantidad cambiada (negativo = salida, positivo = entrada) |
| `current_stock_after` | REAL | NO | — | Stock resultante después del movimiento |
| `reason` | TEXT | NO | — | Motivo: `'VENTA'`, `'ANULACION'`, `'AJUSTE_MANUAL'`... |
| `reference_id` | INTEGER | NO | — | ID de referencia (ej: `sales.id` para ventas) |
| `user_id` | INTEGER | YES | — | FK → `users.id`, ON DELETE SET NULL (quién ejecutó el movimiento) |
| `created_at` | TEXT | YES | `datetime('now','localtime')` | Fecha y hora del movimiento |

**Relaciones:**
- `product_id` → `products.id`
- `user_id` → `users.id`, ON DELETE SET NULL

**Índices:**
- `idx_inventory_logs_product_id` ON `product_id`
- `idx_inventory_logs_created_at` ON `created_at`

---

## product_lots

Lotes de productos con trazabilidad.

| Campo | Tipo | Nullable | Default | Descripción |
|-------|------|----------|---------|-------------|
| `id` | INTEGER | NO (PK) | AUTOINCREMENT | Identificador único |
| `product_id` | INTEGER | NO (FK) | — | FK → `products.id`, ON DELETE CASCADE |
| `lot_number` | TEXT | NO | — | Número de lote |
| `expiration_date` | TEXT | YES (NULL) | — | Fecha de vencimiento del lote |
| `initial_stock` | REAL | NO | `0` | Stock inicial del lote (CHECK >= 0) |
| `current_stock` | REAL | NO | `0` | Stock actual del lote (CHECK >= 0) |
| `created_at` | TEXT | NO | `datetime('now','localtime')` | Fecha de creación del lote |

**Relaciones:**
- `product_id` → `products.id`, ON DELETE CASCADE

---

## settings

Configuración del sistema en formato clave-valor.

| Campo | Tipo | Nullable | Default | Descripción |
|-------|------|----------|---------|-------------|
| `key` | TEXT | NO (PK) | — | Clave de configuración: `companyName`, `ticketFooter`, etc. |
| `value` | TEXT | YES (NULL) | — | Valor de la configuración |

**Claves actuales:**
- `companyName` — Nombre de la ferretería para facturación
- `companyRuc` — RUC (11 dígitos)
- `companyAddress` — Dirección fiscal
- `companyPhone` — Teléfono
- `ticketFooter` — Mensaje al pie del ticket de venta

---

## Resumen de Relaciones Foreign Key

| Tabla origen | Columna | Tabla destino | ON DELETE |
|--------------|---------|---------------|-----------|
| `role_permissions.role_id` | INTEGER | `roles.id` | CASCADE |
| `role_permissions.permission_id` | INTEGER | `permissions.id` | CASCADE |
| `users.role_id` | INTEGER | `roles.id` | — |
| `products.provider_id` | INTEGER | `providers.id` | SET NULL |
| `product_lots.product_id` | INTEGER | `products.id` | CASCADE |
| `sales.user_id` | INTEGER | `users.id` | SET NULL |
| `sale_items.sale_id` | INTEGER | `sales.id` | CASCADE |
| `sale_items.product_id` | INTEGER | `products.id` | — |
| `inventory_logs.product_id` | INTEGER | `products.id` | — |
| `inventory_logs.user_id` | INTEGER | `users.id` | SET NULL |

---

## Total de Entidades

| Tipo | Cantidad | Nombres |
|------|----------|---------|
| Tablas físicas | 10 | users, roles, permissions, role_permissions, providers, products, sales, sale_items, inventory_logs, product_lots |
| Tablas virtuales | 1 | products_fts (FTS5) |
| Tablas de sistema | 2 | schema_version, settings |
| Triggers | 3 | products_ai, products_ad, products_au |
| Índices | 5 | idx_sales_created_at, idx_sale_items_sale_id, idx_sale_items_product_id, idx_inventory_logs_product_id, idx_inventory_logs_created_at |
| Permisos | 28 | (ver tabla permissions) |
| Roles semilla | 3 | gerente, cajero, supervisor |

---

*Documento generado a partir del análisis del schema en `src/main/db.js`. Mantener actualizado con cada cambio de schema.*
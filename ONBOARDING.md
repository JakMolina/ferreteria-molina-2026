# 🎓 Guía de Onboarding Completa - Ferretería Molina v1.2.0

> **Para:** Desarrollador que llega al proyecto sin conocer nada  
> **Objetivo:** Entender la arquitectura, el flujo de datos, cada archivo y poder explicarlo con confianza  
> **Tiempo estimado de lectura:** 45-60 minutos

---

## 1. 🎯 ¿QUÉ ES ESTE PROYECTO?

**Ferretería Molina** es una **aplicación de escritorio** (no web) para gestionar una ferretería real. Permite:

- 📦 **Productos**: CRUD completo, stock, lotes, búsqueda full-text
- 🏪 **Proveedores**: Gestión de proveedores
- 💰 **Ventas (POS)**: Punto de venta, historial, anulación, impresión de tickets/boletas
- 👥 **Usuarios y Roles**: Login, roles dinámicos (gerente, cajero, supervisor), permisos granulares
- 📊 **Dashboard**: Estadísticas, predicciones, alertas de stock bajo
- ⚙️ **Configuración**: Datos de facturación, backup/restore

**Tecnologías clave:**
| Tecnología | Qué hace |
|------------|----------|
| **Electron** | Framework para apps de escritorio con tecnologías web (HTML/JS/CSS) |
| **Node.js** | Backend embebido (corre en el mismo proceso `main`) |
| **SQLite (better-sqlite3)** | Base de datos embebida, archivo único, sin servidor |
| **bcryptjs** | Hash seguro de contraseñas (JS puro, sin binarios nativos) |
| **HTML/CSS/JS vanilla** | Frontend sin frameworks (React, Vue, etc.) |

---

## 2. 🏗️ ARQUITECTURA: DOS PROCESOS SEPARADOS

Electron usa **arquitectura multi-proceso**. Esto es **CRÍTICO** entenderlo:

```
┌─────────────────────────────────────────────────────────────────┐
│                      MAIN PROCESS (Node.js)                     │
│  src/main/index.js → db.js → ipc.js → controllers → services   │
│  - Acceso a BD (better-sqlite3)                                 │
│  - Sistema de archivos (fs, path)                               │
│  - Ventanas (BrowserWindow)                                     │
│  - IPC (comunicación con renderer)                              │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ IPC (ipcMain / ipcRenderer)
                              │ contextBridge (preload.js)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RENDERER PROCESS (Chromium)                  │
│  src/renderer/modules/*/                                       │
│  - HTML + CSS + JS vanilla                                      │
│  - NO acceso a Node.js, NO acceso a BD                         │
│  - Solo llama a `window.api.xxx()` expuesto por preload.js      │
└─────────────────────────────────────────────────────────────────┘
```

**Regla de oro:** **NUNCA** accedas a `require('better-sqlite3')` o `fs` desde el renderer. Todo pasa por IPC.

---

## 3. 📁 ESTRUCTURA DE CARPETAS EXPLICADA

```
FERRETERIA_MOLINA_2026/
├── 📄 package.json              # Config npm, scripts, build (electron-builder)
├── 📄 package-lock.json         # Lock de versiones
├── 📄 README.md                 # Documentación básica
├── 📄 CHANGELOG.md              # Historial de versiones
├── 📄 opencode.json             # Config de opencode (IA)
├── 📂 src/                      # CÓDIGO FUENTE
│   ├── 📂 main/                 # MAIN PROCESS (Node.js)
│   │   ├── index.js             # Entry point: crea ventana, init DB, setup IPC
│   │   ├── db.js                # Conexión SQLite + schema + migraciones + bcrypt
│   │   ├── ipc.js               # Handlers IPC + verificación permisos (hasPermission)
│   │   ├── 📂 controllers/      # Capa de controladores (reciben IPC, orquestan)
│   │   ├── 📂 services/         # Capa de lógica de negocio (transacciones, validaciones)
│   │   └── 📂 repositories/     # Capa de acceso a datos (SQL puro)
│   ├── 📂 preload/
│   │   └── preload.js           # Puente seguro: expone `window.api` al renderer
│   └── 📂 renderer/             # RENDERER PROCESS (UI)
│       ├── 📂 modules/          # Cada feature = un módulo
│       │   ├── auth/            # Login
│       │   ├── home/            # Dashboard
│       │   ├── products/        # CRUD productos
│       │   ├── providers/       # CRUD proveedores
│       │   ├── sales/           # POS, daily, history
│       │   ├── users/           # CRUD usuarios + roles
│       │   └── settings/        # Configuración + backup
│       ├── 📂 receipts/
│       │   └── invoice.html     # Plantilla HTML para PDF tickets
│       └── 📂 styles/
│           └── style.css        # CSS global
├── 📂 docs/                     # DOCUMENTACIÓN (ver al final)
│   ├── architecture/            # ADRs, diagramas Mermaid
│   ├── database/                # Diccionario, migraciones V1/V2
│   ├── operations/              # Guías: install, backup, troubleshooting
│   └── security/                # Threat model STRIDE
├── 📂 assets/                   # Imágenes/iconos (PNG)
├── 📂 build/                    # Iconos para instalador (.ico, .icns, .png)
└── 📂 dist/                     # Salida de build (generado, no versionar)
    └── win-unpacked/            # App desempaquetada para testing
```

---

## 4. 🔑 ARCHIVOS CLAVE DEL MAIN PROCESS (src/main/)

### 4.1 `src/main/index.js` — **Punto de entrada**
```javascript
// Qué hace:
1. Importa db.js → initDB()  (crea/migra BD)
2. Crea BrowserWindow (ventana principal)
3. Carga preload.js
4. Llama setupIPC(mainWindow) desde ipc.js
5. Carga login.html al arrancar
```
**Concepto clave:** Es el `main` de Electron. Aquí vive el event loop principal.

### 4.2 `src/main/db.js` — **Corazón de la base de datos**
```javascript
// Exporta: { db, initDB }
// Qué hace:
1. Decide ruta de la BD:
   - Desarrollo: ./dev-data/ferreteria_dev.db
   - Producción: %APPDATA%/ferreteria_data/ferreteria.db
2. Configura: WAL mode, foreign_keys=ON
3. initDB():
   - Crea TODAS las tablas con CREATE TABLE IF NOT EXISTS
   - Llama migrateToV2() si la BD es antigua
4. migrateToV2():
   - Transacción atómica (BEGIN/COMMIT/ROLLBACK)
   - Crea tablas nuevas: permissions, roles, role_permissions
   - Hashea contraseñas, mapea role string → role_id
   - Recrea 5 tablas para agregar FKs, CHECKs, índices
   - Inserta schema_version = 2
```
**Concepto clave:** Toda la lógica de esquema y migración vive aquí. Es la única verdad de la BD.

### 4.3 `src/main/ipc.js` — **Centro de comunicaciones**
```javascript
// Qué hace:
1. Registra TODOS los handlers ipcMain.handle('canal', handler)
2. hasPermission(userId, codename): consulta role_permissions JOIN permissions
3. requirePermission(userId, codename): lanza error si no tiene permiso
4. Cada handler protegido llama requirePermission(userId, 'permiso.requerido')
```
**Concepto clave:** Aquí vive la **seguridad real**. El frontend solo oculta botones; el backend **rechaza** si no hay permiso.

### 4.4 `src/main/preload.js` — **Puente seguro (Context Bridge)**
```javascript
// Qué hace:
contextBridge.exposeInMainWorld('api', {
  auth: { login, getPermissions },
  products: { getAll, list, create, update, delete },
  sale: { create, history, daily, details, getById, savePdf, delete },
  users: { list, create, update, delete },
  // ...
});
```
**Concepto clave:** Es el **ÚNICO** puente entre renderer y main. El renderer **solo** ve `window.api.xxx()`. No puede hacer `require()`, no puede tocar `ipcRenderer` directamente.

### 4.5 Controladores (`src/main/controllers/`)
| Archivo | Responsabilidad |
|---------|-----------------|
| `auth.controller.js` | Login: bcrypt.compare + is_active + devuelve user + permissions |
| `user.controller.js` | CRUD usuarios: bcrypt.hash, role_id, protege is_protected |
| `roles.controller.js` | CRUD roles + permisos (crear, editar, borrar, catálogo) |
| `product.controller.js` | CRUD productos + validaciones |
| `sales.controller.js` | createSale, getHistory, getDaily, getById, deleteSale |
| `provider.controller.js` | CRUD proveedores (SQL directo, sin service) |
| `settings.controller.js` | get/save settings (key-value), backup DB |
| `stats.controller.js` | Dashboard: ventas hoy, stock bajo, top productos, predicción |
| `pdf.controller.js` | Genera PDF: carga invoice.html, inyecta datos, printToPDF |

**Patrón:** Reciben request IPC → llaman Service/Repository → devuelven respuesta.

### 4.6 Servicios (`src/main/services/`)
| Archivo | Responsabilidad |
|---------|-----------------|
| `product.service.js` | Validaciones + transacción crear producto + lotes |
| `sale.service.js` | **Complejo**: transacción venta + validación stock + baja stock + inventory_logs + factura |
| `stats.service.js` | Agregaciones + regresión lineal para predicción |

**Concepto:** Lógica de negocio, transacciones, validaciones. Los controllers son delgados.

### 4.7 Repositorios (`src/main/repositories/`)
| Archivo | Qué hace |
|---------|----------|
| `product.repository.js` | SQL productos: getAll (con FTS), create, update, soft delete, createLot |
| `sale.repository.js` | SQL ventas: createSaleHeader, createSaleItem, getDailySales, getById, updateStock, logInventoryMovement |
| `stats.repository.js` | SQL agregado: ventas hoy, stock bajo, top productos, últimos 30 días |

**Concepto:** Capa de acceso a datos. SQL puro, parametrizado. Sin lógica de negocio.

---

## 5. 🖥️ RENDERER PROCESS (src/renderer/)

### 5.1 Estructura por módulo
Cada módulo en `src/renderer/modules/<nombre>/` tiene:
```
<nombre>/
├── list.html      # Lista/tabla (ej: productos, usuarios)
├── list.js        # Lógica lista: carga datos, botones editar/borrar
├── form.html      # Formulario crear/editar
├── form.js        # Lógica form: validación, envío a window.api
```
**Ejemplo:** `products/list.js` → `window.api.products.list()` → renderiza tabla → botón editar → `form.html?id=5` → `form.js` carga datos → submit → `window.api.products.update(id, data)`

### 5.2 Módulos existentes
| Módulo | Archivos | Qué hace |
|--------|----------|----------|
| `auth/` | `login.html`, `login.js` | Login → guarda user+permissions en sessionStorage → navega a home |
| `home/` | `index.html`, `index.js` | Dashboard: llama `api.stats.getDashboard()` → gráficos + alertas |
| `products/` | `form/list.html/js` | CRUD productos: búsqueda FTS, formulario con lotes |
| `providers/` | `form/list.html/js` | CRUD proveedores simple |
| `sales/` | `pos.html/js`, `daily.html/js`, `history.html/js` | POS (venta), ventas del día, historial, anular, reimprimir |
| `users/` | `form/list/roles.html/js` | CRUD usuarios + **gestión de roles** (roles.html) |
| `settings/` | `settings.html/js` | Config facturación + **backup/restore** |

### 5.3 Navegación
```javascript
// En cualquier .js del renderer:
window.api.navigation.goTo('products/list.html');
// En main/index.js: ipcMain.handle('navigate-to', (e, route) => mainWindow.loadFile(...))
```

### 5.4 `src/renderer/receipts/invoice.html`
Plantilla HTML para tickets/boletas. Se carga en `BrowserWindow` oculto, se inyectan datos via `executeJavaScript`, se imprime a PDF con `printToPDF`.

### 5.5 `src/renderer/styles/style.css`
**Único** CSS global. Variables CSS (`--primary-color`, etc.), clases utilitarias (`.btn`, `.card`, `.badge`, `.form-grid`).

---

## 6. 🗄️ BASE DE DATOS - ESQUEMA v2

### Tablas principales (12 físicas + 1 virtual + 3 triggers + 5 índices)
| Tabla | Propósito | Claves |
|-------|-----------|--------|
| `schema_version` | Control migraciones | PK: version |
| `permissions` | Catálogo 28 permisos fijos | PK: id, UK: codename |
| `roles` | Roles dinámicos (gerente, cajero, supervisor) | PK: id, UK: name |
| `role_permissions` | M:N roles ↔ permisos | PK: (role_id, permission_id) |
| `users` | Usuarios + bcrypt + role_id FK | PK: id, UK: username |
| `providers` | Proveedores | PK: id |
| `products` | Productos + CHECKs + FTS5 | PK: id, FK: provider_id |
| `products_fts` | Virtual FTS5 (búsqueda) | triggers sync |
| `product_lots` | Lotes + vencimiento | PK: id, FK: product_id |
| `sales` | Ventas (cabecera) | PK: id, FK: user_id |
| `sale_items` | Detalle venta | PK: id, FK: sale_id, product_id |
| `inventory_logs` | Auditoría stock | FK: product_id, user_id |
| `settings` | Key-value config | PK: key |

### Relaciones FK clave
```
users.role_id → roles.id
products.provider_id → providers.id (ON DELETE SET NULL)
sales.user_id → users.id (ON DELETE SET NULL)
sale_items.sale_id → sales.id (ON DELETE CASCADE)
sale_items.product_id → products.id
inventory_logs.product_id → products.id
inventory_logs.user_id → users.id (ON DELETE SET NULL)
product_lots.product_id → products.id (ON DELETE CASCADE)
role_permissions.role_id → roles.id (CASCADE)
role_permissions.permission_id → permissions.id (CASCADE)
```

### Índices de performance
- `idx_sales_created_at` → dashboard ventas hoy / últimos 30 días
- `idx_sale_items_product_id` → top productos vendidos
- `idx_inventory_logs_product_id` + `_created_at` → auditoría

---

## 7. 🔐 SEGURIDAD - AUTENTICACIÓN Y AUTORIZACIÓN

### Login (`auth.controller.js`)
```javascript
1. SELECT * FROM users WHERE username=? AND is_active=1
2. bcrypt.compareSync(password, password_hash)
3. UPDATE users SET last_login=now() WHERE id=?
4. SELECT codename FROM role_permissions JOIN permissions WHERE role_id=?
5. Devuelve: {success, user: {id, name, username, role_id, role_name, permissions: [...]}}
```
**El renderer guarda:** `sessionStorage.setItem('user', JSON.stringify(user))` + `permissions`

### Verificación de permisos (Backend - `ipc.js`)
```javascript
function hasPermission(userId, codename) {
  return db.prepare(`
    SELECT 1 FROM role_permissions rp
    JOIN permissions p ON rp.permission_id = p.id
    JOIN users u ON u.role_id = rp.role_id
    WHERE u.id = ? AND p.codename = ?
  `).get(userId, codename);
}

// En cada handler protegido:
ipcMain.handle('user:delete', (e, { id, userId }) => {
  requirePermission(userId, 'users.delete');  // Lanza error si no tiene
  return userController.deleteUser(id);
});
```

### Permisos actuales (28)
| Módulo | Permisos |
|--------|----------|
| dashboard | `dashboard.view` |
| products | `read, create, update, delete, import` |
| providers | `read, create, update, delete` |
| sales | `pos, daily, history, delete, receipt` |
| users | `read, create, update, delete` |
| roles | `roles.manage` |
| stats | `view, export` |
| pdf | `generate` |
| settings | `read, update` |
| inventory | `view, adjust` |
| backup | `create` |

### Roles semilla
| Rol | Protegido | Permisos |
|-----|-----------|----------|
| `gerente` | ✅ | **Todos (28)** |
| `cajero` | ❌ | 6 permisos básicos |
| `supervisor` | ❌ | 11 permisos (incluye anular ventas) |

**El gerente crea roles desde UI** (`users/roles.html`) asignando checkboxes de permisos.

---

## 8. 🔄 FLUJOS DE DATOS PRINCIPALES

### 8.1 Login
```
Cajero → UI (login.html) → window.api.auth.login(creds)
  → preload.js → ipcRenderer.invoke('login')
  → ipc.js → authController.login()
  → db.js (SELECT + bcrypt.compare + SELECT permissions)
  → return {success, user: {id, name, role_id, permissions: [...]}}
  → renderer: sessionStorage.setItem('user', ...) + sessionStorage.setItem('permissions', ...)
  → navigate to home
```

### 8.2 Venta (POS) - **Flujo crítico**
```
Cajero → POS UI → window.api.sale.create({items, payment, client, user_id})
  → ipc.js: requirePermission(user_id, 'sales.pos')
  → saleService.createSale(data)
    → BEGIN TRANSACTION
    → INSERT INTO sales (invoice_number, total, payment_method, user_id)
    → FOR EACH item:
        SELECT stock FROM products WHERE id=?
        VALIDAR stock >= quantity
        INSERT INTO sale_items (sale_id, product_id, product_name, qty, price, subtotal)
        UPDATE products SET stock = stock - qty WHERE id=?
        INSERT INTO inventory_logs (product_id, change=-qty, current_stock, reason='VENTA', ref=sale_id, user_id)
    → COMMIT
    → return {success, saleId, invoiceNumber, total}
  → renderer: muestra comprobante / imprime PDF
```

### 8.3 Anular Venta
```
Cajero → Botón Anular → window.api.sale.delete(id, userId)
  → ipc.js: requirePermission(userId, 'sales.delete')
  → saleService.deleteSale(id, userId)
    → BEGIN
    → SELECT * FROM sale_items WHERE sale_id=?
    → DELETE FROM sales WHERE id=?
    → FOR EACH item:
        UPDATE products SET stock = stock + qty WHERE id=?
        INSERT INTO inventory_logs (reason='ANULACION', change=+qty, user_id)
    → COMMIT
```

### 8.3 Búsqueda Productos (FTS5)
```
UI → input búsqueda → window.api.products.getAll(query)
  → productController.getProducts(query)
  → productRepository.getAll(query)
    → IF query: SELECT * FROM products JOIN products_fts ON id=rowid WHERE products_fts MATCH ?
    → ELSE: SELECT * FROM products WHERE is_active=1
```

---

## 9. 🛠️ SCRIPTS NPM DISPONIBLES

```bash
npm run dev      # Desarrollo: nodemon + electron (recarga auto)
npm run start    # Producción: electron .
npm run rebuild  # Recompila better-sqlite3 para Electron actual
npm run pack     # Empaqueta sin instalador (dist/win-unpacked)
npm run dist     # Genera instalador .exe (NSIS) en dist/
```

---

## 10. 🏗️ BUILD Y DISTRIBUCIÓN

### `package.json` → `build` config clave
```json
"files": ["src/**/*", "assets/**/*", "package.json"],  // Qué empaquetar
"asarUnpack": ["node_modules/better-sqlite3/**/*"],   // Binario nativo FUERA del asar
"npmRebuild": false,                                   # NO recompilar al build (usa binario actual)
"win": { "target": "nsis", "icon": "build/icon.ico" }
```

### Pasos para generar instalador
```powershell
# En Windows PowerShell (IMPORTANTE: en Windows, no WSL)
npm run dist
# Genera: dist/Ferretería Molina Setup 1.2.0.exe
```

**Por qué en Windows:** `better-sqlite3` compila binario nativo (`.node`). Si buildeas en Linux/WSL, el `.exe` llevará binario Linux y fallará en Windows.

---

## 11. 🐛 DEBUGGING Y TROUBLESHOOTING

### Ver logs en desarrollo
```javascript
// En cualquier .js del main:
console.log('🔍 Debug:', variable);

// En renderer:
console.log('🖥️ Renderer:', data);
// Se ve en: DevTools (F12) → Console
// Y en terminal donde corrió npm run dev
```

### Logs en producción
```powershell
# Electron-log guarda en:
%APPDATA%\ferreteria-molina-manager\logs\main.log
```

### Errores comunes
| Error | Causa | Solución |
|-------|-------|----------|
| `database disk image is malformed` | BD corrupta | Borrar `%APPDATA%\ferreteria_data\ferreteria.db*` y reabrir |
| `cannot add REFERENCES column with non-NULL default` | Migración V2 | Ya corregido en db.js (ALTER sin DEFAULT + UPDATE) |
| `ACCESO DENEGADO` | Sin permiso | Gerente → Usuarios → Roles → asignar permiso |
| `better_sqlite3.node invalid ELF header` | Binario Linux en Windows | `npm run rebuild` en Windows |

### DevTools
- **Renderer:** F12 en la app (Chrome DevTools)
- **Main:** `console.log` sale en terminal donde corrió `npm run dev`

---

## 12. 📋 FLUJO DE TRABAJO RECOMENDADO

### Para agregar una feature nueva (ej: módulo Clientes)
```
1. BD: CREATE TABLE clients (...) en db.js (initDB) + migración V3
2. Repo: client.repository.js (SQL CRUD)
3. Service: client.service.js (validaciones)
4. Controller: client.controller.js (expone métodos)
5. IPC: ipc.js → handlers client:list, create, update, delete + requirePermission
6. Preload: api.client = { list, create, update, delete }
7. Renderer: modules/clients/list.html/js + form.html/js
8. Permisos: agregar 'clients.read', 'clients.create'... en db.js seed + roles UI
9. Test: npm run dev → crear cliente → listar → editar → borrar
10. Build: npm run dist → probar .exe en máquina limpia
```

### Checklist antes de commit
- [ ] `npm run dev` sin errores en consola
- [ ] Login `pedro_molina` / `pedro123` → dashboard
- [ ] CRUD productos/proveedores/usuarios funciona
- [ ] Venta POS crea registro, baja stock, genera PDF
- [ ] Anular venta devuelve stock
- [ ] Permisos: cajero NO ve botón anular, gerente SÍ
- [ ] `npm run dist` genera `.exe` sin errores

---

## 13. 📚 DOCUMENTACIÓN EXISTENTE (carpeta `docs/`)

| Archivo | Qué encontrarás |
|---------|-----------------|
| `architecture/adr/001-use-sqlite.md` | Por qué SQLite y no Postgres |
| `architecture/adr/002-roles-permissions-dynamic.md` | Por qué roles en BD |
| `architecture/adr/003-bcrypt-passwords.md` | Por qué bcryptjs |
| `architecture/component-diagram.mmd` | Diagrama componentes (Mermaid) |
| `architecture/sequence-login-sale.mmd` | Secuencia login + venta + anulación |
| `database/data-dictionary.md` | **Diccionario completo**: 12 tablas, campos, FKs, checks |
| `database/migrations/V1__initial_schema.sql` | Schema original (v1.1.1) |
| `database/migrations/V2__roles_permissions_security.sql` | Migración completa v2 |
| `database/migration-guide.md` | Cómo crear V3, V4... |
| `operations/install-guide.md` | Instalación paso a paso |
| `operations/backup-restore.md` | Backup manual/auto + restore |
| `operations/troubleshooting.md` | 10 errores comunes + solución |
| `security/threat-model.md` | STRIDE: 18 riesgos analizados |

---

## 14. 🎓 TU PRIMER DÍA - PLAN DE ACCIÓN

| Paso | Acción | Verificación |
|------|--------|--------------|
| 1 | `git clone` + `npm install` | `npm run dev` abre app |
| 2 | Login `pedro_molina` / `pedro123` | Ves dashboard |
| 3 | Crea un producto | Aparece en lista |
| 4 | Haz una venta en POS | Genera ticket PDF |
| 5 | Anula la venta | Stock vuelve a original |
| 4 | Crea usuario "cajero1" rol Cajero | Login con él → NO ve botón Anular |
| 5 | Gerente → Roles → crea "inventarista" | Asigna `products.read` + `inventory.adjust` |
| 6 | `npm run dist` en Windows | Genera `.exe` instalable |
| 7 | Instala `.exe` en otra PC | Funciona sin Node.js instalado |

---

## 15. 🧭 MAPA MENTAL RÁPIDO

```
Usuario hace clic en UI
       │
       ▼
window.api.xxx()  (preload.js)
       │
       ▼
ipcRenderer.invoke('canal', data)
       │
       ▼
ipcMain.handle('canal')  (ipc.js)
       │
       ├── requirePermission(userId, 'permiso') ──❌→ Error "ACCESO DENEGADO"
       │
       └──✅→ Controller → Service → Repository → SQLite
                    │
                    ▼
              Respuesta JSON
                    │
                    ▼
           ipcRenderer → preload → window.api → UI actualiza
```

---

## 16. 📞 PRÓXIMOS PASOS REALES

1. **Clona y corre** → `npm run dev`
2. **Rompe cosas a propósito** → borra BD, rompe login, quita permisos
3. **Agrega un campo** → ej: `phone` en `products` → schema + repo + service + controller + IPC + preload + UI
4. **Genera instalador** → `npm run dist` en Windows
5. **Lee `docs/`** → cada archivo te enseña el "por qué" de cada decisión

---

> **Recuerda:** Este proyecto no usa magia. Todo es JS plano, SQL plano, Electron documentado. Si algo no entiendes, **lee el código** — está escrito para ser leído.

---

*Última actualización: Julio 2026 — v1.2.0*  
*Para: Cualquier desarrollador que se una al proyecto*  
*Filosofía: Código legible > código clever*
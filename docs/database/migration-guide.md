# Guía de Migraciones - Ferretería Molina

## Qué son las migraciones

Archivos SQL numerados que registran cada cambio del schema de la base de datos a lo largo del tiempo. Son el historial versionado y auditable de cómo evolucionó la estructura de datos.

**No son migraciones de datos** (tipo importar CSV). Son migraciones de **estructura** (tablas, columnas, FKs, índices).

## Convención de nombres

```
V{numero}__descripcion_corta.sql
```

Ejemplos:
- `V1__initial_schema.sql` — Schema original de la app
- `V2__roles_permissions_security.sql` — Sistema de roles y seguridad
- `V3__add_clients_table.sql` — (futuro) tabla de clientes
- `V4__add_discounts.sql` — (futuro) descuentos y promociones

## Cómo se aplican las migraciones

### En desarrollo
El archivo `src/main/db.js` contiene `initDB()` y `migrateToV2()`. Cuando la app inicia:

1. `initDB()` ejecuta el schema final actual (todas las tablas con `IF NOT EXISTS`)
2. `migrateToV2()` verifica si la DB existente necesita migración:
   - Si `schema_version.max(version) < 2` → ejecuta migración V2
   - Si ya está en V2 → salta la migración
3. La migración se ejecuta dentro de una transacción atómica: si falla en cualquier paso, **todo se revierte** (ROLLBACK) y la DB queda intacta en V1.

### En producción (app instalada)

Exactamente igual que en desarrollo. La app detecta automáticamente el schema de la DB existente y aplica migraciones pendientes. El usuario no ve nada.

## Cómo agregar una nueva migración V3

Supongamos que necesitas agregar una tabla `clients` y un campo `client_id` en `sales`.

### Paso 1: Crear el archivo SQL
```
docs/database/migrations/V3__add_clients_table.sql
```

```sql
-- Migración V3: Agregar tabla de clientes
BEGIN;

CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    ruc TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime'))
);

-- Agregar client_id a sales (opcional, si quieres FK real)
ALTER TABLE sales ADD COLUMN client_id INTEGER;

COMMIT;
```

### Paso 2: Agregar lógica en db.js

```javascript
function migrateToV3() {
    const currentVersion = db.prepare("SELECT MAX(version) as v FROM schema_version").get();
    if (currentVersion && currentVersion.v >= 3) return;

    const migration = db.transaction(() => {
        db.exec(`CREATE TABLE IF NOT EXISTS clients (...)`);
        // ALTER TABLE sales ADD COLUMN...
        db.exec("INSERT OR REPLACE INTO schema_version (version) VALUES (3)");
    });

    migration();
    console.log("✅ Migración a schema v3 completada.");
}
```

### Paso 3: Llamar en initDB()

```javascript
function initDB() {
    db.exec(schema);  // schema con CREATE TABLE IF NOT EXISTS
    migrateToV2();    // idempotente: solo si < v2
    migrateToV3();    // idempotente: solo si < v3
}
```

### Paso 4: Actualizar documentación

- `data-dictionary.md` → agregar tabla `clients` y columna `sales.client_id`
- `CHANGELOG.md` → entrada v1.3.0

## Principios importantes

1. **Idempotencia**: Toda migración usa `CREATE TABLE IF NOT EXISTS`, `INSERT OR IGNORE`, y verifica `MAX(version)` antes de ejecutarse. Se puede ejecutar 100 veces y solo se aplica una.

2. **Atomicidad**: cada migración se ejecuta dentro de `BEGIN` / `COMMIT`. Si algo falla, nada cambia.

3. **Forward-only**: SQLite no soporta fácilmente `DROP COLUMN`. Las migraciones no se revierten (no hay downgrade). Para volver atrás: restaurar backup.

4. **Compatibilidad**: Las migraciones no deben romper consultas SQL existentes. No se renombran columnas usadas por el código. No se eliminan columnas sin justificar.

5. **Una migración por versión**: Si V3 agrega 5 tablas, todo va en `V3__*.sql`. No se fragmenta en múltiples archivos para el mismo bump de versión.

## Migración manual (desde CLI)

```bash
# Ver versión actual
sqlite3 ferreteria.db "SELECT * FROM schema_version;"

# Aplicar migración manualmente
sqlite3 ferreteria.db < docs/database/migrations/V2__roles_permissions_security.sql

# Verificar
sqlite3 ferreteria.db "SELECT * FROM schema_version;"
# Debe mostrar: 2|<fecha>

# Si falla, restaurar backup
cp backup_antes.db ferreteria.db
```

## Checklist para cada migración nueva

- [ ] Nuevo archivo `docs/database/migrations/V{N}__descripcion.sql`
- [ ] Contenido dentro de `BEGIN;` / `COMMIT;`
- [ ] Usa `CREATE TABLE IF NOT EXISTS`, `INSERT OR IGNORE`, `CHECK()`
- [ ] Probar en DB de desarrollo
- [ ] Nueva función `migrateToV{N}()` en `db.js` (llamada desde `initDB()`)
- [ ] `data-dictionary.md` actualizado con nuevas tablas/columnas
- [ ] `CHANGELOG.md` actualizado con descripción del cambio
- [ ] Backup de DB antes de desplegar a producción

---

*Documento mantenido junto con `/docs/database/migrations/`.*
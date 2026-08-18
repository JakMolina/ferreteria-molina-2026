# ADR 002: Roles y Permisos Dinámicos en Base de Datos

## Contexto

El sistema necesita que el gerente pueda crear roles personalizados y asignarles permisos específicos sin tocar código fuente. El sistema anterior solo tenía 2 roles cableados (`admin` y `cashier`) con protecciones únicamente en el frontend (esconder botones).

## Decisión

Implementar roles y permisos en la base de datos con tablas:

- `permissions` — catálogo fijo de 28 permisos atómicos
- `roles` — los crea el gerente desde la UI
- `role_permissions` — tabla pivote M:N
- `users.role_id` — FK a roles (reemplaza el string `role`)

La verificación se hace en el backend (IPC handlers) mediante `hasPermission(userId, codename)` que consulta `role_permissions`.

## Alternativas consideradas

| Alternativa | Pros | Contras |
|-------------|------|---------|
| **BD (Roles + Permisos dinámicos)** | Flexible, administrable desde UI, granular, auditable | Requiere 3 tablas extras + migración |
| Strings hardcodeados (`admin`, `cashier`) | Simple | No escala, no auditable, seguridad falsa |
| Roles en código (enum) | Type-safe | Requiere deploy para cada nuevo rol |

## Consecuencias

**Positivas:**
- Gerente crea "inventarista" con `products.read` + `inventory.view` + `inventory.adjust` en 30 segundos
- Verificación de permisos en backend: la UI solo oculta botones, el IPC rechaza si no tiene permiso
- Roles protegidos (gerente: `is_protected=1`) no pueden eliminarse accidentalmente
- 28 permisos granulares para todos los módulos del sistema

**Negativas:**
- 3 tablas nuevas → mayor complejidad del modelo de datos
- Cada handler IPC requiere consulta adicional de permisos (no es lento: SQLite en local)
- Migración de datos: las contraseñas texto plano deben hashearse, rol string mapearse a role_id

**Mitigaciones:**
- Migración atómica con rollback automático
- `hasPermission()` usa query simple (sub-milisegundo en SQLite local)
- Diccionario de datos documenta los 28 permisos para desarrolladores futuros
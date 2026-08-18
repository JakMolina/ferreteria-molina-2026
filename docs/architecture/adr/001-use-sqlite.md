# ADR 001: Uso de SQLite como Base de Datos

## Contexto

Se necesita una base de datos para una aplicación Electron de escritorio (single-user, offline-first) que gestione inventario, ventas, proveedores y usuarios de una ferretería.

## Decisión

Usar **SQLite** mediante `better-sqlite3` como base de datos embebida.

## Alternativas consideradas

| Alternativa | Pros | Contras |
|-------------|------|---------|
| **SQLite (better-sqlite3)** | Cero configuración, archivo único, backup trivial, ACID, WAL mode, sin servidor | Binario nativo requiere rebuild por plataforma, sin concurrencia multi-usuario remota |
| PostgreSQL / MySQL | Multi-usuario, replicación, herramientas maduras | Requiere servidor instalado, overkill para app monousuario, latencia de red |
| NeDB / LokiJS | Sin binarios nativos, JS puro | Sin ACID real, corrupción frecuente, rendimiento pobre con >10k registros |
| JSON plano | Sin dependencias | Sin queries, sin transacciones, corrupción fácil, imposible escalar |

## Consecuencias

**Positivas:**
- Instalación del sistema sin dependencia externa (el usuario no instala servidores)
- Backup: copiar un archivo `.db`
- WAL mode permite lecturas concurrentes mientras se escribe (POS + dashboard simultáneo)
- `better-sqlite3` es sincrónico, más simple de razonar que async
- FTS5 integrado para búsqueda de productos sin dependencia extra

**Negativas:**
- `better-sqlite3` requiere binario nativo: debe compilarse para cada plataforma (Windows/Linux/Mac) y cada versión de Electron
- No escala a múltiples sucursales conectadas remotamente (se necesitaría API REST)
- Tamaño de DB crece con cada venta (solucionable con mantenimiento programado)

**Mitigaciones:**
- `electron-builder` con `npmRebuild: false` para buildear en la plataforma target
- `asarUnpack` para extraer el binario nativo del ASAR
- Función `backup` en settings para que el gerente descargue copia periódica
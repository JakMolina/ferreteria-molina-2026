# Modelo de Amenazas (STRIDE) - Ferretería Molina v1.2.0

> Metodología STRIDE: Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege

## Activos a Proteger

| Activo | Ubicación | Criticidad |
|--------|-----------|------------|
| DB SQLite (usuarios, ventas, inventario) | `%APPDATA%\ferreteria_data\ferreteria.db` | **Alta** |
| Credenciales (hash bcrypt) | Columna `users.password_hash` | **Alta** |
| Binario instalado + ASAR | `C:\Program Files\Ferretería Molina\resources\app.asar` | **Media** |
| Logs de aplicación | `%APPDATA%\ferreteria-molina-manager\logs\` | **Baja** |

## Análisis STRIDE

### Spoofing (Suplantación de Identidad)

| Riesgo | Probabilidad | Impacto | Mitigación Implementada |
|--------|-------------|---------|-------------------------|
| Login con credenciales robadas | Media | Alto | bcrypt 10 rounds, `is_active` efectivo en WHERE del login |
| Login con credenciales por defecto sin cambiar | Media | Alto | Contraseña semilla (`pedro123`) documentada para cambio inmediato |
| Sesión almacenada en sessionStorage manipulable | Baja | Medio | sessionStorage solo accesible desde el mismo proceso renderer; IPC verifica userId en cada handler |
| Modificar archivo de login HTML para bypass | Baja | Alto | El renderer solo llama IPC; el backend siempre verifica permisos |

### Tampering (Manipulación de Datos)

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Modificar `ferreteria.db` directamente con visor SQLite | Media | **Crítico** | DB en `%APPDATA%` con permisos de usuario Windows; bcrypt protege contraseñas aunque lean la DB |
| Modificar `app.asar` para saltar verificación de permisos | Baja | Alto | electron-builder puede firmar el instalador; verificación de integridad en futura versión |
| Inyectar IPC calls maliciosas desde renderer | Muy baja | Alto | `contextIsolation: true`, `nodeIntegration: false`. Renderer no puede llamar IPC directamente, solo vía `contextBridge` expuesto |

### Repudiation (No Repudio)

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Cajero niega haber hecho una venta | Media | Medio | `inventory_logs.user_id` registra quién hizo cada movimiento; `sales.user_id` registra quién hizo la venta |
| Cajero niega haber anulado una venta | Media | Alto | `inventory_logs.reason='ANULACION'` registra el movimiento inverso con `user_id` |
| Usuario niega haber modificado configuración | Baja | Bajo | `settings` no registra quién modificó (pendiente auditoría) |
| Acceso no autorizado sin registro | Baja | Medio | `last_login` registra el último login exitoso |

### Information Disclosure (Divulgación de Información)

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| DB copiada en USB por empleado | Media | **Crítico** | bcrypt en contraseñas; no hay datos de tarjetas de crédito; la DB requiere permisos del OS para leer |
| Backup en carpeta pública | Media | Alto | El backup se genera con `dialog.showSaveDialog()` — el usuario elige dónde guardar; educar al gerente |
| Logs contienen datos sensibles | Baja | Bajo | Logs solo registran queries SQL sin valores de contraseña |

### Denial of Service (Denegación de Servicio)

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| DB corrompida por cierre abrupto | Media | Alto | WAL mode permite recuperación; `db.js` detecta `malformed` y regenera DB limpia automáticamente |
| DB corrompida al crecer indefinidamente | Baja | Bajo | Sin mitigación hoy; en futuro: tarea programada para VACUUM o backup automático |
| Instalación incompatible | Baja | Alto | Guía de troubleshooting documentada (`docs/operations/troubleshooting.md`); verificar requisitos |

### Elevation of Privilege (Elevación de Privilegio)

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Cajero elimina usuario admin via IPC | Baja | **Crítico** | `user:delete` verifica `users.delete` en backend; gerente es `is_protected` (no se puede borrar) |
| Cajero modifica settings via IPC | Baja | Alto | `settings:save` verifica `settings.update` en backend |
| Cajero anula venta via IPC | Baja | Alto | `sale:delete` verifica `sales.delete` en backend |
| Cajero crea usuarios en UI por DevTools | Muy baja | Alto | `contextBridge` limita exposición de API; incluso si se salta la UI, el IPC verifica permiso |

## Controles No Implementados (Futuro)

| Control | Prioridad | Justificación |
|---------|-----------|---------------|
| Firma de códigos del instalador (.exe) | Media | Previene modificación del binario instalado; requiere certificado |
| Cifrar DB en reposo (SQLCipher) | Baja | Agrega complejidad, overkill para datos sin información sensible |
| Firma de actualizaciones (electron-updater) | Media | Si se implementa auto-update, validar que las actualizaciones sean oficiales |
| Auditoría de accesos (tabla access_log) | Baja | `last_login` ya registra cada login; para auditoría completa, registrar cada acción |

## Evaluación de Riesgo Residual

| Categoría | Nivel de Riesgo |
|-----------|----------------|
| Spoofing | Bajo - bcrypt + is_active protegen bien |
| Tampering | Bajo - contextIsolation y verificación backend |
| No Reprimonio | Medio - ventas con trazabilidad, settings sin trazabilidad |
| Data Disclosure | Medio - bcrypt protege contraseñas, DB expuesta si roban PC |
| DoS | Bajo - regeneración automática + WAL |
| Elevation | Bajo - todos los handlers verifican permisos |

*Documento generado para fines de auditoría y revisión de seguridad.*
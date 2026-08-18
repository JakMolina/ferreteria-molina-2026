# Backup y Restore - Ferretería Molina v1.2.0

## Backup Automático (desde la aplicación)

1. Abrir la app → menú ⚙ **Configuración**
2. Sección **🛡️ Seguridad** → clic en **📥 Descargar Backup**
3. Elegir carpeta de destino (recomendado: `Documentos\Backups\`)
4. Clic **Guardar**
5. La app generará `Backup_<timestamp>.db`

> El backup se realiza en caliente (app abierta). WAL mode garantiza consistencia.

---

## Backup Manual (línea de comandos)

```powershell
# PowerShell - copia de seguridad rápida
$backupPath = "$env:USERPROFILE\Documents\Backups"
New-Item -ItemType Directory -Force -Path $backupPath
$date = Get-Date -Format "yyyyMMdd_HHmmss"
copy "$env:APPDATA\ferreteria_data\ferreteria.db" "$backupPath\ferreteria_$date.db"
```

```powershell
# Incluir archivos WAL/SHM (solo si la app está corriendo)
copy "$env:APPDATA\ferreteria_data\ferreteria.db-wal" "$backupPath\ferreteria_$date.db-wal"
copy "$env:APPDATA\ferreteria_data\ferreteria.db-shm" "$backupPath\ferreteria_$date.db-shm"
```

---

## Backup Programado (Task Scheduler)

Para generar un backup automático todos los días:

1. Abrir **Programador de Tareas** (taskschd.msc)
2. **Crear tarea básica** → nombre: `Backup Ferretería Molina`
3. **Desencadenador:** Diario → 02:00 AM
4. **Acción:** Iniciar un programa → `powershell.exe`
5. **Argumentos:**
```powershell
-Command "$d=Get-Date -Format 'yyyyMMdd'; copy '$env:APPDATA\ferreteria_data\ferreteria.db' '$env:USERPROFILE\Documents\Backups\ferreteria_$d.db'"
```
6. **Finalizar** → la tarea se ejecutará automáticamente

---

## Restore (Restaurar Backup)

### Escenario 1: DB corrupta o pérdida de datos

```powershell
# 1. Cerrar la aplicación completamente
# 2. Reemplazar el archivo
copy "C:\Users\steve\Documents\Backups\ferreteria_20260715_1430.db" "$env:APPDATA\ferreteria_data\ferreteria.db"

# 3. Borrar archivos WAL/SHM (residuales de la versión corrupta)
del "$env:APPDATA\ferreteria_data\ferreteria.db-wal" 2>$null
del "$env:APPDATA\ferreteria_data\ferreteria.db-shm" 2>$null
del "$env:APPDATA\ferreteria_data\ferreteria.db-journal" 2>$null

# 4. Abrir la aplicación
# 5. Verificar que los datos son correctos (ventas, inventario, etc.)
```

### Escenario 2: Restaurar backup completo desde un archivo .db descargado

```powershell
# Si usaste el botón 📥 Descargar Backup, el archivo está en tu carpeta elegida
# 1. Cerrar la app
# 2. Copiar el backup a la ruta correcta
copy "C:\Descargas\Backup_1726000000000.db" "$env:APPDATA\ferreteria_data\ferreteria.db"
# 3. Abrir la app
```

---

## Consideraciones Importantes

1. **No hacer backup con la DB abierta en editor externo** (p.ej., DB Browser for SQLite). La app sí puede correr porque WAL mode garantiza lecturas concurrentes.

2. **Cada backup incluye todo:** usuarios, ventas, inventario, configuración, logs. Es una instantánea completa del sistema.

3. **Frecuencia recomendada:**
   - Backup diario automático (Task Scheduler)
   - Backup antes de actualizar la versión de la app
   - Backup después de cerrar caja al final del día

4. **Probar restore periódicamente:** Cada mes, restaurar un backup en una copia temporal y abrirla con DB Browser para verificar que los datos están íntegros.

---

*Documento mantenido para el equipo de operaciones y soporte.*
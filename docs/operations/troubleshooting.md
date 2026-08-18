# Troubleshooting - Ferretería Molina v1.2.0

## database disk image is malformed

**Causa:** La base de datos en `%APPDATA%\ferreteria_data\ferreteria.db` está corrupta.

**Solución automática:** La app detecta este error y regenera la DB desde cero. Si aparece al abrir:

1. Cerrar la aplicación
2. Navegar a: `%APPDATA%\ferreteria_data\`
3. Borrar manualmente: `ferreteria.db`, `ferreteria.db-wal`, `ferreteria.db-shm`
4. Reabrir la aplicación (se crea DB limpia con schema v2)
5. Login: `pedro_molina` / `pedro123`
6. Restaurar backup si tienes uno reciente (ver `backup-restore.md`)

---

## La aplicación no abre / pantalla en blanco

1. Verificar que la carpeta `%APPDATA%\ferreteria_data\` existe:
```powershell
ls $env:APPDATA\ferreteria_data\
```
Debe contener `ferreteria.db`. Si no existe, la app la crea al iniciar.

2. Revisar los logs:
```powershell
ls $env:APPDATA\ferreteria-molina-manager\logs\
```
Abrir el archivo `.log` más reciente y buscar errores.

3. Si nada funciona, reinstalar:
   - Panel de control → desinstalar "Ferretería Molina"
   - Borrar `%APPDATA%\ferreteria_data\` (conserva tu backup primero)
   - Reinstalar desde el `.exe`

---

## Error: cannot add a REFERENCES column with non-NULL default value

**Causa:** Versión del instalador con bug en la migración de `users.role_id`.

**Solución:**
1. Actualizar a la última versión de la app (v1.2.0 en adelante)
2. Si persiste, cerrar la app y borrar `%APPDATA%\ferreteria_data\ferreteria.db`
3. Reabrir con la última versión

---

## Error: ACCESO DENEGADO: No tienes permiso para esta operación

**Causa:** El usuario no tiene el permiso requerido para la acción.

**Solución:**
1. Iniciar sesión como gerente (`pedro_molina`)
2. Ir a 👤 **Usuarios** → 🔑 **Roles**
3. Encontrar el rol del usuario afectado → clic en **✏️ Editar**
4. Marcar el permiso faltante
5. Clic en **Actualizar Rol**

| Acción denegada | Permiso necesario |
|-----------------|-------------------|
| No puedo crear usuarios | `users.create` |
| No puedo eliminar usuarios | `users.delete` |
| No puedo anular ventas | `sales.delete` |
| No puedo crear productos | `products.create` |
| No puedo ver configuración | `settings.read` |
| No puedo ver roles | `roles.manage` |

---

## Error al imprimir o guardar PDF

1. Verificar que la carpeta `Documentos\Ferreteria_Comprobantes\` existe y tiene permisos
2. Si el error persiste, borrar la carpeta y dejar que la app la recree:
```powershell
rmdir /s "$env:USERPROFILE\Documents\Ferreteria_Comprobantes"
```

---

## Better_sqlite3.node loaded incorrectly

**Causa:** El binario nativo de `better-sqlite3` no es compatible con tu Windows/Electron.

**Solución (para desarrollador):**
```powershell
# Recompilar el binario para la versión actual de Electron
npm run rebuild

# O reinstalar desde cero
rm -rf node_modules
npm install
```

---

## Mi backup no restaura correctamente

Usar DB Browser for SQLite para verificar si el backup es válido:
```powershell
# Abrir el backup en DB Browser (gratis)
# File → Open Database → seleccionar tu archivo .db
# Si abre sin error → backup válido
# Si da error "malformed" → backup corrupto, usar uno más antiguo
```

---

## Al actualizar perdí mis datos

**No debería pasar.** La base de datos (`%APPDATA%\ferreteria_data\`) no se toca durante la instalación. Si pasó:

1. Cerrar la app inmediatamente (no generar más datos)
2. Ir a `%APPDATA%\ferreteria_data\`
3. ¿Existe `ferreteria.db.bak` o `ferreteria.db-wal` o `ferreteria.db-shm`?
4. Si sí: la DB se cerró abruptamente y SQLite tiene datos en WAL sin consolidar. Abrir con DB Browser (lee WAL automáticamente)
5. Si no: buscar backups en `Documentos\Backups\`
6. Si nada funciona: los datos se perdieron. Restaurar desde el último backup manual

---

## La app no se instala / Windows SmartScreen bloquea

1. Clic derecho en el `.exe` → **Propiedades**
2. Pestaña **General** → **Desbloquear** (si aparece)
3. Clic en **Aplicar** → **Aceptar**
4. Ejecutar de nuevo

Si SmartScreen sigue mostrando advertencia: clic en **"Más información"** → **"Ejecutar de todos modos"**.

---

*Documento mantenido para el equipo de operaciones y soporte.*
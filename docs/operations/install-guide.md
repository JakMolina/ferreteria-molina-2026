# Guía de Instalación - Ferretería Molina v1.2.0

## Requisitos del Sistema

| Componente | Mínimo | Recomendado |
|------------|--------|-------------|
| Sistema Operativo | Windows 10 (64-bit) | Windows 10/11 (64-bit) |
| Memoria RAM | 4 GB | 8 GB |
| Espacio en disco | 500 MB (aplicación) + 100 MB (datos) | 1 GB |
| Permisos | Administrador (para instalar) | — |
| Dependencias | Ninguna externa (app auto-contenida) | — |

---

## Instalación

### Paso 1: Ejecutar el instalador

1. Descargar `Ferretería Molina Setup 1.2.0.exe` desde la fuente autorizada
2. Doble clic en el archivo
3. Si Windows SmartScreen aparece, hacer clic en **"Más información"** → **"Ejecutar de todos modos"**

### Paso 2: Asistente de instalación

1. Pantalla de bienvenida → clic en **"Siguiente"**
2. Seleccionar carpeta de instalación (por defecto: `C:\Program Files\Ferretería Molina`)
3. Crear accesos directos: escritorio y menú inicio (recomendado)
4. Clic en **"Instalar"**
5. Esperar a que termine
6. Clic en **"Finalizar"** (la app se abre automáticamente)

---

## Primera Ejecución

### Login inicial

| Campo | Valor |
|-------|-------|
| Usuario | `pedro_molina` |
| Contraseña | `pedro123` |

**Importante:** Cambiar la contraseña del gerente inmediatamente después del primer login.

### Qué sucede al iniciar

1. La base de datos se crea automáticamente en:  
   `%APPDATA%\ferreteria_data\ferreteria.db`
2. Se ejecuta la migración a schema v2 (roles, permisos, bcrypt, FKs)
3. Se crea el usuario `Pedro Molina` con todos los permisos
4. La pantalla de login aparece → ingresar credenciales

---

## Rutas del Sistema

| Descripción | Ruta |
|-------------|------|
| Instalación | `C:\Program Files\Ferretería Molina` |
| Base de datos | `%APPDATA%\ferreteria_data\ferreteria.db` |
| Logs | `%APPDATA%\ferreteria-molina-manager\logs\` |
| Comprobantes PDF | `Documentos\Ferreteria_Comprobantes\` |
| Backup manual | Elegido por el usuario al guardar |

---

## Configuración Inicial Recomendada

Al iniciar como Pedro_molina:

1. **Configuración (⚙)** → llenar datos de facturación:
   - Nombre empresa: "Ferretería Molina"
   - RUC: (11 dígitos)
   - Dirección fiscal
   - Teléfono
   - Mensaje ticket

2. **Seguridad:**
   - Ir a **Usuarios** → crear usuarios para cada empleado (cajero, supervisor)
   - Ir a **🔑 Roles** → crear roles personalizados si es necesario
   - Ir a **Configuración** → descargar **backup** de seguridad

3. **Productos:**
   - Agregar productos (código, nombre, precio, stock, proveedor)
   - Los productos se buscan por nombre, categoría o descripción

---

## Actualización de Versión

| Paso | Acción |
|------|--------|
| 1 | Cerrar la aplicación completamente |
| 2 | Ejecutar `Ferretería Molina Setup X.Y.Z.exe` |
| 3 | El instalador detecta la versión actual y actualiza |
| 4 | `%APPDATA%\ferreteria_data\ferreteria.dat` se **preserva** (datos intactos) |
| 5 | Al abrir, la app ejecuta migraciones pendientes automáticamente |

---

## Desinstalación

| Paso | Acción |
|------|--------|
| 1 | Cerrar la aplicación |
| 2 | Panel de control → **"Desinstalar un programa"** |
| 3 | Buscar **"Ferretería Molina"** → clic derecho → **"Desinstalar"** |
| 4 | Seguir el asistente |
| 5 | **Opcional:** borrar datos manualmente:  
|    | `del %APPDATA%\ferreteria_data\*`  
|    | (o conservar para reinstalación futura) |

---

## Verificar que funciona

1. Abrir la app → login con `pedro_molina / pedro123`
2. Dashboard muestra estadísticas (vacías al inicio)
3. Crear un producto → aparece en lista de productos
4. Crear una venta → aparece en ventas del día
5. Anular una venta → el stock se devuelve

---

*Documento mantenido para el equipo de operaciones y soporte.*
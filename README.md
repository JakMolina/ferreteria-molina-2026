# Ferretería Molina - Sistema de Gestión Empresarial (POS)

Sistema de escritorio avanzado para la gestión integral de inventario, facturación y control de acceso, diseñado con una arquitectura modular y segura.

## Características Principales

* **Control de Acceso Estricto (RBAC):** Sistema de roles (Gerente, Administrador, Cajero) con protección de rutas, permisos escalonados y middleware de validación.
* **Gestión de Inventario:** Control de productos, alertas de stock mínimo automático y directorio de proveedores.
* **Punto de Venta (POS):** Módulo de ventas optimizado con cálculo de totales y generación de tickets.
* **Dashboard Analítico:** Visualización de métricas clave, gráficos de tendencias de ventas y alertas operativas en tiempo real.
* **Seguridad de Datos:** Auto-sanador de base de datos, protección contra eliminación de cuentas maestras y utilidades de backup.

## Stack Tecnológico

* **Frontend:** HTML5, CSS3, Vanilla JavaScript (DOM Manipulation, Chart.js)
* **Backend / Core:** Node.js, Electron.js
* **Base de Datos:** SQLite3 (vía `better-sqlite3` con modo WAL activado para alta concurrencia)
* **Seguridad:** Comunicación estricta IPC (Inter-Process Communication) aislando el contexto web (`contextBridge`).

## Arquitectura del Proyecto

El proyecto sigue un patrón de diseño modular separando responsabilidades:
* `/main`: Proceso principal de Electron, Controladores, Repositorios y Servicios.
* `/renderer`: Interfaces gráficas organizadas por módulos (Ventas, Productos, Usuarios).
* `/preload`: Puente seguro entre el sistema operativo y la interfaz gráfica.

## Instalación y Uso Local

Para ejecutar este proyecto en un entorno de desarrollo:

1. Clona el repositorio:
   \`\`\`bash
   git clone https://github.com/TU_USUARIO/ferreteria_molina_2026.git
   \`\`\`
2. Instala las dependencias:
   \`\`\`bash
   npm install
   \`\`\`
3. Compila los binarios nativos de SQLite:
   \`\`\`bash
   npm run rebuild
   \`\`\`
4. Inicia la aplicación en modo desarrollo:
   \`\`\`bash
   npm run dev
   \`\`\`

## Compilación para Producción

Para generar el instalador final (`.exe`, AppImage, etc.):

\`\`\`bash
npm run dist
\`\`\`

---
**Desarrollado por:** Jak Steve Molina Campos  
*Universidad Nacional de Cajamarca (UNC) - Ingeniería de Sistemas* *Cajamarca, Perú*
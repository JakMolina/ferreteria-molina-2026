# ADR 003: Hash de Contraseñas con bcryptjs

## Contexto

El sistema original almacenaba contraseñas en texto plano en la columna `users.password`. Cualquier persona con acceso al archivo `.db` podía leer todas las credenciales.

## Decisión

Usar **bcrypt** vía `bcryptjs` (implementación JS pura) con 10 rounds de salt para el hash de contraseñas.

## Alternativas consideradas

| Alternativa | Pros | Contras |
|-------------|------|---------|
| **bcryptjs (JS puro)** | Sin binarios nativos, funciona en cualquier plataforma, compatible con Electron sin rebuild extra | Más lento que bcrypt nativo (~2x), pero insignificante para login (1-2 operaciones) |
| bcrypt (C++) | Más rápido | Requiere compilación nativa por plataforma, posible conflicto con electron-builder |
| argon2 | Más moderno (ganador Password Hashing Competition) | Binario nativo, overkill para app monousuario |
| SHA-256 casero | Sin dependencias | Sin sal, vulnerable a rainbow tables, no es bcrypt |
| Seguir con texto plano | Sin cambios | Inaceptable para cualquier sistema profesional |

## Consecuencias

**Positivas:**
- Estándar industria para hashing de contraseñas
- Sal automática (incluida en el hash): dos usuarios con misma contraseña tienen hashes diferentes
- Resistente a fuerza bruta por diseño (10 rounds ≈ 100ms en hardware moderno)
- Sin binarios nativos → mismo código en Windows/Linux/Mac

**Negativas:**
- Migración obligatoria: contraseñas existentes deben re-hashearse
- `bcrypt.compareSync()` es bloqueante (sincrónico) pero login es operación de baja frecuencia

**Mitigaciones:**
- Migración V2 hashea automáticamente contraseñas existentes
- Nuevo usuario `pedro_molina` ya se crea con bcrypt
- El hash se almacena en columna `password_hash` (renombrada de `password`)
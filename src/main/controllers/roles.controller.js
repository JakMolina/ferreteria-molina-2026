const { db } = require('../db');

const getRoles = () => {
    return db.prepare(
        'SELECT r.id, r.name, r.description, r.is_protected, r.created_at, ' +
        '(SELECT COUNT(*) FROM users u WHERE u.role_id = r.id) as user_count ' +
        'FROM roles r ORDER BY r.is_protected DESC, r.id ASC'
    ).all();
};

const getRoleById = (id) => {
    const role = db.prepare('SELECT * FROM roles WHERE id = ?').get(id);
    if (!role) return null;

    const permissions = db.prepare(
        'SELECT p.id, p.codename, p.description, p.module ' +
        'FROM role_permissions rp JOIN permissions p ON rp.permission_id = p.id ' +
        'WHERE rp.role_id = ? ORDER BY p.module, p.codename'
    ).all(id);

    return { ...role, permissions };
};

const createRole = (data) => {
    if (!data.name || data.name.trim() === '') {
        throw new Error('El nombre del rol es obligatorio.');
    }

    const result = db.prepare(
        'INSERT INTO roles (name, description, is_protected) VALUES (@name, @description, 0)'
    ).run({
        name: data.name.trim(),
        description: data.description || ''
    });

    const newRoleId = result.lastInsertRowid;

    if (data.permissions && Array.isArray(data.permissions)) {
        const insertRP = db.prepare(
            'INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)'
        );
        for (const permId of data.permissions) {
            insertRP.run(newRoleId, permId);
        }
    }

    return { id: newRoleId, name: data.name };
};

const updateRole = (id, data) => {
    const role = db.prepare('SELECT is_protected FROM roles WHERE id = ?').get(id);
    if (!role) throw new Error('Rol no encontrado.');

    if (role.is_protected && data.name) {
        throw new Error('No se puede renombrar un rol protegido.');
    }

    if (data.name) {
        db.prepare('UPDATE roles SET name = @name, description = @description WHERE id = @id').run({
            name: data.name.trim(),
            description: data.description || '',
            id
        });
    } else if (data.description !== undefined) {
        db.prepare('UPDATE roles SET description = @description WHERE id = @id').run({
            description: data.description,
            id
        });
    }

    if (data.permissions && Array.isArray(data.permissions)) {
        db.prepare('DELETE FROM role_permissions WHERE role_id = ?').run(id);
        const insertRP = db.prepare(
            'INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)'
        );
        for (const permId of data.permissions) {
            insertRP.run(id, permId);
        }
    }

    return { success: true };
};

const deleteRole = (id) => {
    const role = db.prepare('SELECT is_protected FROM roles WHERE id = ?').get(id);
    if (!role) throw new Error('Rol no encontrado.');

    if (role.is_protected) {
        throw new Error('No se puede eliminar un rol protegido.');
    }

    const userCount = db.prepare(
        'SELECT COUNT(*) as c FROM users WHERE role_id = ?'
    ).get(id).c;

    if (userCount > 0) {
        throw new Error(`No se puede eliminar: hay ${userCount} usuario(s) con este rol.`);
    }

    db.prepare('DELETE FROM roles WHERE id = ?').run(id);
    return { success: true };
};

const getPermissionsCatalog = () => {
    return db.prepare(
        'SELECT id, codename, description, module FROM permissions ORDER BY module, codename'
    ).all();
};

module.exports = { getRoles, getRoleById, createRole, updateRole, deleteRole, getPermissionsCatalog };
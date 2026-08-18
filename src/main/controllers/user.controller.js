const { db } = require('../db');
const bcrypt = require('bcryptjs');

const getUsers = () => {
    return db.prepare(
        'SELECT u.id, u.username, u.fullname, u.role_id, r.name as role_name, r.is_protected ' +
        'FROM users u JOIN roles r ON u.role_id = r.id ORDER BY u.id'
    ).all();
};

const createUser = (data) => {
    const roleId = resolveRoleId(data);

    const passwordHash = data.password
        ? bcrypt.hashSync(data.password, 10)
        : bcrypt.hashSync('cambiame123', 10);

    return db.prepare(
        'INSERT INTO users (username, password_hash, fullname, role_id) VALUES (@username, @password_hash, @fullname, @role_id)'
    ).run({
        username: data.username,
        password_hash: passwordHash,
        fullname: data.fullname,
        role_id: roleId
    });
};

const updateUser = (id, data) => {
    const roleId = resolveRoleId(data);

    const user = db.prepare(
        'SELECT u.id, r.is_protected FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?'
    ).get(id);

    if (user && user.is_protected) {
        throw new Error('No se puede modificar un usuario con rol protegido.');
    }

    if (data.password) {
        const passwordHash = bcrypt.hashSync(data.password, 10);
        return db.prepare(
            'UPDATE users SET username=@username, password_hash=@password_hash, fullname=@fullname, role_id=@role_id, updated_at=datetime(\'now\',\'localtime\') WHERE id=@id'
        ).run({ username: data.username, password_hash: passwordHash, fullname: data.fullname, role_id: roleId, id });
    } else {
        return db.prepare(
            'UPDATE users SET username=@username, fullname=@fullname, role_id=@role_id, updated_at=datetime(\'now\',\'localtime\') WHERE id=@id'
        ).run({ username: data.username, fullname: data.fullname, role_id: roleId, id });
    }
};

const deleteUser = (id) => {
    const user = db.prepare(
        'SELECT u.id, u.username, r.is_protected FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?'
    ).get(id);

    if (!user) throw new Error('Usuario no encontrado.');

    if (user.is_protected) {
        throw new Error('No se puede eliminar un usuario con rol protegido.');
    }

    return db.prepare('DELETE FROM users WHERE id = ?').run(id);
};

function resolveRoleId(data) {
    if (data.role_id !== undefined && data.role_id !== null) {
        return data.role_id;
    }

    if (data.role !== undefined && data.role !== null) {
        const role = db.prepare('SELECT id FROM roles WHERE name = ?').get(data.role);
        if (role) return role.id;
        return 2;
    }

    return 2;
}

module.exports = { getUsers, createUser, updateUser, deleteUser };
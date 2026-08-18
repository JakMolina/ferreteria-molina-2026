const { db } = require('../db');
const bcrypt = require('bcryptjs');

const login = ({ username, password }) => {
    const user = db.prepare(
        'SELECT u.id, u.username, u.password_hash, u.fullname, u.role_id, u.is_active, r.name as role_name, r.is_protected ' +
        'FROM users u JOIN roles r ON u.role_id = r.id WHERE u.username = ?'
    ).get(username);

    if (!user) {
        return { success: false, error: "Usuario o contraseña incorrectos" };
    }

    if (!user.is_active) {
        return { success: false, error: "Usuario desactivado. Contacte al administrador." };
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
        return { success: false, error: "Usuario o contraseña incorrectos" };
    }

    const permissions = db.prepare(
        'SELECT p.codename FROM role_permissions rp ' +
        'JOIN permissions p ON rp.permission_id = p.id WHERE rp.role_id = ?'
    ).all(user.role_id).map(p => p.codename);

    db.prepare('UPDATE users SET last_login = datetime(\'now\',\'localtime\') WHERE id = ?').run(user.id);

    return {
        success: true,
        user: {
            id: user.id,
            name: user.fullname,
            username: user.username,
            role: user.role_name,
            role_id: user.role_id,
            role_name: user.role_name,
            is_protected: user.is_protected === 1,
            permissions: permissions
        }
    };
};

module.exports = { login };
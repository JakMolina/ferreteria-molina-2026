const { db } = require('../db');

const login = ({ username, password }) => {
    const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);
    
    if (user) {
        return { success: true, user: { id: user.id, name: user.fullname, role: user.role } };
    }
    return { success: false, error: "Usuario o contraseña incorrectos" };
};

module.exports = { login };
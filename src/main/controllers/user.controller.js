const { db } = require('../db');

const getUsers = () => {
    return db.prepare('SELECT id, username, fullname, role FROM users').all();
};

const createUser = (data) => {
    const sql = 'INSERT INTO users (username, password, fullname, role) VALUES (@username, @password, @fullname, @role)';
    return db.prepare(sql).run(data);
};

const updateUser = (id, data) => {
    if (data.password) {
        const sql = 'UPDATE users SET username=@username, password=@password, fullname=@fullname, role=@role WHERE id=@id';
        return db.prepare(sql).run({ ...data, id });
    } else {
        const sql = 'UPDATE users SET username=@username, fullname=@fullname, role=@role WHERE id=@id';
        return db.prepare(sql).run({ 
            username: data.username, fullname: data.fullname, role: data.role, id 
        });
    }
};

const deleteUser = (id) => {
    return db.prepare('DELETE FROM users WHERE id = ?').run(id);
};

module.exports = { getUsers, createUser, updateUser, deleteUser };
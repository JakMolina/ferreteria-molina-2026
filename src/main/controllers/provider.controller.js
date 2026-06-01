const { db } = require('../db');

const getProviders = () => {
    return db.prepare('SELECT * FROM providers ORDER BY name ASC').all();
};

const createProvider = (data) => {
    const sql = 'INSERT INTO providers (name, phone, email, address) VALUES (@name, @phone, @email, @address)';
    return db.prepare(sql).run(data);
};

const updateProvider = (id, data) => {
    const sql = 'UPDATE providers SET name=@name, phone=@phone, email=@email, address=@address WHERE id=@id';
    return db.prepare(sql).run({ ...data, id });
};

const getProviderById = (id) => {
    return db.prepare('SELECT * FROM providers WHERE id = ?').get(id);
};

const deleteProvider = (id) => {
    return db.prepare('DELETE FROM providers WHERE id = ?').run(id);
};

module.exports = { getProviders, createProvider, updateProvider, getProviderById, deleteProvider };
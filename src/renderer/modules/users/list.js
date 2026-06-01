document.addEventListener("DOMContentLoaded", loadUsers);

async function loadUsers() {
    const tbody = document.getElementById("usersBody");
    const loader = document.getElementById("loading");

    try {
        if(loader) loader.style.display = "block";
        
        // API NUEVA
        const users = await window.api.users.list();
        
        if(loader) loader.style.display = "none";
        tbody.innerHTML = "";

        if (!users.length) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding:20px;">No hay usuarios.</td></tr>`;
            return;
        }

        users.forEach(u => {
            const roleBadge = u.role === 'admin' 
                ? `<span class="badge badge-danger">Administrador</span>` 
                : `<span class="badge badge-neutral">Cajero</span>`;

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="text-muted">#${u.id}</td>
                <td style="font-weight:600;">${u.fullname || '-'}</td>
                <td>${u.username}</td>
                <td>${roleBadge}</td>
                <td class="text-right">
                    <button onclick="editUser(${u.id})" class="btn-icon edit" title="Editar">✏️</button>
                    ${u.username !== 'admin' ? `<button onclick="deleteUser(${u.id}, '${u.username}')" class="btn-icon delete" title="Eliminar">🗑️</button>` : ''}
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error(err);
        if(loader) loader.textContent = "Error al cargar usuarios.";
    }
}

// Funciones globales
window.editUser = (id) => {
    window.location.href = `form.html?id=${id}`;
};

window.deleteUser = async (id, username) => {
    const currentUser = JSON.parse(sessionStorage.getItem('user'));
    if (currentUser && currentUser.id == id) {
        return window.api.dialog.alert("No puedes eliminar tu propio usuario.", "warning");
    }

    const confirmed = await window.api.dialog.confirm(`¿Seguro que deseas eliminar el acceso a: ${username}?`);
    if (!confirmed) return;

    try {
        await window.api.users.delete(id);
        await window.api.dialog.alert("Usuario eliminado correctamente.", "info");
        loadUsers();
    } catch (err) {
        console.error(err);
        await window.api.dialog.alert("Error: " + err.message, "error");
    }
};
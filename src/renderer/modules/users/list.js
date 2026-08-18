document.addEventListener("DOMContentLoaded", () => {
    const userPermissions = JSON.parse(sessionStorage.getItem('permissions')) || [];
    const btnRoles = document.getElementById('btnRoles');
    const menuRoles = document.getElementById('menuRoles');
    if (!userPermissions.includes('roles.manage')) {
        if (btnRoles) btnRoles.style.display = 'none';
        if (menuRoles) menuRoles.style.display = 'none';
    }
    loadUsers();
});

async function loadUsers() {
    const tbody = document.getElementById("usersBody");
    const loader = document.getElementById("loading");
    const userSession = JSON.parse(sessionStorage.getItem('user')) || {};

    try {
        if(loader) loader.style.display = "block";

        const users = await window.api.users.list(userSession.id || 0);

        if(loader) loader.style.display = "none";
        tbody.innerHTML = "";

        if (!users.length) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding:20px;">No hay usuarios.</td></tr>`;
            return;
        }

        users.forEach(u => {
            const roleName = u.role_name || 'Sin rol';
            let badgeClass = 'badge-neutral';
            if (u.is_protected) badgeClass = 'badge-danger';
            else if (u.role_id === 2) badgeClass = 'badge-neutral';
            else badgeClass = 'badge-success';

            const roleBadge = `<span class="badge ${badgeClass}">${roleName}</span>`;

            const deleteBtn = !u.is_protected
                ? `<button onclick="deleteUser(${u.id}, '${u.username.replace(/'/g, "\\'")}')" class="btn-icon delete" title="Eliminar">🗑️</button>`
                : '';

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="text-muted">#${u.id}</td>
                <td style="font-weight:600;">${u.fullname || '-'}</td>
                <td>${u.username}</td>
                <td>${roleBadge}</td>
                <td class="text-right">
                    <button onclick="editUser(${u.id})" class="btn-icon edit" title="Editar">✏️</button>
                    ${deleteBtn}
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error(err);
        if(loader) loader.textContent = "Error al cargar usuarios.";
    }
}

window.editUser = (id) => {
    window.location.href = `form.html?id=${id}`;
};

window.deleteUser = async (id, username) => {
    const userSession = JSON.parse(sessionStorage.getItem('user')) || {};
    if (userSession.id == id) {
        return window.api.dialog.alert("No puedes eliminar tu propio usuario.", "warning");
    }

    const confirmed = await window.api.dialog.confirm(`¿Seguro que deseas eliminar el acceso a: ${username}?`);
    if (!confirmed) return;

    try {
        await window.api.users.delete(id, userSession.id);
        await window.api.dialog.alert("Usuario eliminado correctamente.", "info");
        loadUsers();
    } catch (err) {
        console.error(err);
        await window.api.dialog.alert("Error: " + err.message, "error");
    }
};
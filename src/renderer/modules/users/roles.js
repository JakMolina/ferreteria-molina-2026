const userSession = JSON.parse(sessionStorage.getItem('user')) || {};
let allPermissionsCatalog = [];
let editingRoleId = null;

document.addEventListener("DOMContentLoaded", async () => {
    const userPermissions = JSON.parse(sessionStorage.getItem('permissions')) || [];

    if (!userPermissions.includes('roles.manage')) {
        document.getElementById('rolesContainer').innerHTML =
            '<div class="card text-center text-muted" style="padding:40px;">⛔ No tienes permisos para gestionar roles.</div>';
        const btn = document.getElementById('btnNewRole');
        if (btn) btn.style.display = 'none';
        return;
    }

    await loadRoles();
    await loadPermissionsCatalog();
});

async function loadRoles() {
    const container = document.getElementById('rolesContainer');
    try {
        const roles = await window.api.roles.list();

        if (!roles || roles.length === 0) {
            container.innerHTML = '<div class="text-center text-muted" style="padding:40px;">No hay roles definidos.</div>';
            return;
        }

        container.innerHTML = '';
        for (const role of roles) {
            const card = document.createElement('div');
            card.className = 'role-card';

            const userLabel = role.user_count === 0
                ? 'Sin usuarios'
                : `${role.user_count} usuario${role.user_count > 1 ? 's' : ''}`;

            const protectedBadge = role.is_protected
                ? '<span class="badge badge-danger" style="margin-left:8px;">Protegido</span>'
                : '';

            const actions = role.is_protected
                ? '<button class="btn btn-ghost" onclick="previewRole(' + role.id + ')" title="Ver permisos">👁 Ver</button>'
                : '<button class="btn btn-ghost" onclick="openRoleModal(' + role.id + ')" title="Editar">✏️ Editar</button>' +
                  '<button class="btn btn-ghost" style="color:#dc2626;" onclick="confirmDeleteRole(' + role.id + ',\'' + role.name.replace(/'/g, "\\'") + '\')" title="Eliminar">🗑️</button>';

            card.innerHTML = `
                <div class="role-header">
                    <div>
                        <span class="role-name">${role.name}</span>${protectedBadge}
                        <div class="role-count">${userLabel}</div>
                    </div>
                    <div>${actions}</div>
                </div>
                <p style="color:var(--text-muted); font-size:0.9rem; margin:0;">${role.description || 'Sin descripción'}</p>
            `;
            container.appendChild(card);
        }

    } catch (err) {
        console.error("Error cargando roles:", err);
        container.innerHTML = '<div class="text-center text-muted" style="padding:40px;">Error al cargar roles.</div>';
    }
}

async function loadPermissionsCatalog() {
    try {
        allPermissionsCatalog = await window.api.roles.getPermissionsCatalog(userSession.id);
    } catch (err) {
        console.error("Error cargando catálogo de permisos:", err);
        allPermissionsCatalog = [];
    }
}

function renderPermissionsCheckboxes(selectedIds = []) {
    const container = document.getElementById('permsCheckboxes');
    if (!allPermissionsCatalog.length) {
        container.innerHTML = '<p class="text-muted">No se pudo cargar el catálogo de permisos.</p>';
        return;
    }

    const byModule = {};
    for (const p of allPermissionsCatalog) {
        if (!byModule[p.module]) byModule[p.module] = [];
        byModule[p.module].push(p);
    }

    let html = '';
    for (const [module, perms] of Object.entries(byModule)) {
        html += `<div class="perm-module-title">📁 ${module.toUpperCase()}</div>`;
        for (const p of perms) {
            const checked = selectedIds.includes(p.id) ? 'checked' : '';
            const disabledAttr = editingRoleId && selectedIds.length > 0 && p.codename === 'roles.manage' ? '' : '';
            html += `
                <label class="perm-item">
                    <input type="checkbox" name="perm" value="${p.id}" ${checked} ${disabledAttr}>
                    <span>${p.description} <small style="color:var(--text-muted)">(${p.codename})</small></span>
                </label>`;
        }
    }
    container.innerHTML = html;
}

async function openRoleModal(roleId = null) {
    editingRoleId = roleId;
    const modal = document.getElementById('roleModal');
    const title = document.getElementById('modalTitle');
    const nameInput = document.getElementById('roleNameInput');
    const descInput = document.getElementById('roleDescInput');
    const btnSave = document.getElementById('btnSaveRole');

    document.getElementById('roleForm').reset();

    if (roleId) {
        title.textContent = 'Editar Rol';
        btnSave.textContent = 'Actualizar Rol';
        try {
            const role = await window.api.roles.getById(roleId, userSession.id);
            if (!role) throw new Error('Rol no encontrado');

            nameInput.value = role.name;
            descInput.value = role.description || '';

            if (role.is_protected) {
                nameInput.disabled = true;
                nameInput.title = 'No se puede renombrar un rol protegido.';
            }

            const selectedPermIds = role.permissions ? role.permissions.map(p => p.id) : [];
            renderPermissionsCheckboxes(selectedPermIds);
        } catch (err) {
            await window.api.dialog.alert("Error cargando rol: " + err.message, "error");
            return;
        }
    } else {
        title.textContent = 'Nuevo Rol';
        btnSave.textContent = 'Guardar Rol';
        nameInput.disabled = false;
        renderPermissionsCheckboxes([]);
    }

    modal.classList.add('active');
}

function closeRoleModal() {
    document.getElementById('roleModal').classList.remove('active');
    editingRoleId = null;
}

async function previewRole(roleId) {
    try {
        const role = await window.api.roles.getById(roleId, userSession.id);
        if (!role) return;

        const permsList = role.permissions
            ? role.permissions.map(p => `• ${p.description}`).join('<br>')
            : 'Sin permisos asignados.';

        await window.api.dialog.alert(
            `🔑 Rol: ${role.name}\n📝 ${role.description || 'Sin descripción'}\n\nPermisos:\n${permsList}`,
            'info'
        );
    } catch (err) {
        console.error(err);
    }
}

document.getElementById('roleForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnSave = document.getElementById('btnSaveRole');

    const name = document.getElementById('roleNameInput').value.trim();
    const description = document.getElementById('roleDescInput').value.trim();

    if (!name) return;

    const checkedPerms = Array.from(
        document.querySelectorAll('#permsCheckboxes input[name="perm"]:checked')
    ).map(cb => parseInt(cb.value));

    btnSave.disabled = true;
    btnSave.textContent = editingRoleId ? 'Actualizando...' : 'Guardando...';

    try {
        if (editingRoleId) {
            await window.api.roles.update(editingRoleId, {
                name,
                description,
                permissions: checkedPerms
            }, userSession.id);
            await window.api.dialog.alert("✅ Rol actualizado correctamente.", "info");
        } else {
            await window.api.roles.create({
                name,
                description,
                permissions: checkedPerms,
                userId: userSession.id
            });
            await window.api.dialog.alert("✅ Rol creado exitosamente.", "info");
        }

        closeRoleModal();
        await loadRoles();
    } catch (err) {
        console.error(err);
        await window.api.dialog.alert("Error: " + err.message, "error");
    } finally {
        btnSave.disabled = false;
        btnSave.textContent = editingRoleId ? 'Actualizar Rol' : 'Guardar Rol';
    }
});

window.confirmDeleteRole = async (roleId, roleName) => {
    const confirmed = await window.api.dialog.confirm(
        `¿Eliminar el rol "${roleName}"?\n\nSolo se puede eliminar si ningún usuario lo tiene asignado.`
    );
    if (!confirmed) return;

    try {
        await window.api.roles.delete(roleId, userSession.id);
        await window.api.dialog.alert("✅ Rol eliminado.", "info");
        await loadRoles();
    } catch (err) {
        console.error(err);
        await window.api.dialog.alert("Error: " + err.message, "error");
    }
};
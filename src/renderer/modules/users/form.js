document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const userSession = JSON.parse(sessionStorage.getItem('user')) || {};

    const form = document.getElementById("userForm");
    const btn = document.getElementById("btnSave");
    const title = document.getElementById("pageTitle");
    const pwdHelp = document.getElementById("pwdHelp");
    const passwordInput = document.getElementById("password");
    const usernameInput = document.getElementById("username");
    const roleSelect = document.getElementById("role");

    await loadRoles();

    let isEdit = false;
    if (id) {
        isEdit = true;
        if(title) title.textContent = "Editar Usuario";
        btn.textContent = "Actualizar Acceso";

        if(pwdHelp) {
            pwdHelp.style.display = "block";
            pwdHelp.classList.remove("hidden");
        }
        passwordInput.required = false;

        await loadUserData(id);
    } else {
        passwordInput.required = true;
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const username = usernameInput.value.trim();
        const fullname = document.getElementById("fullname").value.trim();
        const password = passwordInput.value;
        const roleId = parseInt(roleSelect.value);

        if (!username || !fullname) return;
        if (!roleId) return window.api.dialog.alert("Selecciona un rol.", "warning");

        if (!isEdit && password.length < 4) {
            return window.api.dialog.alert("La contraseña debe tener al menos 4 caracteres.", "warning");
        }
        if (isEdit && password.length > 0 && password.length < 4) {
            return window.api.dialog.alert("La nueva contraseña es muy corta.", "warning");
        }

        btn.disabled = true;
        btn.textContent = "Procesando...";

        const data = {
            fullname: fullname,
            username: username,
            role_id: roleId,
            password: password || null,
            userId: userSession.id
        };

        try {
            if (isEdit) {
                await window.api.users.update(id, data, userSession.id);
                await window.api.dialog.alert("✅ Usuario actualizado", "info");
            } else {
                await window.api.users.create(data);
                await window.api.dialog.alert("✅ Usuario creado exitosamente", "info");
            }
            window.location.href = "list.html";
        } catch (err) {
            console.error(err);
            if (err.message.includes("UNIQUE constraint")) {
                await window.api.dialog.alert("El nombre de usuario ya existe.", "warning");
            } else {
                await window.api.dialog.alert("Error: " + err.message, "error");
            }
            btn.disabled = false;
            btn.textContent = isEdit ? "Actualizar Acceso" : "Guardar";
        }
    });
});

async function loadRoles() {
    const roleSelect = document.getElementById("role");
    try {
        const roles = await window.api.roles.list();

        if (!roles || roles.length === 0) {
            roleSelect.innerHTML = '<option value="">No hay roles disponibles</option>';
            return;
        }

        roleSelect.innerHTML = '<option value="">Selecciona un rol</option>';
        for (const role of roles) {
            const label = role.is_protected ? `${role.name} (protegido)` : role.name;
            roleSelect.innerHTML += `<option value="${role.id}">${label}</option>`;
        }
    } catch (err) {
        console.error("Error cargando roles:", err);
        roleSelect.innerHTML = '<option value="">Error al cargar roles</option>';
    }
}

async function loadUserData(id) {
    try {
        const users = await window.api.users.list(userSession.id);
        const user = users.find(u => u.id == id);

        if (!user) {
            await window.api.dialog.alert("Usuario no encontrado", "error");
            window.location.href = "list.html";
            return;
        }

        document.getElementById("fullname").value = user.fullname || "";
        document.getElementById("username").value = user.username;
        document.getElementById("role").value = user.role_id;

        if (user.is_protected) {
            document.getElementById("username").disabled = true;
            document.getElementById("role").disabled = true;
        }

    } catch (err) {
        console.error(err);
        await window.api.dialog.alert("Error cargando datos", "error");
    }
}
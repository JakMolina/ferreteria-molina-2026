document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    const form = document.getElementById("providerForm");
    const btn = document.getElementById("saveBtn");
    const title = document.getElementById("formTitle");

    if (id) {
        if(title) title.textContent = "Editar Proveedor";
        btn.textContent = "Guardar Cambios";
        await loadProviderData(id);
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const nameInput = document.getElementById("name");
        if (!nameInput.value.trim()) {
            return window.api.dialog.alert("El nombre es obligatorio", "warning");
        }

        btn.disabled = true;
        btn.textContent = "Guardando...";

        const data = {
            name: nameInput.value.trim(),
            phone: document.getElementById("phone").value.trim(),
            email: document.getElementById("email").value.trim(),
            address: document.getElementById("address").value.trim(),
        };

        try {
            if (id) {
                await window.api.providers.update(id, data);
                await window.api.dialog.alert("✅ Proveedor actualizado", "info");
            } else {
                await window.api.providers.create(data);
                await window.api.dialog.alert("✅ Proveedor creado", "info");
            }
            window.location.href = "list.html";

        } catch (err) {
            console.error(err);
            await window.api.dialog.alert("Error: " + err.message, "error");
            btn.disabled = false;
            btn.textContent = id ? "Guardar Cambios" : "Guardar";
        }
    });
});

async function loadProviderData(id) {
    try {
        const p = await window.api.providers.getById(id);
        if (!p) {
            await window.api.dialog.alert("Proveedor no encontrado", "error");
            window.location.href = "list.html";
            return;
        }
        document.getElementById("name").value = p.name || "";
        document.getElementById("phone").value = p.phone || "";
        document.getElementById("email").value = p.email || "";
        document.getElementById("address").value = p.address || "";
    } catch (err) {
        console.error(err);
        await window.api.dialog.alert("Error cargando datos", "error");
    }
}
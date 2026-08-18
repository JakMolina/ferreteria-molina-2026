let allProviders = [];

document.addEventListener("DOMContentLoaded", async () => {
    await loadProviders();

    const searchInput = document.getElementById("searchProvider");
    if(searchInput) {
        searchInput.addEventListener("input", (e) => {
            const text = e.target.value.toLowerCase();
            const filtered = allProviders.filter(p => 
                p.name.toLowerCase().includes(text) || 
                (p.email && p.email.toLowerCase().includes(text))
            );
            renderTable(filtered);
        });
    }
});

async function loadProviders() {
    const loader = document.getElementById("loading");
    if(loader) loader.style.display = "block";
    
    try {
        const providers = await window.api.providers.list();
        allProviders = providers || [];
        
        if(loader) loader.style.display = "none";
        renderTable(allProviders);
    } catch (error) {
        console.error("Error providers:", error);
        if(loader) {
            loader.textContent = "Error al cargar proveedores.";
            loader.style.color = "var(--danger)";
        }
    }
}

function renderTable(list) {
    const tbody = document.querySelector("#tblProviders tbody");
    if(!tbody) return;
    tbody.innerHTML = "";

    if (!list || list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding:20px;">No hay proveedores registrados.</td></tr>`;
        return;
    }

    list.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="text-muted">#${p.id}</td>
            <td>
                <div style="font-weight:600; color:var(--text-main);">${p.name}</div>
                <small class="text-muted">${p.address || 'Sin dirección'}</small>
            </td>
            <td>${p.phone || '-'}</td>
            <td><a href="mailto:${p.email}" style="color:var(--primary); text-decoration:none;">${p.email || '-'}</a></td>
            <td class="text-right">
                <button onclick="editProvider(${p.id})" class="btn-icon edit" title="Editar">✏️</button>
                <button onclick="deleteProvider(${p.id})" class="btn-icon delete" title="Eliminar">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.editProvider = (id) => {
    window.location.href = `form.html?id=${id}`;
};

window.deleteProvider = async (id) => {
    const confirmed = await window.api.dialog.confirm("¿Eliminar este proveedor? Se perderá la asociación con sus productos.");
    if (!confirmed) return;

    try {
        await window.api.providers.delete(id);
        await window.api.dialog.alert("Proveedor eliminado correctamente.", "info");
        loadProviders();
    } catch (error) {
        console.error(error);
        if (error.message.includes("FOREIGN KEY")) {
            await window.api.dialog.alert("No se puede eliminar: Tiene productos asociados.", "warning");
        } else {
            await window.api.dialog.alert("Error al eliminar.", "error");
        }
    }
};
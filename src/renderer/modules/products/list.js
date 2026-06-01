let allProducts = [];

document.addEventListener("DOMContentLoaded", async () => {
    await loadProducts();

    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = allProducts.filter(p => 
                p.name.toLowerCase().includes(term) || 
                (p.category && p.category.toLowerCase().includes(term))
            );
            renderTable(filtered);
        });
    }
});

async function loadProducts() {
    const loader = document.getElementById("loading");
    if(loader) loader.style.display = "block";
    
    try {
        const products = await window.api.products.list();
        allProducts = products || [];
        
        if(loader) loader.style.display = "none";
        renderTable(allProducts);
        
    } catch (error) {
        console.error("Error cargando productos:", error);
        if(loader) {
            loader.textContent = "Error de conexión con la base de datos.";
            loader.style.color = "var(--danger)";
        }
    }
}

function renderTable(list) {
    const tbody = document.querySelector("#productsTable tbody");
    if(!tbody) return;
    
    tbody.innerHTML = "";

    if (!list.length) {
        tbody.innerHTML = `<tr><td colspan="10" class="text-center text-muted" style="padding:20px;">No hay productos registrados.</td></tr>`;
        return;
    }

    list.forEach(p => {
        const tr = document.createElement("tr");
        
        const cost = parseFloat(p.cost_price) || parseFloat(p.price) || 0;
        
        const p10 = (cost * 1.10).toFixed(2);
        const p20 = (cost * 1.20).toFixed(2);
        const p30 = (cost * 1.30).toFixed(2);
        const p40 = (cost * 1.40).toFixed(2);
        const p50 = (cost * 1.50).toFixed(2);

        let stockBadge = `<span class="badge badge-success">${p.stock} u.</span>`;
        if (p.stock <= p.min_stock) {
            stockBadge = `<span class="badge badge-danger">${p.stock} u.</span>`;
        }

        tr.innerHTML = `
            <td class="text-muted">#${p.id}</td>
            <td>
                <div style="font-weight:600; color:var(--text-main);">${p.name}</div>
                <small class="text-muted">${p.category || 'General'} • ${p.provider_name || 'Sin Proveedor'}</small>
            </td>
            <td style="font-weight:bold; color:#475569;">S/ ${cost.toFixed(2)}</td>
            
            <td class="col-price" style="color:#64748b;">${p10}</td>
            <td class="col-price" style="color:#64748b;">${p20}</td>
            <td class="col-price" style="color:var(--primary); font-weight:bold;">${p30}</td> <td class="col-price" style="color:#64748b;">${p40}</td>
            <td class="col-price" style="color:#16a34a; font-weight:bold;">${p50}</td>

            <td>${stockBadge}</td>
            
            <td class="text-right">
                <button onclick="editProduct(${p.id})" class="btn-icon edit" title="Editar">✏️</button>
                <button onclick="deleteProduct(${p.id})" class="btn-icon delete" title="Eliminar">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.editProduct = (id) => {
    window.location.href = `form.html?id=${id}`;
};

window.deleteProduct = async (id) => {
    const confirmed = await window.api.dialog.confirm("¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.");
    if (!confirmed) return;

    try {
        await window.api.products.delete(id);
        await window.api.dialog.alert("Producto eliminado correctamente.", "info");
        loadProducts();
    } catch (error) {
        console.error(error);
        await window.api.dialog.alert("No se pudo eliminar el producto.", "error");
    }
};
let allSales = [];

document.addEventListener("DOMContentLoaded", async () => {
    const today = new Date();
    const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    document.getElementById("monthFilter").value = monthStr;

    await loadSales();

    document.getElementById("btnFilter").addEventListener("click", applyFilter);
    document.getElementById("btnClear").addEventListener("click", () => {
        document.getElementById("monthFilter").value = "";
        renderTable(allSales);
    });
});

async function loadSales() {
    const loader = document.getElementById("loading");
    if(loader) loader.style.display = "block";

    try {
        const sales = await window.api.sale.history();
        allSales = sales || [];
        
        if(loader) loader.style.display = "none";
        applyFilter();
    } catch (e) {
        console.error(e);
        if(loader) loader.textContent = "Error al cargar historial.";
    }
}

function applyFilter() {
    const filterVal = document.getElementById("monthFilter").value;
    let filtered = allSales;
    
    if (filterVal) {
        filtered = allSales.filter(s => s.created_at && s.created_at.startsWith(filterVal));
    }
    renderTable(filtered);
}

function renderTable(list) {
    const tbody = document.getElementById("salesBody");
    const totalView = document.getElementById("totalView");
    tbody.innerHTML = "";

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding:20px;">No se encontraron ventas.</td></tr>`;
        totalView.textContent = "S/ 0.00";
        return;
    }

    const total = list.reduce((sum, s) => sum + s.total, 0);
    totalView.textContent = `S/ ${total.toFixed(2)}`;

    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    list.forEach(sale => {
        const dateObj = new Date(sale.created_at);
        const dateStr = dateObj.toLocaleDateString('es-PE');
        const timeStr = dateObj.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

        let clientName = "Público General";
        try {
            const clientData = JSON.parse(sale.client_json);
            if(clientData.name) clientName = clientData.name;
        } catch(e){}

        const itemCount = sale.items_count || "?"; 

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="text-muted"><strong>${sale.invoice_number || sale.id}</strong></td>
            <td>
                <div>${dateStr} <span class="text-muted text-sm">${timeStr}</span></div>
                <small class="text-primary">${clientName}</small>
            </td>
            <td>
                <span class="badge badge-neutral">👤 ${sale.username || 'Sistema'}</span>
            </td>
            <td style="font-weight:bold;">S/ ${sale.total.toFixed(2)}</td>
            <td class="text-right">
                <button onclick="deleteSale(${sale.id})" class="btn-icon delete" title="Anular Venta">🚫</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.deleteSale = async (id) => {
    const confirmed = await window.api.dialog.confirm(`¿Anular Venta #${id}? El stock será devuelto al inventario.`);
    if (!confirmed) return;

    try {
        await window.api.sale.delete(id);
        await window.api.dialog.alert("Venta anulada y stock restaurado.", "info");
        loadSales();
    } catch (e) {
        window.api.dialog.alert("Error: " + e.message, "error");
    }
};
document.addEventListener("DOMContentLoaded", async () => {
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const dateStr = new Date().toLocaleDateString('es-PE', options);
    const dateEl = document.getElementById("dateDisplay");
    if (dateEl) {
        dateEl.textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    }

    await loadDailySales();
});

window.loadDailySalesTable = loadDailySales;

async function loadDailySales() {
    const tbody = document.getElementById("dailyBody");
    const loader = document.getElementById("loading");
    const totalDisplay = document.getElementById("totalDay");

    const userSession = JSON.parse(sessionStorage.getItem('user')) || { role: 'cashier' };

    if (!tbody) return;

    try {
        if (loader) loader.style.display = "block";
        
        const sales = await window.api.sale.daily();
        
        if (loader) loader.style.display = "none";
        tbody.innerHTML = "";

        if (!sales || sales.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted" style="padding:30px;">
                No hay ventas hoy.<br>
                <small>Ve a <b>+ Nueva Venta</b> para comenzar.</small>
            </td></tr>`;
            if(totalDisplay) totalDisplay.textContent = "S/ 0.00";
            return;
        }

        const total = sales.reduce((sum, s) => sum + s.total, 0);
        if(totalDisplay) totalDisplay.textContent = `S/ ${total.toFixed(2)}`;

        sales.forEach(s => {
            const timeStr = new Date(s.created_at).toLocaleTimeString('es-PE', { 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: true 
            });
            
            const deleteButton = userSession.role === 'admin' 
                ? `<button onclick="deleteSale(${s.id})" class="btn-icon delete" title="Anular (Admin)">🗑️</button>` 
                : '';

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td class="text-muted">#${s.invoice_number || s.id}</td>
                <td class="font-bold">${timeStr}</td>
                <td style="max-width: 300px; font-size: 0.9em; color:#475569;">${s.products_summary || 'Varios'}</td>
                <td><span class="badge badge-neutral">${s.username || 'Sistema'}</span></td>
                <td style="font-weight:bold; color: var(--success);">S/ ${s.total.toFixed(2)}</td>
                <td class="text-right">
                    <button onclick="reprintSale(${s.id})" class="btn-icon" title="Reimprimir Boleta">🖨️</button>
                    ${deleteButton}
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error(error);
        if(loader) loader.textContent = "Error al cargar movimientos.";
    }
}

window.deleteSale = async (id) => {
    const confirmed = await window.api.dialog.confirm(`⚠️ ¿ESTÁS SEGURO?\n\nSe anulará la venta #${id} y el stock regresará al inventario.`);
    if (!confirmed) return;

    try {
        const result = await window.api.sale.delete(id);
        
        if (result.success) {
            await window.api.dialog.alert("✅ Venta anulada y stock restaurado.", "info");
            await loadDailySales(); // Recargar tabla
        } else {
            await window.api.dialog.alert("Error: " + result.error, "error");
        }
    } catch (e) {
        window.api.dialog.alert("Error de sistema: " + e.message, "error");
    }
};
window.reprintSale = async (id) => {
    try {
        const result = await window.api.sale.savePdf(id);
        if (result.success) {
            const open = await window.api.dialog.confirm(`📄 PDF generado.\n¿Abrir documento?`);
            if (open) await window.api.app.openFile(result.path);
        }
    } catch (error) {
        console.error("Error reimprimiendo:", error);
    }
};
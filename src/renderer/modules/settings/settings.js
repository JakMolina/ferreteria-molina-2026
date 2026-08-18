document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("settingsForm");
    const btnBackup = document.getElementById("btnBackup");

    await loadSettings();

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        await saveSettings();
    });

    btnBackup.addEventListener("click", async () => {
        await handleBackup();
    });
});

async function loadSettings() {
    try {
        // 🔥 CORRECCIÓN AQUÍ: Usamos getAll() tal como está en tu preload.js
        const settings = await window.api.settings.getAll();
        
        if (!settings) return;

        if (settings.companyName) document.getElementById("companyName").value = settings.companyName;
        if (settings.companyRuc) document.getElementById("companyRuc").value = settings.companyRuc;
        if (settings.companyAddress) document.getElementById("companyAddress").value = settings.companyAddress;
        if (settings.companyPhone) document.getElementById("companyPhone").value = settings.companyPhone;
        if (settings.ticketFooter) document.getElementById("ticketFooter").value = settings.ticketFooter;

    } catch (error) {
        console.error("Error al cargar la configuración:", error);
        window.api.dialog.alert("Error al cargar los ajustes del sistema.", "error");
    }
}

async function saveSettings() {
    const btnSave = document.getElementById("btnSave");
    const originalText = btnSave.textContent;

    try {
        btnSave.disabled = true;
        btnSave.textContent = "Guardando...";

        const data = {
            companyName: document.getElementById("companyName").value.trim(),
            companyRuc: document.getElementById("companyRuc").value.trim(),
            companyAddress: document.getElementById("companyAddress").value.trim(),
            companyPhone: document.getElementById("companyPhone").value.trim(),
            ticketFooter: document.getElementById("ticketFooter").value.trim()
        };

        if (data.companyRuc && data.companyRuc.length !== 11) {
            throw new Error("El RUC debe tener exactamente 11 dígitos.");
        }

        const result = await window.api.settings.save(data);

        if (result && result.success) {
            await window.api.dialog.alert("Configuración guardada correctamente.", "info");
        } else {
            throw new Error(result?.message || "Ocurrió un error al intentar guardar.");
        }

    } catch (error) {
        console.error("Error al guardar configuración:", error);
        await window.api.dialog.alert(error.message, "error");
    } finally {
        btnSave.disabled = false;
        btnSave.textContent = originalText;
    }
}

async function handleBackup() {
    const btnBackup = document.getElementById("btnBackup");
    const originalText = btnBackup.textContent;

    try {
        btnBackup.disabled = true;
        btnBackup.textContent = "Generando archivo...";

        const result = await window.api.settings.backup();

        if (result && result.cancelled) {
            console.log("Copia de seguridad cancelada por el usuario.");
        } else if (result && result.success) {
            await window.api.dialog.alert("✅ Copia de seguridad descargada exitosamente.", "info");
        } else {
            throw new Error(result?.error || "Error desconocido al generar la copia.");
        }

    } catch (error) {
        console.error("Error en backup:", error);
        await window.api.dialog.alert("Fallo al crear la copia de seguridad: " + error.message, "error");
    } finally {
        btnBackup.disabled = false;
        btnBackup.textContent = originalText;
    }
}
let cart = [];
let currentProduct = null;

// =========================================================
// 🚀 INICIALIZACIÓN
// =========================================================
document.addEventListener("DOMContentLoaded", async () => {
    updateDate();
    
    // Verificación básica de sesión
    const userSession = JSON.parse(sessionStorage.getItem('user'));
    if (!userSession) {
        console.warn("No hay sesión activa (Modo Desarrollo/Prueba)");
    }

    // Cargar productos al iniciar
    await loadProducts();
    
    // Verificar si venimos de "Editar Venta"
    checkEditMode();

    // -----------------------------------------------------
    // 👂 EVENT LISTENERS
    // -----------------------------------------------------
    
    // Selección de producto
    const productSelect = document.getElementById("productSelect");
    if(productSelect) productSelect.addEventListener("change", onProductSelect);

    // Validación en tiempo real de inputs
    const qtyInput = document.getElementById("quantity");
    if(qtyInput) qtyInput.addEventListener("input", validateInput);

    const priceInput = document.getElementById("priceInput");
    if(priceInput) priceInput.addEventListener("input", validateInput);
    
    // Botones de acción
    document.getElementById("btnAdd").addEventListener("click", addToCart);
    document.getElementById("btnProcess").addEventListener("click", processSale);
    
    document.getElementById("btnCancel").addEventListener("click", () => {
        if(cart.length > 0 && !confirm("¿Vaciar carrito?")) return;
        cart = []; 
        renderCart(); 
        resetForm();
    });

    // Validación de RUC/DNI (solo números)
    const clientDoc = document.getElementById("clientDoc");
    if(clientDoc) clientDoc.addEventListener("input", (e) => e.target.value = e.target.value.replace(/[^0-9]/g, ''));
    
    // Cambio entre Boleta y Factura
    const radios = document.querySelectorAll('input[name="docType"]');
    radios.forEach(radio => radio.addEventListener('change', toggleClientFields));
});

// =========================================================
// 🔄 LÓGICA DE CLIENTES (Boleta vs Factura)
// =========================================================
window.toggleClientFields = () => {
    const isFactura = document.querySelector('input[name="docType"]:checked').value === 'factura';
    const docInput = document.getElementById("clientDoc");
    const nameInput = document.getElementById("clientName");
    const alertMsg = document.getElementById("rucAlert");

    if (isFactura) {
        docInput.placeholder = "RUC * (11 dígitos)";
        docInput.setAttribute("maxLength", "11");
        nameInput.placeholder = "Razón Social *";
        if(alertMsg) alertMsg.classList.remove('hidden');
    } else {
        docInput.placeholder = "DNI (Opcional)";
        docInput.setAttribute("maxLength", "8");
        nameInput.placeholder = "Nombre Cliente (Opcional)";
        if(alertMsg) alertMsg.classList.add('hidden');
    }
};

// =========================================================
// 📦 LÓGICA DE PRODUCTOS
// =========================================================
async function loadProducts() {
    const select = document.getElementById("productSelect");
    try {
        const products = await window.api.products.list();
        
        select.innerHTML = '<option value="">-- Seleccione Producto --</option>';
        
        if (!products || !products.length) return;

        products.forEach(p => {
            // Solo mostramos productos activos y con stock positivo
            if (p.stock > 0 && p.is_active !== 0) {
                const opt = document.createElement("option");
                opt.value = p.id;
                opt.textContent = p.name;
                
                // Guardamos datos clave en atributos data- para acceso rápido
                opt.dataset.cost = p.cost_price || 0; 
                opt.dataset.price = p.price || 0;
                opt.dataset.stock = p.stock;
                opt.dataset.name = p.name;
                
                select.appendChild(opt);
            }
        });
    } catch (e) { 
        console.error("Error cargando productos:", e);
        await window.api.dialog.alert("Error al cargar la lista de productos.", "error");
    }
}

function onProductSelect(e) {
    const opt = e.target.selectedOptions[0];
    if (!opt || !opt.value) return resetForm();

    const cost = parseFloat(opt.dataset.cost);
    const basePrice = parseFloat(opt.dataset.price);
    
    // Calculamos el precio mínimo sugerido (ej: Costo + 10%)
    const minPrice = cost * 1.10;

    currentProduct = {
        id: parseInt(opt.value),
        name: opt.dataset.name,
        stock: parseFloat(opt.dataset.stock),
        minPrice: minPrice,
        defaultPrice: basePrice > 0 ? basePrice : minPrice
    };

    // Actualizar UI
    document.getElementById("stockDisplay").textContent = `${currentProduct.stock} disponibles`;
    document.getElementById("priceInput").value = currentProduct.defaultPrice.toFixed(2);
    
    const helpText = document.getElementById("minPriceHelp");
    if(helpText) {
        helpText.textContent = `Mínimo sugerido: S/ ${minPrice.toFixed(2)}`;
        helpText.style.color = "#64748b";
    }

    const qtyField = document.getElementById("quantity");
    qtyField.max = currentProduct.stock;
    qtyField.value = 1;
    
    validateInput();
}

function validateInput() {
    const btn = document.getElementById("btnAdd");
    const qty = parseFloat(document.getElementById("quantity").value);
    const inputPrice = parseFloat(document.getElementById("priceInput").value);
    const helpText = document.getElementById("minPriceHelp");
    const priceField = document.getElementById("priceInput");

    if (!currentProduct) {
        btn.disabled = true;
        return;
    }

    const isQtyValid = qty > 0 && qty <= currentProduct.stock;
    const isPriceValid = inputPrice >= currentProduct.minPrice;

    // Alerta visual si vende muy barato
    if (!isPriceValid) {
        if(helpText) {
            helpText.innerHTML = `⚠️ <b>Precio bajo alerta.</b> Mínimo: S/ ${currentProduct.minPrice.toFixed(2)}`;
            helpText.style.color = "#dc2626";
        }
        priceField.style.borderColor = "orange";
    } else {
        if(helpText) {
            helpText.textContent = `Mínimo sugerido: S/ ${currentProduct.minPrice.toFixed(2)}`;
            helpText.style.color = "#64748b";
        }
        priceField.style.borderColor = "#cbd5e1";
    }

    // Habilitar botón solo si cantidad es válida y precio > 0
    btn.disabled = !(isQtyValid && inputPrice > 0);
}

// =========================================================
// 🛒 LÓGICA DEL CARRITO
// =========================================================
function addToCart() {
    const qty = parseFloat(document.getElementById("quantity").value);
    const price = parseFloat(document.getElementById("priceInput").value);

    // Verificar si ya está en el carrito para no exceder stock total
    const existingIdx = cart.findIndex(i => i.product_id === currentProduct.id);
    const currentInCart = existingIdx >= 0 ? cart[existingIdx].quantity : 0;

    if (qty + currentInCart > currentProduct.stock) {
        window.api.dialog.alert(`Stock insuficiente. Solo quedan ${currentProduct.stock} y ya tienes ${currentInCart} en el carrito.`, "warning");
        return;
    }

    if (existingIdx >= 0) {
        // Actualizar existente
        cart[existingIdx].quantity += qty;
        cart[existingIdx].price = price; // Actualizamos precio al último ingresado
        cart[existingIdx].subtotal = cart[existingIdx].quantity * price;
    } else {
        // Agregar nuevo
        cart.push({
            product_id: currentProduct.id,
            name: currentProduct.name,
            quantity: qty,
            price: price,
            subtotal: qty * price
        });
    }
    
    renderCart();
    resetForm(false); // Limpiar inputs pero mantener foco
    document.getElementById("productSelect").focus();
}

function renderCart() {
    const tbody = document.getElementById("cartTable");
    const totalDisplay = document.getElementById("totalDisplay");
    tbody.innerHTML = "";
    let total = 0;

    cart.forEach((item, idx) => {
        total += item.subtotal;
        tbody.innerHTML += `
            <tr>
                <td class="text-center">${item.quantity}</td>
                <td>${item.name}</td>
                <td class="text-right">S/ ${item.price.toFixed(2)}</td>
                <td class="text-right">S/ ${item.subtotal.toFixed(2)}</td>
                <td class="text-center">
                    <button onclick="removeItem(${idx})" class="btn-icon delete" title="Quitar">🗑</button>
                </td>
            </tr>`;
    });
    totalDisplay.textContent = `S/ ${total.toFixed(2)}`;
    
    // Exponer función global para el onclick del HTML generado
    window.removeItem = (idx) => { cart.splice(idx, 1); renderCart(); };
}

// =========================================================
// 💳 PROCESAR VENTA E IMPRESIÓN (CORE)
// =========================================================
async function processSale() {
    if (cart.length === 0) {
        window.api.dialog.alert("El carrito está vacío. Agregue productos antes de procesar.", "warning");
        return;
    }

    // 1. Recolección de Datos del Cliente
    const docType = document.querySelector('input[name="docType"]:checked').value;
    let clientDoc = document.getElementById("clientDoc").value.trim();
    let clientName = document.getElementById("clientName").value.trim();

    // Validaciones de Cliente
    if (docType === 'factura') {
        if (clientDoc.length !== 11) return window.api.dialog.alert("Para facturas, el RUC debe tener 11 dígitos.", "warning");
        if (clientName.length < 3) return window.api.dialog.alert("La Razón Social es obligatoria para facturas.", "warning");
    } else {
        // Valores por defecto para Boleta simple
        if (!clientName) clientName = "Público General";
        if (!clientDoc) clientDoc = "00000000";
    }

    // Obtener Usuario
    const userSession = JSON.parse(sessionStorage.getItem('user'));
    const userId = userSession ? userSession.id : 1; 

    // Calcular total final
    const total = cart.reduce((sum, i) => sum + i.subtotal, 0);
    
    // Confirmación
    const confirmed = await window.api.dialog.confirm(`¿Generar ${docType.toUpperCase()} por S/ ${total.toFixed(2)}?`);
    if (!confirmed) return;

    // Bloquear botón para evitar doble envío
    const btn = document.getElementById("btnProcess");
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Procesando...";

    try {
        // 2. Construir objeto de Venta
        const saleData = {
            items: cart.map(item => ({
                product_id: item.product_id,
                product_name: item.name,
                quantity: item.quantity,
                price: item.price
            })),
            payment_method: 'EFECTIVO',
            user_id: userId,
            client: { 
                name: clientName, 
                docNumber: clientDoc, 
                type: docType 
            }
        };

        // 3. Enviar al Backend
        const result = await window.api.sale.create(saleData);
        
        if(result.success) {
            
            // 4. Limpiar Interfaz de Venta
            cart = [];
            renderCart();
            resetForm();

            // 5. GENERAR PDF AUTOMÁTICO
            const originalTitle = document.title;
            document.title = "Generando comprobante..."; 

            try {
                const pdfResult = await window.api.sale.savePdf(result.saleId); 
                
                if (pdfResult.success) {
                    const open = await window.api.dialog.confirm(
                        `✅ Venta registrada con éxito.\n\n¿Deseas abrir la boleta/factura generada ahora?`
                    );

                    if (open) {
                        await window.api.app.openFile(pdfResult.path);
                    }
                } else {
                    console.error(pdfResult.error);
                    await window.api.dialog.alert("La venta se guardó, pero hubo un error generando el PDF.", "warning");
                }

            } catch (pdfError) {
                console.error("Error guardando PDF:", pdfError);
            }

            document.title = originalTitle;

            window.location.href = "daily.html";
        }

    } catch (error) {
        console.error(error);
        await window.api.dialog.alert("Error al procesar la venta: " + error.message, "error");
        
        btn.disabled = false;
        btn.textContent = originalText;
    } 
}

function resetForm(full = true) {
    if (full) {
        const sel = document.getElementById("productSelect");
        if(sel) sel.value = "";
        currentProduct = null;
        document.getElementById("stockDisplay").textContent = "-";
        document.getElementById("minPriceHelp").textContent = "";
    }
    document.getElementById("quantity").value = 1;
    
    const price = document.getElementById("priceInput");
    if(price) {
        price.value = "";
        price.style.borderColor = "#cbd5e1";
    }
    
    document.getElementById("btnAdd").disabled = true;
}

function updateDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const el = document.getElementById("dateDisplay");
    if(el) el.textContent = new Date().toLocaleDateString('es-PE', options);
}

function checkEditMode() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('mode') === 'edit') {
        const savedCart = localStorage.getItem('editSaleCart');
        if (savedCart) {
            try {
                cart = JSON.parse(savedCart);
                renderCart();
                localStorage.removeItem('editSaleCart');
            } catch (e) { console.error(e); }
        }
    }
}
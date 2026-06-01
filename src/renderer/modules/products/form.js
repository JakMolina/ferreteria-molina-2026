const tiposProducto = {
  "tornillo_perno": {
    nombre: "Tornillo / Perno",
    atributos: [
      { nombre: "diametro", etiqueta: "Diámetro (mm o pulg)", tipo: "text", requerido: true },
      { nombre: "largo", etiqueta: "Largo (mm)", tipo: "number", requerido: true },
      { nombre: "material", etiqueta: "Material", tipo: "select", opciones: ["Acero inoxidable", "Galvanizado", "Latón", "Nylon"], requerido: true },
      { nombre: "cabeza", etiqueta: "Tipo de cabeza", tipo: "select", opciones: ["Hexagonal", "Avellanada", "Redonda", "Mariposa"], requerido: false }
    ],
    tieneLotes: false, tieneVencimiento: false
  },
  "pintura": {
    nombre: "Pintura / Barniz",
    atributos: [
      { nombre: "volumen", etiqueta: "Volumen (L)", tipo: "select", opciones: ["0.25", "0.5", "1", "4", "20"], requerido: true },
      { nombre: "color", etiqueta: "Color", tipo: "color", requerido: true },
      { nombre: "acabado", etiqueta: "Acabado", tipo: "select", opciones: ["Mate", "Satinado", "Brillante"], requerido: true },
      { nombre: "rendimiento", etiqueta: "Rendimiento (m²/L)", tipo: "number", requerido: false }
    ],
    tieneLotes: true, tieneVencimiento: true
  },
  "pegamento": {
    nombre: "Pegamento / Adhesivo",
    atributos: [
      { nombre: "volumen_ml", etiqueta: "Volumen (ml)", tipo: "number", requerido: true },
      { nombre: "tipo_pegamento", etiqueta: "Tipo", tipo: "select", opciones: ["Instantáneo", "Epóxico", "Contacto", "Silicona", "Termofusible"], requerido: true },
      { nombre: "tiempo_fraguado", etiqueta: "Tiempo de fraguado (min)", tipo: "number", requerido: false }
    ],
    tieneLotes: true, tieneVencimiento: true
  },
  "cinta": {
    nombre: "Cinta adhesiva / Aislante",
    atributos: [
      { nombre: "ancho_mm", etiqueta: "Ancho (mm)", tipo: "select", opciones: ["12", "19", "25", "50"], requerido: true },
      { nombre: "largo_m", etiqueta: "Largo (m)", tipo: "select", opciones: ["5", "10", "20", "50"], requerido: true },
      { nombre: "color", etiqueta: "Color", tipo: "select", opciones: ["Transparente", "Blanca", "Negra", "Roja", "Azul"], requerido: false },
      { nombre: "tipo_cinta", etiqueta: "Tipo", tipo: "select", opciones: ["Aislante", "Teflón", "Masking", "Dúplex", "Embalaje"], requerido: true }
    ],
    tieneLotes: false, tieneVencimiento: false
  },
  "cable_tubo": {
    nombre: "Cable / Tubo / Perfil",
    atributos: [
      { nombre: "diametro_mm", etiqueta: "Diámetro (mm)", tipo: "number", requerido: true },
      { nombre: "largo_m", etiqueta: "Largo (m)", tipo: "number", requerido: true },
      { nombre: "material", etiqueta: "Material", tipo: "select", opciones: ["PVC", "Cobre", "Acero", "Aluminio", "Hierro"], requerido: true },
      { nombre: "venta_por", etiqueta: "Se vende por", tipo: "select", opciones: ["metro", "pieza"], requerido: true }
    ],
    tieneLotes: false, tieneVencimiento: false, permiteFraccion: true
  },
  "producto_peso": {
    nombre: "Producto por peso (clavos, alambre)",
    atributos: [
      { nombre: "peso_por_unidad_g", etiqueta: "Peso por unidad (g)", tipo: "number", requerido: false },
      { nombre: "calibre_mm", etiqueta: "Calibre / Grosor (mm)", tipo: "number", requerido: true },
      { nombre: "material", etiqueta: "Material", tipo: "text", requerido: true }
    ],
    tieneLotes: false, tieneVencimiento: false, permiteFraccion: true, unidadVentaBase: "kilogramo"
  },
  "herramienta": {
    nombre: "Herramienta",
    atributos: [
      { nombre: "marca", etiqueta: "Marca", tipo: "text", requerido: true },
      { nombre: "modelo", etiqueta: "Modelo", tipo: "text", requerido: true },
      { nombre: "voltaje", etiqueta: "Voltaje (V)", tipo: "number", requerido: false },
      { nombre: "potencia_w", etiqueta: "Potencia (W)", tipo: "number", requerido: false },
      { nombre: "garantia_meses", etiqueta: "Garantía (meses)", tipo: "number", requerido: false }
    ],
    tieneLotes: false, tieneVencimiento: false
  },
  "quimico": {
    nombre: "Líquido / Químico",
    atributos: [
      { nombre: "volumen_l", etiqueta: "Volumen (L)", tipo: "number", requerido: true },
      { nombre: "concentracion", etiqueta: "Concentración (%)", tipo: "number", requerido: false },
      { nombre: "tipo_quimico", etiqueta: "Tipo", tipo: "select", opciones: ["Desengrasante", "Lubricante", "Sellador", "Limpiador"], requerido: true }
    ],
    tieneLotes: true, tieneVencimiento: true
  },
  "electrico": {
    nombre: "Material eléctrico",
    atributos: [
      { nombre: "amperaje", etiqueta: "Amperaje (A)", tipo: "number", requerido: true },
      { nombre: "voltaje", etiqueta: "Voltaje (V)", tipo: "number", requerido: true },
      { nombre: "calibre_awg", etiqueta: "Calibre AWG", tipo: "text", requerido: false },
      { nombre: "tipo", etiqueta: "Tipo", tipo: "select", opciones: ["Termomagnético", "Diferencial", "Simple", "Conmutador"], requerido: true }
    ],
    tieneLotes: false, tieneVencimiento: false
  },
  "tubo_hidraulico": {
    nombre: "Tubería hidráulica",
    atributos: [
      { nombre: "diametro_exterior_mm", etiqueta: "Diámetro exterior (mm)", tipo: "number", requerido: true },
      { nombre: "diametro_interior_mm", etiqueta: "Diámetro interior (mm)", tipo: "number", requerido: true },
      { nombre: "presion_max_psi", etiqueta: "Presión máxima (psi)", tipo: "number", requerido: true },
      { nombre: "material", etiqueta: "Material", tipo: "select", opciones: ["PVC", "CPVC", "Cobre", "PEX", "Galvanizado"], requerido: true }
    ],
    tieneLotes: true, tieneVencimiento: false, permiteFraccion: true
  }
};

document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id");

    const form = document.getElementById("productForm");
    const providerSelect = document.getElementById("provider");
    const typeSelect = document.getElementById("productType");
    const title = document.getElementById("pageTitle");
    const btn = document.getElementById("saveBtn");

    for (const key in tiposProducto) {
        const option = document.createElement("option");
        option.value = key;
        option.textContent = tiposProducto[key].nombre;
        typeSelect.appendChild(option);
    }

    typeSelect.addEventListener("change", (e) => renderDynamicFields(e.target.value));

    await loadProviders(providerSelect);

    if (productId) {
        if(title) title.textContent = "Editar Producto";
        const sub = document.getElementById("pageSubtitle");
        if(sub) sub.textContent = `Editando ID: ${productId}`;
        btn.textContent = "Actualizar Cambios";
        
        document.getElementById("lotSection").style.display = 'none'; 
        
        await loadProductData(productId);
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        btn.disabled = true;
        btn.textContent = "Guardando...";

        try {
            const productData = {
                name: document.getElementById("name").value.trim(),
                category: document.getElementById("category").value.trim(),
                type: typeSelect.value,
                cost_price: parseFloat(document.getElementById("cost_price").value) || 0, 
                price: parseFloat(document.getElementById("price").value) || 0, 
                stock: parseFloat(document.getElementById("stock").value) || 0,
                provider_id: providerSelect.value ? parseInt(providerSelect.value) : null,
                description: document.getElementById("description").value.trim(),
                attributes: {},
                lots: []
            };

            if (typeSelect.value !== 'general' && tiposProducto[typeSelect.value]) {
                const config = tiposProducto[typeSelect.value];
                config.atributos.forEach(attr => {
                    const input = document.getElementById(`attr_${attr.nombre}`);
                    if (input) productData.attributes[attr.nombre] = input.value;
                });
            }

            if (!productId && typeSelect.value !== 'general' && tiposProducto[typeSelect.value]?.tieneLotes) {
                const lotInput = document.getElementById("lot_number");
                const expInput = document.getElementById("expiration_date");
                
                if (lotInput && lotInput.value.trim() !== '') {
                    productData.lots.push({
                        lot_number: lotInput.value.trim(),
                        expiration_date: expInput ? expInput.value : null,
                        stock: productData.stock
                    });
                } else {
                    throw new Error("El número de lote es obligatorio para este tipo de producto.");
                }
            }

            let result;
            if (productId) {
                result = await window.api.products.update(productId, productData);
            } else {
                result = await window.api.products.create(productData);
            }

            if (result && result.error) throw new Error(result.message);

            await window.api.dialog.alert("✅ Datos guardados correctamente.", "info");
            window.location.href = "list.html";

        } catch (error) {
            console.error("Error al guardar:", error);
            await window.api.dialog.alert("❌ Error: " + error.message, "error");
            btn.disabled = false;
            btn.textContent = productId ? "Actualizar Cambios" : "Guardar Producto";
        }
    });
});

function renderDynamicFields(typeKey, existingValues = {}) {
    const container = document.getElementById("dynamicFieldsContainer");
    const lotSection = document.getElementById("lotSection");
    const expGroup = document.getElementById("expirationGroup");
    const stockHelp = document.getElementById("stockHelp");
    
    container.innerHTML = '<div class="section-title" style="grid-column: 1/-1;">Especificaciones Técnicas</div>';
    
    if (typeKey === 'general' || !tiposProducto[typeKey]) {
        container.style.display = 'none';
        
        const isEdit = new URLSearchParams(window.location.search).get("id");
        if(!isEdit) lotSection.style.display = 'none';
        
        stockHelp.textContent = "";
        return;
    }

    const config = tiposProducto[typeKey];
    container.style.display = 'grid';

    config.atributos.forEach(attr => {
        const group = document.createElement("div");
        group.className = "form-group";
        
        const label = document.createElement("label");
        label.textContent = attr.etiqueta + (attr.requerido ? " *" : "");
        group.appendChild(label);

        let input;
        if (attr.tipo === 'select') {
            input = document.createElement("select");
            input.innerHTML = `<option value="">-- Seleccione --</option>`;
            attr.opciones.forEach(opt => {
                input.innerHTML += `<option value="${opt}">${opt}</option>`;
            });
        } else {
            input = document.createElement("input");
            input.type = attr.tipo;
            if (attr.tipo === 'number') input.step = 'any';
        }

        input.id = `attr_${attr.nombre}`;
        input.required = attr.requerido;
        if (existingValues[attr.nombre]) input.value = existingValues[attr.nombre];

        group.appendChild(input);
        container.appendChild(group);
    });

    const isEdit = new URLSearchParams(window.location.search).get("id");
    if (!isEdit) {
        if (config.tieneLotes) {
            lotSection.style.display = 'grid';
            document.getElementById("lot_number").required = true;
            
            if (config.tieneVencimiento) {
                expGroup.style.display = 'block';
                document.getElementById("expiration_date").required = true;
            } else {
                expGroup.style.display = 'none';
                document.getElementById("expiration_date").required = false;
            }
        } else {
            lotSection.style.display = 'none';
            document.getElementById("lot_number").required = false;
            document.getElementById("expiration_date").required = false;
        }
    }

    if (config.permiteFraccion) {
        stockHelp.textContent = "Admite decimales (Ej. 1.5 metros, 2.5 kg).";
        document.getElementById("stock").step = "0.01";
    } else {
        stockHelp.textContent = "Unidades enteras.";
        document.getElementById("stock").step = "1";
    }
}

async function loadProviders(selectElement) {
    try {
        const providers = await window.api.providers.list();
        selectElement.innerHTML = '<option value="">-- Seleccione (Opcional) --</option>';
        if (providers.length > 0) {
            providers.forEach(p => {
                selectElement.innerHTML += `<option value="${p.id}">${p.name}</option>`;
            });
        }
    } catch (e) {
        console.error(e);
    }
}

async function loadProductData(id) {
    try {
        const products = await window.api.products.list();
        const product = products.find(p => p.id == id);

        if (!product) {
            await window.api.dialog.alert("Producto no encontrado", "warning");
            window.location.href = "list.html";
            return;
        }

        document.getElementById("productType").value = product.type || 'general';
        document.getElementById("name").value = product.name;
        document.getElementById("category").value = product.category || "";
        document.getElementById("cost_price").value = product.cost_price || 0;
        document.getElementById("price").value = product.price || 0;
        document.getElementById("stock").value = product.stock || 0;
        document.getElementById("description").value = product.description || "";
        
        if (product.provider_id) document.getElementById("provider").value = product.provider_id;

        renderDynamicFields(product.type || 'general', product.attributes || {});

    } catch (error) {
        console.error(error);
    }
}
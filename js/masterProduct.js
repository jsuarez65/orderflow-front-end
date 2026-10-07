const form = document.getElementById("masterForm");
const mensaje = document.getElementById("mensaje");
const titulo = document.getElementById("titulo");
const btnGuardar = document.getElementById("btnGuardar");

// URLs de nuestras APIs
const API_URLS = {
    producto: "http://127.0.0.1:5000/master/product",
    cliente: "http://127.0.0.1:5000/master/cliente"
};

let maestroActual = "producto";
let accion = "nuevo";

inicializar();

function inicializar() {
    registrarEventos();
    aplicarAccion(accion);
}

function registrarEventos() {
    form.addEventListener("submit", procesarFormulario);

    document.querySelectorAll(".menu-item").forEach(btn => {
        btn.addEventListener("click", seleccionarMaestro);
    });

    document.querySelectorAll(".action").forEach(btn => {
        btn.addEventListener("click", seleccionarAccion);
    });
}

function seleccionarMaestro(event) {
    document.querySelectorAll(".menu-item").forEach(btn => btn.classList.remove("active"));
    const boton = event.currentTarget;
    boton.classList.add("active");
    
    maestroActual = boton.dataset.master;
    titulo.textContent = boton.textContent;
    
    // Ocultamos todos los grupos de campos
    document.querySelectorAll(".fields-container").forEach(div => div.style.display = "none");
    // Mostramos solo los del maestro actual
    document.getElementById(`fields-${maestroActual}`).style.display = "block";

    limpiarFormulario();
    mensaje.textContent = "";
}

function seleccionarAccion(event) {
    document.querySelectorAll(".action").forEach(btn => btn.classList.remove("active"));
    const boton = event.currentTarget;
    boton.classList.add("active");
    accion = boton.dataset.action;
    mensaje.textContent = "";
    aplicarAccion(accion);
}

function aplicarAccion(accionSeleccionada) {
    const inputs = document.querySelectorAll(`#fields-${maestroActual} input`);
    
    switch (accionSeleccionada) {
        case "nuevo":
            inputs.forEach(input => input.disabled = false);
            btnGuardar.textContent = "Guardar";
            limpiarFormulario();
            break;
        case "buscar":
            limpiarFormulario();
            inputs.forEach(input => input.disabled = true);
            if (maestroActual === "producto") document.getElementById("codigo").disabled = false;
            if (maestroActual === "cliente") document.getElementById("cuit").disabled = false;
            btnGuardar.textContent = "Buscar";
            break;
        case "modificar":
            limpiarFormulario();
            inputs.forEach(input => input.disabled = false);
            btnGuardar.textContent = "Modificar";
            break;
        case "eliminar":
            limpiarFormulario();
            inputs.forEach(input => input.disabled = true);
            if (maestroActual === "producto") document.getElementById("codigo").disabled = false;
            if (maestroActual === "cliente") document.getElementById("cuit").disabled = false;
            btnGuardar.textContent = "Eliminar";
            break;
    }
}

function limpiarFormulario() {
    form.reset();
}

async function procesarFormulario(event) {
    event.preventDefault();
    switch (accion) {
        case "nuevo": await guardarRegistro(); break;
        case "buscar": await buscarRegistro(); break;
        case "modificar": await modificarRegistro(); break;
        case "eliminar": await eliminarRegistro(); break;
    }
}

// Función genérica para armar el JSON dependiendo de si es Producto o Cliente
function obtenerDatos() {
    if (maestroActual === "producto") {
        return {
            internalCode: document.getElementById("codigo").value,
            description: document.getElementById("descripcion").value,
            sku: document.getElementById("sku").value,
            barcode: document.getElementById("codigo_barras").value,
            minimumStock: parseFloat(document.getElementById("stock_minimo").value),
            maximumStock: parseFloat(document.getElementById("stock_maximo").value)
        };
    } else if (maestroActual === "cliente") {
        return {
            cuit: document.getElementById("cuit").value,
            razonSocial: document.getElementById("razonSocial").value,
            telefono: document.getElementById("telefono").value,
            email: document.getElementById("email").value
        };
    }
}

// Función genérica para obtener el ID (código o cuit)
function obtenerId() {
    return maestroActual === "producto" 
        ? document.getElementById("codigo").value 
        : document.getElementById("cuit").value;
}

async function guardarRegistro() {
    const datos = obtenerDatos();
    try {
        const response = await fetch(API_URLS[maestroActual], {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });
        if (!response.ok) throw new Error("Error al guardar");
        mensaje.textContent = "Registro guardado correctamente.";
        limpiarFormulario();
    } catch (error) {
        console.error(error);
        mensaje.textContent = "Ocurrió un error al guardar.";
    }
}

async function buscarRegistro() {
    const id = obtenerId();
    try {
        // Hacemos un GET a la API y buscamos el registro por su ID
        const response = await fetch(API_URLS[maestroActual]);
        const data = await response.json();
        
        // Buscamos el que coincide con el ID (cuit o internalCode)
        const registroEncontrado = data.find(r => (r.cuit || r.internalCode) === id);
        
        if (registroEncontrado) {
            if (maestroActual === "cliente") {
                document.getElementById("razonSocial").value = registroEncontrado.razonSocial || '';
                document.getElementById("telefono").value = registroEncontrado.telefono || '';
                document.getElementById("email").value = registroEncontrado.email || '';
            } else {
                document.getElementById("descripcion").value = registroEncontrado.description || '';
                document.getElementById("sku").value = registroEncontrado.sku || '';
                document.getElementById("codigo_barras").value = registroEncontrado.barcode || '';
                document.getElementById("stock_minimo").value = registroEncontrado.minimumStock || '';
                document.getElementById("stock_maximo").value = registroEncontrado.maximumStock || '';
            }
            mensaje.textContent = "Registro encontrado.";
        } else {
            mensaje.textContent = "Registro no encontrado.";
        }
    } catch (error) {
        console.error(error);
        mensaje.textContent = "Error al buscar.";
    }
}

async function modificarRegistro() {
    const datos = obtenerDatos();
    try {
        const response = await fetch(API_URLS[maestroActual], {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });
        if (!response.ok) throw new Error("Error al modificar");
        mensaje.textContent = "Registro modificado correctamente.";
    } catch (error) {
        console.error(error);
        mensaje.textContent = "Ocurrió un error al modificar.";
    }
}

async function eliminarRegistro() {
    const id = obtenerId();
    try {
        // Para DELETE, pasamos el ID por la URL (query param)
        const url = `${API_URLS[maestroActual]}?cuit=${id}&internalCode=${id}`;
        const response = await fetch(url, { method: "DELETE" });
        if (!response.ok) throw new Error("Error al eliminar");
        mensaje.textContent = "Registro eliminado correctamente.";
        limpiarFormulario();
    } catch (error) {
        console.error(error);
        mensaje.textContent = "Ocurrió un error al eliminar.";
    }
}
const form = document.getElementById("productoForm");
const mensaje = document.getElementById("mensaje");
const titulo = document.getElementById("titulo");
const btnGuardar = document.getElementById("btnGuardar");

const codigo = document.getElementById("codigo");
const descripcion = document.getElementById("descripcion");
const sku = document.getElementById("sku");
const codigoBarras = document.getElementById("codigo_barras");
const stockMinimo = document.getElementById("stock_minimo");
const stockMaximo = document.getElementById("stock_maximo");

let maestro = "producto";
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

    document.querySelectorAll(".menu-item")
        .forEach(btn => btn.classList.remove("active"));

    const boton = event.currentTarget;

    boton.classList.add("active");

    maestro = boton.dataset.master;

    titulo.textContent = boton.textContent;

    limpiarFormulario();

    mensaje.textContent = "";

    console.log("Maestro:", maestro);

}

function seleccionarAccion(event) {

    document.querySelectorAll(".action")
        .forEach(btn => btn.classList.remove("active"));

    const boton = event.currentTarget;

    boton.classList.add("active");

    accion = boton.dataset.action;

    mensaje.textContent = "";

    aplicarAccion(accion);

}

function aplicarAccion(accionSeleccionada) {

    const inputs = form.querySelectorAll("input");

    switch (accionSeleccionada) {

        case "nuevo":

            inputs.forEach(input => input.disabled = false);

            btnGuardar.textContent = "Guardar";

            limpiarFormulario();

            break;

        case "buscar":

            limpiarFormulario();

            inputs.forEach(input => input.disabled = true);

            codigo.disabled = false;

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

            codigo.disabled = false;

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

        case "nuevo":

            await guardarProducto();

            break;

        case "buscar":

            await buscarProducto();

            break;

        case "modificar":

            await modificarProducto();

            break;

        case "eliminar":

            await eliminarProducto();

            break;

    }

}

async function guardarProducto() {

    const producto = {

        codigo_interno: codigo.value,
        descripcion: descripcion.value,
        sku: sku.value,
        codigo_barras: Number(codigoBarras.value),
        stock_minimo: Number(stockMinimo.value),
        stock_maximo: Number(stockMaximo.value)

    };

    try {

        const response = await fetch(
            "http://localhost:5000/master/product",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(producto)
            }
        );

        if (!response.ok) {
            throw new Error("Error al guardar el producto");
        }

        mensaje.textContent = "Producto guardado correctamente.";

        limpiarFormulario();

    } catch (error) {

        console.error(error);

        mensaje.textContent = "Ocurrió un error al guardar el producto.";

    }

}

async function buscarProducto() {

    mensaje.textContent = "Acá irá el GET.";

}

async function modificarProducto() {

    mensaje.textContent = "Acá irá el PUT.";

}

async function eliminarProducto() {

    mensaje.textContent = "Acá irá el DELETE.";

}
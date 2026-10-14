const titulo = document.getElementById("titulo");
const contenedorMaestro = document.getElementById("contenedorMaestro");
const mensaje = document.getElementById("mensaje");

let maestroActual = "producto";

const nombresMaestros = {
    producto: "Productos",
    cliente: "Clientes",
    proveedor: "Proveedores",
    usuario: "Usuarios",
    rol: "Roles",
    ciudad: "Ciudades"
};

inicializar();

function inicializar() {

    registrarEventos();
}

function registrarEventos() {

    document.querySelectorAll(".menu-item").forEach(boton => {
        boton.addEventListener("click", seleccionarMaestro);
    });

    document.querySelectorAll(".action").forEach(boton => {
        boton.addEventListener("click", seleccionarAccion);
    });
}

function seleccionarMaestro(event) {

    const boton = event.currentTarget;
    maestroActual = boton.dataset.master;

    document.querySelectorAll(".menu-item").forEach(item => {
        item.classList.toggle("active", item === boton);
    });

    titulo.textContent = nombresMaestros[maestroActual];
    mensaje.textContent = "";

    document.querySelectorAll(".action").forEach(item => {
        item.classList.toggle("active", item.dataset.action === "nuevo");
    });

    if (maestroActual === "producto") {

        contenedorMaestro.innerHTML = "<form-producto></form-producto>";
        return;
    }

    contenedorMaestro.textContent =
        `El formulario de ${nombresMaestros[maestroActual].toLowerCase()} todavía no está implementado.`;
}

function seleccionarAccion(event) {

    const boton = event.currentTarget;
    const accion = boton.dataset.action;

    document.querySelectorAll(".action").forEach(item => {
        item.classList.toggle("active", item === boton);
    });

    mensaje.textContent = "";

    const componente = contenedorMaestro.querySelector("form-producto");

    if (!componente) {

        mensaje.textContent = "Este maestro todavía no está implementado.";
        return;
    }

    componente.cambiarAccion(accion);
}
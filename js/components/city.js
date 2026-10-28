class FormCity extends HTMLElement {
    
    constructor() {
        super();
        this.accion = "nuevo";
        this.form = null;
        this.searchForm = null;
        this.mensaje = null;
        this.btnCargar = null;
        this.btnBuscar = null;
        this.archivoExcel = null;
        this.buscarPostalCode = null;
        this.resultadosBusqueda = null;
        this.tbodyResultados = null;
        this.procesando = false;
    }

    async connectedCallback() {
        try {
            const response = await fetch("components/city.html");
            if (!response.ok) {
                throw new Error("No se pudo cargar el formulario de ciudades.");
            }

            this.innerHTML = await response.text();
            
            this.obtenerElementos();
            this.registrarEventos();
            this.aplicarAccion();
            
        } catch (error) {
            console.error("Error al inicializar ciudades:", error);
            this.mostrarMensaje("No se pudo cargar el formulario de ciudades.");
        }
    }

    obtenerElementos() {
        this.form = this.querySelector("#cityForm");
        this.searchForm = this.querySelector("#citySearchForm");
        this.btnCargar = this.querySelector("#btnCargar");
        this.btnBuscar = this.querySelector("#btnBuscar");
        this.archivoExcel = this.querySelector("#archivoExcel");
        this.buscarPostalCode = this.querySelector("#buscarPostalCode");
        this.resultadosBusqueda = this.querySelector("#resultadosBusqueda");
        this.tbodyResultados = this.querySelector("#tbodyResultados");
        this.mensaje = document.getElementById("mensaje");
    }

    registrarEventos() {
        this.form.addEventListener("submit", event => {
            this.procesarCarga(event);
        });

        this.searchForm.addEventListener("submit", event => {
            this.procesarBusqueda(event);
        });
    }

    cambiarAccion(nuevaAccion) {
        this.accion = nuevaAccion;
        if (this.form) {
            this.aplicarAccion();
        }
    }

    aplicarAccion() {
        this.limpiarFormularios();
        this.mostrarMensaje("");
        this.resultadosBusqueda.style.display = "none";

        switch (this.accion) {
            case "nuevo":
                this.form.style.display = "block";
                this.searchForm.style.display = "none";
                this.btnCargar.textContent = "Cargar Códigos Postales";
                break;
            case "buscar":
                this.form.style.display = "none";
                this.searchForm.style.display = "block";
                this.btnBuscar.textContent = "Buscar";
                break;
            case "modificar":
            case "eliminar":
                this.form.style.display = "none";
                this.searchForm.style.display = "none";
                this.mostrarMensaje(`La acción "${this.accion}" no está disponible para ciudades.`);
                break;
        }
    }

    async procesarCarga(event) {
        event.preventDefault();
        if (this.procesando) {
            return;
        }
        this.procesando = true;
        this.btnCargar.disabled = true;

        try {
            const file = this.archivoExcel.files[0];
            if (!file) {
                this.mostrarMensaje("Por favor, seleccione un archivo Excel.");
                return;
            }

            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("http://localhost:5000/master/cities", {
                method: "POST",
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                this.mostrarMensaje(
                    `Importación exitosa. Nuevos: ${result.insertedNew}, ` +
                    `Duplicados: ${result.ignoredDuplicates}, ` +
                    `Saltados: ${result.skippedRows}`
                );
                this.limpiarFormularios();
            } else {
                this.mostrarMensaje("Error: " + (result.message || "Error al importar códigos postales"));
            }

        } catch (error) {
            console.error("Error al cargar códigos postales:", error);
            this.mostrarMensaje("Error de conexión con el servidor.");
        } finally {
            this.procesando = false;
            this.btnCargar.disabled = false;
        }
    }

    async procesarBusqueda(event) {
        event.preventDefault();
        if (this.procesando) {
            return;
        }
        this.procesando = true;
        this.btnBuscar.disabled = true;

        try {
            const postalCode = this.buscarPostalCode.value.trim();

            if (!postalCode) {
                this.mostrarMensaje("Ingrese un código postal para buscar.");
                return;
            }

            const url = `http://localhost:5000/master/cities?postalCode=${encodeURIComponent(postalCode)}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("Error al buscar códigos postales.");
            }

            const ciudades = await response.json();

            if (ciudades.length === 0) {
                this.mostrarMensaje("No se encontraron resultados.");
                this.resultadosBusqueda.style.display = "none";
            } else {
                this.mostrarResultados(ciudades);
                this.mostrarMensaje(`Se encontraron ${ciudades.length} resultado(s).`);
            }

        } catch (error) {
            console.error("Error al buscar códigos postales:", error);
            this.mostrarMensaje("Error de conexión con el servidor.");
        } finally {
            this.procesando = false;
            this.btnBuscar.disabled = false;
        }
    }

    mostrarResultados(ciudades) {
        this.tbodyResultados.innerHTML = "";
        
        ciudades.forEach(ciudad => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${ciudad.id}</td>
                <td>${ciudad.postalCode}</td>
                <td>${ciudad.cityName}</td>
            `;
            this.tbodyResultados.appendChild(row);
        });

        this.resultadosBusqueda.style.display = "block";
    }

    limpiarFormularios() {
        this.form.reset();
        this.searchForm.reset();
        this.tbodyResultados.innerHTML = "";
        this.resultadosBusqueda.style.display = "none";
    }

    mostrarMensaje(texto) {
        if (this.mensaje) {
            this.mensaje.textContent = texto;
        }
    }
}

customElements.define("form-city", FormCity);
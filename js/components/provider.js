class FormProducto extends HTMLElement {

    constructor() {
        super();

        this.accion = "nuevo";
        this.form = null;
        this.mensaje = null;
        this.btnGuardar = null;
        this.cuil = null;
        this.razon_social = null;
        this.domicilio = null;
        this.email = null;
        this.telefono = null;
        this.codigo_postal = null;
        this.provincia = false;
        this.localidad = false;
    }

    async connectedCallback() {
        try {
            const response = await fetch("components/provider.html");

            if (!response.ok) {
                throw new Error("No se pudo cargar el formulario de proveedores.");
            }

            this.innerHTML = await response.text();

            this.obtenerElementos();
            this.registrarEventos();
            this.aplicarAccion();

        } catch (error) {
            console.error("Error al inicializar proveedores:", error);
            this.mostrarMensaje("No se pudo cargar el formulario de proveedores.");
        }
    }

    obtenerElementos() {
        this.form = this.querySelector("#providerForm");
        this.btnGuardar = this.querySelector("#btnGuardar");
        this.cuil = this.querySelector("#cuil");
        this.razon_social = this.querySelector("#razon_social");
        this.domicilio = this.querySelector("#domicilio");
        this.email = this.querySelector("#email");
        this.telefono = this.querySelector("#telefono");
        this.codigo_postal = this.querySelector("#codigo_postal");
        this.provincia = this.querySelector("#provincia");
        this.localidad = this.querySelector("#localidad");
        this.mensaje = document.getElementById("mensaje");
    }

    registrarEventos() {
        this.form.addEventListener("submit", event => {
            this.procesarFormulario(event);
        });
    }

    cambiarAccion(nuevaAccion) {
        this.accion = nuevaAccion;
        this.proveedorCargado = false;

        if (this.form) {
            this.aplicarAccion();
        }
    }

    aplicarAccion() {
        this.limpiarFormulario();
        this.mostrarMensaje("");

        const inputs = this.form.querySelectorAll("input");

        inputs.forEach(input => {
            input.disabled = false;
        });

        switch (this.accion) {
            case "nuevo":
                this.btnGuardar.textContent = "Guardar";
                break;

            case "buscar":
                inputs.forEach(input => {
                    input.disabled = true;
                });

                this.cuil.disabled = false;
                this.btnGuardar.textContent = "Buscar";
                break;

            case "modificar":
                inputs.forEach(input => {
                    input.disabled = true;
                });

                this.cuil.disabled = false;
                this.btnGuardar.textContent = "Buscar proveedor";
                break;

            case "eliminar":
                inputs.forEach(input => {
                    input.disabled = true;
                });

                this.cuil.disabled = false;
                this.btnGuardar.textContent = "Eliminar";
                break;
        }
    }

    async procesarFormulario(event) {
        event.preventDefault();

        if (this.procesando) {
            return;
        }

        this.procesando = true;
        this.btnGuardar.disabled = true;

        try {
            switch (this.accion) {
                case "nuevo":
                    await this.guardarProveedor();
                    break;

                case "buscar":
                    await this.buscarProveedor();
                    break;

                case "modificar":
                    if (this.proveedorCargado) {
                        await this.modificarProveedor();
                    } else {
                        await this.cargarProveedorParaModificar();
                    }
                    break;

                case "eliminar":
                    await this.eliminarProveedor();
                    break;
            }
        } catch (error) {
            console.error("Error al procesar el proveedor:", error);
            this.mostrarMensaje(error.message || "Ocurrió un error al procesar el proveedor.");
        } finally {
            this.procesando = false;
            this.btnGuardar.disabled = false;
        }
    }

    obtenerDatosProveedor() {
        return {
            cuil: this.cuil.value.trim(),
            razon_social: this.razon_social.value.trim(),
            domicilio: this.domicilio.value.trim(),
            email: this.email.value.trim(),
            telefono: this.telefono.value.trim(),
            codigo_postal: this.codigo_postal.value.trim(),
            provincia: this.provincia.value.trim(),
            localidad: this.localidad.value.trim()
        };
    }

    validarCodigo() {
        if (!this.cuil.value.trim()) {
            this.mostrarMensaje("Ingresá el código del proveedor.");
            this.cuil.focus();
            return false;
        }

        return true;
    }

    validarProveedor(proveedor) {
        if (!proveedor.cuil || !proveedor.razon_social) {
            this.mostrarMensaje("El código y la descripción son obligatorios.");
            return false;
        }

        if (
            proveedor.stock_minimo < 0 ||
            proveedor.stock_maximo < 0 ||
            proveedor.stock_minimo > proveedor.stock_maximo
        ) {
            this.mostrarMensaje(
                "Verificá los valores de stock mínimo y máximo."
            );
            return false;
        }

        return true;
    }

    async guardarProveedor() {
        const proveedor = this.obtenerDatosProveedor();

        if (!this.validarProveedor(proveedor)) {
            return;
        }

        const response = await fetch("http://localhost:5000/master/provider", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(proveedor)
        });

        if (!response.ok) {
            throw new Error(await this.obtenerError(response, "Error al guardar el proveedor."));
        }

        this.mostrarMensaje("Proveedores guardado correctamente.");
        this.limpiarFormulario();
    }

    async buscarProveedor() {
        if (!this.validarCodigo()) {
            return;
        }

        const cuil = encodeURIComponent(this.cuil.value.trim());

        const response = await fetch(
            `http://localhost:5000/master/provider/${cuil}`
        );

        if (response.status === 404) {
            this.mostrarMensaje("No se encontró el proveedor.");
            return;
        }

        if (!response.ok) {
            throw new Error(await this.obtenerError(response, "Error al buscar el proveedor."));
        }

        const proveedor = await response.json();

        this.cargarDatosProveedor(proveedor);
        this.mostrarMensaje("Proveedores encontrado correctamente.");
    }

    async cargarProveedorParaModificar() {
        if (!this.validarCodigo()) {
            return;
        }

        const cuil = encodeURIComponent(this.cuil.value.trim());

        const response = await fetch(
            `http://localhost:5000/master/provider/${cuil}`
        );

        if (response.status === 404) {
            this.mostrarMensaje("No se encontró el proveedor.");
            return;
        }

        if (!response.ok) {
            throw new Error(await this.obtenerError(response, "Error al buscar el proveedor."));
        }

        const proveedor = await response.json();

        this.cargarDatosProveedor(proveedor);
        this.proveedorCargado = true;

        this.razon_social.disabled = false;
        this.domicilio.disabled = false;
        this.email.disabled = false;
        this.telefono.disabled = false;
        this.codigo_postal.disabled = false;
        this.provincia.disabled = false;
        this.localidad.disabled = false;
        this.cuil.disabled = true;//el cuil no se puede modificar por lo que se deshabilita el input para que no se pueda cambiar

        this.btnGuardar.textContent = "Guardar cambios";

        this.mostrarMensaje("Proveedores cargado. Modificá los datos y guardá los cambios.");
    }

    async modificarProveedor() {
        const proveedor = this.obtenerDatosProveedor();

        if (!this.validarProveedor(proveedor)) {
            return;
        }

        const codigo = encodeURIComponent(this.codigo.value.trim());

        const response = await fetch(
            `http://localhost:5000/master/provider/${codigo}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(proveedor)
            }
        );

        if (!response.ok) {
            throw new Error(await this.obtenerError(response, "Error al modificar el proveedor."));
        }

        this.mostrarMensaje("Proveedores modificado correctamente.");
        this.aplicarAccion();
    }

    async eliminarProveedor() {
        if (!this.validarCodigo()) {
            return;
        }

        const codigoIngresado = this.codigo.value.trim();

        if (!confirm(`¿Querés eliminar el proveedor ${codigoIngresado}?`)) {
            return;
        }

        const codigo = encodeURIComponent(codigoIngresado);

        const response = await fetch(
            `http://localhost:5000/master/provider/${cuil}`,
            {
                method: "DELETE"
            }
        );

        if (response.status === 404) {
            this.mostrarMensaje("No se encontró el proveedor.");
            return;
        }

        if (!response.ok) {
            throw new Error(await this.obtenerError(response, "Error al eliminar el proveedor."));
        }

        this.mostrarMensaje("Proveedores eliminado correctamente.");
        this.limpiarFormulario();
    }

    cargarDatosProveedor(proveedor) {
        this.cuil.value = proveedor.cuil ?? "";
        this.razonSocial.value = proveedor.razon_social ?? "";
        this.domicilio.value = proveedor.domicilio ?? "";
        this.email.value = proveedor.email ?? "";
        this.telefono.value = proveedor.telefono ?? "";
        this.codigoPostal.value = proveedor.codigo_postal ?? "";
        this.provincia.value = proveedor.provincia ?? "";
        this.localidad.value = proveedor.localidad ?? "";
    }

    limpiarFormulario() {
        this.form.reset();
        this.proveedorCargado = false;
    }

    mostrarMensaje(texto) {
        if (this.mensaje) {
            this.mensaje.textContent = texto;
        }
    }

    async obtenerError(response, mensajePorDefecto) {
        const texto = await response.text();

        if (!texto) {
            return mensajePorDefecto;
        }

        try {
            const error = JSON.parse(texto);
            return error.message || error.mensaje || mensajePorDefecto;
        } catch {
            return texto;
        }
    }
}

customElements.define("form-proveedor", FormProveedor);
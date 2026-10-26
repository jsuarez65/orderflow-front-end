class FormCliente extends HTMLElement {

    constructor() {
        super();

        this.accion = "nuevo";
        this.form = null;
        this.mensaje = null;
        this.btnGuardar = null;
        this.codigo = null;
        this.razonSocial = null;
        this.cuit = null;
        this.telefono = null;
        this.email = null;
        this.clienteCargado = false;
        this.procesando = false;
    }

    async connectedCallback() {
        try {
            const response = await fetch("components/customer.html");

            if (!response.ok) {
                throw new Error("No se pudo cargar el formulario de clientes.");
            }

            this.innerHTML = await response.text();

            this.obtenerElementos();
            this.registrarEventos();
            this.aplicarAccion();

        } catch (error) {
            console.error("Error al inicializar clientes:", error);
            this.mostrarMensaje("No se pudo cargar el formulario de clientes.");
        }
    }

    obtenerElementos() {
        this.form = this.querySelector("#clienteForm");
        this.btnGuardar = this.querySelector("#btnGuardar");
        this.codigo = this.querySelector("#codigo");
        this.razonSocial = this.querySelector("#razon_social");
        this.cuit = this.querySelector("#cuit");
        this.telefono = this.querySelector("#telefono");
        this.email = this.querySelector("#email");
        this.mensaje = document.getElementById("mensaje");
    }

    registrarEventos() {
        this.form.addEventListener("submit", event => {
            this.procesarFormulario(event);
        });
    }

    cambiarAccion(nuevaAccion) {
        this.accion = nuevaAccion;
        this.clienteCargado = false;

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

                this.codigo.disabled = false;
                this.btnGuardar.textContent = "Buscar";
                break;

            case "modificar":
                inputs.forEach(input => {
                    input.disabled = true;
                });

                this.codigo.disabled = false;
                this.btnGuardar.textContent = "Buscar cliente";
                break;

            case "eliminar":
                inputs.forEach(input => {
                    input.disabled = true;
                });

                this.codigo.disabled = false;
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
                    await this.guardarCliente();
                    break;

                case "buscar":
                    await this.buscarCliente();
                    break;

                case "modificar":
                    if (this.clienteCargado) {
                        await this.modificarCliente();
                    } else {
                        await this.cargarClienteParaModificar();
                    }
                    break;

                case "eliminar":
                    await this.eliminarCliente();
                    break;
            }
        } catch (error) {
            console.error("Error al procesar el cliente:", error);
            this.mostrarMensaje(error.message || "Ocurrió un error al procesar el cliente.");
        } finally {
            this.procesando = false;
            this.btnGuardar.disabled = false;
        }
    }

    obtenerDatosCliente() {
        return {
            codigo_interno: this.codigo.value.trim(),
            razon_social: this.razonSocial.value.trim(),
            cuit: this.cuit.value.trim(),
            telefono: this.telefono.value.trim(),
            email: this.email.value.trim()
        };
    }

    validarCodigo() {
        if (!this.codigo.value.trim()) {
            this.mostrarMensaje("Ingresá el código del cliente.");
            this.codigo.focus();
            return false;
        }

        return true;
    }

    validarCliente(cliente) {
        if (!cliente.codigo_interno || !cliente.razon_social) {
            this.mostrarMensaje("El código y la razón social son obligatorios.");
            return false;
        }

        if (cliente.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cliente.email)) {
            this.mostrarMensaje("El email no tiene un formato válido.");
            this.email.focus();
            return false;
        }

        return true;
    }

    async guardarCliente() {
        const cliente = this.obtenerDatosCliente();

        if (!this.validarCliente(cliente)) {
            return;
        }

        const response = await fetch("http://localhost:5000/master/customer", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(cliente)
        });

        if (!response.ok) {
            throw new Error(await this.obtenerError(response, "Error al guardar el cliente."));
        }

        this.mostrarMensaje("Cliente guardado correctamente.");
        this.limpiarFormulario();
    }

    async buscarCliente() {
        if (!this.validarCodigo()) {
            return;
        }

        const codigo = encodeURIComponent(this.codigo.value.trim());

        const response = await fetch(
            `http://localhost:5000/master/customer/${codigo}`
        );

        if (response.status === 404) {
            this.mostrarMensaje("No se encontró el cliente.");
            return;
        }

        if (!response.ok) {
            throw new Error(await this.obtenerError(response, "Error al buscar el cliente."));
        }

        const cliente = await response.json();

        this.cargarDatosCliente(cliente);
        this.mostrarMensaje("Cliente encontrado correctamente.");
    }

    async cargarClienteParaModificar() {
        if (!this.validarCodigo()) {
            return;
        }

        const codigo = encodeURIComponent(this.codigo.value.trim());

        const response = await fetch(
            `http://localhost:5000/master/customer/${codigo}`
        );

        if (response.status === 404) {
            this.mostrarMensaje("No se encontró el cliente.");
            return;
        }

        if (!response.ok) {
            throw new Error(await this.obtenerError(response, "Error al buscar el cliente."));
        }

        const cliente = await response.json();

        this.cargarDatosCliente(cliente);
        this.clienteCargado = true;

        this.razonSocial.disabled = false;
        this.cuit.disabled = false;
        this.telefono.disabled = false;
        this.email.disabled = false;
        this.codigo.disabled = true;

        this.btnGuardar.textContent = "Guardar cambios";

        this.mostrarMensaje("Cliente cargado. Modificá los datos y guardá los cambios.");
    }

    async modificarCliente() {
        const cliente = this.obtenerDatosCliente();

        if (!this.validarCliente(cliente)) {
            return;
        }

        const codigo = encodeURIComponent(this.codigo.value.trim());

        const response = await fetch(
            `http://localhost:5000/master/customer/${codigo}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(cliente)
            }
        );

        if (!response.ok) {
            throw new Error(await this.obtenerError(response, "Error al modificar el cliente."));
        }

        this.mostrarMensaje("Cliente modificado correctamente.");
        this.aplicarAccion();
    }

    async eliminarCliente() {
        if (!this.validarCodigo()) {
            return;
        }

        const codigoIngresado = this.codigo.value.trim();

        if (!confirm(`¿Querés eliminar el cliente ${codigoIngresado}?`)) {
            return;
        }

        const codigo = encodeURIComponent(codigoIngresado);

        const response = await fetch(
            `http://localhost:5000/master/customer/${codigo}`,
            {
                method: "DELETE"
            }
        );

        if (response.status === 404) {
            this.mostrarMensaje("No se encontró el cliente.");
            return;
        }

        if (!response.ok) {
            throw new Error(await this.obtenerError(response, "Error al eliminar el cliente."));
        }

        this.mostrarMensaje("Cliente eliminado correctamente.");
        this.limpiarFormulario();
    }

    cargarDatosCliente(cliente) {
        this.codigo.value = cliente.codigo_interno ?? "";
        this.razonSocial.value = cliente.razon_social ?? "";
        this.cuit.value = cliente.cuit ?? "";
        this.telefono.value = cliente.telefono ?? "";
        this.email.value = cliente.email ?? "";
    }

    limpiarFormulario() {
        this.form.reset();
        this.clienteCargado = false;
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

customElements.define("form-cliente", FormCliente);
class FormProducto extends HTMLElement {

    constructor() {
        super();

        this.accion = "nuevo";
        this.form = null;
        this.mensaje = null;
        this.btnGuardar = null;
        this.codigo = null;
        this.descripcion = null;
        this.sku = null;
        this.codigoBarras = null;
        this.stockMinimo = null;
        this.stockMaximo = null;
        this.productoCargado = false;
        this.procesando = false;
    }

    async connectedCallback() {
        try {
            const response = await fetch("components/product.html");

            if (!response.ok) {
                throw new Error("No se pudo cargar el formulario de productos.");
            }

            this.innerHTML = await response.text();

            this.obtenerElementos();
            this.registrarEventos();
            this.aplicarAccion();

        } catch (error) {
            console.error("Error al inicializar productos:", error);
            this.mostrarMensaje("No se pudo cargar el formulario de productos.");
        }
    }

    obtenerElementos() {
        this.form = this.querySelector("#productoForm");
        this.btnGuardar = this.querySelector("#btnGuardar");
        this.codigo = this.querySelector("#codigo");
        this.descripcion = this.querySelector("#descripcion");
        this.sku = this.querySelector("#sku");
        this.codigoBarras = this.querySelector("#codigo_barras");
        this.stockMinimo = this.querySelector("#stock_minimo");
        this.stockMaximo = this.querySelector("#stock_maximo");
        this.mensaje = document.getElementById("mensaje");
    }

    registrarEventos() {
        this.form.addEventListener("submit", event => {
            this.procesarFormulario(event);
        });
    }

    cambiarAccion(nuevaAccion) {
        this.accion = nuevaAccion;
        this.productoCargado = false;

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
                this.btnGuardar.textContent = "Buscar producto";
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
                    await this.guardarProducto();
                    break;

                case "buscar":
                    await this.buscarProducto();
                    break;

                case "modificar":
                    if (this.productoCargado) {
                        await this.modificarProducto();
                    } else {
                        await this.cargarProductoParaModificar();
                    }
                    break;

                case "eliminar":
                    await this.eliminarProducto();
                    break;
            }
        } catch (error) {
            console.error("Error al procesar el producto:", error);
            this.mostrarMensaje(error.message || "Ocurrió un error al procesar el producto.");
        } finally {
            this.procesando = false;
            this.btnGuardar.disabled = false;
        }
    }

    obtenerDatosProducto() {
        return {
            codigo_interno: this.codigo.value.trim(),
            descripcion: this.descripcion.value.trim(),
            sku: this.sku.value.trim(),
            codigo_barras: this.codigoBarras.value.trim(),
            stock_minimo: Number(this.stockMinimo.value),
            stock_maximo: Number(this.stockMaximo.value)
        };
    }

    validarCodigo() {
        if (!this.codigo.value.trim()) {
            this.mostrarMensaje("Ingresá el código del producto.");
            this.codigo.focus();
            return false;
        }

        return true;
    }

    validarProducto(producto) {
        if (!producto.codigo_interno || !producto.descripcion) {
            this.mostrarMensaje("El código y la descripción son obligatorios.");
            return false;
        }

        if (
            producto.stock_minimo < 0 ||
            producto.stock_maximo < 0 ||
            producto.stock_minimo > producto.stock_maximo
        ) {
            this.mostrarMensaje(
                "Verificá los valores de stock mínimo y máximo."
            );
            return false;
        }

        return true;
    }

    async guardarProducto() {
        const producto = this.obtenerDatosProducto();

        if (!this.validarProducto(producto)) {
            return;
        }

        const response = await fetch("http://localhost:5000/master/product", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(producto)
        });

        if (!response.ok) {
            throw new Error(await this.obtenerError(response, "Error al guardar el producto."));
        }

        this.mostrarMensaje("Producto guardado correctamente.");
        this.limpiarFormulario();
    }

    async buscarProducto() {
        if (!this.validarCodigo()) {
            return;
        }

        const codigo = encodeURIComponent(this.codigo.value.trim());

        const response = await fetch(
            `http://localhost:5000/master/product/${codigo}`
        );

        if (response.status === 404) {
            this.mostrarMensaje("No se encontró el producto.");
            return;
        }

        if (!response.ok) {
            throw new Error(await this.obtenerError(response, "Error al buscar el producto."));
        }

        const producto = await response.json();

        this.cargarDatosProducto(producto);
        this.mostrarMensaje("Producto encontrado correctamente.");
    }

    async cargarProductoParaModificar() {
        if (!this.validarCodigo()) {
            return;
        }

        const codigo = encodeURIComponent(this.codigo.value.trim());

        const response = await fetch(
            `http://localhost:5000/master/product/${codigo}`
        );

        if (response.status === 404) {
            this.mostrarMensaje("No se encontró el producto.");
            return;
        }

        if (!response.ok) {
            throw new Error(await this.obtenerError(response, "Error al buscar el producto."));
        }

        const producto = await response.json();

        this.cargarDatosProducto(producto);
        this.productoCargado = true;

        this.descripcion.disabled = false;
        this.sku.disabled = false;
        this.codigoBarras.disabled = false;
        this.stockMinimo.disabled = false;
        this.stockMaximo.disabled = false;
        this.codigo.disabled = true;

        this.btnGuardar.textContent = "Guardar cambios";

        this.mostrarMensaje("Producto cargado. Modificá los datos y guardá los cambios.");
    }

    async modificarProducto() {
        const producto = this.obtenerDatosProducto();

        if (!this.validarProducto(producto)) {
            return;
        }

        const codigo = encodeURIComponent(this.codigo.value.trim());

        const response = await fetch(
            `http://localhost:5000/master/product/${codigo}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(producto)
            }
        );

        if (!response.ok) {
            throw new Error(await this.obtenerError(response, "Error al modificar el producto."));
        }

        this.mostrarMensaje("Producto modificado correctamente.");
        this.aplicarAccion();
    }

    async eliminarProducto() {
        if (!this.validarCodigo()) {
            return;
        }

        const codigoIngresado = this.codigo.value.trim();

        if (!confirm(`¿Querés eliminar el producto ${codigoIngresado}?`)) {
            return;
        }

        const codigo = encodeURIComponent(codigoIngresado);

        const response = await fetch(
            `http://localhost:5000/master/product/${codigo}`,
            {
                method: "DELETE"
            }
        );

        if (response.status === 404) {
            this.mostrarMensaje("No se encontró el producto.");
            return;
        }

        if (!response.ok) {
            throw new Error(await this.obtenerError(response, "Error al eliminar el producto."));
        }

        this.mostrarMensaje("Producto eliminado correctamente.");
        this.limpiarFormulario();
    }

    cargarDatosProducto(producto) {
        this.codigo.value = producto.codigo_interno ?? "";
        this.descripcion.value = producto.descripcion ?? "";
        this.sku.value = producto.sku ?? "";
        this.codigoBarras.value = producto.codigo_barras ?? "";
        this.stockMinimo.value = producto.stock_minimo ?? "";
        this.stockMaximo.value = producto.stock_maximo ?? "";
    }

    limpiarFormulario() {
        this.form.reset();
        this.productoCargado = false;
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

customElements.define("form-producto", FormProducto);
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const VENTAS_POR_PAGINA = 10;

const MESES_NOMBRES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

const ESTADO_INICIAL_PRODUCTO = {
  nombre: '',
  descripcion: '',
  precio: '',
  stock: '',
  ingredientes: '',
  instrucciones_uso: '',
  consejos: '',
  precauciones: '',
};

const ESTADOS_VENTA = {
  pendiente: { clase: 'afro-badge afro-badge-warning', etiqueta: 'Pendiente' },
  pagado: { clase: 'afro-badge afro-badge-rose', etiqueta: 'Pagado' },
  enviado: { clase: 'afro-badge afro-badge-info', etiqueta: 'Enviado' },
  entregado: { clase: 'afro-badge afro-badge-success', etiqueta: 'Entregado' },
  cancelado: { clase: 'afro-badge afro-badge-danger', etiqueta: 'Cancelado' },
};

const leerTokenSeguro = () => {
  try {
    return localStorage.getItem('token');
  } catch (error) {
    return null;
  }
};

const obtenerConfigHeaders = () => ({
  headers: { Authorization: `Bearer ${leerTokenSeguro()}` },
});

const formatearPrecio = (monto) => {
  const numero = parseFloat(monto);
  return Number.isFinite(numero) ? `$${numero.toFixed(2)}` : '$0.00';
};

const formatearFecha = (cadenaFecha) => {
  if (!cadenaFecha) return 'Fecha desconocida';
  const fecha = new Date(cadenaFecha);
  if (Number.isNaN(fecha.getTime())) return 'Fecha desconocida';
  return fecha.toLocaleDateString('es-VE');
};

const obtenerBadgeEstado = (estado) => {
  const clave = (estado || 'pendiente').toLowerCase();
  if (ESTADOS_VENTA[clave]) {
    return ESTADOS_VENTA[clave];
  }
  return {
    clase: 'afro-badge afro-badge-warning',
    etiqueta: estado ? estado.charAt(0).toUpperCase() + estado.slice(1) : 'Pendiente',
  };
};

const PanelAdmin = () => {
  const [pestanaActiva, setPestanaActiva] = useState('inventario');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [inventario, setInventario] = useState([]);
  const [cargandoInventario, setCargandoInventario] = useState(true);
  const [errorInventario, setErrorInventario] = useState('');

  const [productoData, setProductoData] = useState(ESTADO_INICIAL_PRODUCTO);
  const [imagen, setImagen] = useState(null);
  const [imagenInstrucciones, setImagenInstrucciones] = useState(null);
  const [imagenConsejos, setImagenConsejos] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEdicion, setIdEdicion] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [cambiandoEstadoId, setCambiandoEstadoId] = useState(null);

  const [ventas, setVentas] = useState([]);
  const [cargandoVentas, setCargandoVentas] = useState(false);
  const [errorVentas, setErrorVentas] = useState('');
  const [actualizandoVentaId, setActualizandoVentaId] = useState(null);
  const [busquedaVentas, setBusquedaVentas] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [paginaVentas, setPaginaVentas] = useState(1);

  const [modalMensaje, setModalMensaje] = useState({ visible: false, texto: '', tipo: 'info' });

  const montadoRef = useRef(true);
  const inputImagenRef = useRef(null);
  const inputImagenInstruccionesRef = useRef(null);
  const inputImagenConsejosRef = useRef(null);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  const cargarInventario = useCallback(async () => {
    setCargandoInventario(true);
    setErrorInventario('');
    try {
      const respuesta = await axios.get(
        `${API_URL}/api/productos/admin`,
        obtenerConfigHeaders()
      );
      if (montadoRef.current) {
        setInventario(Array.isArray(respuesta.data) ? respuesta.data : []);
      }
    } catch (error) {
      console.error('Error al cargar inventario:', error);
      if (montadoRef.current) {
        setErrorInventario('Ocurrió un problema al cargar el inventario.');
      }
    } finally {
      if (montadoRef.current) {
        setCargandoInventario(false);
      }
    }
  }, []);

  const cargarVentas = useCallback(async () => {
    setCargandoVentas(true);
    setErrorVentas('');
    try {
      const respuesta = await axios.get(
        `${API_URL}/api/pedidos/admin/todos`,
        obtenerConfigHeaders()
      );
      if (montadoRef.current) {
        setVentas(Array.isArray(respuesta.data) ? respuesta.data : []);
      }
    } catch (error) {
      console.error('Error al cargar ventas:', error);
      if (montadoRef.current) {
        setErrorVentas('Error al cargar el registro de ventas.');
      }
    } finally {
      if (montadoRef.current) {
        setCargandoVentas(false);
      }
    }
  }, []);

  useEffect(() => {
    if (pestanaActiva === 'inventario') {
      cargarInventario();
    } else if (pestanaActiva === 'ventas' || pestanaActiva === 'metricas') {
      cargarVentas();
    }
  }, [pestanaActiva, cargarInventario, cargarVentas]);

  useEffect(() => {
    if (!modalMensaje.visible) return undefined;

    const manejarEscape = (evento) => {
      if (evento.key === 'Escape') {
        setModalMensaje({ visible: false, texto: '', tipo: 'info' });
      }
    };

    document.addEventListener('keydown', manejarEscape);
    return () => {
      document.removeEventListener('keydown', manejarEscape);
    };
  }, [modalMensaje.visible]);

  const limpiarCamposArchivo = () => {
    setImagen(null);
    setImagenInstrucciones(null);
    setImagenConsejos(null);
    if (inputImagenRef.current) inputImagenRef.current.value = '';
    if (inputImagenInstruccionesRef.current) inputImagenInstruccionesRef.current.value = '';
    if (inputImagenConsejosRef.current) inputImagenConsejosRef.current.value = '';
  };

  const cancelarFormulario = () => {
    setMostrarFormulario(false);
    setModoEdicion(false);
    setIdEdicion(null);
    setProductoData(ESTADO_INICIAL_PRODUCTO);
    limpiarCamposArchivo();
  };

  const cambiarEstadoPedido = async (id_pedido, nuevoEstado) => {
    if (actualizandoVentaId === id_pedido) return;
    setActualizandoVentaId(id_pedido);
    try {
      await axios.patch(
        `${API_URL}/api/pedidos/admin/${id_pedido}/estado`,
        { estado: nuevoEstado },
        obtenerConfigHeaders()
      );
      await cargarVentas();
      if (montadoRef.current) {
        setModalMensaje({
          visible: true,
          texto: 'Estado logístico actualizado con éxito.',
          tipo: 'exito',
        });
      }
    } catch (error) {
      if (montadoRef.current) {
        setModalMensaje({
          visible: true,
          texto: 'No se pudo actualizar el estado del pedido.',
          tipo: 'error',
        });
      }
    } finally {
      if (montadoRef.current) {
        setActualizandoVentaId(null);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProductoData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (enviando) return;

    if (!modoEdicion && !imagen) {
      setModalMensaje({
        visible: true,
        texto: 'Error: Selecciona la fotografía principal para el cosmético.',
        tipo: 'error',
      });
      return;
    }

    setEnviando(true);
    try {
      const formData = new FormData();
      formData.append('nombre', productoData.nombre);
      formData.append('descripcion', productoData.descripcion);
      formData.append('precio', productoData.precio);
      formData.append('stock', productoData.stock);
      formData.append('ingredientes', productoData.ingredientes);
      formData.append('instrucciones_uso', productoData.instrucciones_uso);
      formData.append('consejos', productoData.consejos);
      formData.append('precauciones', productoData.precauciones);

      if (imagen) formData.append('imagen', imagen);
      if (imagenInstrucciones) formData.append('imagen_instrucciones', imagenInstrucciones);
      if (imagenConsejos) formData.append('imagen_consejos', imagenConsejos);

      const { headers } = obtenerConfigHeaders();
      const configMultipart = {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' },
      };

      if (modoEdicion) {
        await axios.put(
          `${API_URL}/api/productos/${idEdicion}`,
          formData,
          configMultipart
        );
        if (montadoRef.current) {
          setModalMensaje({
            visible: true,
            texto: 'Producto actualizado correctamente, incluyendo las imágenes.',
            tipo: 'exito',
          });
        }
      } else {
        await axios.post(`${API_URL}/api/productos`, formData, configMultipart);
        if (montadoRef.current) {
          setModalMensaje({
            visible: true,
            texto: 'Producto creado y publicado exitosamente.',
            tipo: 'exito',
          });
        }
      }

      if (montadoRef.current) {
        cancelarFormulario();
      }
      await cargarInventario();
    } catch (error) {
      console.error('Error:', error);
      if (montadoRef.current) {
        setModalMensaje({
          visible: true,
          texto: error.response?.data?.mensaje || 'Error procesando solicitud.',
          tipo: 'error',
        });
      }
    } finally {
      if (montadoRef.current) {
        setEnviando(false);
      }
    }
  };

  const iniciarEdicion = (producto) => {
    setModoEdicion(true);
    setMostrarFormulario(true);
    setIdEdicion(producto.id_producto);
    setProductoData({
      nombre: producto.nombre || '',
      descripcion: producto.descripcion || '',
      precio: producto.precio ?? '',
      stock: producto.stock ?? '',
      ingredientes: producto.ingredientes || '',
      instrucciones_uso: producto.instrucciones_uso || '',
      consejos: producto.consejos || '',
      precauciones: producto.precauciones || '',
    });
    limpiarCamposArchivo();
    window.scrollTo(0, 0);
  };

  const alternarEstado = async (id, estadoActual) => {
    if (cambiandoEstadoId === id) return;
    const nuevoEstado = estadoActual === 1 ? 0 : 1;
    setCambiandoEstadoId(id);
    try {
      await axios.patch(
        `${API_URL}/api/productos/${id}/estado`,
        { estado: nuevoEstado },
        obtenerConfigHeaders()
      );
      await cargarInventario();
    } catch (error) {
      if (montadoRef.current) {
        setModalMensaje({
          visible: true,
          texto: 'No se pudo cambiar la visibilidad del producto.',
          tipo: 'error',
        });
      }
    } finally {
      if (montadoRef.current) {
        setCambiandoEstadoId(null);
      }
    }
  };

  const { ingresosTotales, totalPedidos, ticketPromedio, datosMensuales, datosTopProductos } =
    useMemo(() => {
      const listaVentas = Array.isArray(ventas) ? ventas : [];

      let totalIngresos = 0;
      const ingresosPorMes = {};
      const conteoProductos = {};

      listaVentas.forEach((venta) => {
        if (!venta || typeof venta !== 'object') return;
        const monto = parseFloat(venta.total);
        const montoValido = Number.isFinite(monto) ? monto : 0;
        totalIngresos += montoValido;

        const fecha = new Date(venta.fecha_pedido);
        if (!Number.isNaN(fecha.getTime())) {
          const mesFormat = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(
            2,
            '0'
          )}`;
          ingresosPorMes[mesFormat] = (ingresosPorMes[mesFormat] || 0) + montoValido;
        }

        if (Array.isArray(venta.detalles)) {
          venta.detalles.forEach((detalle) => {
            if (!detalle || !detalle.nombre) return;
            const cantidad = Number(detalle.cantidad) || 0;
            conteoProductos[detalle.nombre] =
              (conteoProductos[detalle.nombre] || 0) + cantidad;
          });
        }
      });

      const cantidadPedidos = listaVentas.length;
      const promedio = cantidadPedidos > 0 ? totalIngresos / cantidadPedidos : 0;

      const serieMensual = Object.keys(ingresosPorMes)
        .sort()
        .map((llave) => {
          const [anio, mes] = llave.split('-');
          const indiceMes = parseInt(mes, 10) - 1;
          return {
            mes: `${MESES_NOMBRES[indiceMes] || mes} ${anio}`,
            ingresos: parseFloat(ingresosPorMes[llave].toFixed(2)),
          };
        });

      const serieTop = Object.keys(conteoProductos)
        .map((nombre) => ({ nombre, cantidad: conteoProductos[nombre] }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5);

      return {
        ingresosTotales: totalIngresos,
        totalPedidos: cantidadPedidos,
        ticketPromedio: promedio,
        datosMensuales: serieMensual,
        datosTopProductos: serieTop,
      };
    }, [ventas]);

  const ventasProcesadas = useMemo(() => {
    const listaBase = Array.isArray(ventas) ? ventas : [];
    const termino = busquedaVentas.trim().toLowerCase();

    return listaBase.filter((venta) => {
      const idTexto = venta.id_pedido != null ? venta.id_pedido.toString() : '';
      const coincideBusqueda =
        !termino ||
        idTexto.includes(termino) ||
        (venta.cliente_nombre && venta.cliente_nombre.toLowerCase().includes(termino)) ||
        (venta.cliente_email && venta.cliente_email.toLowerCase().includes(termino));

      const coincideEstado = filtroEstado === 'todos' || venta.estado === filtroEstado;
      return coincideBusqueda && coincideEstado;
    });
  }, [ventas, busquedaVentas, filtroEstado]);

  const totalPaginasVentas = useMemo(
    () => Math.ceil(ventasProcesadas.length / VENTAS_POR_PAGINA),
    [ventasProcesadas.length]
  );

  const ventasPaginadas = useMemo(() => {
    const indiceUltimaVenta = paginaVentas * VENTAS_POR_PAGINA;
    const indicePrimeraVenta = indiceUltimaVenta - VENTAS_POR_PAGINA;
    return ventasProcesadas.slice(indicePrimeraVenta, indiceUltimaVenta);
  }, [ventasProcesadas, paginaVentas]);

  const actualizarBusqueda = (valor) => {
    setBusquedaVentas(valor);
    setPaginaVentas(1);
  };

  const actualizarFiltroEstado = (valor) => {
    setFiltroEstado(valor);
    setPaginaVentas(1);
  };

  const cerrarModal = () => {
    setModalMensaje({ visible: false, texto: '', tipo: 'info' });
  };

  return (
    <section className="afro-admin-page" aria-labelledby="panel-admin-titulo">
      <div className="afro-admin-header">
        <h1 id="panel-admin-titulo" className="afro-page-title">
          Panel de Administración
        </h1>
      </div>

      <div className="afro-tabs" role="tablist" aria-label="Secciones de administración">
        <button
          type="button"
          role="tab"
          id="panel-tab-inventario"
          aria-selected={pestanaActiva === 'inventario'}
          aria-controls="panel-section-inventario"
          className="afro-tab-btn"
          onClick={() => setPestanaActiva('inventario')}
        >
          Gestión de Inventario
        </button>

        <button
          type="button"
          role="tab"
          id="panel-tab-ventas"
          aria-selected={pestanaActiva === 'ventas'}
          aria-controls="panel-section-ventas"
          className="afro-tab-btn"
          onClick={() => setPestanaActiva('ventas')}
        >
          Registro de Ventas
        </button>

        <button
          type="button"
          role="tab"
          id="panel-tab-metricas"
          aria-selected={pestanaActiva === 'metricas'}
          aria-controls="panel-section-metricas"
          className="afro-tab-btn"
          onClick={() => setPestanaActiva('metricas')}
        >
          Métricas y Rendimiento
        </button>
      </div>

      {pestanaActiva === 'inventario' ? (
        <div
          role="tabpanel"
          id="panel-section-inventario"
          aria-labelledby="panel-tab-inventario"
          className="afro-admin-page"
        >
          {!mostrarFormulario ? (
            <div className="afro-admin-actions">
              <button
                type="button"
                className="afro-btn afro-btn-primary"
                onClick={() => {
                  setModoEdicion(false);
                  setIdEdicion(null);
                  setProductoData(ESTADO_INICIAL_PRODUCTO);
                  limpiarCamposArchivo();
                  setMostrarFormulario(true);
                }}
              >
                + Agregar Nuevo Cosmético
              </button>
            </div>
          ) : null}

          {mostrarFormulario ? (
            <div className="afro-card afro-admin-form-card">
              <h2 className="afro-admin-form-title">
                {modoEdicion ? 'Editar Producto' : 'Agregar Nuevo Cosmético'}
              </h2>

              <form onSubmit={handleSubmit} className="afro-form-stack">
                <h3 className="afro-admin-form-section">Información Básica (Obligatoria)</h3>

                <div className="afro-field">
                  <label htmlFor="panel-inv-nombre" className="afro-label">
                    Nombre del Producto
                  </label>
                  <input
                    id="panel-inv-nombre"
                    type="text"
                    name="nombre"
                    className="afro-input"
                    placeholder="Nombre del producto"
                    value={productoData.nombre}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="afro-field">
                  <label htmlFor="panel-inv-descripcion" className="afro-label">
                    Descripción General
                  </label>
                  <textarea
                    id="panel-inv-descripcion"
                    name="descripcion"
                    className="afro-textarea"
                    placeholder="Descripción general"
                    value={productoData.descripcion}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="afro-admin-form-grid">
                  <div className="afro-field">
                    <label htmlFor="panel-inv-precio" className="afro-label">
                      Precio ($)
                    </label>
                    <input
                      id="panel-inv-precio"
                      type="number"
                      name="precio"
                      className="afro-input afro-tabular"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      value={productoData.precio}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="afro-field">
                    <label htmlFor="panel-inv-stock" className="afro-label">
                      Unidades en Stock
                    </label>
                    <input
                      id="panel-inv-stock"
                      type="number"
                      name="stock"
                      className="afro-input afro-tabular"
                      placeholder="0"
                      min="0"
                      step="1"
                      value={productoData.stock}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="afro-admin-file-box">
                  <label htmlFor="panel-inv-imagen" className="afro-label">
                    Fotografía Principal{' '}
                    {modoEdicion ? '(Opcional: subir archivo para reemplazar actual)' : '(Obligatoria)'}
                  </label>
                  <input
                    ref={inputImagenRef}
                    id="panel-inv-imagen"
                    type="file"
                    accept="image/*"
                    className="afro-file-input"
                    onChange={(e) => setImagen(e.target.files?.[0] || null)}
                    required={!modoEdicion}
                  />
                </div>

                <h3 className="afro-admin-form-section">Información Detallada (Opcional)</h3>

                <div className="afro-field">
                  <label htmlFor="panel-inv-ingredientes" className="afro-label">
                    Ingredientes
                  </label>
                  <textarea
                    id="panel-inv-ingredientes"
                    name="ingredientes"
                    className="afro-textarea"
                    placeholder="Listado de ingredientes..."
                    value={productoData.ingredientes}
                    onChange={handleChange}
                  />
                </div>

                <div className="afro-field">
                  <label htmlFor="panel-inv-instrucciones" className="afro-label">
                    Instrucciones de Uso
                  </label>
                  <textarea
                    id="panel-inv-instrucciones"
                    name="instrucciones_uso"
                    className="afro-textarea"
                    placeholder="Instrucciones paso a paso..."
                    value={productoData.instrucciones_uso}
                    onChange={handleChange}
                  />
                </div>

                <div className="afro-admin-file-box">
                  <label htmlFor="panel-inv-imagen-instrucciones" className="afro-label">
                    Imagen Complementaria para Instrucciones{' '}
                    {modoEdicion ? '(Opcional: reemplazar actual)' : '(Opcional)'}
                  </label>
                  <input
                    ref={inputImagenInstruccionesRef}
                    id="panel-inv-imagen-instrucciones"
                    type="file"
                    accept="image/*"
                    className="afro-file-input"
                    onChange={(e) => setImagenInstrucciones(e.target.files?.[0] || null)}
                  />
                </div>

                <div className="afro-field">
                  <label htmlFor="panel-inv-consejos" className="afro-label">
                    Consejos de Uso
                  </label>
                  <textarea
                    id="panel-inv-consejos"
                    name="consejos"
                    className="afro-textarea"
                    placeholder="Consejos adicionales de uso..."
                    value={productoData.consejos}
                    onChange={handleChange}
                  />
                </div>

                <div className="afro-admin-file-box">
                  <label htmlFor="panel-inv-imagen-consejos" className="afro-label">
                    Imagen Complementaria para Consejos{' '}
                    {modoEdicion ? '(Opcional: reemplazar actual)' : '(Opcional)'}
                  </label>
                  <input
                    ref={inputImagenConsejosRef}
                    id="panel-inv-imagen-consejos"
                    type="file"
                    accept="image/*"
                    className="afro-file-input"
                    onChange={(e) => setImagenConsejos(e.target.files?.[0] || null)}
                  />
                </div>

                <div className="afro-field">
                  <label htmlFor="panel-inv-precauciones" className="afro-label">
                    Precauciones y Advertencias
                  </label>
                  <textarea
                    id="panel-inv-precauciones"
                    name="precauciones"
                    className="afro-textarea"
                    placeholder="Precauciones y advertencias..."
                    value={productoData.precauciones}
                    onChange={handleChange}
                  />
                </div>

                <div className="afro-admin-form-actions">
                  <button
                    type="submit"
                    disabled={enviando}
                    className={`afro-btn afro-admin-form-submit ${
                      modoEdicion ? 'afro-btn-gold' : 'afro-btn-primary'
                    }`}
                  >
                    {enviando
                      ? modoEdicion
                        ? 'Guardando cambios...'
                        : 'Registrando producto...'
                      : modoEdicion
                        ? 'Guardar Cambios del Producto'
                        : 'Registrar Nuevo Producto'}
                  </button>

                  <button
                    type="button"
                    disabled={enviando}
                    className="afro-btn afro-btn-dark"
                    onClick={cancelarFormulario}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          {cargandoInventario ? (
            <div className="afro-card afro-empty-state" role="status" aria-live="polite">
              <p>Cargando inventario de productos...</p>
            </div>
          ) : errorInventario && inventario.length === 0 ? (
            <div className="afro-card afro-empty-state afro-inline-error" role="alert">
              <h2>No se pudo cargar el inventario</h2>
              <p>{errorInventario}</p>
              <button
                type="button"
                className="afro-btn afro-btn-dark"
                onClick={cargarInventario}
              >
                Reintentar
              </button>
            </div>
          ) : (
            <div className="afro-table-wrapper">
              <table className="afro-table">
                <thead>
                  <tr>
                    <th scope="col">ID</th>
                    <th scope="col">Nombre</th>
                    <th scope="col">Precio</th>
                    <th scope="col">Stock</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {inventario.map((item) => (
                    <tr
                      key={item.id_producto}
                      className={item.estado === 1 ? undefined : 'afro-row-inactive'}
                    >
                      <td className="afro-tabular">{item.id_producto}</td>
                      <td className="afro-table-name">{item.nombre}</td>
                      <td className="afro-tabular">{formatearPrecio(item.precio)}</td>
                      <td className="afro-tabular">{item.stock}</td>
                      <td>
                        <span
                          className={
                            item.estado === 1
                              ? 'afro-badge afro-badge-success'
                              : 'afro-badge afro-badge-danger'
                          }
                        >
                          {item.estado === 1 ? 'Activo' : 'Oculto'}
                        </span>
                      </td>
                      <td>
                        <div className="afro-table-actions">
                          <button
                            type="button"
                            className="afro-btn afro-btn-gold afro-btn-sm"
                            onClick={() => iniciarEdicion(item)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            disabled={cambiandoEstadoId === item.id_producto}
                            className={`afro-btn afro-btn-sm ${
                              item.estado === 1 ? 'afro-btn-danger' : 'afro-btn-success'
                            }`}
                            onClick={() => alternarEstado(item.id_producto, item.estado)}
                          >
                            {cambiandoEstadoId === item.id_producto
                              ? 'Actualizando...'
                              : item.estado === 1
                                ? 'Ocultar'
                                : 'Activar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {pestanaActiva === 'ventas' ? (
        <div
          role="tabpanel"
          id="panel-section-ventas"
          aria-labelledby="panel-tab-ventas"
          className="afro-admin-page"
        >
          <div className="afro-card afro-filter-card">
            <div className="afro-filter-grid afro-filter-grid--two">
              <div className="afro-filter-field">
                <label htmlFor="panel-ventas-busqueda" className="afro-label">
                  Buscar Pedido
                </label>
                <input
                  id="panel-ventas-busqueda"
                  type="search"
                  className="afro-input"
                  placeholder="ID, Nombre o Correo del cliente..."
                  value={busquedaVentas}
                  onChange={(e) => actualizarBusqueda(e.target.value)}
                />
              </div>

              <div className="afro-filter-field">
                <label htmlFor="panel-ventas-estado" className="afro-label">
                  Filtrar por Estado
                </label>
                <select
                  id="panel-ventas-estado"
                  className="afro-select"
                  value={filtroEstado}
                  onChange={(e) => actualizarFiltroEstado(e.target.value)}
                >
                  <option value="todos">Todos los estados</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="pagado">Pagado</option>
                  <option value="enviado">Enviado</option>
                  <option value="entregado">Entregado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>
            </div>
          </div>

          {cargandoVentas ? (
            <div className="afro-card afro-empty-state" role="status" aria-live="polite">
              <p>Cargando registro de ventas...</p>
            </div>
          ) : errorVentas && ventas.length === 0 ? (
            <div className="afro-card afro-empty-state afro-inline-error" role="alert">
              <h2>No se pudo cargar el registro de ventas</h2>
              <p>{errorVentas}</p>
              <button
                type="button"
                className="afro-btn afro-btn-dark"
                onClick={cargarVentas}
              >
                Reintentar
              </button>
            </div>
          ) : ventasProcesadas.length === 0 ? (
            <div className="afro-card afro-empty-state">
              <p>No se encontraron ventas que coincidan con la búsqueda.</p>
            </div>
          ) : (
            <>
              <div className="afro-sales-list">
                {ventasPaginadas.map((venta) => {
                  const badgeEstado = obtenerBadgeEstado(venta.estado);
                  return (
                    <article key={venta.id_pedido} className="afro-sale-card">
                      <div className="afro-sale-header">
                        <div className="afro-sale-meta">
                          <span className="afro-sale-meta-label afro-tabular">
                            Orden #{venta.id_pedido}
                          </span>
                          <span className="afro-sale-meta-value afro-tabular">
                            {formatearFecha(venta.fecha_pedido)}
                          </span>
                        </div>

                        <div className="afro-sale-meta">
                          <span className="afro-sale-meta-label">Cliente</span>
                          <span className="afro-sale-meta-value">{venta.cliente_nombre}</span>
                          {venta.cliente_email ? (
                            <span className="afro-sale-meta-sub">{venta.cliente_email}</span>
                          ) : null}
                        </div>

                        <div className="afro-sale-meta">
                          <span className="afro-sale-meta-label">Estado</span>
                          <div className="afro-sale-status-row">
                            <span className={badgeEstado.clase}>{badgeEstado.etiqueta}</span>
                            <select
                              className="afro-select afro-sale-select"
                              aria-label={`Estado de la orden #${venta.id_pedido}`}
                              value={venta.estado || 'pendiente'}
                              disabled={actualizandoVentaId === venta.id_pedido}
                              onChange={(e) => cambiarEstadoPedido(venta.id_pedido, e.target.value)}
                            >
                              <option value="pendiente">Pendiente</option>
                              <option value="pagado">Pagado</option>
                              <option value="enviado">Enviado</option>
                              <option value="entregado">Entregado</option>
                              <option value="cancelado">Cancelado</option>
                            </select>
                          </div>
                        </div>

                        <div className="afro-sale-meta afro-sale-meta--end">
                          <span className="afro-sale-meta-label">Ingresos</span>
                          <span className="afro-sale-total afro-tabular">
                            {formatearPrecio(venta.total)}
                          </span>
                        </div>
                      </div>

                      <div className="afro-sale-body">
                        <h2 className="afro-sale-body-title">Artículos Vendidos</h2>
                        {Array.isArray(venta.detalles) && venta.detalles.length > 0 ? (
                          <ul className="afro-sale-items">
                            {venta.detalles.map((detalle, idx) => (
                              <li key={detalle.id_detalle || detalle.id_producto || idx}>
                                <span className="afro-tabular">{detalle.cantidad}x</span>{' '}
                                <strong>{detalle.nombre}</strong> -{' '}
                                <span className="afro-tabular">
                                  {formatearPrecio(
                                    (parseFloat(detalle.precio_unitario) || 0) *
                                      (Number(detalle.cantidad) || 0)
                                  )}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="afro-muted-note">Sin detalle de artículos registrado.</p>
                        )}
                      </div>

                      <div className="afro-sale-footer">
                        <div className="afro-sale-meta">
                          <span className="afro-sale-meta-label">Dirección de Entrega</span>
                          <span className="afro-sale-meta-sub">
                            {venta.direccion_envio || 'Dato no registrado en esta orden'}
                          </span>
                        </div>
                        <div className="afro-sale-meta">
                          <span className="afro-sale-meta-label">Teléfono</span>
                          <span className="afro-sale-meta-sub afro-tabular">
                            {venta.telefono_contacto || 'No registrado'}
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {totalPaginasVentas > 1 ? (
                <nav className="afro-pagination" aria-label="Paginación de ventas">
                  <button
                    type="button"
                    className="afro-btn afro-btn-outline afro-page-btn"
                    disabled={paginaVentas === 1}
                    onClick={() => setPaginaVentas((prev) => prev - 1)}
                  >
                    Anterior
                  </button>

                  {Array.from({ length: totalPaginasVentas }, (_, index) => {
                    const numeroPagina = index + 1;
                    const activa = paginaVentas === numeroPagina;
                    return (
                      <button
                        key={numeroPagina}
                        type="button"
                        className={`afro-btn afro-page-btn afro-tabular ${
                          activa ? 'afro-btn-dark' : 'afro-btn-outline'
                        }`}
                        aria-current={activa ? 'page' : undefined}
                        aria-label={`Página ${numeroPagina}`}
                        onClick={() => setPaginaVentas(numeroPagina)}
                      >
                        {numeroPagina}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    className="afro-btn afro-btn-outline afro-page-btn"
                    disabled={paginaVentas === totalPaginasVentas}
                    onClick={() => setPaginaVentas((prev) => prev + 1)}
                  >
                    Siguiente
                  </button>
                </nav>
              ) : null}
            </>
          )}
        </div>
      ) : null}

      {pestanaActiva === 'metricas' ? (
        <div
          role="tabpanel"
          id="panel-section-metricas"
          aria-labelledby="panel-tab-metricas"
          className="afro-admin-page"
        >
          {cargandoVentas ? (
            <div className="afro-card afro-empty-state" role="status" aria-live="polite">
              <p>Calculando métricas financieras...</p>
            </div>
          ) : errorVentas && ventas.length === 0 ? (
            <div className="afro-card afro-empty-state afro-inline-error" role="alert">
              <h2>No se pudieron cargar las métricas</h2>
              <p>{errorVentas}</p>
              <button
                type="button"
                className="afro-btn afro-btn-dark"
                onClick={cargarVentas}
              >
                Reintentar
              </button>
            </div>
          ) : (
            <>
              <div className="afro-kpi-grid">
                <article className="afro-kpi-card afro-kpi-card--success">
                  <h2 className="afro-kpi-label">Ingresos Brutos</h2>
                  <p className="afro-kpi-value afro-kpi-value--success afro-tabular">
                    ${ingresosTotales.toFixed(2)}
                  </p>
                </article>

                <article className="afro-kpi-card afro-kpi-card--rose">
                  <h2 className="afro-kpi-label">Total de Pedidos</h2>
                  <p className="afro-kpi-value afro-kpi-value--rose afro-tabular">
                    {totalPedidos}
                  </p>
                </article>

                <article className="afro-kpi-card afro-kpi-card--gold">
                  <h2 className="afro-kpi-label">Ticket Promedio</h2>
                  <p className="afro-kpi-value afro-kpi-value--gold afro-tabular">
                    ${ticketPromedio.toFixed(2)}
                  </p>
                </article>
              </div>

              <div className="afro-charts-stack">
                <article className="afro-chart-card">
                  <h2 className="afro-chart-title">Evolución de Ingresos Mensuales</h2>
                  {datosMensuales.length > 0 ? (
                    <div className="afro-chart-box">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={datosMensuales}
                          margin={{ top: 16, right: 20, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECE3E6" />
                          <XAxis
                            dataKey="mes"
                            tick={{ fontSize: 12, fill: '#685E62' }}
                            tickMargin={10}
                          />
                          <YAxis
                            tickFormatter={(value) => `$${value}`}
                            tick={{ fontSize: 12, fill: '#685E62' }}
                            width={70}
                          />
                          <Tooltip
                            formatter={(value) => [`$${value}`, 'Ingresos Brutos']}
                            cursor={{ fill: '#FCF2F4' }}
                          />
                          <Bar dataKey="ingresos" fill="#D97A8C" radius={[6, 6, 0, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="afro-empty-state">
                      No hay suficientes datos de ventas registrados.
                    </p>
                  )}
                </article>

                <article className="afro-chart-card">
                  <h2 className="afro-chart-title">Top 5: Productos Más Vendidos</h2>
                  {datosTopProductos.length > 0 ? (
                    <div className="afro-chart-box">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={datosTopProductos}
                          margin={{ top: 16, right: 20, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ECE3E6" />
                          <XAxis
                            dataKey="nombre"
                            tick={{ fontSize: 12, fill: '#685E62' }}
                            tickMargin={10}
                          />
                          <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#685E62' }} />
                          <Tooltip
                            formatter={(value) => [value, 'Unidades Vendidas']}
                            cursor={{ fill: '#FAF7F8' }}
                          />
                          <Bar dataKey="cantidad" fill="#1A1A1A" radius={[6, 6, 0, 0]} barSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="afro-empty-state">
                      No hay suficientes datos de ventas registrados.
                    </p>
                  )}
                </article>
              </div>
            </>
          )}
        </div>
      ) : null}

      {modalMensaje.visible ? (
        <div className="afro-modal-backdrop" onClick={cerrarModal}>
          <div
            className="afro-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="panel-admin-modal-title"
            aria-describedby="panel-admin-modal-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={
                modalMensaje.tipo === 'exito'
                  ? 'afro-modal-icon-success'
                  : modalMensaje.tipo === 'info'
                    ? 'afro-modal-icon-info'
                    : 'afro-modal-icon-danger'
              }
              aria-hidden="true"
            >
              {modalMensaje.tipo === 'exito' ? '✓' : modalMensaje.tipo === 'info' ? 'i' : '!'}
            </div>
            <h2 id="panel-admin-modal-title" className="afro-modal-title">
              {modalMensaje.tipo === 'exito'
                ? 'Operación Exitosa'
                : modalMensaje.tipo === 'info'
                  ? 'Información'
                  : 'Atención Requerida'}
            </h2>
            <p id="panel-admin-modal-desc" className="afro-modal-body">
              {modalMensaje.texto}
            </p>
            <div className="afro-modal-actions">
              <button
                type="button"
                className="afro-btn afro-btn-dark afro-btn-full"
                onClick={cerrarModal}
                autoFocus
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default PanelAdmin;

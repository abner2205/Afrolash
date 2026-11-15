import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

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

const AdminInventario = ({ usuarioActual }) => {
  const [inventario, setInventario] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [productoData, setProductoData] = useState(ESTADO_INICIAL_PRODUCTO);
  const [imagen, setImagen] = useState(null);
  const [imagenInstrucciones, setImagenInstrucciones] = useState(null);
  const [imagenConsejos, setImagenConsejos] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idEdicion, setIdEdicion] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [cambiandoEstadoId, setCambiandoEstadoId] = useState(null);
  const [modalMensaje, setModalMensaje] = useState({ visible: false, texto: '', tipo: 'info' });

  const montadoRef = useRef(true);
  const inputImagenRef = useRef(null);
  const inputImagenInstruccionesRef = useRef(null);
  const inputImagenConsejosRef = useRef(null);

  const esAdmin = usuarioActual?.rol === 'admin';

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  const cargarInventario = useCallback(async () => {
    setCargando(true);
    setErrorCarga('');
    try {
      const respuesta = await axios.get(
        'http://localhost:5000/api/productos/admin',
        obtenerConfigHeaders()
      );
      if (montadoRef.current) {
        setInventario(Array.isArray(respuesta.data) ? respuesta.data : []);
      }
    } catch (error) {
      console.error('Error al cargar inventario:', error);
      if (montadoRef.current) {
        setErrorCarga('Ocurrió un problema al cargar el inventario.');
      }
    } finally {
      if (montadoRef.current) {
        setCargando(false);
      }
    }
  }, []);

  useEffect(() => {
    cargarInventario();
  }, [cargarInventario]);

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

  const abrirNuevoProducto = () => {
    setModoEdicion(false);
    setIdEdicion(null);
    setProductoData(ESTADO_INICIAL_PRODUCTO);
    limpiarCamposArchivo();
    setMostrarFormulario(true);
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
          `http://localhost:5000/api/productos/${idEdicion}`,
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
        await axios.post('http://localhost:5000/api/productos', formData, configMultipart);
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
        `http://localhost:5000/api/productos/${id}/estado`,
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

  const exportarInventarioExcel = async () => {
    if (inventario.length === 0) {
      setModalMensaje({
        visible: true,
        texto: 'El inventario está vacío, no hay datos para exportar.',
        tipo: 'info',
      });
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Inventario');

      worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Nombre del Cosmético', key: 'nombre', width: 40 },
        { header: 'Precio ($)', key: 'precio', width: 15 },
        { header: 'Stock Físico', key: 'stock', width: 15 },
        { header: 'Estado', key: 'estado', width: 15 },
        { header: 'Descripción General', key: 'descripcion', width: 60 },
      ];

      const filaCabecera = worksheet.getRow(1);
      filaCabecera.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      filaCabecera.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1A1A1A' },
      };
      filaCabecera.alignment = { vertical: 'middle', horizontal: 'center' };

      inventario.forEach((item) => {
        worksheet.addRow({
          id: item.id_producto,
          nombre: item.nombre,
          precio: (parseFloat(item.precio) || 0).toFixed(2),
          stock: item.stock,
          estado: item.estado === 1 ? 'ACTIVO' : 'OCULTO',
          descripcion: item.descripcion,
        });
      });

      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } },
          };

          if (rowNumber > 1) {
            cell.alignment = {
              vertical: 'middle',
              horizontal: colNumber === 2 || colNumber === 6 ? 'left' : 'center',
              wrapText: true,
            };
          }
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(blob, 'Inventario_Afrolash.xlsx');
    } catch (error) {
      console.error('Error al exportar inventario a Excel:', error);
      setModalMensaje({
        visible: true,
        texto: 'No se pudo generar el archivo de Excel. Intenta nuevamente.',
        tipo: 'error',
      });
    }
  };

  const cerrarModal = () => {
    setModalMensaje({ visible: false, texto: '', tipo: 'info' });
  };

  return (
    <section className="afro-admin-page" aria-labelledby="admin-inventario-titulo">
      <div className="afro-admin-header">
        <h1 id="admin-inventario-titulo" className="afro-page-title">
          Gestión de Inventario
        </h1>

        <div className="afro-admin-actions">
          <button
            type="button"
            className="afro-btn afro-btn-success"
            onClick={exportarInventarioExcel}
          >
            Descargar Inventario Excel
          </button>

          {!mostrarFormulario && esAdmin ? (
            <button
              type="button"
              className="afro-btn afro-btn-primary"
              onClick={abrirNuevoProducto}
            >
              + Agregar Nuevo Cosmético
            </button>
          ) : null}
        </div>
      </div>

      {mostrarFormulario && esAdmin ? (
        <div className="afro-card afro-admin-form-card">
          <h2 className="afro-admin-form-title">
            {modoEdicion ? 'Editar Producto' : 'Agregar Nuevo Cosmético'}
          </h2>

          <form onSubmit={handleSubmit} className="afro-form-stack">
            <h3 className="afro-admin-form-section">Información Básica (Obligatoria)</h3>

            <div className="afro-field">
              <label htmlFor="inv-nombre" className="afro-label">
                Nombre del Producto
              </label>
              <input
                id="inv-nombre"
                type="text"
                name="nombre"
                className="afro-input"
                placeholder="Ej. Serum Crecimiento Afrolash"
                value={productoData.nombre}
                onChange={handleChange}
                required
              />
            </div>

            <div className="afro-field">
              <label htmlFor="inv-descripcion" className="afro-label">
                Descripción General
              </label>
              <textarea
                id="inv-descripcion"
                name="descripcion"
                className="afro-textarea"
                placeholder="Describe los beneficios y características principales..."
                value={productoData.descripcion}
                onChange={handleChange}
                required
              />
            </div>

            <div className="afro-admin-form-grid">
              <div className="afro-field">
                <label htmlFor="inv-precio" className="afro-label">
                  Precio ($)
                </label>
                <input
                  id="inv-precio"
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
                <label htmlFor="inv-stock" className="afro-label">
                  Unidades en Stock
                </label>
                <input
                  id="inv-stock"
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
              <label htmlFor="inv-imagen" className="afro-label">
                Fotografía Principal{' '}
                {modoEdicion ? '(Opcional: subir archivo para reemplazar actual)' : '(Obligatoria)'}
              </label>
              <input
                ref={inputImagenRef}
                id="inv-imagen"
                type="file"
                accept="image/*"
                className="afro-file-input"
                onChange={(e) => setImagen(e.target.files?.[0] || null)}
                required={!modoEdicion}
              />
            </div>

            <h3 className="afro-admin-form-section">Información Detallada (Opcional)</h3>

            <div className="afro-field">
              <label htmlFor="inv-ingredientes" className="afro-label">
                Ingredientes
              </label>
              <textarea
                id="inv-ingredientes"
                name="ingredientes"
                className="afro-textarea"
                placeholder="Listado de ingredientes..."
                value={productoData.ingredientes}
                onChange={handleChange}
              />
            </div>

            <div className="afro-field">
              <label htmlFor="inv-instrucciones" className="afro-label">
                Instrucciones de Uso
              </label>
              <textarea
                id="inv-instrucciones"
                name="instrucciones_uso"
                className="afro-textarea"
                placeholder="Instrucciones paso a paso..."
                value={productoData.instrucciones_uso}
                onChange={handleChange}
              />
            </div>

            <div className="afro-admin-file-box">
              <label htmlFor="inv-imagen-instrucciones" className="afro-label">
                Imagen Complementaria para Instrucciones{' '}
                {modoEdicion ? '(Opcional: reemplazar actual)' : '(Opcional)'}
              </label>
              <input
                ref={inputImagenInstruccionesRef}
                id="inv-imagen-instrucciones"
                type="file"
                accept="image/*"
                className="afro-file-input"
                onChange={(e) => setImagenInstrucciones(e.target.files?.[0] || null)}
              />
            </div>

            <div className="afro-field">
              <label htmlFor="inv-consejos" className="afro-label">
                Consejos de Uso
              </label>
              <textarea
                id="inv-consejos"
                name="consejos"
                className="afro-textarea"
                placeholder="Consejos adicionales de uso..."
                value={productoData.consejos}
                onChange={handleChange}
              />
            </div>

            <div className="afro-admin-file-box">
              <label htmlFor="inv-imagen-consejos" className="afro-label">
                Imagen Complementaria para Consejos{' '}
                {modoEdicion ? '(Opcional: reemplazar actual)' : '(Opcional)'}
              </label>
              <input
                ref={inputImagenConsejosRef}
                id="inv-imagen-consejos"
                type="file"
                accept="image/*"
                className="afro-file-input"
                onChange={(e) => setImagenConsejos(e.target.files?.[0] || null)}
              />
            </div>

            <div className="afro-field">
              <label htmlFor="inv-precauciones" className="afro-label">
                Precauciones y Advertencias
              </label>
              <textarea
                id="inv-precauciones"
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

      {cargando ? (
        <div className="afro-card afro-empty-state" role="status" aria-live="polite">
          <p>Cargando inventario de productos...</p>
        </div>
      ) : errorCarga && inventario.length === 0 ? (
        <div className="afro-card afro-empty-state afro-inline-error" role="alert">
          <h2>No se pudo cargar el inventario</h2>
          <p>{errorCarga}</p>
          <button
            type="button"
            className="afro-btn afro-btn-dark"
            onClick={cargarInventario}
          >
            Reintentar
          </button>
        </div>
      ) : inventario.length === 0 ? (
        <div className="afro-card afro-empty-state">
          <h2>Sin productos registrados</h2>
          <p>No hay cosméticos cargados en el inventario actualmente.</p>
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
                      {esAdmin ? (
                        <>
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
                        </>
                      ) : (
                        <span className="afro-badge">Solo lectura</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalMensaje.visible ? (
        <div className="afro-modal-backdrop" onClick={cerrarModal}>
          <div
            className="afro-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-inv-modal-title"
            aria-describedby="admin-inv-modal-desc"
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
            <h2 id="admin-inv-modal-title" className="afro-modal-title">
              {modalMensaje.tipo === 'exito'
                ? 'Operación Exitosa'
                : modalMensaje.tipo === 'info'
                  ? 'Información'
                  : 'Atención Requerida'}
            </h2>
            <p id="admin-inv-modal-desc" className="afro-modal-body">
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

export default AdminInventario;

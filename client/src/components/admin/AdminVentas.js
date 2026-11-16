import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import axios from 'axios';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { API_URL } from '../../config/api';

const VENTAS_POR_PAGINA = 10;

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

const AdminVentas = () => {
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [actualizandoId, setActualizandoId] = useState(null);

  const [busquedaVentas, setBusquedaVentas] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const [paginaVentas, setPaginaVentas] = useState(1);
  const [modalMensaje, setModalMensaje] = useState({ visible: false, texto: '', tipo: 'info' });

  const montadoRef = useRef(true);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  const cargarVentas = useCallback(async () => {
    setCargando(true);
    setErrorCarga('');
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
        setErrorCarga('Ocurrió un problema al cargar el registro de ventas.');
      }
    } finally {
      if (montadoRef.current) {
        setCargando(false);
      }
    }
  }, []);

  useEffect(() => {
    cargarVentas();
  }, [cargarVentas]);

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

  const cambiarEstadoPedido = async (id_pedido, nuevoEstado) => {
    if (actualizandoId === id_pedido) return;
    setActualizandoId(id_pedido);
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
        setActualizandoId(null);
      }
    }
  };

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

      let coincideFecha = true;
      if (fechaInicio || fechaFin) {
        const fechaVenta = new Date(venta.fecha_pedido);
        if (Number.isNaN(fechaVenta.getTime())) {
          coincideFecha = false;
        } else {
          fechaVenta.setHours(0, 0, 0, 0);

          if (fechaInicio) {
            const fInicio = new Date(`${fechaInicio}T00:00:00`);
            if (fechaVenta < fInicio) coincideFecha = false;
          }
          if (fechaFin) {
            const fFin = new Date(`${fechaFin}T00:00:00`);
            if (fechaVenta > fFin) coincideFecha = false;
          }
        }
      }

      return coincideBusqueda && coincideEstado && coincideFecha;
    });
  }, [ventas, busquedaVentas, filtroEstado, fechaInicio, fechaFin]);

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

  const actualizarEstadoFiltro = (valor) => {
    setFiltroEstado(valor);
    setPaginaVentas(1);
  };

  const actualizarFechaInicio = (valor) => {
    setFechaInicio(valor);
    setPaginaVentas(1);
  };

  const actualizarFechaFin = (valor) => {
    setFechaFin(valor);
    setPaginaVentas(1);
  };

  const limpiarFiltros = () => {
    setBusquedaVentas('');
    setFiltroEstado('todos');
    setFechaInicio('');
    setFechaFin('');
    setPaginaVentas(1);
  };

  const hayFiltrosActivos = Boolean(
    busquedaVentas || filtroEstado !== 'todos' || fechaInicio || fechaFin
  );

  const exportarAExcel = async () => {
    if (ventasProcesadas.length === 0) {
      setModalMensaje({
        visible: true,
        texto: 'No hay datos para exportar con los filtros actuales.',
        tipo: 'info',
      });
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Reporte de Ventas');

      worksheet.columns = [
        { header: 'N° de Orden', key: 'id', width: 15 },
        { header: 'Fecha', key: 'fecha', width: 15 },
        { header: 'Cliente', key: 'cliente', width: 25 },
        { header: 'Correo', key: 'correo', width: 30 },
        { header: 'Teléfono', key: 'telefono', width: 18 },
        { header: 'Dirección de Envío', key: 'direccion', width: 40 },
        { header: 'Estado', key: 'estado', width: 15 },
        { header: 'Total ($)', key: 'total', width: 15 },
        { header: 'Artículos Adquiridos', key: 'articulos', width: 50 },
      ];

      const filaCabecera = worksheet.getRow(1);
      filaCabecera.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      filaCabecera.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1A1A1A' },
      };
      filaCabecera.alignment = { vertical: 'middle', horizontal: 'center' };

      ventasProcesadas.forEach((venta) => {
        const articulos = Array.isArray(venta.detalles)
          ? venta.detalles.map((d) => `${d.cantidad}x ${d.nombre}`).join(' |\n')
          : '';

        worksheet.addRow({
          id: venta.id_pedido,
          fecha: formatearFecha(venta.fecha_pedido),
          cliente: venta.cliente_nombre,
          correo: venta.cliente_email,
          telefono: venta.telefono_contacto || 'N/A',
          direccion: venta.direccion_envio || 'N/A',
          estado: (venta.estado || 'pendiente').toUpperCase(),
          total: (parseFloat(venta.total) || 0).toFixed(2),
          articulos,
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
              horizontal: colNumber === 6 || colNumber === 9 ? 'left' : 'center',
              wrapText: true,
            };
          }
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(blob, 'Reporte_Ventas_Afrolash.xlsx');
    } catch (error) {
      console.error('Error al exportar ventas a Excel:', error);
      setModalMensaje({
        visible: true,
        texto: 'No se pudo generar el reporte de Excel. Intenta nuevamente.',
        tipo: 'error',
      });
    }
  };

  const cerrarModal = () => {
    setModalMensaje({ visible: false, texto: '', tipo: 'info' });
  };

  return (
    <section className="afro-admin-page" aria-labelledby="admin-ventas-titulo">
      <div className="afro-admin-header">
        <h1 id="admin-ventas-titulo" className="afro-page-title">
          Registro de Ventas
        </h1>

        <div className="afro-admin-actions">
          <button
            type="button"
            className="afro-btn afro-btn-success"
            onClick={exportarAExcel}
          >
            Exportar Registro Actual
          </button>
        </div>
      </div>

      <div className="afro-card afro-filter-card">
        <div className="afro-filter-grid">
          <div className="afro-filter-field">
            <label htmlFor="ventas-busqueda" className="afro-label">
              Buscar (ID, Nombre, Correo)
            </label>
            <input
              id="ventas-busqueda"
              type="search"
              className="afro-input"
              placeholder="Término de búsqueda..."
              value={busquedaVentas}
              onChange={(e) => actualizarBusqueda(e.target.value)}
            />
          </div>

          <div className="afro-filter-field">
            <label htmlFor="ventas-estado" className="afro-label">
              Estado
            </label>
            <select
              id="ventas-estado"
              className="afro-select"
              value={filtroEstado}
              onChange={(e) => actualizarEstadoFiltro(e.target.value)}
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="pagado">Pagado</option>
              <option value="enviado">Enviado</option>
              <option value="entregado">Entregado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>

          <div className="afro-filter-field">
            <label htmlFor="ventas-fecha-inicio" className="afro-label">
              Fecha Inicio
            </label>
            <input
              id="ventas-fecha-inicio"
              type="date"
              className="afro-input"
              value={fechaInicio}
              onChange={(e) => actualizarFechaInicio(e.target.value)}
            />
          </div>

          <div className="afro-filter-field">
            <label htmlFor="ventas-fecha-fin" className="afro-label">
              Fecha Fin
            </label>
            <input
              id="ventas-fecha-fin"
              type="date"
              className="afro-input"
              value={fechaFin}
              onChange={(e) => actualizarFechaFin(e.target.value)}
            />
          </div>
        </div>

        <div className="afro-filter-footer">
          <span className="afro-tabular">
            Mostrando {ventasProcesadas.length} {ventasProcesadas.length === 1 ? 'orden' : 'órdenes'}
          </span>
          {hayFiltrosActivos ? (
            <button
              type="button"
              className="afro-btn afro-btn-ghost afro-btn-sm"
              onClick={limpiarFiltros}
            >
              Limpiar filtros
            </button>
          ) : null}
        </div>
      </div>

      {cargando ? (
        <div className="afro-card afro-empty-state" role="status" aria-live="polite">
          <p>Cargando registro de ventas...</p>
        </div>
      ) : errorCarga && ventas.length === 0 ? (
        <div className="afro-card afro-empty-state afro-inline-error" role="alert">
          <h2>No se pudo cargar el registro de ventas</h2>
          <p>{errorCarga}</p>
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
          <h2>Sin resultados</h2>
          <p>No se encontraron ventas que coincidan con los filtros aplicados.</p>
          {hayFiltrosActivos ? (
            <div className="afro-empty-action">
              <button
                type="button"
                className="afro-btn afro-btn-outline"
                onClick={limpiarFiltros}
              >
                Restablecer filtros
              </button>
            </div>
          ) : null}
        </div>
      ) : (
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
                        disabled={actualizandoId === venta.id_pedido}
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
                          <strong>{detalle.nombre}</strong>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="afro-muted-note">Sin detalle de artículos registrado.</p>
                  )}
                </div>

                {venta.direccion_envio || venta.telefono_contacto ? (
                  <div className="afro-sale-footer">
                    <div className="afro-sale-meta">
                      <span className="afro-sale-meta-label">Dirección de Entrega</span>
                      <span className="afro-sale-meta-sub">
                        {venta.direccion_envio || 'No registrada'}
                      </span>
                    </div>
                    <div className="afro-sale-meta">
                      <span className="afro-sale-meta-label">Teléfono</span>
                      <span className="afro-sale-meta-sub afro-tabular">
                        {venta.telefono_contacto || 'No registrado'}
                      </span>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

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

      {modalMensaje.visible ? (
        <div className="afro-modal-backdrop" onClick={cerrarModal}>
          <div
            className="afro-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-ventas-modal-title"
            aria-describedby="admin-ventas-modal-desc"
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
            <h2 id="admin-ventas-modal-title" className="afro-modal-title">
              {modalMensaje.tipo === 'exito'
                ? 'Operación Exitosa'
                : modalMensaje.tipo === 'info'
                  ? 'Información'
                  : 'Atención Requerida'}
            </h2>
            <p id="admin-ventas-modal-desc" className="afro-modal-body">
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

export default AdminVentas;

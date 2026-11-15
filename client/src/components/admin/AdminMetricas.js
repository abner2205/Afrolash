import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

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

const leerTokenSeguro = () => {
  try {
    return localStorage.getItem('token');
  } catch (error) {
    return null;
  }
};

const AdminMetricas = () => {
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
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
      const token = leerTokenSeguro();
      const respuesta = await axios.get('http://localhost:5000/api/pedidos/admin/todos', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (montadoRef.current) {
        setVentas(Array.isArray(respuesta.data) ? respuesta.data : []);
      }
    } catch (error) {
      console.error('Error al cargar ventas para métricas:', error);
      if (montadoRef.current) {
        setErrorCarga('Ocurrió un problema al cargar las métricas financieras.');
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

  return (
    <section className="afro-admin-page" aria-labelledby="admin-metricas-titulo">
      <div className="afro-admin-header">
        <h1 id="admin-metricas-titulo" className="afro-page-title">
          Métricas y Rendimiento
        </h1>
      </div>

      {cargando ? (
        <div className="afro-card afro-empty-state" role="status" aria-live="polite">
          <p>Calculando métricas financieras...</p>
        </div>
      ) : errorCarga ? (
        <div className="afro-card afro-empty-state afro-inline-error" role="alert">
          <h2>No se pudieron cargar las métricas</h2>
          <p>{errorCarga}</p>
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
                      <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#685E62' }} tickMargin={10} />
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
                <p className="afro-empty-state">Faltan datos de ventas para mostrar la serie mensual.</p>
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
    </section>
  );
};

export default AdminMetricas;

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import axios from 'axios';
import AdminInventario from './components/admin/AdminInventario';
import AdminVentas from './components/admin/AdminVentas';
import AdminMetricas from './components/admin/AdminMetricas';
import AdminUsuarios from './components/admin/AdminUsuarios';
import PanelAdmin from './components/PanelAdmin';

jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
}));

jest.mock('file-saver', () => ({
  saveAs: jest.fn(),
}));

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="recharts-container">{children}</div>,
  BarChart: ({ data, children }) => (
    <div data-testid="recharts-barchart" data-points={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Bar: ({ dataKey }) => <div data-testid={`recharts-bar-${dataKey}`} />,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

const inventarioMock = [
  {
    id_producto: 1,
    nombre: 'Serum Crecimiento Afrolash',
    descripcion: 'Serum nutritivo para pestañas.',
    precio: '28.50',
    stock: 12,
    estado: 1,
    ingredientes: 'Ricino y biotina',
    instrucciones_uso: 'Aplicar de noche.',
    consejos: 'Usar con rostro limpio.',
    precauciones: 'Uso externo.',
  },
  {
    id_producto: 2,
    nombre: 'Rímel Noir',
    descripcion: 'Rímel resistente al agua.',
    precio: '18.00',
    stock: 0,
    estado: 0,
  },
];

const ventasMock = [
  {
    id_pedido: 101,
    fecha_pedido: '2026-03-10T14:00:00.000Z',
    cliente_nombre: 'Camila Rojas',
    cliente_email: 'camila@afrolash.com',
    telefono_contacto: '3001112233',
    direccion_envio: 'Calle 10 #5-20',
    estado: 'pagado',
    total: '60.00',
    detalles: [
      { nombre: 'Serum Crecimiento Afrolash', cantidad: 2, precio_unitario: '30.00' },
    ],
  },
  {
    id_pedido: 102,
    fecha_pedido: '2026-04-15T14:00:00.000Z',
    cliente_nombre: 'Valeria Díaz',
    cliente_email: 'valeria@afrolash.com',
    telefono_contacto: '3104445566',
    direccion_envio: 'Av. 8 #12-30',
    estado: 'entregado',
    total: '45.00',
    detalles: [
      { nombre: 'Rímel Noir', cantidad: 3, precio_unitario: '15.00' },
    ],
  },
  {
    id_pedido: 103,
    fecha_pedido: '2026-04-20T14:00:00.000Z',
    cliente_nombre: 'Sofía Méndez',
    cliente_email: 'sofia@afrolash.com',
    telefono_contacto: '3207778899',
    direccion_envio: 'Carrera 15 #40-10',
    estado: 'pendiente',
    total: '45.00',
    detalles: [
      { nombre: 'Serum Crecimiento Afrolash', cantidad: 1, precio_unitario: '45.00' },
    ],
  },
];

const usuariosMock = [
  {
    id_usuario: 1,
    nombre_completo: 'María Admin',
    correo: 'admin@afrolash.com',
    rol: 'admin',
    telefono: '3000000001',
  },
  {
    id_usuario: 2,
    nombre_completo: 'Lucía Empleada',
    correo: 'lucia@afrolash.com',
    rol: 'empleado',
    telefono: '3000000002',
  },
  {
    id_usuario: 3,
    nombre_completo: 'Elena Cliente',
    correo: 'elena@afrolash.com',
    rol: 'cliente',
    telefono: '',
  },
];

describe('T5 — Módulos Operativos y de Administración', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('token', 'token-admin-test');
    window.scrollTo = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('AdminInventario', () => {
    it('mantiene vista estrictamente de solo lectura para rol empleado y envuelve tabla responsiva', async () => {
      axios.get.mockResolvedValueOnce({ data: inventarioMock });

      const { container } = render(
        <AdminInventario usuarioActual={{ rol: 'empleado', nombre_completo: 'Lucía' }} />
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('http://localhost:5000/api/productos/admin', {
          headers: { Authorization: 'Bearer token-admin-test' },
        });
      });

      expect(await screen.findByText('Serum Crecimiento Afrolash')).toBeInTheDocument();

      const wrapper = container.querySelector('.afro-table-wrapper');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper.querySelector('table.afro-table')).toBeInTheDocument();

      expect(screen.getByRole('button', { name: /Descargar Inventario Excel/i })).toBeInTheDocument();

      expect(screen.queryByRole('button', { name: /Agregar Nuevo Cosmético/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Editar/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Ocultar/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Activar/i })).not.toBeInTheDocument();
      expect(screen.getAllByText(/Solo lectura/i)).toHaveLength(2);
    });

    it('asocia etiquetas en formulario admin, previene envíos múltiples, tolera localStorage y cierra modal con Escape', async () => {
      axios.get.mockResolvedValue({ data: inventarioMock });

      render(<AdminInventario usuarioActual={{ rol: 'admin', nombre_completo: 'María' }} />);

      const btnAgregar = await screen.findByRole('button', { name: /\+ Agregar Nuevo Cosmético/i });
      fireEvent.click(btnAgregar);

      const inputNombre = screen.getByLabelText(/Nombre del Producto/i);
      const inputDesc = screen.getByLabelText(/Descripción General/i);
      const inputPrecio = screen.getByLabelText(/Precio \(\$\)/i);
      const inputStock = screen.getByLabelText(/Unidades en Stock/i);
      const inputImagen = screen.getByLabelText(/Fotografía Principal/i);

      expect(inputNombre).toHaveAttribute('id');
      expect(inputDesc).toHaveAttribute('id');
      expect(inputPrecio).toHaveAttribute('id');
      expect(inputStock).toHaveAttribute('id');
      expect(inputImagen).toHaveAttribute('id');
      expect(screen.getByLabelText(/Ingredientes/i)).toHaveAttribute('id');
      expect(screen.getByLabelText(/^Instrucciones de Uso/i)).toHaveAttribute('id');
      expect(screen.getByLabelText(/^Consejos de Uso/i)).toHaveAttribute('id');
      expect(screen.getByLabelText(/Precauciones y Advertencias/i)).toHaveAttribute('id');

      fireEvent.change(inputNombre, { target: { value: 'Aceite de Cejas' } });
      fireEvent.change(inputDesc, { target: { value: 'Aceite fortalecedor.' } });
      fireEvent.change(inputPrecio, { target: { value: '22.50' } });
      fireEvent.change(inputStock, { target: { value: '15' } });

      const form = screen.getByRole('button', { name: /Registrar Nuevo Producto/i }).closest('form');
      fireEvent.submit(form);

      const modalFaltaImg = await screen.findByRole('dialog');
      expect(modalFaltaImg).toHaveAttribute('aria-modal', 'true');
      expect(modalFaltaImg).toHaveAttribute('aria-labelledby');
      expect(modalFaltaImg).toHaveTextContent(/fotografía principal/i);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      const archivo = new File(['img'], 'aceite.png', { type: 'image/png' });
      fireEvent.change(inputImagen, { target: { files: [archivo] } });

      let resolverPost;
      axios.post.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolverPost = resolve;
          })
      );

      fireEvent.submit(form);
      fireEvent.submit(form);

      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('button', { name: /Registrando producto\.\.\./i })).toBeDisabled();

      resolverPost({ data: { ok: true } });

      const modalExito = await screen.findByRole('dialog');
      expect(modalExito).toHaveTextContent(/Producto creado y publicado exitosamente/i);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('Storage denied');
      });
      axios.patch.mockResolvedValueOnce({ data: { ok: true } });
      const botonesOcultar = screen.getAllByRole('button', { name: /Ocultar/i });
      fireEvent.click(botonesOcultar[0]);

      await waitFor(() => {
        expect(axios.patch).toHaveBeenCalledWith(
          'http://localhost:5000/api/productos/1/estado',
          { estado: 0 },
          { headers: { Authorization: 'Bearer null' } }
        );
      });
    });
  });

  describe('AdminVentas', () => {
    it('etiqueta los 4 filtros y selects por orden, filtra con useMemo, cambia estado y cierra modal con Escape', async () => {
      axios.get.mockResolvedValue({ data: ventasMock });

      render(<AdminVentas />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('http://localhost:5000/api/pedidos/admin/todos', {
          headers: { Authorization: 'Bearer token-admin-test' },
        });
      });

      const inputBuscar = screen.getByLabelText(/Buscar \(ID, Nombre, Correo\)/i);
      const selectEstado = screen.getByLabelText(/^Estado$/i);
      const inputInicio = screen.getByLabelText(/Fecha Inicio/i);
      const inputFin = screen.getByLabelText(/Fecha Fin/i);

      expect(inputBuscar).toHaveAttribute('id');
      expect(selectEstado).toHaveAttribute('id');
      expect(inputInicio).toHaveAttribute('id');
      expect(inputFin).toHaveAttribute('id');

      expect(screen.getByText(/ORDEN #101/i)).toBeInTheDocument();
      expect(screen.getByText(/ORDEN #102/i)).toBeInTheDocument();
      expect(screen.getByText(/ORDEN #103/i)).toBeInTheDocument();

      fireEvent.change(inputBuscar, { target: { value: 'Valeria' } });
      expect(screen.queryByText(/ORDEN #101/i)).not.toBeInTheDocument();
      expect(screen.getByText(/ORDEN #102/i)).toBeInTheDocument();

      fireEvent.change(inputBuscar, { target: { value: '' } });
      fireEvent.change(selectEstado, { target: { value: 'pendiente' } });
      expect(screen.queryByText(/ORDEN #101/i)).not.toBeInTheDocument();
      expect(screen.getByText(/ORDEN #103/i)).toBeInTheDocument();

      fireEvent.change(selectEstado, { target: { value: 'todos' } });

      fireEvent.change(inputInicio, { target: { value: '2026-04-01' } });
      fireEvent.change(inputFin, { target: { value: '2026-04-18' } });
      expect(screen.queryByText(/ORDEN #101/i)).not.toBeInTheDocument();
      expect(screen.getByText(/ORDEN #102/i)).toBeInTheDocument();
      expect(screen.queryByText(/ORDEN #103/i)).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Limpiar filtros/i }));
      expect(screen.getByText(/ORDEN #101/i)).toBeInTheDocument();
      expect(screen.getByText(/ORDEN #103/i)).toBeInTheDocument();

      const selectOrden103 = screen.getByLabelText('Estado de la orden #103');
      axios.patch.mockResolvedValueOnce({ data: { ok: true } });
      fireEvent.change(selectOrden103, { target: { value: 'enviado' } });

      await waitFor(() => {
        expect(axios.patch).toHaveBeenCalledWith(
          'http://localhost:5000/api/pedidos/admin/103/estado',
          { estado: 'enviado' },
          { headers: { Authorization: 'Bearer token-admin-test' } }
        );
      });

      const modal = await screen.findByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby');

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('muestra estado de error con botón de reintento si falla la carga de ventas', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      axios.get.mockRejectedValueOnce(new Error('Network Error'));

      render(<AdminVentas />);

      expect(await screen.findByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reintentar/i })).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('AdminMetricas', () => {
    it('calcula y memoriza KPIs y series Recharts con tolerancia defensiva ante datos', async () => {
      axios.get.mockResolvedValueOnce({ data: ventasMock });

      const { container } = render(<AdminMetricas />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('http://localhost:5000/api/pedidos/admin/todos', {
          headers: { Authorization: 'Bearer token-admin-test' },
        });
      });

      expect(await screen.findByText('$150.00')).toHaveClass('afro-kpi-value', 'afro-tabular');

      const kpiGrid = container.querySelector('.afro-kpi-grid');
      expect(kpiGrid).toBeInTheDocument();
      expect(container.querySelectorAll('.afro-kpi-card')).toHaveLength(3);

      expect(screen.getByText('3')).toHaveClass('afro-kpi-value', 'afro-tabular');
      expect(screen.getByText('$50.00')).toHaveClass('afro-kpi-value', 'afro-tabular');

      const charts = screen.getAllByTestId('recharts-barchart');
      expect(charts).toHaveLength(2);
      const topProductos = JSON.parse(charts[1].getAttribute('data-points'));
      expect(topProductos[0]).toEqual({ nombre: 'Serum Crecimiento Afrolash', cantidad: 3 });
      expect(topProductos[1]).toEqual({ nombre: 'Rímel Noir', cantidad: 3 });
    });

    it('maneja errores de red y respuestas no-arreglo sin lanzar excepciones', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      axios.get.mockRejectedValueOnce(new Error('Network Error'));

      render(<AdminMetricas />);

      const alerta = await screen.findByRole('alert');
      expect(alerta).toBeInTheDocument();

      axios.get.mockResolvedValueOnce({ data: null });
      fireEvent.click(screen.getByRole('button', { name: /Reintentar/i }));

      expect(await screen.findAllByText('$0.00')).toHaveLength(2);
      consoleErrorSpy.mockRestore();
    });
  });

  describe('AdminUsuarios', () => {
    it('reemplaza window.confirm por un modal accesible al revocar acceso y asocia labels en el alta de empleados', async () => {
      axios.get.mockResolvedValue({ data: usuariosMock });
      const confirmSpy = jest.spyOn(window, 'confirm').mockImplementation(() => true);

      const { container } = render(<AdminUsuarios />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('http://localhost:5000/api/usuarios/admin/todos', {
          headers: { Authorization: 'Bearer token-admin-test' },
        });
      });

      expect(await screen.findByText('Lucía Empleada')).toBeInTheDocument();
      expect(container.querySelector('.afro-table-wrapper table.afro-table')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Revocar Acceso/i }));
      expect(confirmSpy).not.toHaveBeenCalled();

      const modalConfirm = screen.getByRole('dialog');
      expect(modalConfirm).toHaveAttribute('aria-modal', 'true');
      expect(modalConfirm).toHaveAttribute('aria-labelledby');
      expect(modalConfirm).toHaveTextContent(/Lucía Empleada/i);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(axios.delete).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole('button', { name: /Revocar Acceso/i }));
      const modalConfirm2 = screen.getByRole('dialog');
      axios.delete.mockResolvedValueOnce({ data: { ok: true } });
      fireEvent.click(within(modalConfirm2).getByRole('button', { name: /Sí, revocar acceso/i }));

      await waitFor(() => {
        expect(axios.delete).toHaveBeenCalledWith(
          'http://localhost:5000/api/usuarios/admin/empleado/2',
          { headers: { Authorization: 'Bearer token-admin-test' } }
        );
      });
      expect(confirmSpy).not.toHaveBeenCalled();

      expect(await screen.findByText(/Cuenta de empleado eliminada correctamente/i)).toBeInTheDocument();
      const modalExitoRevocacion = screen.getByRole('dialog');
      expect(modalExitoRevocacion).toHaveAttribute('aria-modal', 'true');
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /\+ Registrar Nuevo Empleado/i }));

      const inputNombre = screen.getByLabelText(/Nombre Completo/i);
      const inputCorreo = screen.getByLabelText(/Correo Electrónico/i);
      const inputTel = screen.getByLabelText(/Teléfono de Contacto/i);
      const inputDir = screen.getByLabelText(/Dirección de Residencia/i);

      expect(inputNombre).toHaveAttribute('id');
      expect(inputCorreo).toHaveAttribute('id');
      expect(inputTel).toHaveAttribute('id');
      expect(inputDir).toHaveAttribute('id');

      fireEvent.change(inputNombre, { target: { value: 'Carlos Pérez' } });
      fireEvent.change(inputCorreo, { target: { value: 'carlos@afrolash.com' } });
      fireEvent.change(inputTel, { target: { value: '3151234567' } });

      let resolverPost;
      axios.post.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolverPost = resolve;
          })
      );

      const form = screen
        .getByRole('button', { name: /Generar Credenciales y Registrar/i })
        .closest('form');
      fireEvent.submit(form);
      fireEvent.submit(form);

      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('button', { name: /Registrando empleado\.\.\./i })).toBeDisabled();

      resolverPost({ data: { ok: true } });
      expect(await screen.findByRole('dialog')).toHaveTextContent(/Empleado creado exitosamente/i);
    });
  });

  describe('PanelAdmin', () => {
    it('expone pestañas accesibles, tabla responsiva, filtros etiquetados y KPIs memorizados', async () => {
      axios.get.mockImplementation((url) => {
        if (url.includes('/api/productos/admin')) {
          return Promise.resolve({ data: inventarioMock });
        }
        if (url.includes('/api/pedidos/admin/todos')) {
          return Promise.resolve({ data: ventasMock });
        }
        return Promise.resolve({ data: [] });
      });

      const { container } = render(<PanelAdmin />);

      const tablist = screen.getByRole('tablist');
      expect(tablist).toBeInTheDocument();
      const tabInv = screen.getByRole('tab', { name: /Gestión de Inventario/i });
      const tabVentas = screen.getByRole('tab', { name: /Registro de Ventas/i });
      const tabMetricas = screen.getByRole('tab', { name: /Métricas y Rendimiento/i });

      expect(tabInv).toHaveAttribute('aria-selected', 'true');
      expect(tabVentas).toHaveAttribute('aria-selected', 'false');

      await waitFor(() => {
        expect(screen.getByText('Serum Crecimiento Afrolash')).toBeInTheDocument();
      });
      expect(container.querySelector('.afro-table-wrapper table.afro-table')).toBeInTheDocument();

      fireEvent.click(tabVentas);
      expect(tabVentas).toHaveAttribute('aria-selected', 'true');

      expect(await screen.findByText(/ORDEN #101/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Buscar Pedido/i)).toHaveAttribute('id');
      expect(screen.getByLabelText(/Filtrar por Estado/i)).toHaveAttribute('id');
      expect(screen.getByLabelText('Estado de la orden #101')).toBeInTheDocument();

      fireEvent.click(tabMetricas);
      expect(tabMetricas).toHaveAttribute('aria-selected', 'true');
      expect(await screen.findByText('$150.00')).toHaveClass('afro-kpi-value', 'afro-tabular');
      expect(screen.getAllByTestId('recharts-barchart')).toHaveLength(2);
    });
  });
});

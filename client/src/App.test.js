import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import App from './App';

jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  interceptors: {
    response: {
      use: jest.fn(() => 1),
      eject: jest.fn(),
    },
  },
}));

describe('Pruebas del Marco Global de Afrolash (App)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({ data: [] });
    axios.interceptors.response.use.mockReturnValue(1);
    localStorage.clear();
    window.history.replaceState({}, '', '/');
    window.scrollTo = jest.fn();
  });

  it('renderiza la cabecera accesible, pie de página con botones legales y enlace de WhatsApp', async () => {
    render(<App />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('http://localhost:5000/api/productos');
    });

    expect(screen.getByRole('button', { name: /Ir al inicio de Afrolash/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Carrito \(0\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ingresar/i })).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: /Afrolash C\.A\./i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Términos y Condiciones/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Políticas de Privacidad/i })).toBeInTheDocument();

    const whatsappLink = screen.getByRole('link', { name: /Contactar por WhatsApp/i });
    expect(whatsappLink).toBeInTheDocument();
    expect(whatsappLink).toHaveAttribute('href', expect.stringContaining('https://wa.me/'));

    expect(screen.getByRole('link', { name: /Instagram/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Facebook/i })).toBeInTheDocument();
  });

  it('tolera datos corruptos en localStorage sin lanzar errores al iniciar', async () => {
    localStorage.setItem('carritoAfrolash', '{json-corrupto');
    localStorage.setItem('usuario', 'usuario-invalido');

    render(<App />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });

    expect(screen.getByRole('button', { name: /Carrito \(0\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ingresar/i })).toBeInTheDocument();
  });

  it('abre el drawer de cuenta como diálogo accesible y lo cierra con la tecla Escape', async () => {
    localStorage.setItem(
      'usuario',
      JSON.stringify({ nombre_completo: 'Camila Rojas', rol: 'cliente' })
    );

    render(<App />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Mi Cuenta/i }));

    const drawer = screen.getByRole('dialog', { name: /Menú de usuario y operaciones/i });
    expect(drawer).toBeInTheDocument();
    expect(drawer).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('button', { name: /Cerrar menú/i })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(
      screen.queryByRole('dialog', { name: /Menú de usuario y operaciones/i })
    ).not.toBeInTheDocument();
  });

  it('muestra el buscador accesible en la tienda y una alerta accesible al exceder el stock', async () => {
    const productoMock = {
      id_producto: 1,
      nombre: 'Rímel Volumen Afrolash',
      precio: '18.00',
      stock: 1,
      imagen_url: '/img/rimel.jpg',
      categoria: 'Ojos',
    };

    localStorage.setItem(
      'carritoAfrolash',
      JSON.stringify([{ ...productoMock, cantidad: 1 }])
    );
    axios.get.mockResolvedValue({ data: [productoMock] });

    render(<App />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Explorar Catálogo/i }));

    const buscador = await screen.findByRole('searchbox', {
      name: /Buscar cosméticos, marcas o tonos/i,
    });
    expect(buscador).toBeInTheDocument();

    const btnAgregar = await screen.findByRole('button', { name: /Agregar al Carrito/i });
    fireEvent.click(btnAgregar);

    const alertaStock = await screen.findByRole('alertdialog');
    expect(alertaStock).toHaveAttribute('aria-modal', 'true');
    expect(alertaStock).toHaveTextContent(/stock máximo/i);

    fireEvent.click(screen.getByRole('button', { name: /Entendido/i }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    fireEvent.click(btnAgregar);
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('navega de forma accesible hacia Términos, Privacidad, Login y Carrito', async () => {
    render(<App />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('http://localhost:5000/api/productos');
    });

    // Navegación desde el footer: Términos y Condiciones
    fireEvent.click(screen.getByRole('button', { name: /Términos y Condiciones/i }));
    expect(
      await screen.findByRole('heading', { level: 1, name: /Términos y Condiciones de Uso/i })
    ).toBeInTheDocument();

    // Navegación desde el footer: Políticas de Privacidad
    fireEvent.click(screen.getByRole('button', { name: /Políticas de Privacidad/i }));
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: /Políticas de Privacidad y Tratamiento de Datos/i,
      })
    ).toBeInTheDocument();

    // Navegación hacia Login desde la cabecera
    fireEvent.click(screen.getByRole('button', { name: /Ingresar/i }));
    expect(
      await screen.findByRole('heading', { level: 1, name: /Iniciar Sesión/i })
    ).toBeInTheDocument();

    // Navegación hacia Carrito desde la cabecera
    fireEvent.click(screen.getByRole('button', { name: /Carrito \(0\)/i }));
    expect(
      await screen.findByRole('heading', { name: /Tu carrito está vacío/i })
    ).toBeInTheDocument();
  });

  it('aplica control de acceso por rol en el drawer y permite cerrar sesión limpiamente', async () => {
    // 1. Rol empleado: ve Inventario y Pedidos, pero NO Métricas Financieras ni Gestión de Usuarios
    localStorage.setItem(
      'usuario',
      JSON.stringify({ nombre_completo: 'Elena Empleada', rol: 'empleado' })
    );
    localStorage.setItem('token', 'jwt-empleado');

    const { unmount } = render(<App />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Mi Cuenta/i }));

    const drawerEmpleado = screen.getByRole('dialog', { name: /Menú de usuario y operaciones/i });
    expect(drawerEmpleado).toBeInTheDocument();
    expect(screen.getByText('Elena Empleada')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Consulta de Inventario/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gestión de Pedidos/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Métricas Financieras/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Gestión de Usuarios/i })).not.toBeInTheDocument();

    // Cerrar sesión
    fireEvent.click(screen.getByRole('button', { name: /Cerrar Sesión/i }));
    expect(
      screen.queryByRole('dialog', { name: /Menú de usuario y operaciones/i })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ingresar/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Mi Cuenta/i })).not.toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('usuario')).toBeNull();

    unmount();

    // 2. Rol admin: ve las 4 opciones de operaciones en el drawer
    localStorage.setItem(
      'usuario',
      JSON.stringify({ nombre_completo: 'Administradora Afrolash', rol: 'admin' })
    );
    localStorage.setItem('token', 'jwt-admin');

    render(<App />);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: /Mi Cuenta/i }));

    const drawerAdmin = screen.getByRole('dialog', { name: /Menú de usuario y operaciones/i });
    expect(drawerAdmin).toBeInTheDocument();
    expect(screen.getByText('Administradora Afrolash')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Consulta de Inventario/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gestión de Pedidos/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Métricas Financieras/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Gestión de Usuarios/i })).toBeInTheDocument();
  });
});

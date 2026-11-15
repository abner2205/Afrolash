import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import { useStripe, useElements } from '@stripe/react-stripe-js';
import Carrito from './components/Carrito';

jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
}));

jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve({})),
}));

jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }) => <div data-testid="stripe-elements">{children}</div>,
  CardElement: () => <div data-testid="stripe-card-element" />,
  useStripe: jest.fn(),
  useElements: jest.fn(),
}));

const calcularTotal = (productos) => {
  return productos.reduce((total, item) => total + item.precio * item.cantidad, 0);
};

const carritoMock = [
  {
    id_producto: 1,
    nombre: 'Pestañas Volumen',
    precio: '15.00',
    cantidad: 2,
    imagen_url: '/img/pestanas.jpg',
  },
  {
    id_producto: 2,
    nombre: 'Pegamento Quirúrgico',
    precio: '20.00',
    cantidad: 1,
    imagen_url: '/img/pegamento.jpg',
  },
];

describe('Pruebas de Funcionalidad: Carrito de Compras', () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    window.scrollTo = jest.fn();
    URL.createObjectURL = jest.fn(() => 'blob:http://localhost/factura-test');
    URL.revokeObjectURL = jest.fn();
    useStripe.mockReturnValue({
      confirmCardPayment: jest.fn(),
    });
    useElements.mockReturnValue({
      getElement: jest.fn(() => ({})),
    });
  });

  afterAll(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('Debería calcular el total exacto de los cosméticos añadidos', () => {
    const productosCalculo = [
      { id: 1, nombre: 'Pestañas Volumen', precio: 15.0, cantidad: 2 },
      { id: 2, nombre: 'Pegamento Quirúrgico', precio: 20.0, cantidad: 1 },
    ];

    const totalCalculado = calcularTotal(productosCalculo);

    expect(totalCalculado).toBe(50.0);
  });

  it('muestra estado vacío cuando no hay productos y oculta el stepper', () => {
    render(
      <Carrito
        carrito={[]}
        eliminarDelCarrito={jest.fn()}
        volver={jest.fn()}
        navegarA={jest.fn()}
        vaciarCarrito={jest.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: /Tu carrito está vacío/i })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: /Progreso/i })).not.toBeInTheDocument();
  });

  it('tolera JSON corrupto en localStorage, renderiza stepper en etapa 1, miniaturas lazy y modal login con Escape', () => {
    localStorage.setItem('usuario', '{corrupto');
    const eliminarDelCarrito = jest.fn();

    render(
      <Carrito
        carrito={carritoMock}
        eliminarDelCarrito={eliminarDelCarrito}
        volver={jest.fn()}
        navegarA={jest.fn()}
        vaciarCarrito={jest.fn()}
      />
    );

    const pasoResumen = screen.getByText('Resumen').closest('li');
    expect(pasoResumen).toHaveClass('is-active');
    expect(pasoResumen).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText('Envío')).toBeInTheDocument();
    expect(screen.getByText('Pago')).toBeInTheDocument();
    expect(screen.getByText('Confirmación')).toBeInTheDocument();

    expect(screen.getByAltText('Pestañas Volumen')).toHaveAttribute('loading', 'lazy');
    expect(screen.getByText('$30.00')).toBeInTheDocument();
    expect(screen.getByText('$20.00')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Subtotal: \$50\.00/i })).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Eliminar Pestañas Volumen del carrito' })
    );
    expect(eliminarDelCarrito).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByRole('button', { name: /Continuar con el Envío/i }));

    const modalLogin = screen.getByRole('dialog');
    expect(modalLogin).toHaveAttribute('aria-modal', 'true');
    expect(modalLogin).toHaveAttribute('aria-labelledby');
    expect(screen.getByRole('heading', { name: /Autenticación Requerida/i })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('muestra estado de carga en envío y modal de error accesible sin window.alert si falla crear-intencion', async () => {
    localStorage.setItem('token', 'jwt-token-test');
    localStorage.setItem(
      'usuario',
      JSON.stringify({ id_usuario: 7, direccion: 'Calle 10', telefono: '3001112233' })
    );
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    let resolverPromesa;
    axios.post.mockImplementationOnce(
      () =>
        new Promise((resolve, reject) => {
          resolverPromesa = { resolve, reject };
        })
    );

    render(
      <Carrito
        carrito={carritoMock}
        eliminarDelCarrito={jest.fn()}
        volver={jest.fn()}
        navegarA={jest.fn()}
        vaciarCarrito={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Continuar con el Envío/i }));

    const pasoEnvio = screen.getByText('Envío').closest('li');
    expect(pasoEnvio).toHaveClass('is-active');
    expect(pasoEnvio).toHaveAttribute('aria-current', 'step');

    const inputDireccion = screen.getByLabelText(/Dirección de Entrega/i);
    const inputTelefono = screen.getByLabelText(/Teléfono de Contacto/i);
    expect(inputDireccion).toHaveAttribute('id', 'checkout-direccion');
    expect(inputTelefono).toHaveAttribute('id', 'checkout-telefono');
    expect(inputTelefono).toHaveAttribute('type', 'tel');

    fireEvent.click(screen.getByRole('button', { name: /Ir al Pago/i }));

    const btnCargando = screen.getByRole('button', { name: /Preparando pago\.\.\./i });
    expect(btnCargando).toBeDisabled();

    resolverPromesa.reject(new Error('Network Error'));

    const modalError = await screen.findByRole('dialog');
    expect(modalError).toHaveAttribute('aria-modal', 'true');
    expect(modalError).toHaveAttribute('aria-labelledby');
    expect(modalError).toHaveTextContent(/servidor de pagos/i);
    expect(alertSpy).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Entendido/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    alertSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('maneja rechazo en Stripe con modal accesible, procesa pago exitoso, muestra PDF y revoca Blob URL al desmontar', async () => {
    localStorage.setItem('token', 'jwt-token-test');
    localStorage.setItem(
      'usuario',
      JSON.stringify({ id: 9, direccion: 'Av. 5 #12-34', telefono: '3109998877' })
    );

    const vaciarCarrito = jest.fn();
    const confirmCardPayment = jest
      .fn()
      .mockResolvedValueOnce({ error: { message: 'Fondos insuficientes.' } })
      .mockResolvedValueOnce({ paymentIntent: { status: 'succeeded' } });
    useStripe.mockReturnValue({ confirmCardPayment });

    axios.post
      .mockResolvedValueOnce({ data: { clientSecret: 'pi_secret_123' } })
      .mockResolvedValueOnce({ data: { factura: btoa('PDF-DEMO') } });

    const { unmount } = render(
      <Carrito
        carrito={carritoMock}
        eliminarDelCarrito={jest.fn()}
        volver={jest.fn()}
        navegarA={jest.fn()}
        vaciarCarrito={vaciarCarrito}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Continuar con el Envío/i }));
    fireEvent.click(screen.getByRole('button', { name: /Ir al Pago/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:5000/api/pagos/crear-intencion',
        { total: 50 },
        { headers: { Authorization: 'Bearer jwt-token-test' } }
      );
    });

    const pasoPago = await screen.findByText('Pago');
    expect(pasoPago.closest('li')).toHaveAttribute('aria-current', 'step');

    const btnPagar = screen.getByRole('button', { name: /Pagar \$50\.00/i });
    fireEvent.click(btnPagar);

    const modalRechazo = await screen.findByRole('dialog');
    expect(modalRechazo).toHaveAttribute('aria-modal', 'true');
    expect(modalRechazo).toHaveAttribute('aria-labelledby');
    expect(modalRechazo).toHaveTextContent(/Fondos insuficientes\./i);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pagar \$50\.00/i })).not.toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /Pagar \$50\.00/i }));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:5000/api/pedidos/procesar',
        {
          id_usuario: 9,
          carrito: carritoMock,
          total: 50,
          direccion_envio: 'Av. 5 #12-34',
          telefono_contacto: '3109998877',
        },
        { headers: { Authorization: 'Bearer jwt-token-test' } }
      );
    });

    expect(vaciarCarrito).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole('heading', { name: /¡Pago Procesado Exitosamente!/i })).toBeInTheDocument();
    expect(screen.getByText('Confirmación').closest('li')).toHaveAttribute('aria-current', 'step');
    expect(screen.getByTitle('Factura PDF')).toHaveAttribute(
      'src',
      'blob:http://localhost/factura-test'
    );
    expect(screen.getByRole('link', { name: /Descargar Factura PDF/i })).toHaveAttribute(
      'download',
      'Factura_Afrolash.pdf'
    );

    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/factura-test');
  });

  it('restaura el botón de pago tras excepción inesperada y muestra modal de error si falla procesarCompraFinal', async () => {
    localStorage.setItem('token', 'jwt-token-test');
    localStorage.setItem(
      'usuario',
      JSON.stringify({ id_usuario: 12, direccion: 'Carrera 8', telefono: '3201234567' })
    );
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    const vaciarCarrito = jest.fn();

    const confirmCardPayment = jest
      .fn()
      .mockRejectedValueOnce(new Error('Fallo inesperado de Stripe'))
      .mockResolvedValueOnce({ paymentIntent: { status: 'succeeded' } });
    useStripe.mockReturnValue({ confirmCardPayment });

    axios.post
      .mockResolvedValueOnce({ data: { clientSecret: 'pi_secret_456' } })
      .mockRejectedValueOnce(new Error('Error 500 en procesar pedido'));

    render(
      <Carrito
        carrito={carritoMock}
        eliminarDelCarrito={jest.fn()}
        volver={jest.fn()}
        navegarA={jest.fn()}
        vaciarCarrito={vaciarCarrito}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Continuar con el Envío/i }));
    fireEvent.click(screen.getByRole('button', { name: /Ir al Pago/i }));

    const btnPagar = await screen.findByRole('button', { name: /Pagar \$50\.00/i });
    fireEvent.click(btnPagar);

    const modalErrorStripe = await screen.findByRole('dialog');
    expect(modalErrorStripe).toHaveTextContent(/Fallo inesperado de Stripe/i);
    expect(screen.getByRole('button', { name: /Pagar \$50\.00/i })).not.toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /Entendido/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Pagar \$50\.00/i }));

    const modalErrorPedido = await screen.findByRole('dialog');
    expect(modalErrorPedido).toHaveAttribute('aria-modal', 'true');
    expect(modalErrorPedido).toHaveTextContent(/ocurrió un error al cargar la pantalla final/i);
    expect(vaciarCarrito).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Pagar \$50\.00/i })).not.toBeDisabled();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    alertSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});

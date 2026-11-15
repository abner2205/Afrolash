import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import Login from './components/Login';
import Registro from './components/Registro';
import RecuperarPassword from './components/RecuperarPassword';
import RestablecerPassword from './components/RestablecerPassword';
import Perfil from './components/Perfil';
import MisPedidos from './components/MisPedidos';
import DocumentosLegales from './components/DocumentosLegales';

jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
}));

describe('T4 — Autenticación, Perfil, Mis Pedidos y Documentos Legales', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    window.scrollTo = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  describe('Login', () => {
    it('asocia etiquetas, permite toggle de contraseña por teclado con aria-pressed y usa botones semánticos', () => {
      const navegarA = jest.fn();
      render(<Login navegarA={navegarA} />);

      const inputCorreo = screen.getByLabelText(/Correo Electrónico/i);
      const inputPassword = screen.getByLabelText(/^Contraseña/i);

      expect(inputCorreo).toHaveAttribute('id');
      expect(inputCorreo).toHaveAttribute('autoComplete', 'email');
      expect(inputPassword).toHaveAttribute('id');
      expect(inputPassword).toHaveAttribute('type', 'password');
      expect(inputPassword).toHaveAttribute('autoComplete', 'current-password');

      const btnToggle = screen.getByRole('button', { name: 'Mostrar contraseña' });
      expect(btnToggle).not.toHaveAttribute('tabindex', '-1');
      expect(btnToggle).toHaveAttribute('aria-pressed', 'false');

      fireEvent.click(btnToggle);

      expect(inputPassword).toHaveAttribute('type', 'text');
      const btnOcultar = screen.getByRole('button', { name: 'Ocultar contraseña' });
      expect(btnOcultar).toHaveAttribute('aria-pressed', 'true');

      const btnRecuperar = screen.getByRole('button', { name: /¿Olvidaste tu contraseña\?/i });
      const btnRegistro = screen.getByRole('button', { name: /Regístrate aquí/i });
      fireEvent.click(btnRecuperar);
      expect(navegarA).toHaveBeenCalledWith('recuperar');
      fireEvent.click(btnRegistro);
      expect(navegarA).toHaveBeenCalledWith('registro');
    });

    it('previene envíos múltiples, maneja fallos de localStorage con try/catch y cierra modal de error con Escape', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      let resolverLogin;
      axios.post.mockImplementationOnce(
        () =>
          new Promise((resolve, reject) => {
            resolverLogin = { resolve, reject };
          })
      );

      render(<Login navegarA={jest.fn()} />);

      fireEvent.change(screen.getByLabelText(/Correo Electrónico/i), {
        target: { value: 'cliente@afrolash.com' },
      });
      fireEvent.change(screen.getByLabelText(/^Contraseña/i), {
        target: { value: 'ClaveSegura1' },
      });

      const form = screen.getByRole('button', { name: /Ingresar/i }).closest('form');
      fireEvent.submit(form);
      fireEvent.submit(form);

      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('button', { name: /Iniciando Sesión\.\.\./i })).toBeDisabled();

      resolverLogin.reject(new Error('Unauthorized'));

      const modalError = await screen.findByRole('dialog');
      expect(modalError).toHaveAttribute('aria-modal', 'true');
      expect(modalError).toHaveAttribute('aria-labelledby');

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      const reloadMock = jest.fn();
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { ...originalLocation, reload: reloadMock },
      });
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      axios.post.mockResolvedValueOnce({
        data: { token: 'jwt-123', usuario: { id: 1, nombre_completo: 'Ana' } },
      });

      fireEvent.change(screen.getByLabelText(/^Contraseña/i), {
        target: { value: 'ClaveSegura1' },
      });
      fireEvent.submit(form);

      const modalStorageError = await screen.findByRole('dialog');
      expect(modalStorageError).toHaveAttribute('aria-modal', 'true');
      expect(reloadMock).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Registro', () => {
    it('mantiene botones legales fuera de <label htmlFor="terminos">, abre DocumentosLegales en modal accesible y valida en tiempo real', async () => {
      const navegarA = jest.fn();
      render(<Registro navegarA={navegarA} />);

      const inputNombre = screen.getByLabelText(/Nombre Completo/i);
      const inputCorreo = screen.getByLabelText(/Correo Electrónico/i);
      const inputPass = screen.getByLabelText(/^Contraseña$/i);
      const inputConfirmar = screen.getByLabelText(/Confirmar Contraseña/i);
      const checkboxTerminos = screen.getByRole('checkbox');

      expect(inputNombre).toHaveAttribute('autoComplete', 'name');
      expect(inputCorreo).toHaveAttribute('autoComplete', 'email');
      expect(inputPass).toHaveAttribute('autoComplete', 'new-password');
      expect(inputConfirmar).toHaveAttribute('autoComplete', 'new-password');

      const botonesMostrar = screen.getAllByRole('button', { name: 'Mostrar contraseña' });
      expect(botonesMostrar).toHaveLength(2);
      botonesMostrar.forEach((btn) => {
        expect(btn).not.toHaveAttribute('tabindex', '-1');
        expect(btn).toHaveAttribute('aria-pressed', 'false');
      });

      const btnTerminos = screen.getByRole('button', { name: 'Términos y Condiciones' });
      const btnPrivacidad = screen.getByRole('button', { name: 'Política de Privacidad' });
      const labelTerminos = checkboxTerminos.closest('div')?.querySelector('label[for="terminos"]');
      expect(labelTerminos).toBeInTheDocument();
      expect(labelTerminos).not.toContainElement(btnTerminos);
      expect(labelTerminos).not.toContainElement(btnPrivacidad);

      fireEvent.click(btnTerminos);
      expect(checkboxTerminos).not.toBeChecked();

      const modalLegal = screen.getByRole('dialog');
      expect(modalLegal).toHaveAttribute('aria-modal', 'true');
      expect(modalLegal).toHaveAttribute('aria-labelledby');
      expect(modalLegal).toHaveTextContent(/Estatuto del Consumidor/i);
      expect(modalLegal.querySelector('.afro-card')).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Cerrar documento' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      fireEvent.click(btnPrivacidad);
      expect(screen.getByRole('dialog')).toHaveTextContent(/Hábeas Data/i);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      const btnCrear = screen.getByRole('button', { name: /Crear Cuenta/i });
      expect(btnCrear).toBeDisabled();

      fireEvent.change(inputNombre, { target: { value: 'Laura Gómez' } });
      fireEvent.change(inputCorreo, { target: { value: 'laura@afrolash.com' } });
      fireEvent.change(inputPass, { target: { value: 'Afrolash1' } });
      fireEvent.change(inputConfirmar, { target: { value: 'Afrolash1' } });
      fireEvent.click(checkboxTerminos);

      expect(btnCrear).not.toBeDisabled();

      axios.post.mockResolvedValueOnce({ data: { ok: true } });
      fireEvent.click(btnCrear);

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith('http://localhost:5000/api/auth/registro', {
          nombre_completo: 'Laura Gómez',
          correo: 'laura@afrolash.com',
          password: 'Afrolash1',
        });
      });

      const modalExito = await screen.findByRole('dialog');
      expect(modalExito).toHaveAttribute('aria-modal', 'true');
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(navegarA).toHaveBeenCalledWith('login');
    });
  });

  describe('RecuperarPassword y RestablecerPassword', () => {
    it('RecuperarPassword etiqueta campo, usa botón semántico para volver y cierra modal con Escape', async () => {
      const navegarA = jest.fn();
      axios.post.mockResolvedValueOnce({ data: { ok: true } });

      render(<RecuperarPassword navegarA={navegarA} />);

      const inputCorreo = screen.getByLabelText(/Correo Electrónico/i);
      expect(inputCorreo).toHaveAttribute('autoComplete', 'email');

      fireEvent.change(inputCorreo, { target: { value: 'usuario@afrolash.com' } });
      fireEvent.click(screen.getByRole('button', { name: /Enviar enlace/i }));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          'http://localhost:5000/api/auth/recuperar-password',
          { correo: 'usuario@afrolash.com' }
        );
      });

      const modal = await screen.findByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby');

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(navegarA).toHaveBeenCalledWith('login');

      fireEvent.click(screen.getByRole('button', { name: /Volver al inicio de sesión/i }));
      expect(navegarA).toHaveBeenCalledWith('login');
    });

    it('RestablecerPassword habilita botón de visibilidad por teclado, valida longitud mínima y preserva endpoint', async () => {
      const navegarA = jest.fn();
      axios.post.mockResolvedValueOnce({ data: { mensaje: 'Clave actualizada.' } });

      render(<RestablecerPassword navegarA={navegarA} id="42" token="tok-abc" />);

      const inputPass = screen.getByLabelText(/^Nueva Contraseña$/i);
      expect(inputPass).toHaveAttribute('id', 'restablecer-password');
      expect(inputPass).toHaveAttribute('type', 'password');
      expect(inputPass).toHaveAttribute('autoComplete', 'new-password');

      const btnToggle = screen.getByRole('button', { name: 'Mostrar contraseña' });
      expect(btnToggle).not.toHaveAttribute('tabindex', '-1');
      expect(btnToggle).toHaveAttribute('aria-pressed', 'false');

      fireEvent.click(btnToggle);
      expect(inputPass).toHaveAttribute('type', 'text');
      expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );

      fireEvent.change(inputPass, { target: { value: 'corta' } });
      fireEvent.click(screen.getByRole('button', { name: /Guardar nueva contraseña/i }));

      const modalError = await screen.findByRole('dialog');
      expect(modalError).toHaveTextContent(/al menos 8 caracteres/i);
      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      fireEvent.change(inputPass, { target: { value: 'NuevaClave2026' } });
      fireEvent.click(screen.getByRole('button', { name: /Guardar nueva contraseña/i }));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          'http://localhost:5000/api/auth/restablecer-password/42/tok-abc',
          { nuevaPassword: 'NuevaClave2026' }
        );
      });

      const modalExito = await screen.findByRole('dialog');
      expect(modalExito).toHaveAttribute('aria-modal', 'true');
      fireEvent.click(screen.getByRole('button', { name: /Ir al Login/i }));
      expect(navegarA).toHaveBeenCalledWith('login');
    });
  });

  describe('Perfil', () => {
    it('tolera localStorage corrupto, usa type="tel" y autoComplete correctos, y actualiza el perfil', async () => {
      localStorage.setItem('usuario', '{corrupto');
      localStorage.setItem('token', 'jwt-perfil');
      axios.put.mockResolvedValueOnce({ data: { ok: true } });

      render(<Perfil />);

      const inputCorreo = screen.getByLabelText(/Correo Electrónico/i);
      const inputNombre = screen.getByLabelText(/Nombre Completo/i);
      const inputTelefono = screen.getByLabelText(/Teléfono de Contacto/i);
      const inputDireccion = screen.getByLabelText(/Dirección de Entrega/i);

      expect(inputCorreo).toBeDisabled();
      expect(inputNombre).toHaveAttribute('autoComplete', 'name');
      expect(inputTelefono).toHaveAttribute('type', 'tel');
      expect(inputTelefono).toHaveAttribute('autoComplete', 'tel');
      expect(inputDireccion).toHaveAttribute('autoComplete', 'street-address');

      fireEvent.change(inputNombre, { target: { value: 'Sofia Méndez' } });
      fireEvent.change(inputTelefono, { target: { value: '3001234567' } });
      fireEvent.change(inputDireccion, { target: { value: 'Calle 10 #5-20' } });

      fireEvent.click(screen.getByRole('button', { name: /Guardar Cambios/i }));

      await waitFor(() => {
        expect(axios.put).toHaveBeenCalledWith(
          'http://localhost:5000/api/auth/perfil',
          {
            nombre_completo: 'Sofia Méndez',
            direccion: 'Calle 10 #5-20',
            telefono: '3001234567',
          },
          { headers: { Authorization: 'Bearer jwt-perfil' } }
        );
      });

      const modalExito = await screen.findByRole('dialog');
      expect(modalExito).toHaveAttribute('aria-modal', 'true');
      expect(JSON.parse(localStorage.getItem('usuario'))).toMatchObject({
        nombre_completo: 'Sofia Méndez',
        telefono: '3001234567',
        direccion: 'Calle 10 #5-20',
      });

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('MisPedidos', () => {
    it('muestra modal accesible con Escape cuando no hay token', async () => {
      render(<MisPedidos />);

      const modalError = await screen.findByRole('dialog');
      expect(modalError).toHaveAttribute('aria-modal', 'true');
      expect(modalError).toHaveTextContent(/Debes iniciar sesión/i);

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renderiza pedidos con badges semánticos, montos tabulares, imágenes lazy y limpieza al desmontar', async () => {
      localStorage.setItem('token', 'jwt-pedidos');
      const estados = ['pendiente', 'pagado', 'enviado', 'entregado', 'cancelado'];
      const pedidosMock = estados.map((estado, idx) => ({
        id_pedido: 100 + idx,
        fecha_pedido: '2026-06-15T14:30:00Z',
        total: (25 + idx).toFixed(2),
        estado,
        direccion_envio: 'Carrera 7 #12-30',
        telefono_contacto: '3110000000',
        detalles: [
          {
            id_producto: idx + 1,
            nombre: `Cosmético ${estado}`,
            cantidad: 1,
            precio_unitario: (25 + idx).toFixed(2),
            imagen_url: `/img/prod-${idx}.jpg`,
          },
        ],
      }));

      axios.get.mockResolvedValueOnce({ data: pedidosMock });

      render(<MisPedidos />);

      expect(await screen.findByText('#100')).toBeInTheDocument();
      expect(screen.getByText('Pendiente')).toHaveClass('afro-badge', 'afro-badge-warning');
      expect(screen.getByText('Pagado')).toHaveClass('afro-badge', 'afro-badge-rose');
      expect(screen.getByText('Enviado')).toHaveClass('afro-badge', 'afro-badge-info');
      expect(screen.getByText('Entregado')).toHaveClass('afro-badge', 'afro-badge-success');
      expect(screen.getByText('Cancelado')).toHaveClass('afro-badge', 'afro-badge-danger');

      expect(screen.getByAltText('Cosmético pendiente')).toHaveAttribute('loading', 'lazy');

      let resolverPendiente;
      axios.get.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolverPendiente = resolve;
          })
      );
      const { unmount } = render(<MisPedidos />);
      unmount();
      resolverPendiente({ data: [] });
    });
  });

  describe('DocumentosLegales', () => {
    it('mantiene jerarquía semántica h1 -> h2 sin saltos a h3 en vista estándar y omite tarjeta en modo modal', () => {
      const { container, rerender } = render(<DocumentosLegales tipoDocumento="terminos" />);

      expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
      expect(container.querySelector('.afro-card')).toBeInTheDocument();
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThanOrEqual(4);
      expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0);

      window.scrollTo.mockClear();
      rerender(<DocumentosLegales tipoDocumento="privacidad" enModal={true} />);

      expect(window.scrollTo).not.toHaveBeenCalled();
      expect(container.querySelector('.afro-card')).not.toBeInTheDocument();
      expect(screen.getByText(/Políticas de Privacidad y Tratamiento de Datos/i)).toBeInTheDocument();
    });
  });
});

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = ({ navegarA }) => {
  const [formData, setFormData] = useState({
    correo: '',
    password: '',
  });
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const montadoRef = useRef(true);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!mensaje) return undefined;

    const manejarEscape = (evento) => {
      if (evento.key === 'Escape') {
        setMensaje('');
      }
    };

    document.addEventListener('keydown', manejarEscape);
    return () => {
      document.removeEventListener('keydown', manejarEscape);
    };
  }, [mensaje]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cargando) return;

    if (!formData.correo.trim() || !formData.password) {
      setMensaje('Por favor, completa todos los campos para poder ingresar.');
      return;
    }

    setCargando(true);

    try {
      const respuesta = await axios.post('http://localhost:5000/api/auth/login', {
        correo: formData.correo,
        password: formData.password,
      });

      try {
        localStorage.setItem('token', respuesta.data.token);
        localStorage.setItem('usuario', JSON.stringify(respuesta.data.usuario));
      } catch (storageError) {
        console.error('No se pudo guardar la sesión en almacenamiento local:', storageError);
        if (montadoRef.current) {
          setMensaje(
            'No pudimos guardar tu sesión en el navegador. Verifica que el almacenamiento local esté habilitado.'
          );
          setCargando(false);
        }
        return;
      }

      window.location.reload();
    } catch (error) {
      console.error('Intento de acceso fallido interceptado.');
      if (montadoRef.current) {
        setMensaje(
          'El correo electrónico o la contraseña son incorrectos. Por favor, verifica tus datos e inténtalo nuevamente.'
        );
        setFormData((prev) => ({ ...prev, password: '' }));
        setCargando(false);
      }
    }
  };

  return (
    <section className="afro-form-card afro-form-card--auth" aria-labelledby="login-titulo">
      <h1 id="login-titulo" className="afro-auth-title">
        Iniciar Sesión
      </h1>
      <p className="afro-auth-subtitle">Accede a tu cuenta para gestionar tus pedidos y perfil.</p>

      <form onSubmit={handleSubmit} className="afro-form-stack">
        <div className="afro-field">
          <label htmlFor="login-correo" className="afro-label">
            Correo Electrónico
          </label>
          <input
            id="login-correo"
            type="email"
            name="correo"
            className="afro-input"
            value={formData.correo}
            onChange={handleChange}
            required
            autoComplete="email"
          />
        </div>

        <div className="afro-field">
          <label htmlFor="login-password" className="afro-label">
            Contraseña
          </label>
          <div className="afro-password-wrap">
            <input
              id="login-password"
              type={mostrarPassword ? 'text' : 'password'}
              name="password"
              className="afro-input afro-password-input"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              className="afro-password-toggle"
              onClick={() => setMostrarPassword((prev) => !prev)}
              aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={mostrarPassword}
            >
              {mostrarPassword ? (
                <FaEyeSlash size={18} aria-hidden="true" />
              ) : (
                <FaEye size={18} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <button type="submit" disabled={cargando} className="afro-btn afro-btn-primary afro-btn-full">
          {cargando ? 'Iniciando Sesión...' : 'Ingresar'}
        </button>
      </form>

      <div className="afro-auth-links">
        <button
          type="button"
          className="afro-link-btn afro-link-btn--inline"
          onClick={() => navegarA('recuperar')}
        >
          ¿Olvidaste tu contraseña?
        </button>
        <p className="afro-auth-footer-text">
          <span>¿No tienes una cuenta?</span>
          <button
            type="button"
            className="afro-link-btn afro-link-btn--inline"
            onClick={() => navegarA('registro')}
          >
            Regístrate aquí
          </button>
        </p>
      </div>

      {mensaje ? (
        <div className="afro-modal-backdrop" onClick={() => setMensaje('')}>
          <div
            className="afro-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-error-modal-title"
            aria-describedby="login-error-modal-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="afro-modal-icon-danger" aria-hidden="true">
              !
            </div>
            <h2 id="login-error-modal-title" className="afro-modal-title">
              No se pudo acceder
            </h2>
            <p id="login-error-modal-desc" className="afro-modal-body">
              {mensaje}
            </p>
            <div className="afro-modal-actions">
              <button
                type="button"
                className="afro-btn afro-btn-dark afro-btn-full"
                onClick={() => setMensaje('')}
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

export default Login;

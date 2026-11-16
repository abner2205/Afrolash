import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const RestablecerPassword = ({ navegarA, id, token }) => {
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [modalMensaje, setModalMensaje] = useState({
    visible: false,
    texto: '',
    tipo: 'info',
    accionPosterior: null,
  });

  const montadoRef = useRef(true);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  const cerrarModal = useCallback(() => {
    const accion = modalMensaje.accionPosterior;
    setModalMensaje({ visible: false, texto: '', tipo: 'info', accionPosterior: null });
    if (accion) {
      accion();
    }
  }, [modalMensaje.accionPosterior]);

  useEffect(() => {
    if (!modalMensaje.visible) return undefined;

    const manejarEscape = (evento) => {
      if (evento.key === 'Escape') {
        cerrarModal();
      }
    };

    document.addEventListener('keydown', manejarEscape);
    return () => {
      document.removeEventListener('keydown', manejarEscape);
    };
  }, [modalMensaje.visible, cerrarModal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cargando) return;

    const esPasswordValida =
      password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);

    if (!esPasswordValida) {
      setModalMensaje({
        visible: true,
        texto:
          'Por motivos de seguridad, tu nueva contraseña debe tener al menos 8 caracteres, una letra mayúscula y un número.',
        tipo: 'error',
        accionPosterior: null,
      });
      return;
    }

    setCargando(true);
    try {
      const respuesta = await axios.post(
        `http://localhost:5000/api/auth/restablecer-password/${id}/${token}`,
        { nuevaPassword: password }
      );

      if (montadoRef.current) {
        setModalMensaje({
          visible: true,
          texto: respuesta.data.mensaje || 'Tu contraseña ha sido actualizada con éxito.',
          tipo: 'exito',
          accionPosterior: () => navegarA('login'),
        });
      }
    } catch (error) {
      if (montadoRef.current) {
        setModalMensaje({
          visible: true,
          texto:
            error.response?.data?.mensaje ||
            'Error al restablecer la contraseña. Es posible que el enlace haya expirado o sea inválido.',
          tipo: 'error',
          accionPosterior: null,
        });
      }
    } finally {
      if (montadoRef.current) {
        setCargando(false);
      }
    }
  };

  return (
    <section className="afro-form-card afro-form-card--auth" aria-labelledby="restablecer-titulo">
      <h1 id="restablecer-titulo" className="afro-auth-title">
        Crear nueva contraseña
      </h1>
      <p className="afro-auth-subtitle">
        Elige una contraseña segura de al menos 8 caracteres, una mayúscula y un número para tu cuenta.
      </p>

      <form onSubmit={handleSubmit} className="afro-form-stack">
        <div className="afro-field">
          <label htmlFor="restablecer-password" className="afro-label">
            Nueva Contraseña
          </label>
          <div className="afro-password-wrap">
            <input
              id="restablecer-password"
              type={mostrarPassword ? 'text' : 'password'}
              name="nuevaPassword"
              className="afro-input afro-password-input"
              placeholder="Mínimo 8 caracteres (mayúscula y número)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
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
          {cargando ? 'Guardando...' : 'Guardar nueva contraseña'}
        </button>
      </form>

      {modalMensaje.visible ? (
        <div className="afro-modal-backdrop" onClick={cerrarModal}>
          <div
            className="afro-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="restablecer-modal-title"
            aria-describedby="restablecer-modal-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={
                modalMensaje.tipo === 'exito'
                  ? 'afro-modal-icon-success'
                  : 'afro-modal-icon-danger'
              }
              aria-hidden="true"
            >
              {modalMensaje.tipo === 'exito' ? '✓' : '!'}
            </div>
            <h2 id="restablecer-modal-title" className="afro-modal-title">
              {modalMensaje.tipo === 'exito' ? '¡Contraseña Actualizada!' : 'Atención Requerida'}
            </h2>
            <p id="restablecer-modal-desc" className="afro-modal-body">
              {modalMensaje.texto}
            </p>
            <div className="afro-modal-actions">
              <button
                type="button"
                className="afro-btn afro-btn-dark afro-btn-full"
                onClick={cerrarModal}
                autoFocus
              >
                {modalMensaje.tipo === 'exito' ? 'Ir al Login' : 'Entendido'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default RestablecerPassword;

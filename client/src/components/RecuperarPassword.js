import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';

const RecuperarPassword = ({ navegarA }) => {
  const [correo, setCorreo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [modalMensaje, setModalMensaje] = useState({
    visible: false,
    texto: '',
    tipo: 'info',
  });

  const montadoRef = useRef(true);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  const cerrarModal = useCallback(() => {
    const esExito = modalMensaje.tipo === 'exito';
    setModalMensaje({ visible: false, texto: '', tipo: 'info' });
    if (esExito) {
      navegarA('login');
    }
  }, [modalMensaje.tipo, navegarA]);

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

    setCargando(true);
    try {
      await axios.post(`${API_URL}/api/auth/recuperar-password`, { correo });
      if (montadoRef.current) {
        setModalMensaje({
          visible: true,
          texto:
            'Si el correo está registrado, recibirás un enlace de recuperación en los próximos minutos.',
          tipo: 'exito',
        });
      }
    } catch (error) {
      if (montadoRef.current) {
        setModalMensaje({
          visible: true,
          texto:
            'Ocurrió un error al procesar la solicitud. Verifica tu conexión e intenta nuevamente.',
          tipo: 'error',
        });
      }
    } finally {
      if (montadoRef.current) {
        setCargando(false);
      }
    }
  };

  return (
    <section className="afro-form-card afro-form-card--auth" aria-labelledby="recuperar-titulo">
      <h1 id="recuperar-titulo" className="afro-auth-title">
        Recuperar Contraseña
      </h1>
      <p className="afro-auth-subtitle">
        Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu acceso.
      </p>

      <form onSubmit={handleSubmit} className="afro-form-stack">
        <div className="afro-field">
          <label htmlFor="recuperar-correo" className="afro-label">
            Correo Electrónico
          </label>
          <input
            id="recuperar-correo"
            type="email"
            name="correo"
            className="afro-input"
            placeholder="Ingresa tu correo electrónico"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <button type="submit" disabled={cargando} className="afro-btn afro-btn-primary afro-btn-full">
          {cargando ? 'Enviando...' : 'Enviar enlace'}
        </button>
      </form>

      <div className="afro-auth-links">
        <button
          type="button"
          className="afro-link-btn afro-link-btn--inline"
          onClick={() => navegarA('login')}
        >
          Volver al inicio de sesión
        </button>
      </div>

      {modalMensaje.visible ? (
        <div className="afro-modal-backdrop" onClick={cerrarModal}>
          <div
            className="afro-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="recuperar-modal-title"
            aria-describedby="recuperar-modal-desc"
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
            <h2 id="recuperar-modal-title" className="afro-modal-title">
              {modalMensaje.tipo === 'exito' ? 'Solicitud Enviada' : 'Atención Requerida'}
            </h2>
            <p id="recuperar-modal-desc" className="afro-modal-body">
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

export default RecuperarPassword;

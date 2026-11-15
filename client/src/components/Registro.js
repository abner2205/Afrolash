import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import DocumentosLegales from './DocumentosLegales';

const Registro = ({ navegarA }) => {
  const [formData, setFormData] = useState({
    nombre_completo: '',
    correo: '',
    password: '',
    confirmarPassword: '',
  });

  const [cargando, setCargando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false);
  const [terminosAceptados, setTerminosAceptados] = useState(false);

  const [modalMensaje, setModalMensaje] = useState({
    visible: false,
    texto: '',
    tipo: 'error',
    accionPosterior: null,
  });
  const [modalDocumentoLegal, setModalDocumentoLegal] = useState(null);

  const montadoRef = useRef(true);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  const cerrarModalMensaje = useCallback(() => {
    const accion = modalMensaje.accionPosterior;
    setModalMensaje({ visible: false, texto: '', tipo: 'error', accionPosterior: null });
    if (accion) {
      accion();
    }
  }, [modalMensaje.accionPosterior]);

  useEffect(() => {
    if (!modalDocumentoLegal && !modalMensaje.visible) return undefined;

    const manejarEscape = (evento) => {
      if (evento.key === 'Escape') {
        if (modalDocumentoLegal) {
          setModalDocumentoLegal(null);
        } else if (modalMensaje.visible) {
          cerrarModalMensaje();
        }
      }
    };

    document.addEventListener('keydown', manejarEscape);
    return () => {
      document.removeEventListener('keydown', manejarEscape);
    };
  }, [modalDocumentoLegal, modalMensaje.visible, cerrarModalMensaje]);

  const tieneLongitud = formData.password.length >= 8;
  const tieneMayuscula = /[A-Z]/.test(formData.password);
  const tieneNumero = /[0-9]/.test(formData.password);
  const contraseñasCoinciden =
    formData.password.length > 0 && formData.password === formData.confirmarPassword;

  const formularioValido =
    tieneLongitud && tieneMayuscula && tieneNumero && contraseñasCoinciden && terminosAceptados;

  const requisitosPassword = [
    { id: 'longitud', cumplido: tieneLongitud, texto: 'Mínimo 8 caracteres' },
    { id: 'mayuscula', cumplido: tieneMayuscula, texto: 'Al menos una letra mayúscula' },
    { id: 'numero', cumplido: tieneNumero, texto: 'Al menos un número' },
    { id: 'coinciden', cumplido: contraseñasCoinciden, texto: 'Las contraseñas coinciden' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cargando) return;

    if (!formularioValido) {
      setModalMensaje({
        visible: true,
        texto:
          'Por favor, asegúrate de cumplir con todos los requisitos de seguridad y aceptar los términos y condiciones.',
        tipo: 'error',
        accionPosterior: null,
      });
      return;
    }

    setCargando(true);

    try {
      await axios.post('http://localhost:5000/api/auth/registro', {
        nombre_completo: formData.nombre_completo,
        correo: formData.correo,
        password: formData.password,
      });

      if (montadoRef.current) {
        setModalMensaje({
          visible: true,
          texto: 'Tu cuenta ha sido creada exitosamente. Ya formas parte de la comunidad Afrolash.',
          tipo: 'exito',
          accionPosterior: () => navegarA('login'),
        });
      }
    } catch (error) {
      console.error('Error en el registro:', error);
      if (montadoRef.current) {
        setModalMensaje({
          visible: true,
          texto:
            error.response?.data?.mensaje ||
            'Ocurrió un error al registrar la cuenta. Es posible que el correo ya esté en uso.',
          tipo: 'error',
          accionPosterior: null,
        });
        setCargando(false);
      }
    }
  };

  const claseConfirmarPassword = `afro-input afro-password-input${
    formData.confirmarPassword.length > 0
      ? contraseñasCoinciden
        ? ' afro-input--valid'
        : ' afro-input--invalid'
      : ''
  }`;

  return (
    <section className="afro-form-card afro-form-card--auth" aria-labelledby="registro-titulo">
      <h1 id="registro-titulo" className="afro-auth-title">
        Crear Cuenta en Afrolash
      </h1>
      <p className="afro-auth-subtitle">
        Regístrate para realizar compras rápidas y consultar el seguimiento de tus pedidos.
      </p>

      <form onSubmit={handleSubmit} className="afro-form-stack">
        <div className="afro-field">
          <label htmlFor="registro-nombre" className="afro-label">
            Nombre Completo
          </label>
          <input
            id="registro-nombre"
            type="text"
            name="nombre_completo"
            className="afro-input"
            value={formData.nombre_completo}
            onChange={handleChange}
            required
            autoComplete="name"
          />
        </div>

        <div className="afro-field">
          <label htmlFor="registro-correo" className="afro-label">
            Correo Electrónico
          </label>
          <input
            id="registro-correo"
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
          <label htmlFor="registro-password" className="afro-label">
            Contraseña
          </label>
          <div className="afro-password-wrap">
            <input
              id="registro-password"
              type={mostrarPassword ? 'text' : 'password'}
              name="password"
              className="afro-input afro-password-input"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
              aria-describedby="registro-password-requisitos"
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

        <div className="afro-field">
          <label htmlFor="registro-confirmar-password" className="afro-label">
            Confirmar Contraseña
          </label>
          <div className="afro-password-wrap">
            <input
              id="registro-confirmar-password"
              type={mostrarConfirmar ? 'text' : 'password'}
              name="confirmarPassword"
              className={claseConfirmarPassword}
              value={formData.confirmarPassword}
              onChange={handleChange}
              required
              autoComplete="new-password"
              aria-invalid={
                formData.confirmarPassword.length > 0 && !contraseñasCoinciden ? 'true' : undefined
              }
            />
            <button
              type="button"
              className="afro-password-toggle"
              onClick={() => setMostrarConfirmar((prev) => !prev)}
              aria-label={mostrarConfirmar ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={mostrarConfirmar}
            >
              {mostrarConfirmar ? (
                <FaEyeSlash size={18} aria-hidden="true" />
              ) : (
                <FaEye size={18} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <div id="registro-password-requisitos" className="afro-checklist-box">
          <p className="afro-checklist-title">Requisitos de la contraseña:</p>
          <ul className="afro-checklist">
            {requisitosPassword.map((req) => (
              <li
                key={req.id}
                className={`afro-checklist-item${req.cumplido ? ' is-valid' : ''}`}
              >
                <span className="afro-checklist-icon" aria-hidden="true">
                  {req.cumplido ? '✓' : '○'}
                </span>
                <span>{req.texto}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="afro-terms-row">
          <input
            type="checkbox"
            id="terminos"
            className="afro-checkbox"
            checked={terminosAceptados}
            onChange={(e) => setTerminosAceptados(e.target.checked)}
          />
          <div className="afro-terms-text">
            <label htmlFor="terminos" className="afro-terms-label">
              He leído y acepto los términos y condiciones de Afrolash.
            </label>
            <div className="afro-terms-links">
              <span>Consultar:</span>
              <button
                type="button"
                className="afro-link-btn afro-link-btn--inline"
                onClick={() => setModalDocumentoLegal('terminos')}
              >
                Términos y Condiciones
              </button>
              <span aria-hidden="true">/</span>
              <button
                type="button"
                className="afro-link-btn afro-link-btn--inline"
                onClick={() => setModalDocumentoLegal('privacidad')}
              >
                Política de Privacidad
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={!formularioValido || cargando}
          className="afro-btn afro-btn-primary afro-btn-full"
        >
          {cargando ? 'Procesando...' : 'Crear Cuenta'}
        </button>
      </form>

      <div className="afro-auth-links">
        <p className="afro-auth-footer-text">
          <span>¿Ya tienes una cuenta?</span>
          <button
            type="button"
            className="afro-link-btn afro-link-btn--inline"
            onClick={() => navegarA('login')}
          >
            Inicia Sesión aquí
          </button>
        </p>
      </div>

      {modalMensaje.visible ? (
        <div className="afro-modal-backdrop" onClick={cerrarModalMensaje}>
          <div
            className="afro-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="registro-modal-title"
            aria-describedby="registro-modal-desc"
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
            <h2 id="registro-modal-title" className="afro-modal-title">
              {modalMensaje.tipo === 'exito' ? '¡Bienvenido a Afrolash!' : 'Atención Requerida'}
            </h2>
            <p id="registro-modal-desc" className="afro-modal-body">
              {modalMensaje.texto}
            </p>
            <div className="afro-modal-actions">
              <button
                type="button"
                className="afro-btn afro-btn-dark afro-btn-full"
                onClick={cerrarModalMensaje}
                autoFocus
              >
                {modalMensaje.tipo === 'exito' ? 'Ir al Login' : 'Entendido'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {modalDocumentoLegal ? (
        <div className="afro-modal-backdrop" onClick={() => setModalDocumentoLegal(null)}>
          <div
            className="afro-modal-legal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="registro-legal-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="afro-modal-legal-header">
              <h2 id="registro-legal-modal-title" className="afro-modal-legal-title">
                {modalDocumentoLegal === 'terminos'
                  ? 'Términos y Condiciones'
                  : 'Política de Privacidad'}
              </h2>
              <button
                type="button"
                className="afro-drawer-close"
                onClick={() => setModalDocumentoLegal(null)}
                aria-label="Cerrar documento"
                autoFocus
              >
                ✕
              </button>
            </div>

            <div className="afro-modal-legal-body">
              <DocumentosLegales tipoDocumento={modalDocumentoLegal} enModal={true} />
            </div>

            <div className="afro-modal-legal-footer">
              <button
                type="button"
                className="afro-btn afro-btn-primary"
                onClick={() => setModalDocumentoLegal(null)}
              >
                Cerrar Documento
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default Registro;

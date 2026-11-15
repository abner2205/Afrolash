import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const leerUsuarioSeguro = () => {
  try {
    const raw = localStorage.getItem('usuario');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (error) {
    return null;
  }
};

const leerTokenSeguro = () => {
  try {
    return localStorage.getItem('token');
  } catch (error) {
    return null;
  }
};

const Perfil = () => {
  const [formData, setFormData] = useState({
    nombre_completo: '',
    correo: '',
    direccion: '',
    telefono: '',
  });

  const [modalMensaje, setModalMensaje] = useState({
    visible: false,
    texto: '',
    tipo: 'info',
  });
  const [cargando, setCargando] = useState(false);

  const montadoRef = useRef(true);

  useEffect(() => {
    montadoRef.current = true;
    const usuario = leerUsuarioSeguro();
    if (usuario) {
      setFormData({
        nombre_completo: usuario.nombre_completo || usuario.nombre || '',
        correo: usuario.correo || usuario.email || '',
        direccion: usuario.direccion || '',
        telefono: usuario.telefono || '',
      });
    }
    return () => {
      montadoRef.current = false;
    };
  }, []);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cargando) return;

    setCargando(true);

    try {
      const token = leerTokenSeguro();
      await axios.put(
        'http://localhost:5000/api/auth/perfil',
        {
          nombre_completo: formData.nombre_completo,
          direccion: formData.direccion,
          telefono: formData.telefono,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      try {
        const usuarioGuardado = leerUsuarioSeguro() || {};
        const usuarioActualizado = {
          ...usuarioGuardado,
          nombre_completo: formData.nombre_completo,
          direccion: formData.direccion,
          telefono: formData.telefono,
        };
        localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));
      } catch (storageError) {
        console.error('No se pudo actualizar el usuario en almacenamiento local:', storageError);
      }

      if (montadoRef.current) {
        setModalMensaje({
          visible: true,
          texto: 'Tus datos del perfil han sido actualizados correctamente.',
          tipo: 'exito',
        });
      }
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      if (montadoRef.current) {
        setModalMensaje({
          visible: true,
          texto: 'No se pudo actualizar la información. Verifica tu conexión e intenta de nuevo.',
          tipo: 'error',
        });
      }
    } finally {
      if (montadoRef.current) {
        setCargando(false);
      }
    }
  };

  const cerrarModal = () => {
    setModalMensaje({ visible: false, texto: '', tipo: 'info' });
  };

  return (
    <section className="afro-form-card afro-form-card--profile" aria-labelledby="perfil-titulo">
      <h1 id="perfil-titulo" className="afro-form-heading">
        Mi Perfil
      </h1>

      <form onSubmit={handleSubmit} className="afro-form-stack">
        <div className="afro-field">
          <label htmlFor="perfil-correo" className="afro-label">
            Correo Electrónico (No editable)
          </label>
          <input
            id="perfil-correo"
            type="email"
            name="correo"
            className="afro-input afro-input--readonly"
            value={formData.correo}
            disabled
            autoComplete="email"
          />
        </div>

        <div className="afro-field">
          <label htmlFor="perfil-nombre" className="afro-label">
            Nombre Completo
          </label>
          <input
            id="perfil-nombre"
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
          <label htmlFor="perfil-telefono" className="afro-label">
            Teléfono de Contacto
          </label>
          <input
            id="perfil-telefono"
            type="tel"
            name="telefono"
            className="afro-input"
            value={formData.telefono}
            onChange={handleChange}
            placeholder="Ej: 0414-1234567"
            autoComplete="tel"
          />
        </div>

        <div className="afro-field">
          <label htmlFor="perfil-direccion" className="afro-label">
            Dirección de Entrega Predeterminada
          </label>
          <textarea
            id="perfil-direccion"
            name="direccion"
            className="afro-textarea"
            value={formData.direccion}
            onChange={handleChange}
            placeholder="Escribe tu dirección completa..."
            autoComplete="street-address"
          />
        </div>

        <button type="submit" disabled={cargando} className="afro-btn afro-btn-primary afro-btn-full">
          {cargando ? 'Guardando cambios...' : 'Guardar Cambios'}
        </button>
      </form>

      {modalMensaje.visible ? (
        <div className="afro-modal-backdrop" onClick={cerrarModal}>
          <div
            className="afro-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="perfil-modal-title"
            aria-describedby="perfil-modal-desc"
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
            <h2 id="perfil-modal-title" className="afro-modal-title">
              {modalMensaje.tipo === 'exito' ? 'Operación Exitosa' : 'Atención Requerida'}
            </h2>
            <p id="perfil-modal-desc" className="afro-modal-body">
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

export default Perfil;

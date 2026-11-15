import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const ESTADO_INICIAL_EMPLEADO = {
  nombre_completo: '',
  correo: '',
  telefono: '',
  direccion: '',
};

const ROLES_BADGE = {
  admin: { clase: 'afro-badge afro-badge-dark', etiqueta: 'Admin' },
  empleado: { clase: 'afro-badge afro-badge-warning', etiqueta: 'Empleado' },
  cliente: { clase: 'afro-badge', etiqueta: 'Cliente' },
};

const leerTokenSeguro = () => {
  try {
    return localStorage.getItem('token');
  } catch (error) {
    return null;
  }
};

const obtenerConfigHeaders = () => ({
  headers: { Authorization: `Bearer ${leerTokenSeguro()}` },
});

const obtenerBadgeRol = (rol) => {
  const clave = (rol || 'cliente').toLowerCase();
  if (ROLES_BADGE[clave]) {
    return ROLES_BADGE[clave];
  }
  return {
    clase: 'afro-badge',
    etiqueta: rol ? rol.charAt(0).toUpperCase() + rol.slice(1) : 'Cliente',
  };
};

const AdminUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formData, setFormData] = useState(ESTADO_INICIAL_EMPLEADO);
  const [enviando, setEnviando] = useState(false);
  const [confirmacionEliminar, setConfirmacionEliminar] = useState(null);
  const [procesandoRevocacion, setProcesandoRevocacion] = useState(false);
  const [modalMensaje, setModalMensaje] = useState({ visible: false, texto: '', tipo: 'info' });

  const montadoRef = useRef(true);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  const cargarUsuarios = useCallback(async () => {
    setCargando(true);
    setErrorCarga('');
    try {
      const respuesta = await axios.get(
        'http://localhost:5000/api/usuarios/admin/todos',
        obtenerConfigHeaders()
      );
      if (montadoRef.current) {
        setUsuarios(Array.isArray(respuesta.data) ? respuesta.data : []);
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      if (montadoRef.current) {
        setErrorCarga('Error al obtener la lista de usuarios del sistema.');
      }
    } finally {
      if (montadoRef.current) {
        setCargando(false);
      }
    }
  }, []);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  useEffect(() => {
    if (!modalMensaje.visible && !confirmacionEliminar) return undefined;

    const manejarEscape = (evento) => {
      if (evento.key === 'Escape') {
        if (confirmacionEliminar && !procesandoRevocacion) {
          setConfirmacionEliminar(null);
        } else if (modalMensaje.visible) {
          setModalMensaje({ visible: false, texto: '', tipo: 'info' });
        }
      }
    };

    document.addEventListener('keydown', manejarEscape);
    return () => {
      document.removeEventListener('keydown', manejarEscape);
    };
  }, [modalMensaje.visible, confirmacionEliminar, procesandoRevocacion]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const cancelarFormulario = () => {
    setMostrarFormulario(false);
    setFormData(ESTADO_INICIAL_EMPLEADO);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (enviando) return;

    setEnviando(true);
    try {
      await axios.post(
        'http://localhost:5000/api/usuarios/admin/empleado',
        formData,
        obtenerConfigHeaders()
      );

      if (montadoRef.current) {
        setModalMensaje({
          visible: true,
          texto:
            'Empleado creado exitosamente. Se ha enviado un correo con sus credenciales de acceso.',
          tipo: 'exito',
        });
        cancelarFormulario();
      }
      await cargarUsuarios();
    } catch (error) {
      if (montadoRef.current) {
        setModalMensaje({
          visible: true,
          texto: error.response?.data?.mensaje || 'Error al registrar al empleado.',
          tipo: 'error',
        });
      }
    } finally {
      if (montadoRef.current) {
        setEnviando(false);
      }
    }
  };

  const confirmarRevocacion = async () => {
    if (!confirmacionEliminar || procesandoRevocacion) return;

    setProcesandoRevocacion(true);
    try {
      await axios.delete(
        `http://localhost:5000/api/usuarios/admin/empleado/${confirmacionEliminar.id}`,
        obtenerConfigHeaders()
      );
      if (montadoRef.current) {
        setConfirmacionEliminar(null);
        setModalMensaje({
          visible: true,
          texto: 'Cuenta de empleado eliminada correctamente.',
          tipo: 'exito',
        });
      }
      await cargarUsuarios();
    } catch (error) {
      if (montadoRef.current) {
        setConfirmacionEliminar(null);
        setModalMensaje({
          visible: true,
          texto: error.response?.data?.mensaje || 'Error al intentar eliminar la cuenta.',
          tipo: 'error',
        });
      }
    } finally {
      if (montadoRef.current) {
        setProcesandoRevocacion(false);
      }
    }
  };

  const cerrarModalConfirmacion = () => {
    if (!procesandoRevocacion) {
      setConfirmacionEliminar(null);
    }
  };

  const cerrarModalMensaje = () => {
    setModalMensaje({ visible: false, texto: '', tipo: 'info' });
  };

  return (
    <section className="afro-admin-page" aria-labelledby="admin-usuarios-titulo">
      <div className="afro-admin-header">
        <h1 id="admin-usuarios-titulo" className="afro-page-title">
          Gestión de Personal y Usuarios
        </h1>

        {!mostrarFormulario ? (
          <div className="afro-admin-actions">
            <button
              type="button"
              className="afro-btn afro-btn-dark"
              onClick={() => setMostrarFormulario(true)}
            >
              + Registrar Nuevo Empleado
            </button>
          </div>
        ) : null}
      </div>

      {mostrarFormulario ? (
        <div className="afro-card afro-admin-form-card">
          <h2 className="afro-admin-form-title">Alta de Nuevo Empleado</h2>
          <p className="afro-admin-form-intro">
            El sistema generará una contraseña segura y la enviará automáticamente al correo
            proporcionado.
          </p>

          <form onSubmit={handleSubmit} className="afro-form-stack">
            <div className="afro-field">
              <label htmlFor="emp-nombre" className="afro-label">
                Nombre Completo
              </label>
              <input
                id="emp-nombre"
                type="text"
                name="nombre_completo"
                className="afro-input"
                placeholder="Nombre completo del empleado"
                value={formData.nombre_completo}
                onChange={handleChange}
                autoComplete="name"
                required
              />
            </div>

            <div className="afro-admin-form-grid">
              <div className="afro-field">
                <label htmlFor="emp-correo" className="afro-label">
                  Correo Electrónico
                </label>
                <input
                  id="emp-correo"
                  type="email"
                  name="correo"
                  className="afro-input"
                  placeholder="empleado@afrolash.com"
                  value={formData.correo}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>

              <div className="afro-field">
                <label htmlFor="emp-telefono" className="afro-label">
                  Teléfono de Contacto
                </label>
                <input
                  id="emp-telefono"
                  type="tel"
                  name="telefono"
                  className="afro-input afro-tabular"
                  placeholder="Número de teléfono"
                  value={formData.telefono}
                  onChange={handleChange}
                  autoComplete="tel"
                  required
                />
              </div>
            </div>

            <div className="afro-field">
              <label htmlFor="emp-direccion" className="afro-label">
                Dirección de Residencia (Opcional)
              </label>
              <textarea
                id="emp-direccion"
                name="direccion"
                className="afro-textarea"
                placeholder="Dirección de residencia..."
                value={formData.direccion}
                onChange={handleChange}
                autoComplete="street-address"
              />
            </div>

            <div className="afro-admin-form-actions">
              <button
                type="submit"
                disabled={enviando}
                className="afro-btn afro-btn-success afro-admin-form-submit"
              >
                {enviando ? 'Registrando empleado...' : 'Generar Credenciales y Registrar'}
              </button>
              <button
                type="button"
                disabled={enviando}
                className="afro-btn afro-btn-outline"
                onClick={cancelarFormulario}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {cargando ? (
        <div className="afro-card afro-empty-state" role="status" aria-live="polite">
          <p>Cargando lista de usuarios...</p>
        </div>
      ) : errorCarga && usuarios.length === 0 ? (
        <div className="afro-card afro-empty-state afro-inline-error" role="alert">
          <h2>No se pudo cargar la lista de usuarios</h2>
          <p>{errorCarga}</p>
          <button
            type="button"
            className="afro-btn afro-btn-dark"
            onClick={cargarUsuarios}
          >
            Reintentar
          </button>
        </div>
      ) : usuarios.length === 0 ? (
        <div className="afro-card afro-empty-state">
          <h2>Sin usuarios registrados</h2>
          <p>No se encontraron cuentas de usuario en el sistema.</p>
        </div>
      ) : (
        <div className="afro-table-wrapper">
          <table className="afro-table">
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Nombre</th>
                <th scope="col">Correo</th>
                <th scope="col">Rol</th>
                <th scope="col">Teléfono</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => {
                const badgeRol = obtenerBadgeRol(usuario.rol);
                return (
                  <tr key={usuario.id_usuario}>
                    <td className="afro-tabular">{usuario.id_usuario}</td>
                    <td className="afro-table-name">{usuario.nombre_completo}</td>
                    <td>{usuario.correo}</td>
                    <td>
                      <span className={badgeRol.clase}>{badgeRol.etiqueta}</span>
                    </td>
                    <td className="afro-tabular">{usuario.telefono || 'N/A'}</td>
                    <td>
                      <div className="afro-table-actions">
                        {usuario.rol === 'empleado' ? (
                          <button
                            type="button"
                            className="afro-btn afro-btn-danger afro-btn-sm"
                            onClick={() =>
                              setConfirmacionEliminar({
                                id: usuario.id_usuario,
                                nombre: usuario.nombre_completo,
                              })
                            }
                          >
                            Revocar Acceso
                          </button>
                        ) : (
                          <span className="afro-badge">Protegido</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {confirmacionEliminar ? (
        <div className="afro-modal-backdrop" onClick={cerrarModalConfirmacion}>
          <div
            className="afro-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-usuarios-confirm-title"
            aria-describedby="admin-usuarios-confirm-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="afro-modal-icon-danger" aria-hidden="true">
              !
            </div>
            <h2 id="admin-usuarios-confirm-title" className="afro-modal-title">
              Revocar Acceso de Empleado
            </h2>
            <p id="admin-usuarios-confirm-desc" className="afro-modal-body">
              ¿Estás seguro de que deseas eliminar permanentemente el acceso del empleado{' '}
              <strong>{confirmacionEliminar.nombre}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="afro-modal-actions">
              <button
                type="button"
                className="afro-btn afro-btn-outline"
                disabled={procesandoRevocacion}
                onClick={cerrarModalConfirmacion}
                autoFocus
              >
                Cancelar
              </button>
              <button
                type="button"
                className="afro-btn afro-btn-danger"
                disabled={procesandoRevocacion}
                onClick={confirmarRevocacion}
              >
                {procesandoRevocacion ? 'Revocando acceso...' : 'Sí, revocar acceso'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {modalMensaje.visible ? (
        <div className="afro-modal-backdrop" onClick={cerrarModalMensaje}>
          <div
            className="afro-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-usuarios-modal-title"
            aria-describedby="admin-usuarios-modal-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={
                modalMensaje.tipo === 'exito'
                  ? 'afro-modal-icon-success'
                  : modalMensaje.tipo === 'info'
                    ? 'afro-modal-icon-info'
                    : 'afro-modal-icon-danger'
              }
              aria-hidden="true"
            >
              {modalMensaje.tipo === 'exito' ? '✓' : modalMensaje.tipo === 'info' ? 'i' : '!'}
            </div>
            <h2 id="admin-usuarios-modal-title" className="afro-modal-title">
              {modalMensaje.tipo === 'exito'
                ? 'Operación Exitosa'
                : modalMensaje.tipo === 'info'
                  ? 'Información'
                  : 'Atención Requerida'}
            </h2>
            <p id="admin-usuarios-modal-desc" className="afro-modal-body">
              {modalMensaje.texto}
            </p>
            <div className="afro-modal-actions">
              <button
                type="button"
                className="afro-btn afro-btn-dark afro-btn-full"
                onClick={cerrarModalMensaje}
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

export default AdminUsuarios;

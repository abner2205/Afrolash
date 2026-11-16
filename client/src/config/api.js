/**
 * Configuración centralizada de API y resolución de recursos multimedia.
 * Proyecto Afrolash (React 19 + Express 5).
 */

/**
 * Normaliza la URL base de la API.
 * Si no es string o queda vacía tras recortar espacios y barras finales, retorna 'http://localhost:5000'.
 *
 * @param {unknown} [valorEnv=process.env.REACT_APP_API_URL]
 * @returns {string}
 */
export function obtenerApiUrl(valorEnv = process.env.REACT_APP_API_URL) {
  if (typeof valorEnv !== 'string') {
    return 'http://localhost:5000';
  }
  const limpia = valorEnv.trim().replace(/\/+$/, '');
  return limpia.length > 0 ? limpia : 'http://localhost:5000';
}

export const API_URL = obtenerApiUrl();

/**
 * Resuelve determinísticamente la URL de una imagen.
 *
 * - Retorna '' si la ruta no es string o está vacía tras trim.
 * - Retorna la ruta intacta si es URL absoluta (http://, https://) o data: (case-insensitive).
 * - Si comienza con '/img/' o 'img/' (case-insensitive), normaliza sin barras iniciales
 *   y antepone `${obtenerApiUrl(apiBase)}/` garantizando ausencia de dobles barras.
 * - En cualquier otro caso (ej. activos del shell SPA como '/logo.png'), retorna ruta.trim().
 *
 * @param {unknown} ruta
 * @param {string} [apiBase=API_URL]
 * @returns {string}
 */
export function obtenerUrlImagen(ruta, apiBase = API_URL) {
  if (typeof ruta !== 'string') {
    return '';
  }
  const rutaTrim = ruta.trim();
  if (!rutaTrim) {
    return '';
  }

  // 1. URLs absolutas (http://, https://) o esquemas data:
  if (/^(?:https?:\/\/|data:)/i.test(rutaTrim)) {
    return rutaTrim;
  }

  // 2. Rutas relativas del catálogo (/img/... o img/...)
  const rutaNormalizada = rutaTrim.replace(/^\/+/, '');
  if (/^img\//i.test(rutaNormalizada)) {
    const base = obtenerApiUrl(apiBase);
    return `${base}/${rutaNormalizada}`;
  }

  // 3. Activos propios del shell SPA o cualquier otra ruta
  return rutaTrim;
}

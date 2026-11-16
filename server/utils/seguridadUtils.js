/**
 * Utilidades compartidas de validación, sanitización y hardening de seguridad.
 */

/**
 * Escapa caracteres especiales de HTML para mitigar inyección de plantillas y XSS en correos.
 * @param {string} valor 
 * @returns {string}
 */
function escaparHtml(valor) {
    if (valor === null || valor === undefined) return '';
    return String(valor)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Neutraliza caracteres de salto de línea (\r y \n) para prevenir ataques de inyección de cabeceras de correo (CRLF).
 * @param {string} valor 
 * @returns {string}
 */
function limpiarSaltosLinea(valor) {
    if (valor === null || valor === undefined) return '';
    return String(valor).replace(/[\r\n]/g, '').trim();
}

/**
 * Valida la sintaxis estándar de una dirección de correo electrónico.
 * @param {string} correo 
 * @returns {boolean}
 */
function esCorreoValido(correo) {
    if (typeof correo !== 'string') return false;
    const trimmed = correo.trim();
    if (!trimmed) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(trimmed);
}

/**
 * Valida la robustez de una contraseña: mínimo 8 caracteres, al menos una mayúscula y un número.
 * @param {string} password 
 * @returns {boolean}
 */
function esPasswordRobusta(password) {
    return (
        typeof password === 'string' &&
        password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[0-9]/.test(password)
    );
}

/**
 * Obtiene el origen base del frontend sanitizado desde las variables de entorno.
 * @returns {string}
 */
function obtenerOrigenFrontend() {
    return (process.env.FRONTEND_URL || 'http://localhost:3000')
        .split(',')[0]
        .trim()
        .replace(/\/+$/, '');
}

/**
 * Audita la presencia de variables de entorno críticas en el arranque de la API.
 * @returns {{ criticas: string[], faltantes: string[], ok: boolean }}
 */
function auditarVariablesEntorno() {
    const criticas = ['JWT_SECRET', 'DB_HOST', 'DB_USER', 'DB_NAME'];
    const faltantes = criticas.filter((variable) => !process.env[variable]);

    if (process.env.NODE_ENV === 'production') {
        if (faltantes.length > 0) {
            console.error(
                `[SEGURIDAD] Error crítico: Faltan variables de entorno obligatorias en producción: ${faltantes.join(', ')}`
            );
            process.exit(1);
        }
    } else if (process.env.NODE_ENV !== 'test') {
        if (faltantes.length > 0) {
            console.warn(
                `[SEGURIDAD] Advertencia: Variables de entorno críticas no configuradas: ${faltantes.join(', ')}`
            );
        }
    }

    return { criticas, faltantes, ok: faltantes.length === 0 };
}

module.exports = {
    escaparHtml,
    limpiarSaltosLinea,
    esCorreoValido,
    esPasswordRobusta,
    obtenerOrigenFrontend,
    auditarVariablesEntorno
};

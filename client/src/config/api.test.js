import { obtenerApiUrl, API_URL, obtenerUrlImagen } from './api';

describe('Módulo de Configuración de API (client/src/config/api.js)', () => {
  describe('obtenerApiUrl', () => {
    it('retorna http://localhost:5000 por defecto cuando no se pasa argumento ni existe REACT_APP_API_URL', () => {
      expect(obtenerApiUrl(undefined)).toBe('http://localhost:5000');
    });

    it('retorna http://localhost:5000 si el valor recibido no es string', () => {
      expect(obtenerApiUrl(null)).toBe('http://localhost:5000');
      expect(obtenerApiUrl(12345)).toBe('http://localhost:5000');
      expect(obtenerApiUrl({})).toBe('http://localhost:5000');
      expect(obtenerApiUrl(true)).toBe('http://localhost:5000');
    });

    it('retorna http://localhost:5000 si el string está vacío o contiene solo espacios/barras', () => {
      expect(obtenerApiUrl('')).toBe('http://localhost:5000');
      expect(obtenerApiUrl('   ')).toBe('http://localhost:5000');
      expect(obtenerApiUrl('///')).toBe('http://localhost:5000');
      expect(obtenerApiUrl('  ///  ')).toBe('http://localhost:5000');
    });

    it('elimina espacios y barras diagonales finales de una URL válida', () => {
      expect(obtenerApiUrl('https://api.afrolash.com')).toBe('https://api.afrolash.com');
      expect(obtenerApiUrl('https://api.afrolash.com/')).toBe('https://api.afrolash.com');
      expect(obtenerApiUrl('https://api.afrolash.com///')).toBe('https://api.afrolash.com');
      expect(obtenerApiUrl('  https://api.afrolash.com/  ')).toBe('https://api.afrolash.com');
      expect(obtenerApiUrl('http://192.168.1.100:5000/')).toBe('http://192.168.1.100:5000');
    });

    it('exporta una constante API_URL válida', () => {
      expect(typeof API_URL).toBe('string');
      expect(API_URL).toMatch(/^https?:\/\//);
    });
  });

  describe('obtenerUrlImagen', () => {
    it('retorna cadena vacía para valores no válidos o vacíos', () => {
      expect(obtenerUrlImagen(null)).toBe('');
      expect(obtenerUrlImagen(undefined)).toBe('');
      expect(obtenerUrlImagen('')).toBe('');
      expect(obtenerUrlImagen('   ')).toBe('');
      expect(obtenerUrlImagen(123)).toBe('');
      expect(obtenerUrlImagen({})).toBe('');
    });

    it('retorna URLs absolutas (http:// y https://) intactas sin importar mayúsculas', () => {
      const urlHttps = 'https://res.cloudinary.com/demo/image.png';
      const urlHttp = 'http://cdn.afrolash.com/fotos/rimel.jpg';
      const urlMayus = 'HTTPS://OTRODOMINIO.COM/IMAGEN.JPG';

      expect(obtenerUrlImagen(urlHttps)).toBe(urlHttps);
      expect(obtenerUrlImagen(urlHttp)).toBe(urlHttp);
      expect(obtenerUrlImagen(urlMayus)).toBe(urlMayus);
      expect(obtenerUrlImagen(`  ${urlHttps}  `)).toBe(urlHttps);
    });

    it('retorna esquemas data: intactos', () => {
      const dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA';
      const dataUriMayus = 'DATA:IMAGE/JPEG;BASE64,/9j/4AAQSkZJRgABAQ';

      expect(obtenerUrlImagen(dataUri)).toBe(dataUri);
      expect(obtenerUrlImagen(dataUriMayus)).toBe(dataUriMayus);
    });

    it('antepone la base de la API a rutas de catálogo (/img/... o img/...) sin barras dobles', () => {
      // Con API_URL por defecto (http://localhost:5000)
      expect(obtenerUrlImagen('/img/rimel.png')).toBe('http://localhost:5000/img/rimel.png');
      expect(obtenerUrlImagen('img/rimel.png')).toBe('http://localhost:5000/img/rimel.png');
      expect(obtenerUrlImagen('///img/rimel.png')).toBe('http://localhost:5000/img/rimel.png');
      expect(obtenerUrlImagen('/IMG/serum.jpg')).toBe('http://localhost:5000/IMG/serum.jpg');
      expect(obtenerUrlImagen('IMG/serum.jpg')).toBe('http://localhost:5000/IMG/serum.jpg');
      expect(obtenerUrlImagen('/img/subcarpeta/foto.webp')).toBe('http://localhost:5000/img/subcarpeta/foto.webp');
    });

    it('soporta base de API personalizada y evita dobles barras diagonales', () => {
      const apiProd = 'https://afrolash-api.onrender.com';
      expect(obtenerUrlImagen('/img/labial.png', apiProd)).toBe(
        'https://afrolash-api.onrender.com/img/labial.png'
      );
      expect(obtenerUrlImagen('img/labial.png', 'https://afrolash-api.onrender.com/')).toBe(
        'https://afrolash-api.onrender.com/img/labial.png'
      );
    });

    it('retorna activos del shell visual SPA intactos sin anteponer la API', () => {
      expect(obtenerUrlImagen('/logo.png')).toBe('/logo.png');
      expect(obtenerUrlImagen('fondo-hero.jpg')).toBe('fondo-hero.jpg');
      expect(obtenerUrlImagen('/assets/icono.svg')).toBe('/assets/icono.svg');
    });
  });
});

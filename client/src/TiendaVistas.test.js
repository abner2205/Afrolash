import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import Inicio from './components/Inicio';
import Catalogo from './components/Catalogo';
import ProductoDetalle from './components/ProductoDetalle';

jest.mock('axios', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
}));

const productosMock = [
  {
    id_producto: 1,
    nombre: 'Serum Pestañas Radiance',
    descripcion: 'Nutre y fortalece tus pestañas.',
    precio: '28.50',
    stock: 6,
    imagen_url: '/img/serum.jpg',
    categoria: 'Tratamiento',
  },
  {
    id_producto: 2,
    nombre: 'Rímel Volumen Afrolash',
    descripcion: 'Definición intensa de larga duración.',
    precio: '18.00',
    stock: 4,
    imagen_url: '/img/rimel.jpg',
    categoria: 'Ojos',
  },
  {
    id_producto: 3,
    nombre: 'Bálsamo Labial Rosa',
    descripcion: 'Hidratación suave con tono natural.',
    precio: '12.00',
    stock: 0,
    imagen_url: '/img/balsamo.jpg',
    categoria: 'Labios',
  },
];

describe('T2 — Pruebas de Inicio, Catálogo y Detalle de Producto', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.scrollTo = jest.fn();
  });

  describe('Inicio', () => {
    it('renderiza hero, carrusel accesible por teclado con lazy loading en productos y controles con aria-label', async () => {
      axios.get.mockResolvedValueOnce({ data: productosMock });
      const navegarA = jest.fn();

      render(<Inicio navegarA={navegarA} />);

      const logoHero = screen.getByAltText(/Logo de Afrolash/i);
      expect(logoHero).not.toHaveAttribute('loading', 'lazy');

      fireEvent.click(screen.getByRole('button', { name: /Explorar Catálogo/i }));
      expect(navegarA).toHaveBeenCalledWith('tienda');

      const btnSiguiente = await screen.findByRole('button', {
        name: /Producto destacado siguiente/i,
      });
      const btnAnterior = screen.getByRole('button', {
        name: /Producto destacado anterior/i,
      });
      expect(btnAnterior).toBeInTheDocument();

      const primerIndicador = screen.getByRole('button', {
        name: /Ir al producto destacado 1/i,
      });
      const segundoIndicador = screen.getByRole('button', {
        name: /Ir al producto destacado 2/i,
      });
      expect(primerIndicador).toHaveAttribute('aria-current', 'true');
      expect(segundoIndicador).not.toHaveAttribute('aria-current');

      const imgDestacado = screen.getByAltText('Serum Pestañas Radiance');
      expect(imgDestacado).toHaveAttribute('loading', 'lazy');

      fireEvent.click(btnSiguiente);
      expect(segundoIndicador).toHaveAttribute('aria-current', 'true');

      fireEvent.click(primerIndicador);
      expect(primerIndicador).toHaveAttribute('aria-current', 'true');
    });

    it('muestra aviso de error en UI sin bloquear el Hero si falla la carga de destacados', async () => {
      axios.get.mockRejectedValueOnce(new Error('Network Error'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<Inicio navegarA={jest.fn()} />);

      expect(screen.getByRole('heading', { name: /Bienvenido a Afrolash/i })).toBeInTheDocument();
      expect(await screen.findByRole('button', { name: /Reintentar/i })).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Catalogo', () => {
    it('asocia label al selector de orden, ordena de forma inmutable, carga imágenes lazy y permite abrir detalle por botón', async () => {
      axios.get.mockResolvedValueOnce({ data: productosMock });
      const navegarA = jest.fn();

      render(
        <Catalogo
          agregarAlCarrito={jest.fn(() => true)}
          navegarA={navegarA}
          terminoBusqueda=""
        />
      );

      const selectOrden = await screen.findByLabelText(/Ordenar por/i);
      expect(selectOrden).toHaveAttribute('id', 'orden-catalogo');

      const botonesDetalleIniciales = await screen.findAllByRole('button', {
        name: /Ver detalles de /i,
      });
      const titulosIniciales = botonesDetalleIniciales.map((btn) =>
        btn.getAttribute('aria-label')
      );
      expect(titulosIniciales).toEqual([
        'Ver detalles de Bálsamo Labial Rosa',
        'Ver detalles de Rímel Volumen Afrolash',
        'Ver detalles de Serum Pestañas Radiance',
      ]);

      fireEvent.change(selectOrden, { target: { value: 'precio_desc' } });

      const titulosDesc = screen
        .getAllByRole('button', { name: /Ver detalles de /i })
        .map((btn) => btn.getAttribute('aria-label'));
      expect(titulosDesc).toEqual([
        'Ver detalles de Serum Pestañas Radiance',
        'Ver detalles de Rímel Volumen Afrolash',
        'Ver detalles de Bálsamo Labial Rosa',
      ]);

      const imgProducto = screen.getByAltText('Rímel Volumen Afrolash');
      expect(imgProducto).toHaveAttribute('loading', 'lazy');

      fireEvent.click(
        screen.getByRole('button', { name: 'Ver detalles de Rímel Volumen Afrolash' })
      );
      expect(navegarA).toHaveBeenCalledWith('detalle', 2);
    });

    it('expone controles de cantidad accesibles y cierra el modal de confirmación con Escape', async () => {
      axios.get.mockResolvedValueOnce({ data: [productosMock[1]] });
      const agregarAlCarrito = jest.fn(() => true);

      render(
        <Catalogo
          agregarAlCarrito={agregarAlCarrito}
          navegarA={jest.fn()}
          terminoBusqueda=""
        />
      );

      const inputCantidad = await screen.findByLabelText('Cantidad de Rímel Volumen Afrolash');
      expect(inputCantidad).toHaveValue(1);

      fireEvent.click(
        screen.getByRole('button', { name: 'Aumentar cantidad de Rímel Volumen Afrolash' })
      );
      expect(inputCantidad).toHaveValue(2);

      fireEvent.click(
        screen.getByRole('button', { name: 'Disminuir cantidad de Rímel Volumen Afrolash' })
      );
      expect(inputCantidad).toHaveValue(1);

      fireEvent.click(screen.getByRole('button', { name: /Agregar al Carrito/i }));
      expect(agregarAlCarrito).toHaveBeenCalledWith(productosMock[1], 1);

      const modal = await screen.findByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby');

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('muestra un estado de error claro con opción de reintento si falla la red', async () => {
      axios.get.mockRejectedValueOnce(new Error('Network Error'));
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <Catalogo
          agregarAlCarrito={jest.fn()}
          navegarA={jest.fn()}
          terminoBusqueda=""
        />
      );

      expect(await screen.findByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reintentar/i })).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('ProductoDetalle', () => {
    const detalleMock = {
      id_producto: 10,
      nombre: 'Aceite Nutritivo Afrolash',
      descripcion: 'Fórmula botánica ligera para cejas y pestañas.',
      precio: '24.00',
      stock: 5,
      imagen_url: '/img/aceite.jpg',
      categoria: 'Cuidado Facial',
      ingredientes: 'Aceite de ricino orgánico, vitamina E y extracto de romero.',
      instrucciones_uso: 'Aplicar cada noche sobre pestañas limpias.',
      imagen_instrucciones: '/img/aceite-uso.jpg',
      consejos: 'Retira el exceso antes de aplicar para evitar goteo.',
      imagen_consejos: '/img/aceite-consejos.jpg',
      precauciones: 'Uso externo únicamente. Evitar contacto directo dentro del ojo.',
    };

    it('renderiza secciones detalladas, lazy loading en imágenes secundarias, controles accesibles y modal con Escape', async () => {
      axios.get.mockResolvedValueOnce({ data: detalleMock });
      const agregarAlCarrito = jest.fn(() => true);

      render(
        <ProductoDetalle
          idProducto={10}
          agregarAlCarrito={agregarAlCarrito}
          navegarA={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('http://localhost:5000/api/productos/10');
      });

      expect(
        await screen.findByRole('heading', { name: 'Aceite Nutritivo Afrolash' })
      ).toBeInTheDocument();

      expect(screen.getByText(detalleMock.ingredientes)).toBeInTheDocument();
      expect(screen.getByText(detalleMock.instrucciones_uso)).toBeInTheDocument();
      expect(screen.getByText(detalleMock.consejos)).toBeInTheDocument();
      expect(screen.getByText(detalleMock.precauciones)).toBeInTheDocument();

      expect(screen.getByAltText('Aceite Nutritivo Afrolash')).not.toHaveAttribute(
        'loading',
        'lazy'
      );
      expect(screen.getByAltText(/Instrucciones de uso/i)).toHaveAttribute('loading', 'lazy');
      expect(screen.getByAltText(/Consejos de uso/i)).toHaveAttribute('loading', 'lazy');

      fireEvent.click(screen.getByRole('button', { name: 'Aumentar cantidad' }));
      fireEvent.click(screen.getByRole('button', { name: 'Disminuir cantidad' }));
      fireEvent.click(screen.getByRole('button', { name: /Agregar al Carrito/i }));

      expect(agregarAlCarrito).toHaveBeenCalledWith(detalleMock, 1);

      const modal = await screen.findByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
      expect(modal).toHaveAttribute('aria-labelledby');

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('muestra estado de error con botón para volver al catálogo cuando no se encuentra el producto', async () => {
      axios.get.mockRejectedValueOnce({ response: { status: 404 } });
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const navegarA = jest.fn();

      render(
        <ProductoDetalle
          idProducto={999}
          agregarAlCarrito={jest.fn()}
          navegarA={navegarA}
        />
      );

      const btnVolver = await screen.findByRole('button', { name: /Volver al Catálogo/i });
      fireEvent.click(btnVolver);
      expect(navegarA).toHaveBeenCalledWith('tienda');

      consoleErrorSpy.mockRestore();
    });
  });
});

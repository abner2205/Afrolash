import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

const calcularTotal = (productos) => {
    return productos.reduce((total, item) => total + (item.precio * item.cantidad), 0);
};

describe('Pruebas de Funcionalidad: Carrito de Compras', () => {
    
    it('Debería calcular el total exacto de los cosméticos añadidos', () => {
        const carritoMock = [
            { id: 1, nombre: 'Pestañas Volumen', precio: 15.00, cantidad: 2 },
            { id: 2, nombre: 'Pegamento Quirúrgico', precio: 20.00, cantidad: 1 }
        ];

        const totalCalculado = calcularTotal(carritoMock);

        expect(totalCalculado).toBe(50.00);
    });

});


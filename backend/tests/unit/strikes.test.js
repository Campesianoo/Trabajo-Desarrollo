import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { calcularStrikes } = require('../../src/utils/strikes');

const hoy = '2026-10-30';

describe('calcularStrikes', () => {
  it('sin ausencias no hay strikes ni bloqueo', () => {
    expect(calcularStrikes([], hoy)).toEqual({ strikes: 0, bloqueadoHasta: null });
  });

  it('dos ausencias suman strikes pero no bloquean', () => {
    expect(calcularStrikes(['2026-10-20', '2026-10-28'], hoy)).toEqual({
      strikes: 2,
      bloqueadoHasta: null
    });
  });

  it('la tercera ausencia en 30 días bloquea 7 días desde ella', () => {
    expect(calcularStrikes(['2026-10-05', '2026-10-20', '2026-10-28'], hoy)).toEqual({
      strikes: 3,
      bloqueadoHasta: '2026-11-04'
    });
  });

  it('el bloqueo dura hasta el día 7 inclusive y después se levanta', () => {
    const fechas = ['2026-10-01', '2026-10-10', '2026-10-23'];
    expect(calcularStrikes(fechas, '2026-10-30').bloqueadoHasta).toBe('2026-10-30');
    expect(calcularStrikes(fechas, '2026-10-31').bloqueadoHasta).toBeNull();
  });

  it('tres ausencias separadas por más de 30 días no bloquean', () => {
    expect(calcularStrikes(['2026-09-20', '2026-10-15', '2026-10-25'], hoy)).toEqual({
      strikes: 2,
      bloqueadoHasta: null
    });
  });

  it('las ausencias viejas no cuentan como strikes', () => {
    expect(calcularStrikes(['2026-08-01', '2026-08-02', '2026-08-03'], hoy)).toEqual({
      strikes: 0,
      bloqueadoHasta: null
    });
  });

  it('no depende del orden en que llegan las fechas', () => {
    expect(calcularStrikes(['2026-10-28', '2026-10-05', '2026-10-20'], hoy).bloqueadoHasta).toBe(
      '2026-11-04'
    );
  });
});

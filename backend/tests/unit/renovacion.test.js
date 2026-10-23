import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { sumarDias, proponerRenovacion } = require('../../src/utils/membresia');

describe('sumarDias', () => {
  it('suma días cruzando meses y años', () => {
    expect(sumarDias('2026-10-16', 30)).toBe('2026-11-15');
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('respeta los años bisiestos', () => {
    expect(sumarDias('2028-02-28', 1)).toBe('2028-02-29');
    expect(sumarDias('2027-02-28', 1)).toBe('2027-03-01');
  });
});

describe('proponerRenovacion', () => {
  const hoy = '2026-10-16';

  it('sin membresías empieza hoy y dura 30 días', () => {
    expect(proponerRenovacion(null, hoy)).toEqual({
      fechaInicio: '2026-10-16',
      fechaVencimiento: '2026-11-15'
    });
  });

  it('si la última sigue al día, empieza al día siguiente de su vencimiento', () => {
    const ultima = { fechaVencimiento: '2026-10-25' };
    expect(proponerRenovacion(ultima, hoy)).toEqual({
      fechaInicio: '2026-10-26',
      fechaVencimiento: '2026-11-25'
    });
  });

  it('si vence hoy, la nueva empieza mañana (sin huecos ni superposición)', () => {
    expect(proponerRenovacion({ fechaVencimiento: hoy }, hoy).fechaInicio).toBe('2026-10-17');
  });

  it('si ya venció, empieza hoy', () => {
    const ultima = { fechaVencimiento: '2026-10-01' };
    expect(proponerRenovacion(ultima, hoy)).toEqual({
      fechaInicio: '2026-10-16',
      fechaVencimiento: '2026-11-15'
    });
  });
});

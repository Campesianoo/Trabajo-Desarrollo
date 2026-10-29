import { beforeAll, describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { ADMIN, iniciarBase, loguear, conOrigen } = require('../helpers');
const { hoy, sumarDias } = require('../../src/utils/membresia');

let admin;

const nuevoCliente = (dni) =>
  conOrigen(admin.post('/api/clientes')).send({
    dni,
    nombre: 'Cli',
    apellido: `Ente${dni}`,
    email: `cliente${dni}@test.com`
  });

const cargarMembresia = (dniCliente, desdeHoy, hastaHoy, valor = 20000) =>
  conOrigen(admin.post('/api/membresias')).send({
    dniCliente,
    fechaPago: sumarDias(hoy(), desdeHoy),
    fechaInicio: sumarDias(hoy(), desdeHoy),
    fechaVencimiento: sumarDias(hoy(), hastaHoy),
    valor
  });

const renovar = (dni, body = {}) =>
  conOrigen(admin.post(`/api/membresias/renovar/${dni}`)).send(body);

beforeAll(async () => {
  await iniciarBase();
  admin = await loguear(ADMIN.email, ADMIN.password);
  for (const dni of [1, 2, 3, 4, 5, 6]) await nuevoCliente(dni);
});

describe('GET /api/membresias/renovacion/:dni (cómo quedaría)', () => {
  it('un cliente sin membresías: empieza hoy, dura 30 días y falta el importe', async () => {
    const res = await admin.get('/api/membresias/renovacion/1');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      ultima: null,
      fechaPago: hoy(),
      fechaInicio: hoy(),
      fechaVencimiento: sumarDias(hoy(), 30),
      valor: null
    });
  });

  it('con una membresía al día: empieza al día siguiente de su vencimiento y repite el importe', async () => {
    await cargarMembresia(2, -10, 10, 25000);
    const res = await admin.get('/api/membresias/renovacion/2');
    expect(res.body.ultima.estado).toBeDefined();
    expect(res.body.fechaInicio).toBe(sumarDias(hoy(), 11));
    expect(res.body.fechaVencimiento).toBe(sumarDias(hoy(), 41));
    expect(res.body.valor).toBe(25000);
  });

  it('con la membresía vencida: empieza hoy', async () => {
    await cargarMembresia(3, -60, -30);
    const res = await admin.get('/api/membresias/renovacion/3');
    expect(res.body.fechaInicio).toBe(hoy());
  });

  it('no crea nada: solo calcula', async () => {
    const antes = await admin.get('/api/membresias/cliente/2');
    await admin.get('/api/membresias/renovacion/2');
    const despues = await admin.get('/api/membresias/cliente/2');
    expect(despues.body).toHaveLength(antes.body.length);
  });

  it('cliente inexistente 404 y dni inválido 400', async () => {
    expect((await admin.get('/api/membresias/renovacion/999')).status).toBe(404);
    expect((await admin.get('/api/membresias/renovacion/abc')).status).toBe(400);
  });
});

describe('POST /api/membresias/renovar/:dni', () => {
  it('la primera vez pide el importe (400) y con importe la crea desde hoy', async () => {
    const sin = await renovar(4);
    expect(sin.status).toBe(400);
    expect(sin.body.message).toMatch(/valor es obligatorio/);

    const res = await renovar(4, { valor: 18000 });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      dniCliente: 4,
      valor: 18000,
      fechaPago: hoy(),
      fechaInicio: hoy(),
      fechaVencimiento: sumarDias(hoy(), 30),
      estado: 'Activa'
    });
  });

  it('renovar encadena las membresías sin huecos ni superposiciones', async () => {
    const primera = await renovar(5, { valor: 20000 });
    const segunda = await renovar(5);
    const tercera = await renovar(5);

    expect(segunda.body.fechaInicio).toBe(sumarDias(primera.body.fechaVencimiento, 1));
    expect(tercera.body.fechaInicio).toBe(sumarDias(segunda.body.fechaVencimiento, 1));
    // Sin importe repite el de la anterior
    expect(segunda.body.valor).toBe(20000);
    expect(segunda.body.estado).toBe('Pendiente');
  });

  it('acepta otra fecha de pago y otro importe', async () => {
    const res = await renovar(6, { valor: '19500.5', fechaPago: sumarDias(hoy(), -2) });
    expect(res.status).toBe(201);
    expect(res.body.valor).toBe(19500.5);
    expect(res.body.fechaPago).toBe(sumarDias(hoy(), -2));
  });

  it('rechaza importes y fechas inválidos con 400', async () => {
    expect((await renovar(2, { valor: -5 })).status).toBe(400);
    expect((await renovar(2, { valor: 'abc' })).status).toBe(400);
    expect((await renovar(2, { fechaPago: '2026-02-30' })).status).toBe(400);
  });

  it('cliente inexistente 404', async () => {
    expect((await renovar(999, { valor: 100 })).status).toBe(404);
  });
});

describe('permisos', () => {
  it('el cliente y el profesor no pueden renovar ni ver la renovación (403)', async () => {
    const cliente = await loguear('cliente2@test.com', '2');
    expect((await conOrigen(cliente.post('/api/membresias/renovar/2')).send({})).status).toBe(403);
    expect((await cliente.get('/api/membresias/renovacion/2')).status).toBe(403);

    await conOrigen(admin.post('/api/profesores')).send({
      dni: 500,
      nombre: 'Pro',
      apellido: 'Fe',
      telefono: '1',
      email: 'profe500@test.com'
    });
    const profe = await loguear('profe500@test.com', '500');
    expect((await conOrigen(profe.post('/api/membresias/renovar/2')).send({})).status).toBe(403);
  });
});

describe('efecto sobre las reservas', () => {
  it('después de renovar, el cliente puede reservar un turno del período nuevo', async () => {
    await nuevoCliente(8);
    const cliente = await loguear('cliente8@test.com', '8');
    const tipo = await conOrigen(admin.post('/api/turnos/tipos-clase')).send({
      nombre: 'Funcional'
    });
    const turno = await conOrigen(admin.post('/api/turnos')).send({
      idClase: tipo.body.idClase,
      fecha: sumarDias(hoy(), 5),
      horaInicio: '10:00',
      horaFin: '11:00',
      capacidadMaxima: 5
    });
    const reservar = () =>
      conOrigen(cliente.post(`/api/turnos/${turno.body.idTurno}/inscripciones`));

    expect((await reservar()).status).toBe(409); // sin membresía
    expect((await renovar(8, { valor: 15000 })).status).toBe(201);
    expect((await reservar()).status).toBe(201);
  });
});

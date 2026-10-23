// Una membresía por vencer es la que vence dentro de esta cantidad de días
const DIAS_POR_VENCER = 7;
const MAX_VALOR = 99999999.99; // DECIMAL(10,2)

// Cuántos días dura una membresía que se renueva
const DURACION_RENOVACION_DIAS = 30;

const MS_POR_DIA = 24 * 60 * 60 * 1000;

// Fecha de hoy (YYYY-MM-DD) en la zona del gimnasio: el servidor puede estar en UTC
const hoy = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });

// Valida un YYYY-MM-DD que exista de verdad (no acepta 2026-02-30). Devuelve la fecha o null
const fechaValida = (valor) => {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
  const fecha = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor
    ? valor
    : null;
};

// Suma días a un YYYY-MM-DD sin pasar por la zona horaria
const sumarDias = (fecha, dias) =>
  new Date(Date.parse(`${fecha}T00:00:00Z`) + dias * MS_POR_DIA).toISOString().slice(0, 10);

const diasEntre = (desde, hasta) =>
  Math.round((new Date(`${hasta}T00:00:00Z`) - new Date(`${desde}T00:00:00Z`)) / MS_POR_DIA);

// Devuelve un número con a lo sumo 2 decimales, entre 0 y MAX_VALOR, o null si no es válido
const valorValido = (valor) => {
  const numero = typeof valor === 'string' && valor.trim() !== '' ? Number(valor) : valor;
  if (typeof numero !== 'number' || !Number.isFinite(numero)) return null;
  if (numero < 0 || numero > MAX_VALOR) return null;
  return Math.round(numero * 100) / 100;
};

// 'Pendiente' (todavía no empezó), 'Activa', 'Por vencer' o 'Vencida'
const calcularEstado = ({ fechaInicio, fechaVencimiento }, fechaHoy = hoy()) => {
  if (fechaVencimiento < fechaHoy) return 'Vencida';
  if (fechaInicio > fechaHoy) return 'Pendiente';
  return diasEntre(fechaHoy, fechaVencimiento) <= DIAS_POR_VENCER ? 'Por vencer' : 'Activa';
};

// Fechas de la renovación. Si la última membresía sigue al día, la nueva empieza al día siguiente
// de su vencimiento (sin huecos ni superposiciones); si ya venció o no hay ninguna, empieza hoy.
// `ultima` es la membresía que vence más tarde, o null
const proponerRenovacion = (ultima, fechaHoy = hoy()) => {
  const fechaInicio =
    ultima && ultima.fechaVencimiento >= fechaHoy
      ? sumarDias(ultima.fechaVencimiento, 1)
      : fechaHoy;
  return { fechaInicio, fechaVencimiento: sumarDias(fechaInicio, DURACION_RENOVACION_DIAS) };
};

module.exports = {
  hoy,
  fechaValida,
  valorValido,
  calcularEstado,
  sumarDias,
  proponerRenovacion,
  DIAS_POR_VENCER,
  DURACION_RENOVACION_DIAS
};

const { hoy, sumarDias } = require('./membresia');

// Cada ausencia a un turno reservado es un strike. Con STRIKES_PARA_BLOQUEO ausencias dentro de
// VENTANA_STRIKES_DIAS días, el cliente no puede reservar durante DIAS_BLOQUEO días contados
// desde la última de ellas. Cancelar una reserva no suma strikes
const STRIKES_PARA_BLOQUEO = 3;
const VENTANA_STRIKES_DIAS = 30;
const DIAS_BLOQUEO = 7;

// `fechas` son las fechas (YYYY-MM-DD) de los turnos en los que el cliente quedó ausente.
// Devuelve cuántos strikes tiene en los últimos 30 días y, si está bloqueado, hasta qué día
// inclusive (si no, null)
const calcularStrikes = (fechas, fechaHoy = hoy()) => {
  const ordenadas = [...fechas].sort();
  const desde = sumarDias(fechaHoy, -(VENTANA_STRIKES_DIAS - 1));
  const strikes = ordenadas.filter((f) => f >= desde && f <= fechaHoy).length;

  // Cada ausencia que completa 3 dentro de una ventana de 30 días dispara un bloqueo
  let bloqueadoHasta = null;
  for (let i = STRIKES_PARA_BLOQUEO - 1; i < ordenadas.length; i++) {
    const inicioVentana = sumarDias(ordenadas[i], -(VENTANA_STRIKES_DIAS - 1));
    if (ordenadas[i - (STRIKES_PARA_BLOQUEO - 1)] >= inicioVentana) {
      const fin = sumarDias(ordenadas[i], DIAS_BLOQUEO);
      if (fin >= fechaHoy && (!bloqueadoHasta || fin > bloqueadoHasta)) bloqueadoHasta = fin;
    }
  }
  return { strikes, bloqueadoHasta };
};

module.exports = { calcularStrikes, STRIKES_PARA_BLOQUEO, VENTANA_STRIKES_DIAS, DIAS_BLOQUEO };

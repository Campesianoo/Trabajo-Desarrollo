const Cliente = require('../models/Cliente');
const Membresia = require('../models/membresia');
const { sendError, toPositiveInt } = require('../utils/http');
const { calcularEstado } = require('../utils/membresia');

// Estados de membresía con los que se puede entrar al gimnasio
const ESTADOS_QUE_ENTRAN = ['Activa', 'Por vencer'];

// El estado se calcula con las fechas; el valor (DECIMAL) llega como texto desde la base
const aRespuesta = (membresia) => {
  const datos = membresia.toJSON();
  return { ...datos, valor: Number(datos.valor), estado: calcularEstado(datos) };
};

// GET /api/acceso/:dni - control de ingreso al gimnasio (solo admin).
// Con el DNI devuelve los datos del cliente, su membresía vigente y si puede entrar o no
const getAcceso = async (req, res) => {
  try {
    const dni = toPositiveInt(req.params.dni);
    if (!dni) return res.status(400).json({ message: 'DNI inválido' });

    const cliente = await Cliente.findByPk(dni, {
      attributes: ['dni', 'nombre', 'apellido', 'estado']
    });
    if (!cliente) return res.status(404).json({ message: 'No existe un cliente con ese DNI' });

    const membresias = (
      await Membresia.findAll({
        where: { dniCliente: dni },
        order: [
          ['fechaVencimiento', 'DESC'],
          ['idMembresia', 'DESC']
        ]
      })
    ).map(aRespuesta);

    // La que rige hoy (activa o por vencer); si no hay ninguna, la más reciente
    const vigente = membresias.find((m) => ESTADOS_QUE_ENTRAN.includes(m.estado)) ?? membresias[0] ?? null;

    let motivo = null;
    if (!cliente.estado) motivo = 'El cliente está dado de baja';
    else if (!vigente) motivo = 'El cliente no tiene ninguna membresía registrada';
    else if (vigente.estado === 'Vencida') motivo = 'La membresía está vencida';
    else if (vigente.estado === 'Pendiente') motivo = 'La membresía todavía no empezó';

    res.json({
      cliente: {
        dni: cliente.dni,
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        activo: cliente.estado
      },
      membresia: vigente,
      puedeEntrar: motivo === null,
      motivo
    });
  } catch (error) {
    sendError(res, 500, 'Error al verificar el acceso del cliente', error);
  }
};

module.exports = { getAcceso };
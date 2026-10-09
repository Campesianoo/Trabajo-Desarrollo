const Membresia = require('../models/membresia');
const Cliente = require('../models/Cliente');
const { sendError, toPositiveInt } = require('../utils/http');

// GET /api/membresias - Obtener todas las membresías
const getMembresias = async (req, res) => {
  try {
    const membresias = await Membresia.findAll({
      include: [{ model: Cliente, as: 'cliente', attributes: ['dni', 'nombre', 'apellido', 'email'] }],
    });
    res.json(membresias);
  } catch (error) {
    sendError(res, 500, 'Error al obtener las membresías', error);
  }
};

// GET /api/membresias/:id - Obtener una membresía por su ID
const getMembresiaById = async (req, res) => {
  try {
    const id = toPositiveInt(req.params.id);
    if (!id) {
      return sendError(res, 400, 'El ID de la membresía debe ser un número entero positivo');
    }

    const membresia = await Membresia.findByPk(id, {
      include: [{ model: Cliente, as: 'cliente', attributes: ['dni', 'nombre', 'apellido', 'email'] }],
    });

    if (!membresia) {
      return sendError(res, 404, 'Membresía no encontrada');
    }

    res.json(membresia);
  } catch (error) {
    sendError(res, 500, 'Error al obtener la membresía', error);
  }
};

// GET /api/membresias/cliente/:dni - Obtener las membresías de un cliente específico por su DNI
const getMembresiasByCliente = async (req, res) => {
  try {
    const dniCliente = toPositiveInt(req.params.dni);
    if (!dniCliente) {
      return sendError(res, 400, 'El DNI del cliente debe ser un número entero positivo');
    }

    const membresias = await Membresia.findAll({
      where: { dniCliente },
      order: [['fechaVencimiento', 'DESC']],
    });

    res.json(membresias);
  } catch (error) {
    sendError(res, 500, 'Error al obtener las membresías del cliente', error);
  }
};

// POST /api/membresias - Registrar una nueva membresía
const createMembresia = async (req, res) => {
  try {
    const { dniCliente, fechaPago, fechaInicio, fechaVencimiento, valor, estadoMembresia } = req.body;

    const dniNum = toPositiveInt(dniCliente);
    if (!dniNum) {
      return sendError(res, 400, 'El DNI del cliente es obligatorio y debe ser entero');
    }

    if (!fechaPago || !fechaInicio || !fechaVencimiento || valor === undefined) {
      return sendError(res, 400, 'Las fechas (pago, inicio, vencimiento) y el valor son obligatorios');
    }

    // Verificar que el cliente existe en la base de datos
    const clienteExiste = await Cliente.findByPk(dniNum);
    if (!clienteExiste) {
      return sendError(res, 404, 'El cliente especificado no existe');
    }

    const nuevaMembresia = await Membresia.create({
      dniCliente: dniNum,
      fechaPago,
      fechaInicio,
      fechaVencimiento,
      valor: Number(valor),
      estadoMembresia: estadoMembresia ? estadoMembresia.trim() : 'Activa',
    });

    res.status(201).json(nuevaMembresia);
  } catch (error) {
    sendError(res, 500, 'Error al crear la membresía', error);
  }
};

// PUT /api/membresias/:id - Actualizar una membresía
const updateMembresia = async (req, res) => {
  try {
    const id = toPositiveInt(req.params.id);
    if (!id) {
      return sendError(res, 400, 'El ID debe ser un número entero positivo');
    }

    const { fechaPago, fechaInicio, fechaVencimiento, valor, estadoMembresia } = req.body;

    const membresia = await Membresia.findByPk(id);
    if (!membresia) {
      return sendError(res, 404, 'Membresía no encontrada');
    }

    await membresia.update({
      fechaPago: fechaPago || membresia.fechaPago,
      fechaInicio: fechaInicio || membresia.fechaInicio,
      fechaVencimiento: fechaVencimiento || membresia.fechaVencimiento,
      valor: valor !== undefined ? Number(valor) : membresia.valor,
      estadoMembresia: estadoMembresia ? estadoMembresia.trim() : membresia.estadoMembresia,
    });

    res.json(membresia);
  } catch (error) {
    sendError(res, 500, 'Error al actualizar la membresía', error);
  }
};

// DELETE /api/membresias/:id - Eliminar una membresía
const deleteMembresia = async (req, res) => {
  try {
    const id = toPositiveInt(req.params.id);
    if (!id) {
      return sendError(res, 400, 'El ID debe ser un número entero positivo');
    }

    const membresia = await Membresia.findByPk(id);
    if (!membresia) {
      return sendError(res, 404, 'Membresía no encontrada');
    }

    await membresia.destroy();
    res.json({ message: 'Membresía eliminada correctamente' });
  } catch (error) {
    sendError(res, 500, 'Error al eliminar la membresía', error);
  }
};

module.exports = {
  getMembresias,
  getMembresiaById,
  getMembresiasByCliente,
  createMembresia,
  updateMembresia,
  deleteMembresia,
};
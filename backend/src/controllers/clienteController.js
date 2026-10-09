const Cliente = require('../models/Cliente');
const { sendError } = require('../utils/http');

// GET /api/clientes - Obtener la lista de clientes
const getClientes = async (req, res) => {
  try {
    const clientes = await Cliente.findAll();
    res.json(clientes);
  } catch (error) {
    sendError(res, 500, 'Error al obtener los clientes', error);
  }
};

// GET /api/clientes/:dni - Obtener un cliente específico por DNI
const getClienteByDni = async (req, res) => {
  try {
    const dniNum = Number(req.params.dni);

    if (isNaN(dniNum)) {
      return sendError(res, 400, 'El DNI debe ser un número entero válido');
    }

    const cliente = await Cliente.findByPk(dniNum);

    if (!cliente) {
      return sendError(res, 404, 'Cliente no encontrado');
    }

    res.json(cliente);
  } catch (error) {
    sendError(res, 500, 'Error al buscar el cliente', error);
  }
};

// POST /api/clientes - Registrar un nuevo cliente
const createCliente = async (req, res) => {
  try {
    const { dni, nombre, apellido, telefono, email, idUsuario } = req.body;

    if (!dni || !nombre || !apellido) {
      return sendError(res, 400, 'El DNI, nombre y apellido son obligatorios');
    }

    const dniNum = Number(dni);
    if (isNaN(dniNum)) {
      return sendError(res, 400, 'El DNI debe ser un número entero válido');
    }

    const existe = await Cliente.findByPk(dniNum);
    if (existe) {
      return sendError(res, 400, 'Ya existe un cliente registrado con ese DNI');
    }

    const nuevoCliente = await Cliente.create({
      dni: dniNum,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      telefono: telefono ? String(telefono).trim() : null,
      email: email ? email.trim() : null,
      idUsuario: idUsuario ? Number(idUsuario) : null,
    });

    res.status(201).json(nuevoCliente);
  } catch (error) {
    sendError(res, 500, 'Error al crear el cliente', error);
  }
};

// PUT /api/clientes/:dni - Modificar los datos de un cliente
const updateCliente = async (req, res) => {
  try {
    const dniNum = Number(req.params.dni);

    if (isNaN(dniNum)) {
      return sendError(res, 400, 'El DNI debe ser un número entero válido');
    }

    const { nombre, apellido, telefono, email, estado } = req.body;

    const cliente = await Cliente.findByPk(dniNum);
    if (!cliente) {
      return sendError(res, 404, 'Cliente no encontrado');
    }

    await cliente.update({
      nombre: nombre ? nombre.trim() : cliente.nombre,
      apellido: apellido ? apellido.trim() : cliente.apellido,
      telefono: telefono !== undefined ? (telefono ? String(telefono).trim() : null) : cliente.telefono,
      email: email !== undefined ? (email ? email.trim() : null) : cliente.email,
      estado: estado !== undefined ? estado : cliente.estado,
    });

    res.json(cliente);
  } catch (error) {
    sendError(res, 500, 'Error al actualizar el cliente', error);
  }
};

// DELETE /api/clientes/:dni - Eliminar un cliente
const deleteCliente = async (req, res) => {
  try {
    const dniNum = Number(req.params.dni);

    if (isNaN(dniNum)) {
      return sendError(res, 400, 'El DNI debe ser un número entero válido');
    }

    const cliente = await Cliente.findByPk(dniNum);
    if (!cliente) {
      return sendError(res, 404, 'Cliente no encontrado');
    }

    await cliente.destroy();
    res.json({ message: 'Cliente eliminado correctamente' });
  } catch (error) {
    sendError(res, 500, 'Error al eliminar el cliente', error);
  }
};

module.exports = {
  getClientes,
  getClienteByDni,
  createCliente,
  updateCliente,
  deleteCliente,
};
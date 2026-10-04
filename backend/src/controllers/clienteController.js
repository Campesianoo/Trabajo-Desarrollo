const sequelize = require('../config/database');
const { Cliente, Usuario } = require('../models/associations');
const { validatePassword, hashPassword, hashPasswordInicial } = require('../utils/password');
const { toPositiveInt, isValidEmail, sendError } = require('../utils/http');

const incluirUsuario = {
  model: Usuario,
  as: 'usuario',
  attributes: ['id', 'email', 'activo', 'debeCambiarPassword']
};

const aRespuesta = (cliente, usuario = cliente.usuario) => ({
  dni: cliente.dni,
  nombre: cliente.nombre,
  apellido: cliente.apellido,
  telefono: cliente.telefono,
  email: usuario.email,
  activo: usuario.activo,
  // true mientras el cliente no haya entrado por primera vez y elegido su contraseña
  debeCambiarPassword: usuario.debeCambiarPassword
});

const textoValido = (valor) => typeof valor === 'string' && valor.trim().length > 0;

// El teléfono puede llegar como número desde un formulario; se guarda siempre como texto
const normalizarTelefono = (valor) =>
  typeof valor === 'string' || typeof valor === 'number' ? String(valor).trim() : '';

const normalizarEmail = (email) => email.trim().toLowerCase();

const emailEnUso = async (email) => Boolean(await Usuario.findOne({ where: { email } }));

const manejarError = (res, error, mensaje) => {
  // Respaldo por si dos altas simultáneas pasan los chequeos previos
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res
      .status(409)
      .json({ message: 'Ya existe un cliente con ese DNI o una cuenta con ese email' });
  }
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({ message: error.errors.map((e) => e.message).join(', ') });
  }
  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return res
      .status(409)
      .json({ message: 'No se puede eliminar: el cliente tiene registros asociados' });
  }
  sendError(res, 500, mensaje, error);
};

// GET /clientes
const getClientes = async (req, res) => {
  try {
    const clientes = await Cliente.findAll({
      include: incluirUsuario,
      order: [
        ['apellido', 'ASC'],
        ['nombre', 'ASC']
      ]
    });
    res.json(clientes.map((cliente) => aRespuesta(cliente)));
  } catch (error) {
    sendError(res, 500, 'Error al obtener clientes', error);
  }
};

// GET /clientes/:dni
const getClienteByDni = async (req, res) => {
  try {
    const dni = toPositiveInt(req.params.dni);
    if (!dni) return res.status(400).json({ message: 'dni inválido' });

    const cliente = await Cliente.findByPk(dni, { include: incluirUsuario });
    if (!cliente) return res.status(404).json({ message: 'No encontrado' });
    res.json(aRespuesta(cliente));
  } catch (error) {
    sendError(res, 500, 'Error al obtener cliente', error);
  }
};

// POST /clientes - crea el cliente y su cuenta (rol cliente) en una sola transacción
const createCliente = async (req, res) => {
  try {
    const { dni, nombre, apellido, telefono, email, password } = req.body;
    const dniNum = toPositiveInt(dni);
    if (!dniNum) {
      return res.status(400).json({ message: 'dni es obligatorio y debe ser un entero positivo' });
    }
    const tel = normalizarTelefono(telefono);
    if (!textoValido(nombre) || !textoValido(apellido) || !tel) {
      return res.status(400).json({ message: 'nombre, apellido y telefono son obligatorios' });
    }
    if (!isValidEmail(email)) return res.status(400).json({ message: 'email inválido' });
    // Sin contraseña, la cuenta arranca con el DNI. En los dos casos la conoce el admin,
    // así que la cuenta queda marcada para que el cliente elija la suya
    if (password !== undefined && password !== '') {
      const errorPassword = validatePassword(password);
      if (errorPassword) return res.status(400).json({ message: errorPassword });
    }

    const emailNorm = normalizarEmail(email);
    if (await Cliente.findByPk(dniNum)) {
      return res.status(409).json({ message: 'Ya existe un cliente con ese DNI' });
    }
    if (await emailEnUso(emailNorm)) {
      return res.status(409).json({ message: 'Ya existe una cuenta con ese email' });
    }

    // El hash se calcula antes de abrir la transacción para no tenerla abierta de más
    const passwordHash = password
      ? await hashPassword(password)
      : await hashPasswordInicial(dniNum);
    const { cliente, usuario } = await sequelize.transaction(async (transaction) => {
      const usuario = await Usuario.create(
        { email: emailNorm, passwordHash, rol: 'cliente', debeCambiarPassword: true },
        { transaction }
      );
      const cliente = await Cliente.create(
        {
          dni: dniNum,
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          telefono: tel,
          idUsuario: usuario.id
        },
        { transaction }
      );
      return { cliente, usuario };
    });

    res.status(201).json(aRespuesta(cliente, usuario));
  } catch (error) {
    manejarError(res, error, 'Error al crear cliente');
  }
};

// PUT /clientes/:dni - admite nombre, apellido, telefono, email, password y activo
const updateCliente = async (req, res) => {
  try {
    const dni = toPositiveInt(req.params.dni);
    if (!dni) return res.status(400).json({ message: 'dni inválido' });

    const cliente = await Cliente.findByPk(dni);
    if (!cliente) return res.status(404).json({ message: 'No encontrado' });
    const usuario = await Usuario.findByPk(cliente.idUsuario);

    const { nombre, apellido, telefono, email, password, activo } = req.body;
    const cambiosCliente = {};
    const cambiosUsuario = {};

    for (const [campo, valor] of Object.entries({ nombre, apellido })) {
      if (valor === undefined) continue;
      if (!textoValido(valor))
        return res.status(400).json({ message: `${campo} no puede estar vacío` });
      cambiosCliente[campo] = valor.trim();
    }

    if (telefono !== undefined) {
      const tel = normalizarTelefono(telefono);
      if (!tel) return res.status(400).json({ message: 'telefono no puede estar vacío' });
      cambiosCliente.telefono = tel;
    }

    if (email !== undefined) {
      if (!isValidEmail(email)) return res.status(400).json({ message: 'email inválido' });
      const emailNorm = normalizarEmail(email);
      if (emailNorm !== usuario.email) {
        if (await emailEnUso(emailNorm)) {
          return res.status(409).json({ message: 'Ya existe una cuenta con ese email' });
        }
        cambiosUsuario.email = emailNorm;
      }
    }

    if (activo !== undefined) {
      if (typeof activo !== 'boolean') {
        return res.status(400).json({ message: 'activo debe ser true o false' });
      }
      cambiosUsuario.activo = activo;
    }

    if (password !== undefined) {
      const errorPassword = validatePassword(password);
      if (errorPassword) return res.status(400).json({ message: errorPassword });
      cambiosUsuario.passwordHash = await hashPassword(password);
      // Una contraseña nueva cierra las sesiones abiertas del cliente, y como la eligió el admin,
      // se le vuelve a recordar al cliente que elija la suya
      cambiosUsuario.tokenVersion = usuario.tokenVersion + 1;
      cambiosUsuario.debeCambiarPassword = true;
    }

    await sequelize.transaction(async (transaction) => {
      if (Object.keys(cambiosCliente).length) await cliente.update(cambiosCliente, { transaction });
      if (Object.keys(cambiosUsuario).length) await usuario.update(cambiosUsuario, { transaction });
    });

    res.json(aRespuesta(cliente, usuario));
  } catch (error) {
    manejarError(res, error, 'Error al actualizar cliente');
  }
};

// DELETE /clientes/:dni - borra el cliente y su cuenta
const deleteCliente = async (req, res) => {
  try {
    const dni = toPositiveInt(req.params.dni);
    if (!dni) return res.status(400).json({ message: 'dni inválido' });

    const cliente = await Cliente.findByPk(dni);
    if (!cliente) return res.status(404).json({ message: 'No encontrado' });

    await sequelize.transaction(async (transaction) => {
      await cliente.destroy({ transaction });
      await Usuario.destroy({ where: { id: cliente.idUsuario }, transaction });
    });
    res.json({ message: 'Cliente eliminado' });
  } catch (error) {
    manejarError(res, error, 'Error al eliminar cliente');
  }
};

module.exports = {
  getClientes,
  getClienteByDni,
  createCliente,
  updateCliente,
  deleteCliente
};

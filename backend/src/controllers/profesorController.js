const Profesor = require('../models/profesor');
const Especialidad = require('../models/especialidad');
const ProfesorEspecialidad = require('../models/profesorEspecialidad');
const { toPositiveInt, isValidEmail, sendError } = require('../utils/http');

// config. común para incluir las especialidades de un profesor
const especialidadesInclude = {
  model: Especialidad,
  as: 'especialidades',
  attributes: [['id', 'idEspecialidad'], 'nombre'],
  through: { attributes: [] }
};

// GET /profesores - trae todos
const getProfesor = async (req, res) => {
  try {
    const profesores = await Profesor.findAll({ include: especialidadesInclude });
    res.json(profesores);
  } catch (error) {
    sendError(res, 500, 'Error al obtener profesores', error);
  }
};

// GET trae un profesor por dni
const getProfesorByPk = async (req, res) => {
  try {
    const dni = toPositiveInt(req.params.dni);
    if (!dni) return res.status(400).json({ message: 'dni inválido' });

    const profesor = await Profesor.findByPk(dni, { include: especialidadesInclude });
    if (!profesor) return res.status(404).json({ message: 'No encontrado' });
    res.json(profesor);
  } catch (error) {
    sendError(res, 500, 'Error al obtener profesor', error);
  }
};

// POST - crea nuevo profesor
const createProfesor = async (req, res) => {
  try {
    const { dni, nombre, apellido, telefono, email } = req.body;
    const dniNum = toPositiveInt(dni);
    if (!dniNum)
      return res.status(400).json({ message: 'dni es obligatorio y debe ser un entero positivo' });
    if (!nombre || !apellido || !telefono || !email) {
      return res
        .status(400)
        .json({ message: 'nombre, apellido, telefono y email son obligatorios' });
    }
    if (!isValidEmail(email)) return res.status(400).json({ message: 'email inválido' });

    const nuevo = await Profesor.create({
      dni: dniNum,
      nombre,
      apellido,
      telefono: String(telefono),
      email
    });
    res.status(201).json(nuevo);
  } catch (error) {
    sendError(res, 400, 'Error al crear profesor', error);
  }
};

// PUT edita un profesor existente por dni
const updateProfesor = async (req, res) => {
  try {
    const dni = toPositiveInt(req.params.dni);
    if (!dni) return res.status(400).json({ message: 'dni inválido' });

    const profesor = await Profesor.findByPk(dni); //busca
    if (!profesor) return res.status(404).json({ message: 'No encontrado' });

    const { dni: _dni, ...datos } = req.body; // la PK no se puede modificar por este endpoint
    if (datos.telefono !== undefined) datos.telefono = String(datos.telefono);
    if (datos.email !== undefined && !isValidEmail(datos.email)) {
      return res.status(400).json({ message: 'email inválido' });
    }

    await profesor.update(datos); //actualiza
    res.json(profesor);
  } catch (error) {
    sendError(res, 400, 'Error al actualizar', error);
  }
};

// DELETE elimina un profesor por dni
const deleteProfesor = async (req, res) => {
  try {
    const dni = toPositiveInt(req.params.dni);
    if (!dni) return res.status(400).json({ message: 'dni inválido' });

    const profesor = await Profesor.findByPk(dni); //busca
    if (!profesor) return res.status(404).json({ message: 'No encontrado' });

    await profesor.destroy(); //elimina
    res.json({ message: 'Profesor eliminado' });
  } catch (error) {
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res
        .status(409)
        .json({ message: 'No se puede eliminar: el profesor tiene especialidades asignadas' });
    }
    sendError(res, 500, 'Error al eliminar', error);
  }
};

// POST asigna una especialidad a un profesor
const asignarEspecialidad = async (req, res) => {
  try {
    const dni = toPositiveInt(req.params.dni);
    if (!dni) return res.status(400).json({ message: 'dni inválido' });
    const idEspecialidad = toPositiveInt(req.body.idEspecialidad);
    if (!idEspecialidad) return res.status(400).json({ message: 'idEspecialidad inválido' });

    const profesor = await Profesor.findByPk(dni);
    if (!profesor) return res.status(404).json({ message: 'Profesor no encontrado' });
    const especialidad = await Especialidad.findByPk(idEspecialidad);
    if (!especialidad) return res.status(404).json({ message: 'Especialidad no encontrada' });

    // findOrCreate evita la condición de carrera de "buscar y luego crear"
    const [, created] = await ProfesorEspecialidad.findOrCreate({
      where: { dniProfesor: dni, idEspecialidad }
    });
    if (!created) return res.status(409).json({ message: 'La relación ya existe' });

    res.status(201).json({ message: 'Especialidad asignada al profesor' });
  } catch (error) {
    sendError(res, 500, 'Error al asignar especialidad', error);
  }
};

// DELETE quita una especialidad de un profesor
const quitarEspecialidad = async (req, res) => {
  try {
    const dni = toPositiveInt(req.params.dni);
    const idEspecialidad = toPositiveInt(req.params.idEspecialidad);
    if (!dni || !idEspecialidad) return res.status(400).json({ message: 'Parámetros inválidos' });

    const relacion = await ProfesorEspecialidad.findOne({
      where: { dniProfesor: dni, idEspecialidad }
    });
    if (!relacion) return res.status(404).json({ message: 'Relación no encontrada' });
    await relacion.destroy(); //elimina solo la relación
    res.json({ message: 'Especialidad quitada del profesor' });
  } catch (error) {
    sendError(res, 500, 'Error al quitar especialidad', error);
  }
};

module.exports = {
  getProfesor,
  getProfesorByPk,
  createProfesor,
  updateProfesor,
  deleteProfesor,
  asignarEspecialidad,
  quitarEspecialidad
};

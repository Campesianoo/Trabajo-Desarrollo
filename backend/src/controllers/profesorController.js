const Profesor = require('../models/profesor');
const Especialidad = require('../models/especialidad');
const ProfesorEspecialidad = require('../models/profesorEspecialidad');

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
    console.error(error);
    res.status(500).json({ message: 'Error al obtener profesores', error: error.message });
  }
};

// GET trae un profesor por dni
const getProfesorByPk = async (req, res) => {
  try {
    const profesor = await Profesor.findByPk(req.params.dni, { include: especialidadesInclude });
    if (!profesor) return res.status(404).json({ message: 'No encontrado' });
    res.json(profesor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener profesor', error: error.message });
  }
};

// POST - crea nuevo profesor
const createProfesor = async (req, res) => {
  try {
    const nuevo = await Profesor.create(req.body);
    res.status(201).json(nuevo);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Error al crear profesor', error: error.message });
  }
};

// PUT edita un profesor existente por dni
const updateProfesor = async (req, res) => {
  try {
    const profesor = await Profesor.findByPk(req.params.dni); //busca
    if (!profesor) return res.status(404).json({ message: 'No encontrado' });
    await profesor.update(req.body); //actualiza
    res.json(profesor);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Error al actualizar', error: error.message });
  }
};

// DELETE elimina un profesor por dni
const deleteProfesor = async (req, res) => {
  try {
    const profesor = await Profesor.findByPk(req.params.dni); //busca
    if (!profesor) return res.status(404).json({ message: 'No encontrado' });
    await profesor.destroy(); //elimina
    res.json({ message: 'Profesor eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar', error: error.message });
  }
};

// POST asigna una especialidad a un profesor
const asignarEspecialidad = async (req, res) => {
  try {
    const { idEspecialidad } = req.body;
    const profesor = await Profesor.findByPk(req.params.dni);
    if (!profesor) return res.status(404).json({ message: 'Profesor no encontrado' });
    const especialidad = await Especialidad.findByPk(idEspecialidad);
    if (!especialidad) return res.status(404).json({ message: 'Especialidad no encontrada' });

    const existe = await ProfesorEspecialidad.findOne({
      where: { dniProfesor: req.params.dni, idEspecialidad }
    });
    if (existe) return res.status(409).json({ message: 'La relación ya existe' });

    await ProfesorEspecialidad.create({ dniProfesor: req.params.dni, idEspecialidad });
    res.status(201).json({ message: 'Especialidad asignada al profesor' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al asignar especialidad', error: error.message });
  }
};

// DELETE quita una especialidad de un profesor
const quitarEspecialidad = async (req, res) => {
  try {
    const { dni, idEspecialidad } = req.params;
    const relacion = await ProfesorEspecialidad.findOne({
      where: { dniProfesor: dni, idEspecialidad }
    });
    if (!relacion) return res.status(404).json({ message: 'Relación no encontrada' });
    await relacion.destroy(); //elimina solo la relación
    res.json({ message: 'Especialidad quitada del profesor' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al quitar especialidad', error: error.message });
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
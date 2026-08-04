const Profesor = require('../models/profesor');

// GET /profesores - trae todos
const getProfesor = async (req, res) => {
  try {
    const profesores = await Profesor.findAll();
    res.json(profesores);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener profesores', error: error.message });
  }
};

// GET trae un profesor por dni
const getProfesorByPk = async (req, res) => {
  try {
    const profesor = await Profesor.findByPk(req.params.dni);
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

module.exports = {
  getProfesor,
  getProfesorByPk,
  createProfesor,
  updateProfesor,
  deleteProfesor
}; 
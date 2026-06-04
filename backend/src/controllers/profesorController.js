const Profesor = require('../models/profesor');

// GET /profesores - trae todos
const getProfesor = async (req, res) => {
  try {
    const profesores = await Producto.find();
    res.json(productos);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener profesores' });
  }
};

// GET trae un profesor por dni
const getProfesorByPk = async (req, res) => {
  try {
    const profesor = await Producto.findByPk(req.params.dni);
    if (!profesor) return res.status(404).json({ message: 'No encontrado' });
    res.json(producto);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener profesor' });
  }
};

// POST - crea nuevo profesor
const createProfesor = async (req, res) => {
  try {
    const nuevo = new Profesor(req.body);
    const guardado = await nuevo.save();
    res.status(201).json(guardado);
  } catch (error) {
    res.status(400).json({ message: 'Error al crear producto' });
  }
};

// PUT edita un profesor eistentente por dni
const updateProfesor = async (req, res) => {
  try {
    const profesor = await Profesor.findByPk(req.params.dni); //busca
    if (!persona) return res.status(404).json({ message: 'No encontrado' });
    await profesor.update(req.body); //actualiza
    res.json(profesor);
  } catch (error) {
    res.status(400).json({ message: 'Error al actualizar' });
  }
};

// DELETE elimina un profesor por dni
const deleteProfesor = async (req, res) => {
  try {
    const profesor = await Profesor.findByPk(req.params.dni); //busca
    if (!profesor) return res.status(404).json({ message: 'No encontrado' });
    await profesor.destroy(); //elimina
    res.json({ message: 'Persona eliminada' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar' });
  }
};

module.exports = {
  getProfesor,
  getProfesorByPk,
  createProfesor,
  updateProfesor,
  deleteProfesor
}; 
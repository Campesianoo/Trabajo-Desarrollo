const Especialidad = require('../models/especialidad');

// GET /especialidades - trae todas
const getEspecialidades = async (req, res) => {
  try {
    const especialidades = await Especialidad.findAll();
    res.json(especialidades);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener especialidades', error: error.message });
  }
};

// GET trae una especialidad por id
const getEspecialidadByPk = async (req, res) => {
  try {
    const especialidad = await Especialidad.findByPk(req.params.id);
    if (!especialidad) return res.status(404).json({ message: 'No encontrado' });
    res.json(especialidad);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener especialidad', error: error.message });
  }
};

// POST - crea nueva especialidad
const createEspecialidad = async (req, res) => {
  try {
    const nueva = await Especialidad.create(req.body);
    res.status(201).json(nueva);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Error al crear especialidad', error: error.message });
  }
};

// PUT edita una especialidad existente por id
const updateEspecialidad = async (req, res) => {
  try {
    const especialidad = await Especialidad.findByPk(req.params.id); //busca
    if (!especialidad) return res.status(404).json({ message: 'No encontrado' });
    await especialidad.update(req.body); //actualiza
    res.json(especialidad);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Error al actualizar', error: error.message });
  }
};

// DELETE elimina una especialidad por id
const deleteEspecialidad = async (req, res) => {
  try {
    const especialidad = await Especialidad.findByPk(req.params.id); //busca
    if (!especialidad) return res.status(404).json({ message: 'No encontrado' });
    await especialidad.destroy(); //elimina
    res.json({ message: 'Especialidad eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar', error: error.message });
  }
};

module.exports = {
  getEspecialidades,
  getEspecialidadByPk,
  createEspecialidad,
  updateEspecialidad,
  deleteEspecialidad
};

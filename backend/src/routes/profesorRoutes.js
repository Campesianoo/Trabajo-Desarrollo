const express = require('express');
const router = express.Router();
const {
  getProfesor,
  getProfesorByPk,
  createProfesor,
  updateProfesor,
  deleteProfesor,
  asignarEspecialidad,
  quitarEspecialidad
} = require('../controllers/profesorController');

router.get('/',        getProfesor);
router.get('/:dni',     getProfesorByPk);
router.post('/',       createProfesor);
router.put('/:dni',     updateProfesor);
router.delete('/:dni',  deleteProfesor);

// relación N:M Profesor-Especialidad
router.post('/:dni/especialidades',    asignarEspecialidad);
router.delete('/:dni/especialidades/:idEspecialidad', quitarEspecialidad);

module.exports = router;
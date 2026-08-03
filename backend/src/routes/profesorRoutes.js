const express = require('express');
const router = express.Router();
const {
  getProfesor,
  getProfesorByPk,
  createProfesor,
  updateProfesor,
  deleteProfesor
} = require('../controllers/profesorController');

router.get('/',        getProfesor);
router.get('/:dni',     getProfesorByPk);
router.post('/',       createProfesor);
router.put('/:dni',     updateProfesor);
router.delete('/:dni',  deleteProfesor);

module.exports = router;
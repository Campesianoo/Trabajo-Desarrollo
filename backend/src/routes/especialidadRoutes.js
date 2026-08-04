const express = require('express');
const router = express.Router();
const {
  getEspecialidades,
  getEspecialidadByPk,
  createEspecialidad,
  updateEspecialidad,
  deleteEspecialidad
} = require('../controllers/especialidadController');

router.get('/',            getEspecialidades);
router.get('/:id',          getEspecialidadByPk);
router.post('/',           createEspecialidad);
router.put('/:id',          updateEspecialidad);
router.delete('/:id',       deleteEspecialidad);

module.exports = router;

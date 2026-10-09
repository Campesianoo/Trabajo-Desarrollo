const { Router } = require('express');
const {
  getMembresias,
  getMembresiaById,
  getMembresiasByCliente,
  createMembresia,
  updateMembresia,
  deleteMembresia,
} = require('../controllers/membresiaController');
const { authenticate, authorize } = require('../middlewares/auth');

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

const soloAdmin = authorize('admin');

// Consultas (Accesibles para usuarios autenticados)
router.get('/', getMembresias);
router.get('/:id', getMembresiaById);
router.get('/cliente/:dni', getMembresiasByCliente);

// Operaciones de modificación (Solo administradores)
router.post('/', soloAdmin, createMembresia);
router.put('/:id', soloAdmin, updateMembresia);
router.delete('/:id', soloAdmin, deleteMembresia);

module.exports = router;
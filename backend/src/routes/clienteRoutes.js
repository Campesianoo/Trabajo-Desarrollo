const { Router } = require('express');
const {
  getClientes,
  getClienteByDni,
  createCliente,
  updateCliente,
  deleteCliente,
} = require('../controllers/clienteController');
const { authenticate, authorize } = require('../middlewares/auth');

const router = Router();

// Todas las rutas requieren estar logueado
router.use(authenticate);

const soloAdmin = authorize('admin');

router.get('/', getClientes);
router.get('/:dni', getClienteByDni);
router.post('/', soloAdmin, createCliente);
router.put('/:dni', soloAdmin, updateCliente);
router.delete('/:dni', soloAdmin, deleteCliente);

module.exports = router;
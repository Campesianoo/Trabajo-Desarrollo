const express = require('express');
const router = express.Router();
const {
  getClientes,
  getClienteByDni,
  createCliente,
  updateCliente,
  deleteCliente
} = require('../controllers/clienteController');
const { authenticate, authorize } = require('../middlewares/auth');

// La gestión de clientes es exclusiva del admin
router.use(authenticate, authorize('admin'));

router.get('/', getClientes);
router.get('/:dni', getClienteByDni);
router.post('/', createCliente);
router.put('/:dni', updateCliente);
router.delete('/:dni', deleteCliente);

module.exports = router;

const { Router } = require('express');
const { getAcceso } = require('../controllers/controlaccesoController');
const { authenticate, authorize } = require('../middlewares/auth');

const router = Router();

router.use(authenticate);

// El control de ingreso lo hace el administrador
router.get('/:dni', authorize('admin'), getAcceso);

module.exports = router;
const express = require('express');
const router = express.Router();
const vuelosController = require('../controllers/vuelosController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

router.get('/', vuelosController.listar);
router.get('/:id', vuelosController.obtenerPorId);
router.post('/', vuelosController.crear);
router.put('/:id', vuelosController.actualizar);


router.delete('/:id', verificarToken, verificarRol('admin'), vuelosController.darDeBaja);

router.post('/:id/tripulantes', verificarToken, verificarRol('admin', 'operador'), vuelosController.asignarTripulante);
router.delete('/:id/tripulantes/:idTripulante', verificarToken, verificarRol('admin', 'operador'), vuelosController.quitarTripulante);

module.exports = router;
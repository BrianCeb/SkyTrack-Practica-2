const express = require('express');
const router = express.Router();
const vuelosController = require('../controllers/vuelosController');
const { verificarToken, verificarRol } = require('../middlewares/authMiddleware');

router.get('/panel', vuelosController.panel);

router.get('/', vuelosController.listar);
router.get('/:id', vuelosController.obtenerPorId);
router.post('/', vuelosController.crear);
router.put('/:id', vuelosController.actualizar);
router.delete('/:id', verificarToken, verificarRol('admin'), vuelosController.darDeBaja);

router.post('/:id/tripulantes', verificarToken, verificarRol('admin', 'operador'), vuelosController.asignarTripulante);
router.delete('/:id/tripulantes/:idTripulante', verificarToken, verificarRol('admin', 'operador'), vuelosController.quitarTripulante);

// Caso Nº 6: cambios de estado
router.patch('/:id/iniciar', verificarToken, vuelosController.iniciar);
router.patch('/:id/aterrizar', verificarToken, vuelosController.aterrizar);

module.exports = router;
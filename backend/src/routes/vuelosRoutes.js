const express = require('express');
const router = express.Router();
const vuelosController = require('../controllers/vuelosController');

router.get('/', vuelosController.listar);
router.get('/:id', vuelosController.obtenerPorId);
router.post('/', vuelosController.crear);
router.put('/:id', vuelosController.actualizar);
router.delete('/:id', vuelosController.darDeBaja);

router.post('/:id/tripulantes', vuelosController.asignarTripulante);
router.delete('/:id/tripulantes/:idTripulante', vuelosController.quitarTripulante);

module.exports = router;
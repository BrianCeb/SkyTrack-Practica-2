const express = require('express');
const router = express.Router();
const avionesController = require('../controllers/avionesController');


router.get('/', avionesController.listar);
router.get('/:id', avionesController.obtenerPorId);
router.post('/', avionesController.crear);
router.put('/:id', avionesController.actualizar);

module.exports = router;
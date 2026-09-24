const express = require('express');
const router = express.Router();
const tripulantesController = require('../controllers/tripulantesController');

router.get('/', tripulantesController.listar);
router.post('/', tripulantesController.crear);

module.exports = router;
const tripulantesService = require('../services/tripulantesService');

async function listar(req, res) {
    try {
        const tripulantes = await tripulantesService.listarTripulantes();
        res.json(tripulantes);
    } catch (error) {
        res.status(500).json({ error: 'Error al listar tripulantes', detalle: error.message });
    }
}

async function crear(req, res) {
    try {
        const nuevoTripulante = await tripulantesService.crearTripulante(req.body);
        res.status(201).json(nuevoTripulante);
    } catch (error) {
        res.status(400).json({ error: 'Error al crear el tripulante', detalle: error.message });
    }
}

module.exports = { listar, crear };
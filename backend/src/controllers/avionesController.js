const avionesService = require('../services/avionesService');

async function listar(req, res) {
    try {
        const aviones = await avionesService.listarAviones();
        res.json(aviones);
    } catch (error) {
        res.status(500).json({ error: 'Error al listar aviones', detalle: error.message });
    }
}

async function obtenerPorId(req, res) {
    try {
        const avion = await avionesService.obtenerAvionPorId(req.params.id);
        if (!avion) {
            return res.status(404).json({ error: 'Avión no encontrado' });
        }
        res.json(avion);
    } catch (error) {
        res.status(500).json({ error: 'Error al buscar el avión', detalle: error.message });
    }
}

async function crear(req, res) {
    try {
        const nuevoAvion = await avionesService.crearAvion(req.body);
        res.status(201).json(nuevoAvion);
    } catch (error) {
        res.status(400).json({ error: 'Error al crear el avión', detalle: error.message });
    }
}

async function actualizar(req, res) {
    try {
        const avionActualizado = await avionesService.actualizarAvion(req.params.id, req.body);
        if (!avionActualizado) {
            return res.status(404).json({ error: 'Avión no encontrado' });
        }
        res.json(avionActualizado);
    } catch (error) {
        res.status(400).json({ error: 'Error al actualizar el avión', detalle: error.message });
    }
}

module.exports = {
    listar,
    obtenerPorId,
    crear,
    actualizar,
};
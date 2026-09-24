const vuelosService = require('../services/vuelosService');

async function listar(req, res) {
    try {
        const vuelos = await vuelosService.listarVuelos(req.query);
        res.json(vuelos);
    } catch (error) {
        res.status(500).json({ error: 'Error al listar vuelos', detalle: error.message });
    }
}

async function obtenerPorId(req, res) {
    try {
        const vuelo = await vuelosService.obtenerVueloPorId(req.params.id);
        if (!vuelo) {
            return res.status(404).json({ error: 'Vuelo no encontrado' });
        }
        res.json(vuelo);
    } catch (error) {
        res.status(500).json({ error: 'Error al buscar el vuelo', detalle: error.message });
    }
}

async function crear(req, res) {
    try {
        const nuevoVuelo = await vuelosService.crearVuelo(req.body);
        res.status(201).json(nuevoVuelo);
    } catch (error) {
        res.status(400).json({ error: 'Error al crear el vuelo', detalle: error.message });
    }
}

async function actualizar(req, res) {
    try {
        const vueloActualizado = await vuelosService.actualizarVuelo(req.params.id, req.body);
        if (!vueloActualizado) {
            return res.status(404).json({ error: 'Vuelo no encontrado' });
        }
        res.json(vueloActualizado);
    } catch (error) {
        res.status(400).json({ error: 'Error al actualizar el vuelo', detalle: error.message });
    }
}

async function darDeBaja(req, res) {
    try {
        const vuelo = await vuelosService.darDeBajaVuelo(req.params.id);
        if (!vuelo) {
            return res.status(404).json({ error: 'Vuelo no encontrado' });
        }
        res.json({ mensaje: 'Vuelo dado de baja correctamente', vuelo });
    } catch (error) {
        res.status(500).json({ error: 'Error al dar de baja el vuelo', detalle: error.message });
    }
}

async function asignarTripulante(req, res) {
    try {
        // El id del vuelo viene de la URL, el id del tripulante viene del body.
        const vuelo = await vuelosService.asignarTripulante(req.params.id, req.body.id_tripulante);
        if (!vuelo) {
            return res.status(404).json({ error: 'Vuelo no encontrado' });
        }
        res.status(201).json(vuelo);
    } catch (error) {
        res.status(400).json({ error: 'Error al asignar tripulante', detalle: error.message });
    }
}

async function quitarTripulante(req, res) {
    try {
        // Acá ambos ids vienen de la URL, no hay body en un DELETE.
        const vuelo = await vuelosService.quitarTripulante(req.params.id, req.params.idTripulante);
        if (!vuelo) {
            return res.status(404).json({ error: 'Vuelo no encontrado' });
        }
        res.json(vuelo);
    } catch (error) {
        res.status(400).json({ error: 'Error al quitar tripulante', detalle: error.message });
    }
}

module.exports = {
    listar,
    obtenerPorId,
    crear,
    actualizar,
    darDeBaja,
    asignarTripulante,
    quitarTripulante,
};
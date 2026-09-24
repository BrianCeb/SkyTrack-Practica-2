const { Vuelo, Avion, Tripulante } = require('../models');

// Lista vuelos filtrados por origen/destino/estado.
// Solo devuelve vuelos activos (no dados de baja).
async function listarVuelos(filtros = {}) {
    const where = { activo: true };

    if (filtros.origen) where.origen = filtros.origen;
    if (filtros.destino) where.destino = filtros.destino;
    if (filtros.estado) where.estado = filtros.estado;

    return Vuelo.findAll({
        where,
        include: [Avion, Tripulante],
    });
}

async function obtenerVueloPorId(id) {
    return Vuelo.findOne({
        where: { id, activo: true },
        include: [Avion, Tripulante],
    });
}

async function crearVuelo(datos) {
    const avion = await Avion.findByPk(datos.id_avion);
    if (!avion) {
        throw new Error('El avion indicado no existe');
    }
    return Vuelo.create(datos);
}

async function actualizarVuelo(id, datos) {
    const vuelo = await Vuelo.findOne({ where: { id, activo: true } });
    if (!vuelo) return null;

    if (datos.id_avion) {
        const avion = await Avion.findByPk(datos.id_avion);
        if (!avion) {
            throw new Error('El avion indicado no existe');
        }
    }

    await vuelo.update(datos);
    return vuelo;
}

// Baja logica: NO borra la fila, solo marca activo = false.
async function darDeBajaVuelo(id) {
    const vuelo = await Vuelo.findOne({ where: { id, activo: true } });
    if (!vuelo) return null;

    await vuelo.update({ activo: false });
    return vuelo;
}

async function asignarTripulante(idVuelo, idTripulante) {
    const vuelo = await Vuelo.findOne({ where: { id: idVuelo, activo: true } });
    if (!vuelo) return null;

    const tripulante = await Tripulante.findByPk(idTripulante);
    if (!tripulante) {
        throw new Error('El tripulante indicado no existe');
    }

    await vuelo.addTripulante(tripulante); 
    return obtenerVueloPorId(idVuelo); 
}

async function quitarTripulante(idVuelo, idTripulante) {
    const vuelo = await Vuelo.findOne({ where: { id: idVuelo, activo: true } });
    if (!vuelo) return null;

    await vuelo.removeTripulante(idTripulante);
    return obtenerVueloPorId(idVuelo);
}

module.exports = {
    listarVuelos,
    obtenerVueloPorId,
    crearVuelo,
    actualizarVuelo,
    darDeBajaVuelo,
    asignarTripulante,
    quitarTripulante,
};
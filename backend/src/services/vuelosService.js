const { Vuelo, Avion, Tripulante } = require('../models');

async function listarVuelos(filtros = {}) {
    const where = { activo: true };
    if (filtros.origen) where.origen = filtros.origen;
    if (filtros.destino) where.destino = filtros.destino;
    if (filtros.estado) where.estado = filtros.estado;

    return Vuelo.findAll({ where, include: [Avion, Tripulante] });
}

async function obtenerVueloPorId(id) {
    return Vuelo.findOne({ where: { id, activo: true }, include: [Avion, Tripulante] });
}

async function crearVuelo(datos) {
    const avion = await Avion.findByPk(datos.id_avion);
    if (!avion) throw new Error('El avion indicado no existe');
    return Vuelo.create(datos);
}

async function actualizarVuelo(id, datos) {
    const vuelo = await Vuelo.findOne({ where: { id, activo: true } });
    if (!vuelo) return null;

    if (datos.id_avion) {
        const avion = await Avion.findByPk(datos.id_avion);
        if (!avion) throw new Error('El avion indicado no existe');
    }

    await vuelo.update(datos);
    return vuelo;
}

async function darDeBajaVuelo(id) {
    const vuelo = await Vuelo.findOne({ where: { id, activo: true } });
    if (!vuelo) return null;

    if (vuelo.estado === 'en_vuelo') {
        throw new Error('No se puede dar de baja un vuelo que está en curso');
    }

    await vuelo.update({ activo: false });
    return vuelo;
}

async function asignarTripulante(idVuelo, idTripulante) {
    const vuelo = await Vuelo.findOne({ where: { id: idVuelo, activo: true } });
    if (!vuelo) return null;

    if (vuelo.estado !== 'programado' && vuelo.estado !== 'embarcando') {
        throw new Error('Solo se puede modificar la tripulación de un vuelo que aún no despegó');
    }

    const tripulante = await Tripulante.findByPk(idTripulante);
    if (!tripulante) throw new Error('El tripulante indicado no existe');

    await vuelo.addTripulante(tripulante);
    return obtenerVueloPorId(idVuelo);
}

async function quitarTripulante(idVuelo, idTripulante) {
    const vuelo = await Vuelo.findOne({ where: { id: idVuelo, activo: true } });
    if (!vuelo) return null;

    if (vuelo.estado !== 'programado' && vuelo.estado !== 'embarcando') {
        throw new Error('Solo se puede modificar la tripulación de un vuelo que aún no despegó');
    }

    await vuelo.removeTripulante(idTripulante);
    return obtenerVueloPorId(idVuelo);
}

async function iniciarVuelo(id) {
    const vuelo = await Vuelo.findOne({ where: { id, activo: true } });
    if (!vuelo) return null;

    await vuelo.update({ estado: 'en_vuelo' });

    const avion = await Avion.findByPk(vuelo.id_avion);
    if (avion) await avion.update({ estado: 'en_vuelo' });

    return obtenerVueloPorId(id);
}

async function aterrizarVuelo(id) {
    const vuelo = await Vuelo.findOne({ where: { id, activo: true } });
    if (!vuelo) return null;

    await vuelo.update({ estado: 'aterrizado' });

    const avion = await Avion.findByPk(vuelo.id_avion);
    if (avion) await avion.update({ estado: 'disponible' });

    return obtenerVueloPorId(id);
}

async function obtenerPanel() {
    const enCurso = await Vuelo.findAll({
        where: { activo: true, estado: 'en_vuelo' },
        include: [Avion, Tripulante],
    });

    const proximo = await Vuelo.findOne({
        where: { activo: true, estado: 'programado' },
        order: [['fecha', 'ASC'], ['hora', 'ASC']],
        include: [Avion, Tripulante],
    });

    return { enCurso, proximo };
}

module.exports = {
    listarVuelos,
    obtenerVueloPorId,
    crearVuelo,
    actualizarVuelo,
    darDeBajaVuelo,
    asignarTripulante,
    quitarTripulante,
    iniciarVuelo,
    aterrizarVuelo,
    obtenerPanel,
};
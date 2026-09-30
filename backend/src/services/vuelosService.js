const { Op } = require('sequelize');
const { Vuelo, Avion, Tripulante } = require('../models');

function esFechaHoraPasada(fecha, hora) {
    const fechaHora = new Date(`${fecha}T${hora}`);
    return fechaHora < new Date();
}

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

    if (avion.estado !== 'disponible') {
        throw new Error(`No se puede programar un vuelo con un avión en estado "${avion.estado}"`);
    }

    if (esFechaHoraPasada(datos.fecha, datos.hora)) {
        throw new Error('No se puede programar un vuelo en una fecha u hora que ya pasó');
    }

    return Vuelo.create(datos);
}

async function actualizarVuelo(id, datos) {
    const vuelo = await Vuelo.findOne({ where: { id, activo: true } });
    if (!vuelo) return null;

    if (vuelo.estado !== 'programado') {
        throw new Error('Solo se puede editar un vuelo mientras está programado');
    }

    if (datos.id_avion) {
        const avion = await Avion.findByPk(datos.id_avion);
        if (!avion) throw new Error('El avion indicado no existe');

        if (avion.estado !== 'disponible') {
            throw new Error(`No se puede asignar un avión en estado "${avion.estado}"`);
        }
    }

    await vuelo.update(datos);
    return vuelo;
}

async function darDeBajaVuelo(id) {
    const vuelo = await Vuelo.findOne({ where: { id, activo: true } });
    if (!vuelo) return null;

    if (vuelo.estado === 'en_vuelo' || vuelo.estado === 'aterrizado') {
        throw new Error('No se puede dar de baja un vuelo en curso o ya aterrizado (queda como historial)');
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

    // El tripulante no puede estar ya en otro vuelo que todavía no aterrizó ni se canceló
    const otroVueloActivo = await Vuelo.findOne({
        where: {
            activo: true,
            id: { [Op.ne]: idVuelo },
            estado: { [Op.notIn]: ['aterrizado', 'cancelado'] },
        },
        include: [{ model: Tripulante, where: { id: idTripulante } }],
    });
    if (otroVueloActivo) {
        throw new Error('El tripulante ya está asignado a otro vuelo que todavía no aterrizó');
    }

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
    const vuelo = await Vuelo.findOne({ where: { id, activo: true }, include: [Tripulante] });
    if (!vuelo) return null;

    const roles = (vuelo.Tripulantes || []).map(t => t.rol);
    const faltantes = ['piloto', 'copiloto', 'auxiliar'].filter(rol => !roles.includes(rol));
    if (faltantes.length > 0) {
        throw new Error(`Para iniciar el vuelo falta asignar: ${faltantes.join(', ')}`);
    }

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
    const programados = await Vuelo.findAll({
        where: { activo: true, estado: 'programado' },
        order: [['fecha', 'ASC'], ['hora', 'ASC']],
        include: [Avion, Tripulante],
    });

    const embarcando = await Vuelo.findAll({
        where: { activo: true, estado: 'embarcando' },
        order: [['fecha', 'ASC'], ['hora', 'ASC']],
        include: [Avion, Tripulante],
    });

    const enCurso = await Vuelo.findAll({
        where: { activo: true, estado: 'en_vuelo' },
        include: [Avion, Tripulante],
    });

    const aterrizados = await Vuelo.findAll({
        where: { activo: true, estado: 'aterrizado' },
        order: [['fecha', 'DESC'], ['hora', 'DESC']],
        include: [Avion, Tripulante],
    });

    return { programados, embarcando, enCurso, aterrizados };
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
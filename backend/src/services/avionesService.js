const { Avion } = require('../models');

// Devuelve todos los aviones.
async function listarAviones() {
    return Avion.findAll();
}

// Devuelve un avión por su id, o null si no existe.
async function obtenerAvionPorId(id) {
    return Avion.findByPk(id);
}

// Crea un avión nuevo "datos" viene del body de la request.
async function crearAvion(datos) {
    return Avion.create(datos);
}

// Actualiza un avión existente. Devuelve null si no existe.
async function actualizarAvion(id, datos) {
    const avion = await Avion.findByPk(id);
    if (!avion) return null;

    await avion.update(datos);
    return avion;
}

module.exports = {
    listarAviones,
    obtenerAvionPorId,
    crearAvion,
    actualizarAvion,
};
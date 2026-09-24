const { Tripulante } = require('../models');

async function listarTripulantes() {
    return Tripulante.findAll();
}

async function crearTripulante(datos) {
    return Tripulante.create(datos);
}

module.exports = {
    listarTripulantes,
    crearTripulante,
};
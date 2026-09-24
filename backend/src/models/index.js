const sequelize = require('../config/database');

const Avion = require('./Avion');
const Vuelo = require('./Vuelo');
const Tripulante = require('./Tripulante');
const Usuario = require('./Usuario');
const AsignacionTripulacion = require('./AsignacionTripulacion');

// ---- Relación 1: Avion 1---N Vuelo ----
// Un avión puede tener muchos vuelos; un vuelo pertenece a un solo avión.
Avion.hasMany(Vuelo, { foreignKey: 'id_avion' });
Vuelo.belongsTo(Avion, { foreignKey: 'id_avion' });

// ---- Relación 2: Vuelo N---N Tripulante (a través de AsignacionTripulacion) ----
// Un vuelo tiene muchos tripulantes; un tripulante vuela en muchos vuelos.
Vuelo.belongsToMany(Tripulante, {
    through: AsignacionTripulacion,
    foreignKey: 'id_vuelo',
    otherKey: 'id_tripulante',
});
Tripulante.belongsToMany(Vuelo, {
    through: AsignacionTripulacion,
    foreignKey: 'id_tripulante',
    otherKey: 'id_vuelo',
});

// Usuario sin relación (es solo para login).

module.exports = {
    sequelize,
    Avion,
    Vuelo,
    Tripulante,
    Usuario,
    AsignacionTripulacion,
};
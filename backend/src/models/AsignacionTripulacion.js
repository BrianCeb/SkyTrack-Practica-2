const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Esta tabla relaciona un Vuelo con un Tripulante.
const AsignacionTripulacion = sequelize.define('AsignacionTripulacion', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
}, {
    tableName: 'asignaciones_tripulacion',
    timestamps: true,
});

module.exports = AsignacionTripulacion;
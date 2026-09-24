const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Vuelo = sequelize.define('Vuelo', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    origen: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    destino: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    fecha: {
        type: DataTypes.DATEONLY, // solo fecha
        allowNull: false,
    },
    hora: {
        type: DataTypes.TIME, // solo hora
    },
    estado: {
        type: DataTypes.ENUM('programado', 'embarcando', 'en_vuelo', 'aterrizado', 'cancelado'),
        allowNull: false,
        defaultValue: 'programado',
    },
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true, // false = baja lógica (soft delete)
    },
}, {
    tableName: 'vuelos',
    timestamps: true,
});

module.exports = Vuelo;
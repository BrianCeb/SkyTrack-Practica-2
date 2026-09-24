const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tripulante = sequelize.define('Tripulante', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    rol: {
        type: DataTypes.ENUM('piloto', 'copiloto', 'auxiliar'),
        allowNull: false,
    },
}, {
    tableName: 'tripulantes',
    timestamps: true,
});

module.exports = Tripulante;
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// sequelize.define(nombreModelo, columnas, opciones)
const Avion = sequelize.define('Avion', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    patente: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, 
    },
    modelo: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    estado: {
        type: DataTypes.ENUM('disponible', 'en_vuelo', 'mantenimiento'),
        allowNull: false,
        defaultValue: 'disponible',
    },
}, {
    tableName: 'aviones', // nombre de la tabla en la base
    timestamps: true,    
});

module.exports = Avion;
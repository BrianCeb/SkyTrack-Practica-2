require('dotenv').config();
const { Sequelize } = require('sequelize');

// Creamos UNA instancia de Sequelize para toda la app.
// dialect: 'sqlite' le dice que hable el protocolo de SQLite.
// storage: la ruta del archivo físico donde se guardan los datos.
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || './database.sqlite',
    logging: false, // ponelo en console.log si querés ver el SQL que genera Sequelize
});

module.exports = sequelize;
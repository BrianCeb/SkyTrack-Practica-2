const sequelize = require('./src/config/database');
const Avion = require('./src/models/Avion');

sequelize.sync({ force: true }) // crea la tabla desde cero (borra si ya existía)
    .then(() => Avion.create({ patente: 'LV-ABC', modelo: 'Boeing 737' }))
    .then(avion => console.log('Avion creado:', avion.toJSON()))
    .catch(err => console.error('ERROR:', err))
    .finally(() => sequelize.close());
const sequelize = require('./src/config/database');

sequelize.authenticate()
    .then(() => {
        console.log('Conexión OK, storage en:', sequelize.options.storage);
        return sequelize.close();
    })
    .catch(err => console.error('ERROR:', err));
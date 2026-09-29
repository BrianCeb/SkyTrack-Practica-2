const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../database.e2e.sqlite');
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

process.env.DB_STORAGE = dbPath;

async function start() {

    const { sequelize } = require('../../src/models');
    await sequelize.sync({ force: true });

    require('../../src/app.js');
}

start();
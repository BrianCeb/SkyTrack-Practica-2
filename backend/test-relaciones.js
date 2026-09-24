const { sequelize, Avion, Vuelo, Tripulante } = require('./src/models/index');

async function probar() {
    await sequelize.sync({ force: true }); // recrea todas las tablas con las relaciones

    const avion = await Avion.create({ patente: 'LV-XYZ', modelo: 'Airbus A320' });

    const vuelo = await Vuelo.create({
        origen: 'Buenos Aires',
        destino: 'Córdoba',
        fecha: '2026-10-01',
        hora: '09:30:00',
        id_avion: avion.id, // acá usamos la FK directamente
    });

    const piloto = await Tripulante.create({ nombre: 'Ana Gómez', rol: 'piloto' });
    const auxiliar = await Tripulante.create({ nombre: 'Luis Pérez', rol: 'auxiliar' });

    // Métodos generados automáticamente por belongsToMany:
    await vuelo.addTripulante(piloto);
    await vuelo.addTripulante(auxiliar);

    // Ahora consultamos usando los métodos generados por hasMany/belongsTo/belongsToMany:
    const vueloConDatos = await Vuelo.findByPk(vuelo.id, {
        include: [Avion, Tripulante], // "include" = hacer el JOIN automáticamente
    });

    console.log(JSON.stringify(vueloConDatos, null, 2));

    await sequelize.close();
}

probar().catch(err => console.error('ERROR:', err));
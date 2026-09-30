const bcrypt = require('bcryptjs');
const {
    sequelize,
    Avion,
    Vuelo,
    Tripulante,
    Usuario,
    AsignacionTripulacion,
} = require('./models');

function fechaDentroDe(dias) {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    const anio = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
}

async function seed() {

    await sequelize.sync({ force: true });
    console.log('Tablas creadas.');

    await Usuario.bulkCreate([
        {
            email: 'admin@skytrack.com',
            password_hash: await bcrypt.hash('admin123', 10),
            rol: 'admin',
        },
        {
            email: 'operador@skytrack.com',
            password_hash: await bcrypt.hash('oper123', 10),
            rol: 'operador',
        },
    ]);

    const [a1, a2, a3] = await Avion.bulkCreate([
        { patente: 'LV-ABC', modelo: 'Boeing 737', estado: 'disponible' },
        { patente: 'LV-XYZ', modelo: 'Airbus A320', estado: 'en_vuelo' },
        { patente: 'LV-MNT', modelo: 'Embraer E190', estado: 'mantenimiento' },
    ]);

    const [v1, v2, v3] = await Vuelo.bulkCreate([
        {
            origen: 'Neuquén', destino: 'Buenos Aires',
            fecha: fechaDentroDe(1), hora: '08:30:00',
            estado: 'programado', id_avion: a1.id,
        },
        {
            origen: 'Buenos Aires', destino: 'Córdoba',
            fecha: fechaDentroDe(0), hora: '10:00:00',
            estado: 'en_vuelo', id_avion: a2.id, 
        },
        {
            origen: 'Mendoza', destino: 'Bariloche',
            fecha: fechaDentroDe(3), hora: '15:45:00',
            estado: 'programado', id_avion: a1.id,
        },
    ]);

    const [t1, t2, t3, t4] = await Tripulante.bulkCreate([
        { nombre: 'Laura Gómez', rol: 'piloto' },
        { nombre: 'Martín Pérez', rol: 'copiloto' },
        { nombre: 'Sofía Díaz', rol: 'auxiliar' },
        { nombre: 'Diego Ruiz', rol: 'auxiliar' },
    ]);

    await AsignacionTripulacion.bulkCreate([
        { id_vuelo: v1.id, id_tripulante: t1.id },
        { id_vuelo: v1.id, id_tripulante: t3.id },
        { id_vuelo: v2.id, id_tripulante: t2.id },
        { id_vuelo: v2.id, id_tripulante: t4.id },
    ]);

    console.log('Datos de prueba cargados.');
    console.log('Admin:    admin@skytrack.com / admin123');
    console.log('Operador: operador@skytrack.com / oper123');
}

seed()
    .catch(err => {
        console.error('Error al ejecutar el seed:', err);
        process.exitCode = 1;
    })
    .finally(() => sequelize.close());
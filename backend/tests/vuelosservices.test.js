process.env.DB_STORAGE = ':memory:';

const { sequelize, Avion, Vuelo } = require('../src/models');
const vuelosService = require('../src/services/vuelosService');

beforeAll(async () => {
    await sequelize.authenticate();
});

beforeEach(async () => {
    await sequelize.sync({ force: true });
});

afterAll(async () => {
    await sequelize.close();
});

describe('vuelosService', () => {
    test('listarVuelos filtra por estado', async () => {
        const avion = await Avion.create({ patente: 'AA111', modelo: 'Boeing 737', estado: 'disponible' });
        await Vuelo.create({ origen: 'Buenos Aires', destino: 'Cordoba', fecha: '2030-01-01', hora: '10:00', estado: 'programado', id_avion: avion.id });
        await Vuelo.create({ origen: 'Buenos Aires', destino: 'Mendoza', fecha: '2030-01-02', hora: '11:00', estado: 'cancelado', id_avion: avion.id });

        const resultado = await vuelosService.listarVuelos({ estado: 'programado' });

        expect(resultado).toHaveLength(1);
        expect(resultado[0].estado).toBe('programado');
    });

    test('listarVuelos filtra por origen', async () => {
        const avion = await Avion.create({ patente: 'BB222', modelo: 'Airbus A320', estado: 'disponible' });
        await Vuelo.create({ origen: 'Neuquen', destino: 'Buenos Aires', fecha: '2030-01-01', hora: '09:00', estado: 'programado', id_avion: avion.id });
        await Vuelo.create({ origen: 'Bariloche', destino: 'Buenos Aires', fecha: '2030-01-01', hora: '09:30', estado: 'programado', id_avion: avion.id });

        const resultado = await vuelosService.listarVuelos({ origen: 'Neuquen' });

        expect(resultado).toHaveLength(1);
        expect(resultado[0].origen).toBe('Neuquen');
    });

    test('un vuelo dado de baja no aparece en el listado', async () => {
        const avion = await Avion.create({ patente: 'CC333', modelo: 'Embraer 190', estado: 'disponible' });
        const vuelo = await Vuelo.create({ origen: 'Buenos Aires', destino: 'Rosario', fecha: '2030-01-01', hora: '08:00', estado: 'programado', id_avion: avion.id });

        await vuelosService.darDeBajaVuelo(vuelo.id);
        const resultado = await vuelosService.listarVuelos();

        const idsListados = resultado.map(v => v.id);
        expect(idsListados).not.toContain(vuelo.id);
    });
});
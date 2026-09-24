require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const avionesRoutes = require('./routes/avionesRoutes');
const vuelosRoutes = require('./routes/vuelosRoutes');
const tripulantesRoutes = require('./routes/tripulantesRoutes');
const authRoutes = require('./routes/authRoutes');


const app = express();


app.use(cors());
app.use(express.json());
//  Endpoint de prueba, para confirmar que el server responde
app.get('/', (req, res) => {
    res.json({ mensaje: 'SkyTrack Airlines API funcionando' });
});

//  Acá van a ir montadas las rutas reales 
app.use('/api/vuelos', vuelosRoutes);
app.use('/api/aviones', avionesRoutes);
app.use('/api/tripulantes', tripulantesRoutes);

app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 3000;

sequelize.authenticate()
    .then(() => {
        console.log('Base de datos conectada.');
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('No se pudo conectar a la base de datos:', err);
    });

module.exports = app;
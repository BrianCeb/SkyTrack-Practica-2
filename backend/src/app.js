require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, '../../frontend')));

app.get('/api', (req, res) => {
    res.json({ mensaje: 'SkyTrack Airlines API funcionando' });
});

const avionesRoutes = require('./routes/avionesRoutes');
app.use('/api/aviones', avionesRoutes);

const vuelosRoutes = require('./routes/vuelosRoutes');
app.use('/api/vuelos', vuelosRoutes);

const tripulantesRoutes = require('./routes/tripulantesRoutes');
app.use('/api/tripulantes', tripulantesRoutes);

const authRoutes = require('./routes/authRoutes');
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
const authService = require('../services/authService');

async function registrar(req, res) {
    try {
        const usuario = await authService.registrar(req.body);
        res.status(201).json(usuario);
    } catch (error) {
        res.status(400).json({ error: 'Error al registrar usuario', detalle: error.message });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body;
        const resultado = await authService.login(email, password);
        res.json(resultado);
    } catch (error) {
        res.status(401).json({ error: 'Error al iniciar sesión', detalle: error.message });
    }
}

module.exports = { registrar, login };
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

async function registrar(datos) {

    const passwordHasheada = await bcrypt.hash(datos.password, 10);

    const usuario = await Usuario.create({
        email: datos.email,
        password_hash: passwordHasheada,
        rol: datos.rol || 'operador',
    });

    const { password_hash, ...usuarioSinPassword } = usuario.toJSON();
    return usuarioSinPassword;
}

async function login(email, password) {
    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
        throw new Error('Credenciales inválidas');
    }


    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) {
        throw new Error('Credenciales inválidas');
    }


    const token = jwt.sign(
        { id: usuario.id, rol: usuario.rol }, 
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );

    return { token, usuario: { id: usuario.id, email: usuario.email, rol: usuario.rol } };
}

module.exports = { registrar, login };
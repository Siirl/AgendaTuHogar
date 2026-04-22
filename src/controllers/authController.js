const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

exports.registrarUsuario = async (req, res) => {
    const { nombre, email, password, rol } = req.body;

    try {
        // 1. Verificar si el usuario ya existe
        const [existe] = await db.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (existe.length > 0) {
            return res.status(400).json({ msg: 'El correo ya está registrado' });
        }

        // 2. Encriptar la contraseña (10 rondas de seguridad)
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // 3. Guardar en la base de datos
        const sql = 'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)';
        await db.execute(sql, [nombre, email, passwordHash, rol]);

        res.status(201).json({ msg: 'Usuario registrado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al registrar usuario' });
    }
};


exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Buscar al usuario por email
        const [usuarios] = await db.execute('SELECT * FROM usuarios WHERE email = ?', [email]);
        
        if (usuarios.length === 0) {
            return res.status(400).json({ msg: 'Usuario no encontrado' });
        }

        const usuario = usuarios[0];

        // 2. Verificar si la cuenta está activa
        if (usuario.activo === 0) {
            return res.status(403).json({ msg: 'Esta cuenta está desactivada' });
        }

        // 3. Comparar la contraseña ingresada con la encriptada
        const passwordCorrecto = await bcrypt.compare(password, usuario.password);
        if (!passwordCorrecto) {
            return res.status(400).json({ msg: 'Contraseña incorrecta' });
        }
        // 4. Crear el Token (el carnet de identidad digital)
        const payload = {
            usuario: {
                id: usuario.id,
                rol: usuario.rol
            }
        };
        const token = jwt.sign(
            payload, 
            process.env.JWT_SECRET, 
            { expiresIn: '8h' }
        );

        // 5. Responder con TODO, incluyendo el TOKEN
        return res.json({
            msg: 'Inicio de sesión exitoso',
            token, // <--- Ahora sí debe aparecer aquí
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                rol: usuario.rol
            }
        });

        res.json({
            msg: 'Inicio de sesión exitoso',
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                rol: usuario.rol
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};
// EDITAR PERFIL
exports.actualizarPerfil = async (req, res) => {
    const { nombre, email } = req.body;
    try {
        await db.execute(
            'UPDATE usuarios SET nombre = ?, email = ? WHERE id = ?',
            [nombre, email, req.usuario.id] // Usamos el ID que viene del Token
        );
        res.json({ msg: 'Perfil actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al actualizar perfil' });
    }
};

// DESACTIVAR CUENTA (Soft Delete)
exports.desactivarCuenta = async (req, res) => {
    try {
        await db.execute(
            'UPDATE usuarios SET activo = 0 WHERE id = ?',
            [req.usuario.id]
        );
        res.json({ msg: 'Cuenta desactivada. Esperamos verte pronto.' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al desactivar cuenta' });
    }
};
// 1. Solicitar recuperación
exports.solicitarRecuperacion = async (req, res) => {
    const { email } = req.body;
    try {
        const [usuario] = await db.execute('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (usuario.length === 0) return res.status(404).json({ msg: 'El usuario no existe' });

        // Generar un token aleatorio simple
        const token = crypto.randomBytes(20).toString('hex');
        
        // Guardar token en la BD (puedes usar la columna token_recuperacion que creamos al inicio)
        await db.execute('UPDATE usuarios SET token_recuperacion = ? WHERE email = ?', [token, email]);

        res.json({ msg: 'Token generado. En un entorno real, se enviaría por email.', token });
    } catch (error) {
        res.status(500).json({ msg: 'Error en el servidor' });
    }
};

// 2. Cambiar contraseña con el Token
exports.restablecerPassword = async (req, res) => {
    const { token, nuevaPassword } = req.body;
    try {
        // Buscar al usuario que tenga ese token
        const [usuario] = await db.execute('SELECT id FROM usuarios WHERE token_recuperacion = ?', [token]);
        if (usuario.length === 0) return res.status(400).json({ msg: 'Token inválido o expirado' });

        // Encriptar la nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(nuevaPassword, salt);

        // Actualizar password y limpiar el token
        await db.execute(
            'UPDATE usuarios SET password = ?, token_recuperacion = NULL WHERE id = ?',
            [passwordHash, usuario[0].id]
        );

        res.json({ msg: 'Contraseña actualizada correctamente' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al restablecer contraseña' });
    }
};
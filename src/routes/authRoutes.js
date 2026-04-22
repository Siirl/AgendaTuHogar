const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../config/authMiddleware');

// Ruta: POST /api/auth/registrar
router.post('/registrar', authController.registrarUsuario);
router.post('/login', authController.login);
router.put('/perfil', auth, authController.actualizarPerfil);
router.delete('/desactivar', auth, authController.desactivarCuenta);
router.post('/recuperar', authController.solicitarRecuperacion);
router.post('/restablecer', authController.restablecerPassword);

module.exports = router;
const express = require('express');
const router = express.Router();
const inmuebleController = require('../controllers/inmuebleController');
const auth = require('../config/authMiddleware');
const upload = require('../config/multer');

// --- RUTAS DE INMUEBLES ---

// 1. Crear inmueble (POST /api/inmuebles)
// Usamos .array('imagenes', 10) porque en el HTML el name es "imagenes"
router.post('/', auth, upload.array('imagenes', 10), inmuebleController.crearInmueble);

// 2. Obtener todos los inmuebles
router.get('/', inmuebleController.obtenerInmuebles);

// 3. Obtener mis inmuebles (Dashboard)
router.get('/mis-inmuebles', auth, inmuebleController.obtenerInmuebles);

// 4. Obtener galería de un inmueble específico
router.get('/:id/imagenes', inmuebleController.obtenerGaleria);

// 5. Actualizar inmueble completo (PUT)
router.put('/:id', auth, upload.array('imagenes', 10), inmuebleController.actualizarInmueble);

// 6. Actualizar solo el estado (PATCH)
router.patch('/:id/estado', auth, inmuebleController.actualizarEstado);

// 7. Eliminar inmueble
router.delete('/:id', auth, inmuebleController.eliminarInmueble);

// 8. Eliminar una imagen específica de la galería
router.delete('/imagen/:idImagen', auth, inmuebleController.eliminarImagenGaleria);

module.exports = router;
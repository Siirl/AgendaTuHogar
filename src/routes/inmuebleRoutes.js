const express = require('express');
const router = express.Router();
const inmuebleController = require('../controllers/inmuebleController');
const auth = require('../config/authMiddleware');
const upload = require('../config/multer');

// HU0201 y HU0203: Crear publicación con imagen
router.post('/', auth, upload.single('imagen'), inmuebleController.crearInmueble);

// @route   POST api/inmuebles
// @desc    Crear un inmueble (HU0201)
router.post('/', auth, inmuebleController.crearInmueble);

// @route   GET api/inmuebles
// @desc    Obtener todos los inmuebles
router.get('/', inmuebleController.obtenerInmuebles);

// @route   PUT api/inmuebles/:id
// @desc    Editar un inmueble (HU0202)
router.post('/', auth, upload.array('imagenes', 10), inmuebleController.crearInmueble);

// @route   DELETE api/inmuebles/:id
// @desc    Eliminar un inmueble (HU0205)
router.delete('/:id', auth, inmuebleController.eliminarInmueble);

// @route   PATCH api/inmuebles/:id/estado
// @desc    Actualizar solo el estado del inmueble (HU0204)
router.patch('/:id/estado', auth, inmuebleController.actualizarEstado);


// Ruta específica para el dashboard (con protección obligatoria para ver MIS inmuebles)
router.get('/mis-inmuebles', auth, inmuebleController.obtenerInmuebles);

router.delete('/imagen/:idImagen', auth, inmuebleController.eliminarImagenGaleria);

router.put('/:id', auth, upload.array('imagenes', 10), inmuebleController.actualizarInmueble);

router.get('/:id/imagenes', inmuebleController.obtenerGaleria);

module.exports = router;
const db = require('../config/db');

// HU0201: Crear Publicación
exports.crearInmueble = async (req, res) => {
    const { titulo, descripcion, direccion, precio, tipo } = req.body;
    const propietario_id = req.usuario.id;

    try {
        // La primera imagen del array será la principal
        const portada = (req.files && req.files.length > 0) ? req.files[0].filename : 'default.jpg';

        const [result] = await db.execute(
            'INSERT INTO inmuebles (titulo, descripcion, direccion, precio, tipo, propietario_id, imagen) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [titulo, descripcion, direccion, precio, tipo, propietario_id, portada]
        );

        const inmuebleId = result.insertId;

        // Guardar el resto de imágenes en la tabla de galería
        if (req.files && req.files.length > 1) {
            const fotosAdicionales = req.files.slice(1); // Omitimos la primera que ya es portada
            for (let foto of fotosAdicionales) {
                await db.execute(
                    'INSERT INTO inmueble_imagenes (inmueble_id, ruta_imagen) VALUES (?, ?)',
                    [inmuebleId, foto.filename]
                );
            }
        }

        res.json({ msg: '¡Inmueble publicado con éxito!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error interno al crear el inmueble' });
    }
};

// HU0202: Editar Inmueble
exports.actualizarInmueble = async (req, res) => {
    const { titulo, descripcion, direccion, precio, tipo } = req.body;
    const idInmueble = req.params.id;

    try {
        // 1. Verificar propiedad y obtener imagen actual
        const [inmueble] = await db.execute('SELECT propietario_id, imagen FROM inmuebles WHERE id = ?', [idInmueble]);
        
        if (inmueble.length === 0) return res.status(404).json({ msg: 'Inmueble no encontrado' });
        if (inmueble[0].propietario_id !== req.usuario.id) return res.status(401).json({ msg: 'No autorizado' });

        // 2. Gestionar la imagen de portada (la primera del array si existe)
        // Si el usuario subió fotos nuevas, la primera (index 0) reemplaza la portada anterior.
        // Si no subió nada, mantenemos la que ya estaba en la base de datos.
        let nuevaPortada = inmueble[0].imagen;
        let fotosGaleria = [];

        if (req.files && req.files.length > 0) {
            nuevaPortada = req.files[0].filename;
            // Si subió más de una, las demás van a la galería
            if (req.files.length > 1) {
                fotosGaleria = req.files.slice(1);
            }
        }

        // 3. Actualizar datos básicos e imagen de portada
        await db.execute(
            'UPDATE inmuebles SET titulo = ?, descripcion = ?, direccion = ?, precio = ?, tipo = ?, imagen = ? WHERE id = ?',
            [titulo, descripcion, direccion, precio, tipo, nuevaPortada, idInmueble]
        );

        // 4. Insertar las fotos adicionales en la galería (si existen)
        if (fotosGaleria.length > 0) {
            for (let foto of fotosGaleria) {
                await db.execute(
                    'INSERT INTO inmueble_imagenes (inmueble_id, ruta_imagen) VALUES (?, ?)',
                    [idInmueble, foto.filename]
                );
            }
        }

        res.json({ msg: 'Inmueble y galería actualizados correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error al actualizar el inmueble' });
    }
};

// HU0205: Eliminar Publicación
exports.eliminarInmueble = async (req, res) => {
    try {
        const [inmueble] = await db.execute('SELECT propietario_id FROM inmuebles WHERE id = ?', [req.params.id]);
        
        if (inmueble.length === 0) return res.status(404).json({ msg: 'Inmueble no encontrado' });
        if (inmueble[0].propietario_id !== req.usuario.id) return res.status(401).json({ msg: 'No autorizado' });

        await db.execute('DELETE FROM inmuebles WHERE id = ?', [req.params.id]);
        res.json({ msg: 'Publicación eliminada' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al eliminar' });
    }
};

exports.obtenerInmuebles = async (req, res) => {
    try {
        let sqlQuery = '';
        let sqlParams = [];

        // 1. Caso para el Dashboard (Mis Inmuebles)
        if (req.usuario && req.usuario.id && req.path.includes('mis-inmuebles')) {
            sqlQuery = 'SELECT * FROM inmuebles WHERE propietario_id = ? ORDER BY fecha_publicacion DESC';
            sqlParams = [req.usuario.id];
        } 
        // 2. Caso para la Vista Pública (Explorar con FILTROS)
        else {
            const { tipo, precioMax } = req.query;
            sqlQuery = 'SELECT * FROM inmuebles WHERE estado = "disponible"';
            
            if (tipo && tipo !== 'todos') {
                sqlQuery += ' AND tipo = ?';
                sqlParams.push(tipo);
            }

            if (precioMax && precioMax !== '') {
                sqlQuery += ' AND precio <= ?';
                sqlParams.push(precioMax);
            }

            sqlQuery += ' ORDER BY fecha_publicacion DESC';
        }

        // Ejecutamos la consulta UNA SOLA VEZ al final
        const [rows] = await db.execute(sqlQuery, sqlParams);
        res.json(rows);

    } catch (error) {
        console.error("Error en obtenerInmuebles:", error);
        res.status(500).json({ msg: 'Error al obtener los inmuebles' });
    }
};

// HU0204: Actualizar estado (Disponible, Reservado, Vendido, Arrendado)
exports.actualizarEstado = async (req, res) => {
    const { estado } = req.body;
    const { id } = req.params;

    // Estados permitidos según nuestro ENUM de la base de datos
    const estadosValidos = ['disponible', 'reservado', 'vendido', 'arrendado'];

    if (!estadosValidos.includes(estado)) {
        return res.status(400).json({ msg: 'Estado no válido' });
    }

    try {
        // Verificar propiedad antes de cambiar estado
        const [inmueble] = await db.execute('SELECT propietario_id FROM inmuebles WHERE id = ?', [id]);
        
        if (inmueble.length === 0) return res.status(404).json({ msg: 'Inmueble no encontrado' });
        if (inmueble[0].propietario_id !== req.usuario.id) {
            return res.status(401).json({ msg: 'No autorizado para cambiar este estado' });
        }

        await db.execute('UPDATE inmuebles SET estado = ? WHERE id = ?', [estado, id]);
        
        res.json({ msg: `Estado actualizado a: ${estado}` });
    } catch (error) {
        res.status(500).json({ msg: 'Error al actualizar el estado' });
    }
};

exports.eliminarImagenGaleria = async (req, res) => {
    const { idImagen } = req.params;
    try {
        // Podrías agregar una validación aquí para que solo el dueño borre la foto
        await db.execute('DELETE FROM inmueble_imagenes WHERE id = ?', [idImagen]);
        res.json({ msg: 'Imagen eliminada de la galería' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al eliminar la imagen' });
    }
};

exports.obtenerGaleria = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM inmueble_imagenes WHERE inmueble_id = ?', [req.params.id]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener galería' });
    }
};
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// --- NUEVO: Rutas de la aplicación ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use(express.static('public'));
app.get('/', (req, res) => {
    res.send('Servidor de Inmobiliaria funcionando 🚀');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

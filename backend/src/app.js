const express = require('express');
const cors = require('cors');
const profesorRoutes = require('./routes/profesorRoutes');

const app = express();

app.use(cors());           // permite requests desde el frontend
app.use(express.json());   // parsea el body de las requests como JSON

// Todas las rutas de productos quedan bajo /api/profesores
app.use('/api/profesores', profesorRoutes);

module.exports = app;
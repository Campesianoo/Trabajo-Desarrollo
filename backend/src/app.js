const express = require('express');
const cors = require('cors');
const profesorRoutes = require('./routes/profesorRoutes');
const especialidadRoutes = require('./routes/especialidadRoutes');

const app = express();

app.use(cors());           // permite requests desde el frontend
app.use(express.json());   // parsea el body de las requests como JSON

// Todas las rutas de profesores quedan bajo /api/profesores
app.use('/api/profesores', profesorRoutes);
// Todas las rutas de especialidades quedan bajo /api/especialidades
app.use('/api/especialidades', especialidadRoutes);

module.exports = app;
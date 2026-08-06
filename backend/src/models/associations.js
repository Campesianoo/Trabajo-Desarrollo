const Profesor = require('./profesor');
const Especialidad = require('./especialidad');
const ProfesorEspecialidad = require('./profesorEspecialidad');

Profesor.belongsToMany(Especialidad, {
  through: ProfesorEspecialidad,
  foreignKey: 'dniProfesor',
  otherKey: 'idEspecialidad',
  as: 'especialidades'
});

Especialidad.belongsToMany(Profesor, {
  through: ProfesorEspecialidad,
  foreignKey: 'idEspecialidad',
  otherKey: 'dniProfesor',
  as: 'profesores'
});

module.exports = { Profesor, Especialidad, ProfesorEspecialidad };

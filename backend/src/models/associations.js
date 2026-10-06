const Profesor = require('./profesor');
const Especialidad = require('./especialidad');
const ProfesorEspecialidad = require('./profesorEspecialidad');
const Usuario = require('./usuario');
const Rutina = require('./rutina');
const RutinaEjercicio = require('./rutinaEjercicio');

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

// RESTRICT: no se puede borrar un profesor que tiene cuenta de usuario
Usuario.belongsTo(Profesor, { foreignKey: 'dniProfesor', as: 'profesor', onDelete: 'RESTRICT' });
Profesor.hasOne(Usuario, { foreignKey: 'dniProfesor', as: 'usuario', onDelete: 'RESTRICT' });

Rutina.belongsTo(Profesor, { foreignKey: 'dniProfesor', as: 'profesor' });
Profesor.hasMany(Rutina, { foreignKey: 'dniProfesor', as: 'rutinas' });

Rutina.hasMany(RutinaEjercicio, {
  foreignKey: 'idRutina',
  as: 'ejercicios',
  onDelete: 'CASCADE'
});
RutinaEjercicio.belongsTo(Rutina, { foreignKey: 'idRutina', as: 'rutina' });

module.exports = { Profesor, Especialidad, ProfesorEspecialidad, Usuario, Rutina, RutinaEjercicio };

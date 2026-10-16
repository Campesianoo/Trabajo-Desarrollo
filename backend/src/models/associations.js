const Profesor = require('./profesor');
const Especialidad = require('./especialidad');
const ProfesorEspecialidad = require('./profesorEspecialidad');
const Usuario = require('./usuario');
const Rutina = require('./rutina');
const RutinaEjercicio = require('./rutinaEjercicio');
const Cliente = require('./Cliente');

// Profesor <-> Especialidad (Muchos a Muchos)
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

// Cliente <-> Usuario (1 a 1): no se puede borrar la cuenta de un cliente sin borrar al cliente
Cliente.belongsTo(Usuario, { foreignKey: 'idUsuario', as: 'usuario', onDelete: 'RESTRICT' });
Usuario.hasOne(Cliente, { foreignKey: 'idUsuario', as: 'cliente', onDelete: 'RESTRICT' });

// Rutina <-> Profesor. NO ACTION como en la base: no se puede borrar un profesor con rutinas
// (el esquema real lo definen las migraciones; esto tiene que coincidir con ellas)
Rutina.belongsTo(Profesor, { foreignKey: 'dniProfesor', as: 'profesor', onDelete: 'NO ACTION' });
Profesor.hasMany(Rutina, { foreignKey: 'dniProfesor', as: 'rutinas' });

// Rutina <-> Cliente (Usa dniCliente como clave foránea)
Rutina.belongsTo(Cliente, { foreignKey: 'dniCliente', as: 'cliente', onDelete: 'NO ACTION' });
Cliente.hasMany(Rutina, { foreignKey: 'dniCliente', as: 'rutinas' });

// Rutina <-> RutinaEjercicio
Rutina.hasMany(RutinaEjercicio, {
  foreignKey: 'idRutina',
  as: 'ejercicios',
  onDelete: 'CASCADE'
});
RutinaEjercicio.belongsTo(Rutina, { foreignKey: 'idRutina', as: 'rutina' });

module.exports = {
  Profesor,
  Especialidad,
  ProfesorEspecialidad,
  Usuario,
  Rutina,
  RutinaEjercicio,
  Cliente
};

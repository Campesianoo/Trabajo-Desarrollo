const Profesor = require('./profesor');
const Especialidad = require('./especialidad');
const ProfesorEspecialidad = require('./profesorEspecialidad');
const Usuario = require('./usuario');
const Cliente = require('./cliente');

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

// Cada cliente tiene exactamente una cuenta; la cuenta no se puede borrar mientras exista el cliente
Cliente.belongsTo(Usuario, { foreignKey: 'idUsuario', as: 'usuario', onDelete: 'RESTRICT' });
Usuario.hasOne(Cliente, { foreignKey: 'idUsuario', as: 'cliente', onDelete: 'RESTRICT' });

module.exports = { Profesor, Especialidad, ProfesorEspecialidad, Usuario, Cliente };

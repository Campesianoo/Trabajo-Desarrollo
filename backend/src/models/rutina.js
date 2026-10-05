const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Rutina = sequelize.define('Rutina', {
  idRutina: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nombreEjercicio: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  series: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  repeticiones: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descansoSegundos: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 60,
  },
  diaSemana: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  dniCliente: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Clientes',
      key: 'dni',
    },
  },
  dniProfesor: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Profesores',
      key: 'dni',
    },
  },
}, {
  tableName: 'Rutinas',
  freezeTableName: true,
  timestamps: true,
});

module.exports = Rutina;
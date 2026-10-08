const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Cliente = sequelize.define(
  'Cliente',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    dni: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    apellido: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    telefono: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    estado: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    idUsuario: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: 'clientes',
    timestamps: true,
  }
);

module.exports = Cliente;
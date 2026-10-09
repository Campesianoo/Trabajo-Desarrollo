const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Membresia = sequelize.define(
  'Membresia',
  {
    idMembresia: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    dniCliente: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'clientes',
        key: 'dni',
      },
    },
    fechaPago: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    fechaInicio: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    fechaVencimiento: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    valor: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    estadoMembresia: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Activa',
    },
  },
  {
    tableName: 'membresia',
    timestamps: true,
  }
);

module.exports = Membresia;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// El email de un cliente es el de su cuenta (Usuario): se guarda en un solo lugar
const Cliente = sequelize.define(
  'Cliente',
  {
    dni: {
      type: DataTypes.INTEGER,
      primaryKey: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    apellido: {
      type: DataTypes.STRING,
      allowNull: false
    },
    telefono: {
      type: DataTypes.STRING,
      allowNull: false
    },
    idUsuario: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'Usuarios',
        key: 'id'
      }
    }
  },
  {
    tableName: 'Clientes',
    freezeTableName: true
  }
);

module.exports = Cliente;

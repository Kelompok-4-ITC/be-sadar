const sequelize = require("../util/db_connect");
const Sequelize = require('sequelize');

const User = sequelize.define('users',{
  idUser:{
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  fullName:{
    type: Sequelize.STRING,
    allowNull: false
  },
  userName:{
    type: Sequelize.STRING,
    allowNull: false
  },
  password:{
    type: Sequelize.STRING,
    allowNull: false
  },
  noHP:{
    type: Sequelize.STRING,
    allowNull: false
  },
  tanggalLahir:{
    type: Sequelize.DATE,
    allowNull: false
  },
  tanggalGabung:{
    type: Sequelize.DATE,
    allowNull: false
  },
  fotoProfile:{
    type: Sequelize.STRING,
    allowNull: true
  },
  fotoBG:{
    type: Sequelize.STRING,
    allowNull: true
  },
  poin:{
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false
  }
})

module.exports = User;
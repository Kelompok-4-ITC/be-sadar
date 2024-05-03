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
  email:{
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
  alamat:{
    type: Sequelize.STRING,
    allowNull: true
  },
  jenisKelamin:{
    type: Sequelize.ENUM("Pria", "Perempuan"),
    allowNull: true
  },
  tanggalLahir:{
    type: Sequelize.DATEONLY,
    allowNull: false,
  },
  tanggalGabung:{
    type: Sequelize.DATEONLY,
    allowNull: false,
    defaultValue: Sequelize.NOW
  },
  fotoProfile:{
    type: Sequelize.STRING,
    allowNull: true
  },
  poin:{
    type: Sequelize.INTEGER,
    defaultValue: 0,
    allowNull: false
  }
},{
  timestamps: false
})

module.exports = User;
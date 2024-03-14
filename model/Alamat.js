const sequelize = require("../util/db_connect");
const Sequelize = require('sequelize');

const Alamat = sequelize.define('alamat',{
  idAlamat:{
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  alamatLengkap:{
    type: Sequelize.STRING,
    allowNull: false
  },
  tujuan:{
    type: Sequelize.ENUM("pickUp","dropOff"),
    allowNull: false
  }
},{
  timestamps: false
})

module.exports = Alamat;
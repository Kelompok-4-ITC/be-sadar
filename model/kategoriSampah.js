const sequelize = require("../util/db_connect");
const Sequelize = require('sequelize');

const kategoriSampah = sequelize.define('kategoriSampah',{
  idKategoriSampah:{
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  namaKategoriSampah:{
    type: Sequelize.STRING,
    allowNull: false
  },
  hargaKategoriSampah:{
    type: Sequelize.INTEGER,
    allowNull: false
  }
},{
  timestamps: false
})

module.exports = kategoriSampah;
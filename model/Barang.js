const Sequelize = require("sequelize");
const sequelize = require("../util/db_connect");

const Barang = sequelize.define("barang",{
  idBarang:{
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  namaBarang:{
    type: Sequelize.STRING,
    allowNull: true
  },
  deskripsiBarang:{
    type: Sequelize.STRING,
    allowNull: true
  },
  hargaBarang:{
    type: Sequelize.INTEGER,
    allowNull: true
  },
  fotoBarang:{
    type: Sequelize.STRING,
    allowNull: true
  },
},{
    timestamps: false
});

module.exports = Barang;
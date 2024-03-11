const Sequelize = require("sequelize");
const sequelize = require("../util/db_connect");

const Sampah = sequelize.define("sampah",{
  idSampah:{
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  deskripsiSampah:{
    type: Sequelize.STRING,
    allowNull: false
  },
  hargaSampah:{
    type: Sequelize.INTEGER,
    allowNull: false
  },
  beratSampah:{
    type: Sequelize.INTEGER,
    allowNull: false
  },
  beratSampah:{
    type: Sequelize.INTEGER,
    allowNull: false
  }
},{
    timestamps: false
});

module.exports = Sampah;
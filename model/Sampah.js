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
    allowNull: true
  },
  hargaSampah:{
    type: Sequelize.FLOAT,
    allowNull: true
  },
  beratSampah:{
    type: Sequelize.INTEGER,
    allowNull: true
  },
},{
    timestamps: false
});

module.exports = Sampah;
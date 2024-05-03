const Sequelize = require("sequelize");
const sequelize = require("../util/db_connect");

const pickUp = sequelize.define("pickUp",{
  idPickUp:{
    type: Sequelize.STRING,
    allowNull: false,
    primaryKey: true
  },
  totalHarga:{
    type: Sequelize.INTEGER,
    allowNull: true
  },
  fotoBukti:{
    type: Sequelize.STRING,
    allowNull: true
  },
  videoBukti:{
    type: Sequelize.STRING,
    allowNull: true
  },
  alamat:{
    type: Sequelize.STRING,
    allowNull: false
  }
});

module.exports = pickUp;
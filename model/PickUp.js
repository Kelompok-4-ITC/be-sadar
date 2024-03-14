const Sequelize = require("sequelize");
const sequelize = require("../util/db_connect");

const pickUp = sequelize.define("pickUp",{
  idPickUp:{
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
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
});

module.exports = pickUp;
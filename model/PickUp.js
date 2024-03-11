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
    allowNull: false
  },
  fotoBukti:{
    type: Sequelize.STRING,
    allowNull: false
  },
  videoBukti:{
    type: Sequelize.STRING,
    allowNull: false
  },
});

module.exports = pickUp;
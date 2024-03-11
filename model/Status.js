const Sequelize = require("sequelize");
const sequelize = require("../util/db_connect");

const Status = sequelize.define("status",{
  idStatus:{
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  namaStatus:{
    type: Sequelize.STRING,
    allowNull: false
  }
},{
    timestamps: false
});

module.exports = Status;
const Sequelize = require("sequelize");
const sequelize = require("../util/db_connect");

const Role = sequelize.define("roles",{
  idRole:{
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
    autoIncrement: true
  },
  namaRole:{
    type: Sequelize.ENUM("Customer", "Driver"),
    allowNull: false
  }
},{
  timestamps: false
});

module.exports = Role;
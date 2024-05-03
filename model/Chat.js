const Sequelize = require("sequelize");
const sequelize = require("../util/db_connect");

const Chat = sequelize.define("chat",{
    idChat:{
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: true
    },
    message:{
        type: Sequelize.TEXT,
        allowNull: false
    }
})

module.exports = Chat;
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../model/User');
const Role = require('../model/Role');
const key = process.env.TOKEN_SECRET_KEY;
const cloudinary = require('../util/cloudinary_config');
const fs = require('fs');

const listChat = async(req, res, next) => {
    try {
        const authorization = req.headers.authorization;
        let token;
        if(authorization !== null & authorization.startsWith("Bearer ")){
            token = authorization.substring(7); 
        }else{  
            const error = new Error("Perlu Login");
            error.statusCode = 403;
            throw error;
        }
      
        const decoded = jwt.verify(token, key);
        const {message} = req.body
        const {idOrder} = req.params;

        const loggedUser = await User.findOne({
            where: {
                idUser: decoded.Id,
            },
            include: {
              model: Role,
              attributes: ['nameRole']
            }
        });

        const currentOrder = await pickUp.findOne({
            where: {
                idPickUp: idOrder
            },
            include: [
                {
                    model:  statusPickUp,
                    attributes: ['nameStatus']
                }
            ]
        });

        if(loggedUser == null){
            const error = new Error("Akun anda tidak ditemukan");
            error.statusCode = 404;
            throw error;
        }

        if(currentOrder == null){
            const error = new Error("Orderan tidak ditemukan");
            error.statusCode = 404;
            throw error;
        }

        if (currentOrder.idDriver != loggedUser.idUser && currentOrder.idCustomer != loggedUser.idUser) {
            const error = new Error("Akun anda tidak dapat mengirim chat di orderan ini");
            error.statusCode = 404;
            throw error;
        }

        const blackListStatus = ["MENCARI","SELESAI","BATAL"]

        if (currentOrder.statusPickUp.nameStatus == blackListStatus) {
            const error = new Error(`Orderan dengan Status ${currentOrder.statusPickUp.nameStatus} tidak dapat mengirim pesan`);
            error.statusCode = 404;
            throw error;
        }

        const targetChat = await Chat.create({
            idPickUp: currentOrder.idPickUp,
            message: message,
            messageBy: loggedUser.idUser
        })

        if (targetChat == undefined) {
            const error = new Error("Error");
            error.statusCode = 400;
            throw error;
        }

        res.status(201).json({
            status: "success",
            message: "Send Chat Successfull!",
            Chat:{
                message: message,
                messageBy: loggedUser.fullName,
                messageRole: loggedUser.role.nameRole
            }
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            status: "Error",
            message: error.message,
        })
    }
}

const sendChat = async(req, res, next) => {
    try {
        
    } catch (error) {
        
    }
}

const receiveChat = async(req, res, next) => {
    try {
        
    } catch (error) {
        
    }
}

module.exports = listChat, sendChat, receiveChat;
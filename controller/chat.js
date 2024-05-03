require('dotenv').config();
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../model/User');
const Role = require('../model/Role');
const key = process.env.TOKEN_SECRET_KEY;
const pickUp = require('../model/PickUp');
const Chat = require('../model/Chat');
const Status = require('../model/Status');

const listChat = async(req, res, next) => {
    try {
        const authorization = req.headers.authorization;
        let token;
        if(authorization !== null && authorization.startsWith("Bearer ")){
            token = authorization.substring(7);
        } else {
            const error = new Error("Perlu Login");
            error.statusCode = 403;
            throw error;
        }

        const decoded = jwt.verify(token, key);

        const loggedUser = await User.findOne({
            where: {
                idUser: decoded.Id,
            }
        });

        if(loggedUser == null){
            const error = new Error("Akun anda tidak ditemukan");
            error.statusCode = 404;
            throw error;
        }

        const lists = await pickUp.findAll({
            where: {
                [Op.or]: [
                    {
                        idCustomer: loggedUser.idUser
                    },
                    {
                        idDriver: loggedUser.idUser,
                        idDriver: {[Op.ne]: null}
                    }
                ]
            },
        })

        const listChat = [];
        for(const list of lists) {
            const Customer = await User.findOne({
                where:{idUser: list.idCustomer},
                attributes:['fullName','fotoProfile']
            })

            const Driver = await User.findOne({
                where:{idUser: list.idDriver},
                attributes:['fullName','fotoProfile']
            })

            const lastMessage = await Chat.findOne({
                where: {idPickUp: list.idPickUp},
                attributes: ['message','createdAt'],
                order: [ [ 'createdAt', 'DESC' ]],
                include:{
                    model:User,
                    attributes: ['fullName']
                }
            });
            if (Driver) {
                listChat.push({
                    idPickUp: list.idPickUp,
                    Customer: Customer,
                    Driver: Driver,
                    lastMessage: lastMessage
                });
            }
        }

        res.status(201).json({
            status: "success",
            message: "Successfully fetch list chat",
            listChat
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            status: "Error",
            message: error.message,
        })
    }
}

const listChatFilter = async (req, res, next) => {
    try {
        const authorization = req.headers.authorization;
        let token;
        if (authorization !== null && authorization.startsWith("Bearer ")) {
            token = authorization.substring(7);
        } else {
            const error = new Error("Perlu Login");
            error.statusCode = 403;
            throw error;
        }
    
        const decoded = jwt.verify(token, key);
        const { targetName } = req.params;
    
        const loggedUser = await User.findOne({
            where: {
            idUser: decoded.Id,
            },
        });
    
        if (!loggedUser) {
            const error = new Error("Akun anda tidak ditemukan");
            error.statusCode = 404;
            throw error;
        }
    
        const lists = await pickUp.findAll({
            where: {
                [Op.or]: [
                    {
                    idCustomer: loggedUser.idUser,
                    },
                    {
                    idDriver: loggedUser.idUser,
                    },
                ],
            },
            include: [
                {
                    model: User,
                    as: "Customer",
                    attributes: ["fullName", "fotoProfile"],
                    where: {
                    fullName: {
                        [Op.like]: `%${targetName}%`,
                    },
                    },
                },
                {
                    model: User,
                    as: "Driver",
                    attributes: ["fullName", "fotoProfile"],
                    where: {
                    fullName: {
                        [Op.like]: `%${targetName}%`,
                    },
                    },
                },
            ],
        });
  
      const listChat = [];
      for (const list of lists) {
            const lastMessage = await Chat.findOne({
                where: {idPickUp: list.idPickUp},
                attributes: ['message','createdAt'],
                order: [ [ 'createdAt', 'DESC' ]],
                include:{
                    model:User,
                    attributes: ['fullName']
                }
            });
  
        listChat.push({
            idPickUp: list.idPickUp,
            Customer: list.Customer,
            Driver: list.Driver,
            lastMessage,
        });
      }
  
      res.status(201).json({
        status: "success",
        message: "Successfully fetch list chat",
        listChat,
      });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            status: "Error",
            message: error.message,
        });
    }
};

const sendChat = async(req, res, next) => {
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
        const {kodeOrder} = req.params;

        const loggedUser = await User.findOne({
            where: {
                idUser: decoded.Id,
            }
        });

        if(loggedUser == null){
            const error = new Error("Akun anda tidak ditemukan");
            error.statusCode = 404;
            throw error;
        }

        const currentOrder = await pickUp.findOne({
            where: {
                idPickUp: kodeOrder
            }
        });

        if(currentOrder == null){
            const error = new Error("Orderan tidak ditemukan");
            error.statusCode = 404;
            throw error;
        }

        if(currentOrder.idStatus == 1 ||currentOrder.idStatus == 5){
            const error = new Error("Status di orderan ini tidak memperbolehkan mengirim chat");
            error.statusCode = 400;
            throw error;
        }

        if (currentOrder.idDriver != loggedUser.idUser && currentOrder.idCustomer != loggedUser.idUser) {
            const error = new Error("Akun anda tidak dapat mengirim chat di orderan ini");
            error.statusCode = 404;
            throw error;
        }

        await Chat.create({
            idPickUp: currentOrder.idPickUp,
            message: message,
            messageBy: loggedUser.idUser
        })

        res.status(201).json({
            status: "success",
            message: "Send Chat Successfull!"
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            status: "Error",
            message: error.message,
        })
    }
}

const receiveChat = async(req, res, next) => {
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
        const {kodeOrder} = req.params;

        const loggedUser = await User.findOne({
            where: {
                idUser: decoded.Id,
            }
        });

        if(loggedUser == null){
            const error = new Error("Akun anda tidak ditemukan");
            error.statusCode = 404;
            throw error;
        }

        const currentOrder = await pickUp.findOne({
            where: {
                idPickUp: kodeOrder
            }
        });

        if(currentOrder == null){
            const error = new Error("Orderan tidak ditemukan");
            error.statusCode = 404;
            throw error;
        }

        if (currentOrder.idDriver != loggedUser.idUser && currentOrder.idCustomer != loggedUser.idUser) {
            const error = new Error("Akun anda tidak dapat mengakses chat di orderan ini");
            error.statusCode = 404;
            throw error;
        }

        const Customer = await User.findOne({
            where:{idUser: currentOrder.idCustomer},
            attributes:['fullName','fotoProfile']
        })

        const Driver = await User.findOne({
            where:{idUser: currentOrder.idDriver},
            attributes:['fullName','fotoProfile']
        })

        const Message = await Chat.findAll({
            where: {idPickUp: currentOrder.idPickUp},
            attributes: ['message','createdAt'],
            include:{
                model:User,
                attributes: ['fullName']
            }
        });
        const roomChat = [];
        roomChat.push({
            idPickUp: currentOrder.idPickUp,
            Customer: Customer,
            Driver: Driver,
            listMessage: Message
        });

        res.status(201).json({
            status: "success",
            message: "Receive Chat Successfull!",
            roomChat
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            status: "Error",
            message: error.message,
        })
    }
}

module.exports = {listChat, listChatFilter, sendChat, receiveChat};
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../model/User');
const Role = require('../model/Role');
const key = process.env.TOKEN_SECRET_KEY;
const pickUp = require('../model/PickUp');
const Sampah = require('../model/Sampah');
const Barang = require('../model/Barang');
const Status = require('../model/Status');
const moment = require('moment-timezone');


const listOrder = async(req, res, next) => {
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

        const loggedUser = await User.findOne({
            where: {
                idUser: decoded.Id,
            },
            include: {
                model: Role,
                attributes: ['namaRole']
            }
        });

        if(!loggedUser){
            const error = new Error("Akun anda tidak ditemukan");
            error.statusCode = 404;
            throw error;
        }

        const listPickUp = await pickUp.findAll({
            where: {
                [Op.or]: [
                    {
                        idCustomer: loggedUser.idUser
                    },
                    {
                        idDriver: loggedUser.idUser
                    }
                ]
            },
            include: [
                {
                    model: Status,
                    attributes: ['namaStatus']
                }
            ]
        })



        res.status(200).json({
            status: "success",
            message: `Successfully Fetch Process Order`,
            listPickUp
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            status: "Error",
            message: error.message,
        })
    }
}

const listOrderFilter = async(req, res, next) => {
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

        const loggedUser = await User.findOne({
            where: {
                idUser: decoded.Id,
            },
            include: {
                model: Role,
                attributes: ['namaRole']
            }
        });

        if(!loggedUser){
            const error = new Error("Akun anda tidak ditemukan");
            error.statusCode = 404;
            throw error;
        }

        const {jenisOrder} = req.params;
        let listOrder;

        if (jenisOrder == "pickUp") {
            listOrder = await pickUp.findAll({
                attributes:['idPickUp','createdAt','alamat'],
                where: {
                    [Op.or]: [
                        {
                            idCustomer: loggedUser.idUser
                        },
                        {
                            idDriver: loggedUser.idUser
                        }
                    ]
                },
                include: [
                    {
                        model: Status,
                        attributes: ['namaStatus']
                    },
                    {
                        model: User,
                        as: 'Customer',
                        attributes: ['fullName']
                    },
                    {
                        model: User,
                        as: 'Driver',
                        attributes: ['fullName']
                    }
                ]
            })
        }

        res.status(200).json({
            status: "success",
            message: `Successfully fetch History Order ${jenisOrder}`,
            listOrder
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            status: "Error",
            message: error.message,
        })
    }
}

const detailOrder = async(req, res, next) =>{
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

        const loggedUser = await User.findOne({
            where: {
                idUser: decoded.Id,
            },
            include: {
                model: Role,
                attributes: ['namaRole']
            }
        });

        if(!loggedUser){
            const error = new Error("Akun anda tidak ditemukan");
            error.statusCode = 404;
            throw error;
        }

        const {jenisOrder, kodeOrder} = req.params;
        let order, listSampah, listBarang;

        if (jenisOrder == "pickUp") {
            order = await pickUp.findOne({
                where: {
                    idPickUp: kodeOrder
                },
                attributes:['idPickUp','totalHarga','fotoBukti','videoBukti','alamat','createdAt','idCustomer','idDriver'],
                include: [
                    {
                        model: Status,
                        attributes: ['namaStatus']
                    },
                    {
                        model: User,
                        as: 'Customer',
                        attributes: ['fullName', 'fotoProfile','noHP']
                    },
                    {
                        model: User,
                        as: 'Driver',
                        attributes: ['fullName', 'fotoProfile','noHP']
                    }
                ]
            })
        }

        if(order.idDriver != loggedUser.idUser && order.idCustomer != loggedUser.idUser) {
            const error = new Error("Mohon Cek Kembali. Akun anda tidak dapat mengakses orderan");
            error.statusCode = 403;
            throw error;
        }

        listSampah = await Sampah.findAll({
            attributes:['idSampah','deskripsiSampah','hargaSampah','beratSampah'],
            where: {
                idPickUp: kodeOrder
            }
        })

        listBarang = await Barang.findAll({
            attributes:['idBarang','namaBarang','deskripsiBarang','hargaBarang','fotoBarang'],
            where: {
                idPickUp: kodeOrder
            }
        })

        res.status(200).json({
            status: "success",
            message: `Successfully fetch History Order ${jenisOrder}`,
            order,
            listSampah,
            listBarang
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            status: "Error",
            message: error.message,
        })
    }
}

module.exports = {listOrder, listOrderFilter, detailOrder};
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../model/User');
const Role = require('../model/Role');
const key = process.env.TOKEN_SECRET_KEY;
const cloudinary = require('../util/cloudinary_config');
const fs = require('fs');
const Alamat = require('../model/Alamat');
const pickUp = require('../model/PickUp');
const kategoriSampah = require('../model/kategoriSampah');
const Sampah = require('../model/Sampah');

const makeOrder = async(req, res, next) => {
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

        if(loggedUser.role.namaRole != "Customer") {
            const error = new Error("Akun anda tidak dapat membuat orderan");
            error.statusCode = 403;
            throw error;
        }

        const currentOrder = await pickUp.create({
            idStatus: "1",
            idCustomer: loggedUser.idUser
        });

        const {listSampah} = req.body;

        const cekKategori = async(namaKategori) => {
            return await kategoriSampah.findOne({
                where: { namaKategoriSampah: namaKategori }
            });
        };

        for (const sampah of listSampah) {
            const kategori = sampah.kategori;
            const kategoriSampah = await cekKategori(kategori);
            
            if (!kategoriSampah) {
                const error = new Error(`Kategori sampah '${kategori}' tidak ditemukan`);
                error.statusCode = 404;
                throw error;
            }

            await Sampah.create({ 
                idPickUp: currentOrder.idPickUp,
                idKategoriSampah: kategoriSampah.id,
                deskripsiSampah: sampah.deskripsi,
                fotoSampah: sampah.foto
            });
        }

        res.status(200).json({
            status: "success",
            message: "Success make order!",
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            status: "Error",
            message: error.message
        });
    }
};


const takeOrder = async(req, res, next) => {
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

        if(loggedUser.role.namaRole !== "Driver") {
            const error = new Error("Akun anda tidak dapat mengambil orderan");
            error.statusCode = 403;
            throw error;
        }

        const {idOrder} = req.params;

        const currentOrder = await pickUp.findOne({
            where: {
                idPickUp: idOrder
            }
        });

        if (currentOrder.idStatus != 1){
            const error = new Error("Orderan telah diambil oleh driver lain");
            error.statusCode = 400;
            throw error;
        }

        currentOrder.idDriver = loggedUser.idUser;
        currentOrder.idStatus = 2;

        await currentOrder.save();

        res.status(200).json({
            status: "success",
            message: "Success take order!",
        });

    } catch (error) {
        res.status(error.statusCode || 500).json({
            status: "Error",
            message: error.message
        });
    }
}

const pencatatanOrder = async(req, res, next) => {
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

        const {idOrder} = req.params;

        const currentOrder = await pickUp.findOne({
            where: {
                idPickUp: idOrder
            }
        });

        if(currentOrder.idDriver != loggedUser.idUser && loggedUser.role.namaRole !== "Driver") {
            const error = new Error("Mohon Cek Kembali. Akun anda tidak dapat mengakses orderan");
            error.statusCode = 403;
            throw error;
        }

        if (currentOrder.idStatus != 2){
            const error = new Error("Status Orderan tidak sesuai.");
            error.statusCode = 400;
            throw error;
        }

        currentOrder.idStatus = 3;

        await currentOrder.save();

        res.status(200).json({
            status: "success",
            message: "Success update status order to pengecekan!",
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            status: "Error",
            message: error.message
        });
    }
}

const konfirmasiOrder = async(req, res, next) => {
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

        const {idOrder} = req.params;

        const currentOrder = await pickUp.findOne({
            where: {
                idPickUp: idOrder
            }
        });

        if(currentOrder.idCustomer != loggedUser.idUser && loggedUser.role.namaRole !== "Customer") {
            const error = new Error("Akun anda tidak dapat mengakses orderan");
            error.statusCode = 403;
            throw error;
        }

        if (currentOrder.idStatus != 3){
            const error = new Error("Status Orderan tidak sesuai. Mohon Cek Kembali");
            error.statusCode = 400;
            throw error;
        }

        currentOrder.idStatus = 4;

        await currentOrder.save();

        res.status(200).json({
            status: "success",
            message: "Success update status order to konfirmasi!",
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            status: "Error",
            message: error.message
        });
    }
}

const finishOrder = async(req, res, next) => {
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

        const {idOrder} = req.params;

        const currentOrder = await pickUp.findOne({
            where: {
                idPickUp: idOrder
            }
        });

        if(currentOrder.idDriver != loggedUser.idUser && loggedUser.role.namaRole !== "Customer") {
            const error = new Error("Akun anda tidak dapat mengakses orderan");
            error.statusCode = 403;
            throw error;
        }

        if (currentOrder.idStatus != 4){
            const error = new Error("Status Orderan tidak sesuai. Mohon Cek Kembali");
            error.statusCode = 400;
            throw error;
        }

        currentOrder.idStatus = 5;

        await currentOrder.save();

        res.status(200).json({
            status: "success",
            message: "Success status order to Finish!",
        });
    } catch (error) {
        res.status(error.statusCode || 500).json({
            status: "Error",
            message: error.message
        });
    }
}

module.exports = {makeOrder, takeOrder, pencatatanOrder, konfirmasiOrder, finishOrder};
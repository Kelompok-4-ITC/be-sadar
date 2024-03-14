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

const postUser = async(req,res,next) => {
    try {
        const{
            userName, email, password, role, fullName, tanggalLahir, noHP
        }=req.body

        if (password.length<5) {
            const error = new Error(`Password harus memiliki 5 karakter`);
            error.statusCode = 400;
            throw error
        }

        if (noHP.length<10) {
            const error = new Error(`Nomor HP Anda Tidak Valid. Mohon Cek Kembali`);
            error.statusCode = 400;
            throw error
        }

        const checkUser = await User.findOne({
            where:{
                [Op.or]: [
                    {
                        email: email
                    },
                    {
                        userName: userName
                    },
                    {
                        noHP: noHP
                    }
                ]
            },
        });

        if (checkUser){
            const error = new Error(`Username, email, noHP sudah dipakai. Mohon Ganti`);
            error.statusCode = 409;
            throw error
        }

        const hashedPassword=await bcrypt.hash(password, 5);

        const roleUser = await Role.findOne({
            where:{
                namaRole: role
            }
        });

        if (!roleUser) {
            const error = new Error(`Role ${role} belum terbuat`);
            error.statusCode = 404;
            throw error
        }

        const currentUser = await User.create({
            userName,
            email,
            password : hashedPassword,
            fullName,
            tanggalLahir,
            noHP,
            idRole: roleUser.idRole
        });

        const token = jwt.sign({
            Id: currentUser.idUser,
            Role: roleUser.nameRole
        }, key,{
            algorithm: "HS256"
        })

        res.status(201).json({
            status: "success",
            message: "Register Successfull!",
            token
        })
    } catch (error) {
        res.status(error.statusCode || 500).json({
            status: "Error",
            message: error.message
        })
    }
}

const loginHandler = async(req, res, next)=>{
    try {
        const {
            loginUser, password
        } = req.body;

        const currentUser = await User.findOne({
            where:{
                [Op.or]: [
                    {
                        email : loginUser
                    },
                    {
                        userName : loginUser
                    }
                ]
            },
            include: {
              model: Role,
              attributes: ['namaRole']
            }
        })

        if(!currentUser){
            const error = new Error("Salah akun atau password");
            error.statusCode = 400;
            throw error;
        }

        const checkPassword = await bcrypt.compare(password, currentUser.password); 

        if (checkPassword == false){
            const error = new Error("Salah akun atau password");
            error.statusCode = 400;
            throw error;
        }
        

        const token = jwt.sign({
            Id: currentUser.idUser,
            Role: currentUser.namaRole
        }, key,{
            algorithm: "HS256"
        })
      
        res.status(200).json({
            status: "Success",
            message: "Login Successfull!",
            token
        })


    } catch (error) {
        res.status(error.statusCode || 500).json({
            status: "Error",
            message: error.message
        })
    }
}

const editUserAccount = async(req, res, next) => {
    try {
        const authorization = req.headers.authorization;
        let token;
        if (!authorization || !authorization.startsWith("Bearer ")) {
            const error = new Error("You need to login");
            error.statusCode = 403;
            throw error;
        }

        token = authorization.substring(7);
        const decoded = jwt.verify(token, key);

        const currentUser = await User.findOne({
            where: {
             idUser : decoded.Id,
            }
        });
      
        if (!currentUser) {
            const error = new Error(`Akun dengan id ${decoded.Id} tidak ditemukan!`);
            error.statusCode = 400;
            throw error;
        }

        if(req.body.email){
            const checkUser = await User.findOne({
                where:{
                    email: req.body.email
                }
            });

            if (checkUser) {
                const error = new Error("email sudah dipakai");
                error.statusCode = 400;
                throw error;
            }

            currentUser.email = req.body.email
        }

        let imageUrl;
        if (req.file) {
            const file = req.file.fotoProfile;

            const uploadOption={
                folder:'fotoProfile/',
                public_id:`user_${currentUser.idUser}`,
                overWrite:true
            }

            const uploadFile=await cloudinary.uploader.upload(file.path,uploadOption)
            imageUrl=uploadFile.secure_url
            //menghapus file yang diupload dalam local
            fs.unlinkSync(file.path);
            currentUser.fotoProfile=imageUrl;
        }

        if (req.body.fullName){
            currentUser.fullName = req.body.fullName;
        }
      
        if (req.body.password){
            const hashedPassword = await bcrypt.hash(req.body.password, 5);
            currentUser.password = hashedPassword;
        }

        if (req.body.tanggalLahir){
            currentUser.tanggalLahir = req.body.tanggalLahir
        }

        await currentUser.save();
        await currentUser.reload();

        res.status(200).json({
            status: "Success",
            message:"Succesfully edit user data",
            currentUser
        });

    } catch (error) {
        res.status(error.statusCode || 500).json({
            status: "Error",
            message: error.message
        })
    }
}

const getUserDetail = async(req, res, next) => {
    try {
        const authorization = req.headers.authorization;
        let token;
        if(authorization !== null & authorization.startsWith("Bearer ")){
            token = authorization.substring(7); 
        }else{  
            const error = new Error("You need to login");
            error.statusCode = 403;
            throw error;
        }
      
        const decoded = jwt.verify(token, key);

        const loggedUser = await User.findOne({
            attributes:[
                'fullName', 'userName', 'email', 'noHP', 'tanggalLahir', 'tanggalGabung', 'fotoProfile', 'fotoBG'
            ],
            where: {
                idUser: decoded.Id,
            },
            include: {
                model: Role,
                attributes: ['namaRole']
            }
        });

        if (!loggedUser) {
            const error = new Error(`User with id ${decoded.id} not exist!`);
            error.statusCode = 400;
            throw error;
        }

        res.status(200).json({
            status: "Success",
            message: "Successfuly fetch user data",
            loggedUser
        })

    } catch (error) {
        res.status(error.statusCode || 500).json({
            status: "Error",
            message: error.message
        })
    }
}

const getAlamatByToken = async(req, res, next) => {
    try {
        const authorization = req.headers.authorization;
        let token;
        if(authorization !== null & authorization.startsWith("Bearer ")){
            token = authorization.substring(7); 
        }else{  
            const error = new Error("You need to login");
            error.statusCode = 403;
            throw error;
        }
      
        const decoded = jwt.verify(token, key);

        const loggedUser = await User.findOne({
            where: {
                idUser: decoded.Id,
            }
        });

        if (!loggedUser) {
            const error = new Error(`User with id ${decoded.id} not exist!`);
            error.statusCode = 400;
            throw error;
        }

        const alamatUser = await Alamat.findAll({
            attributes:['alamatLengkap','tujuan'],
            where: {
                idUser: loggedUser.idUser
            }
        })

        res.status(200).json({
            status: "Success",
            message: "Successfuly fetch Alamat",
            alamatUser
        })

    } catch (error) {
        res.status(error.statusCode || 500).json({
            status: "Error",
            message: error.message
        })
    }
}

const postAlamatByToken = async(req, res, next) => {
    try {
        const authorization = req.headers.authorization;
        let token;
        if(authorization !== null & authorization.startsWith("Bearer ")){
            token = authorization.substring(7); 
        }else{  
            const error = new Error("You need to login");
            error.statusCode = 403;
            throw error;
        }
      
        const decoded = jwt.verify(token, key);

        const loggedUser = await User.findOne({
            where: {
                idUser: decoded.Id,
            }
        });

        if (!loggedUser) {
            const error = new Error(`User with id ${decoded.id} not exist!`);
            error.statusCode = 400;
            throw error;
        }

        const {alamatLengkap, tujuan} = req.body

        const alamat = await Alamat.create({
            alamatLengkap,
            idUser: loggedUser.idUser,
            tujuan
        })

        if (!alamat) {
            const error = new Error(`Alamat yang dikirim error. Mohon Dicoba Kembali`);
            error.statusCode = 400;
            throw error;
        }

        res.status(200).json({
            status: "Success",
            message: "Successfuly register alamat",
            Alamat: alamat.alamatLengkap
        })

    } catch (error) {
        res.status(error.statusCode || 500).json({
            status: "Error",
            message: error.message
        })
    }
}

const getRiwayatByToken = async(req, res, next) => {
    try {
        const authorization = req.headers.authorization;
        let token;
        if(authorization !== null & authorization.startsWith("Bearer ")){
            token = authorization.substring(7); 
        }else{  
            const error = new Error("You need to login");
            error.statusCode = 403;
            throw error;
        }

        res.status(200).json({
            status: "Success",
            message: "Successfuly fetch riwayat user data",
            loggedUser
        })

    } catch (error) {
        res.status(error.statusCode || 500).json({
            status: "Error",
            message: error.message
        })
    }
}

module.exports={postUser, loginHandler, editUserAccount, getUserDetail, getAlamatByToken, postAlamatByToken, getRiwayatByToken}
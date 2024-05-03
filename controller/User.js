require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const cloudinary = require('../util/cloudinary_config');
const fs = require('fs');
const {multer, streamUpload} = require('../middleware/upload_file');
const User = require('../model/User');
const Role = require('../model/Role');
const key = process.env.TOKEN_SECRET_KEY;

const postUser = async(req,res,next) => {
    try {
        const{
            userName, email, password, role, fullName, tanggalLahir, noHP
        }=req.body;

        const kurangData =[];

        if (!userName){
            kurangData.push('username');
        }

        if (!email){
            kurangData.push('email');
        }

        if (!password){
            kurangData.push('password');
        }

        if(!role){
            kurangData.push('role');
        }

        if (!fullName){
            kurangData.push('fullName');
        }

        if (!tanggalLahir){
            kurangData.push('tanggalLahir');
        }

        if(!noHP){
            kurangData.push('noHP');
        }

        if (kurangData.length > 0) {
            const error = new Error(`Data yang diperlukan belum lengkap: ${kurangData.join(', ')}`);
            error.statusCode = 400;
            throw error;
        }

        if(noHP.length<10){
            const error = new Error('Nomor HP Anda tidak valid. Mohon cek kembali');
            error.statusCode = 400;
            throw error;
        }

        if (password.length < 5) {
            const error = new Error('Password harus memiliki minimal 5 karakter');
            error.statusCode = 400;
            throw error;
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
            const error = new Error(`Username, email, atau noHP sudah dipakai. Mohon Ganti`);
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

        const kurangData =[];

        if (!loginUser){
            kurangData.push('loginUser');
        }

        if (!password){
            kurangData.push('password');
        }

        if (kurangData.length > 0) {
            const error = new Error(`Data yang diperlukan belum lengkap: ${kurangData.join(', ')}`);
            error.statusCode = 400;
            throw error;
        }

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
            error.statusCode = 404;
            throw error;
        }

        const checkPassword = await bcrypt.compare(password, currentUser.password); 

        if (checkPassword == false){
            const error = new Error("Salah akun atau password");
            error.statusCode = 404;
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

const editFotoProfile = async(req, res, next) => {
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

        let imageUrl;

        if (!req.file) {
            const error = new Error(`Anda tidak mengirimkan file apa-apa`);
            error.statusCode = 400;
            throw error;
        }

        const file = req.file;

        if (!file.mimetype.startsWith('image/')) {
            const error = new Error(`File yang diunggah bukan gambar`);
            error.statusCode = 400;
            throw error;
        }

        const uploadOption = {
            folder: 'fotoProfile/',
            public_id: `user_${currentUser.idUser}`,
            overwrite: true,
        };
        const result = await streamUpload(file, uploadOption);
        imageUrl = result.secure_url;
        currentUser.fotoProfile = imageUrl;
        
        await currentUser.save();

        res.status(200).json({
            status: "Success",
            message:"Succesfully edit foto profile",
        });

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

        if (req.body.fullName){
            currentUser.fullName = req.body.fullName;
        }

        if (req.body.alamat){
            currentUser.alamat = req.body.alamat;
        }

        if (req.body.tanggalLahir){
            currentUser.tanggalLahir = req.body.tanggalLahir;
        }

        if (req.body.jenisKelamin){
            if (req.body.jenisKelamin != "Pria" && req.body.jenisKelamin != "Perempuan") {
                const error = new Error("Masukkan jenis kelamin Pria atau Perempuan");
                error.statusCode = 400;
                throw error;
            }
            currentUser.jenisKelamin = req.body.jenisKelamin;
        }

        await currentUser.save();

        res.status(200).json({
            status: "Success",
            message:"Succesfully edit user data",
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
                'fullName', 'userName', 'email', 'noHP', 'alamat', 'jenisKelamin', 'tanggalLahir', 'tanggalGabung', 'fotoProfile'
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



module.exports={postUser, loginHandler, editFotoProfile, editUserAccount, getUserDetail}
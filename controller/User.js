require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../model/User');
const Role = require('../model/Role');
const key = process.env.TOKEN_SECRET_KEY;
const cloudinary = require('../util/cloudinary_config');
const fs = require('fs');

const postUser = async(req,res,next) => {
    try {
        const{
            userName, email, password, role
        }=req.body

        const checkUser = await User.findOne({
            where:{
                [Op.or]: [
                    {
                        email : email
                    },
                    {
                        userName : userName
                    }
                ]
            },
        });

        if (checkUser != undefined){
            const error = new Error(`Username atau email sudah dipakai. Mohon Ganti`);
            error.statusCode = 409;
            throw error
        }

        if (password.length<5) {
            const error = new Error(`Password harus memiliki 5 karakter`);
            error.statusCode = 400;
            throw error
        }

        const hashedPassword=await bcrypt.hash(password, 5);

        const roleUser = await Role.findOne({
            where:{
                nameRole: role
            }
        });

        if (roleUser == undefined) {
            const error = new Error(`Role ${role} belum terbuat`);
            error.statusCode = 404;
            throw error
        }

        const currentUser = await User.create({
            userName,
            email,
            password : hashedPassword,
            fullName,
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
              attributes: ['nameRole']
            }
        })

        if(currentUser == undefined){
            const error = new Error("wrong account or password");
            error.statusCode = 400;
            throw error;
        }

        const checkPassword = await bcrypt.compare(password, currentUser.password); 

        if (checkPassword == false){
            const error = new Error("wrong account or password");
            error.statusCode = 400;
            throw error;
        }
        

        const token = jwt.sign({
            Id: currentUser.idUser,
            Role: currentUser.role.nameRole
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
            },
            include: {
              model: Role,
              attributes: ['nameRole']
            }
        });
      
        if (!currentUser) {
            const error = new Error(`Akun dengan id ${decoded.Id} tidak ditemukan!`);
            error.statusCode = 400;
            throw error;
        }

        let imageUrl;
        if (req.file.fotoProfile) {
            const file = req.file.fotoProfile;

            const uploadOption={
                folder:'fotoProfile',
                public_id:`user_${currentUser.idUser}`,
                overWrite:true
            }

            const uploadFile=await cloudinary.uploader.upload(file.path,uploadOption)
            imageUrl=uploadFile.secure_url
            //menghapus file yang diupload dalam local
            fs.unlinkSync(file.path);
            currentUser.profilePicture=imageUrl;
        }

        if (req.file.fotoBG) {
            const file = fotoBG;

            const uploadOption={
                folder:'fotoBG/',
                public_id:`user_${currentUser.idUser}`,
                overWrite:true
            }

            const uploadFile=await cloudinary.uploader.upload(file.path,uploadOption)
            imageUrl=uploadFile.secure_url
            //menghapus file yang diupload dalam local
            fs.unlinkSync(file.path);
            currentUser.profilePicture=imageUrl;
        }

        if (req.body.fullName){
            currentUser.fullName = req.body.fullName;
        }

        if(req.body.email){
            currentUser.email = req.body.email
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
            user:{
                fullname:currentUser.fullName,
                userName:currentUser.userName,
                email:currentUser.email,
                fotoProfile:currentUser.fotoProfile,
                fotoBackground:currentUser.fotoBG
            }
        });

    } catch (error) {
        res.status(error.statusCode || 500).json({
            status: "Error",
            message: error.message
        })
    }
}

const getUserByToken = async(req, res, next) => {
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
            },
            include: {
              model: Role,
              attributes: ['nameRole']
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
            user:{
              fullname: loggedUser.fullName,
              userName: loggedUser.userName,
              profilePicture: loggedUser.profilePicture,
              saldo: loggedUser.saldo,
              role: loggedUser.role.nameRole,
              tanggalBuat: loggedUser.createdAt
            }
        })

    } catch (error) {
        res.status(error.statusCode || 500).json({
            status: "Error",
            message: error.message
        })
    }
}

module.exports={postUser, loginHandler, editUserAccount, getUserByToken}
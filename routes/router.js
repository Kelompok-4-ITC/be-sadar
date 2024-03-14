const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload_file');
const User = "/user";
const pickUp = "/pickUp";
const Chat = "/chat";

const { 
  postUser, loginHandler, editUserAccount, getUserDetail, getAlamatByToken, postAlamatByToken, getRiwayatByToken
} = require('../controller/User');

const {
  makeOrder, takeOrder, pencatatanOrder, konfirmasiOrder, finishOrder
} = require('../controller/pickup');

const { 
  listChat, sendChat, receiveChat
} = require('../controller/chat');

//Register user
router.post("/register", postUser);

//Login user
router.post("/login", loginHandler);

//edit user dari token
router.put(User + "/edit-user", upload.single('image'), editUserAccount);


//dapat user dari token
router.get(User + "/fetch-user", getUserDetail);

//dapat alamat user dari token
router.get(User + "/fetch-alamat", getAlamatByToken);

//POST alamat user dari token
router.post(User + "/register-alamat", postAlamatByToken);

//dapat riwayat transaksi user dari token
//belum
router.get(User + "/fetch-riwayat", getRiwayatByToken);

//chat
// router.get(Chat + "/", listChat);

// router.post(Chat + "/send-chat", sendChat);

// router.get(Chat + "/receive-chat", receiveChat);

//membuat orderan pickup dari customer
router.post(pickUp + "/make-order", makeOrder);

router.put(pickUp + "/take-order/:idOrder", takeOrder);

router.put(pickUp + "/pengecekan-order/:idOrder", pencatatanOrder);

router.put(pickUp + "/konfirmasi-order/:idOrder", konfirmasiOrder);

router.put(pickUp + "/finish-order/:idOrder", finishOrder);

module.exports = router;
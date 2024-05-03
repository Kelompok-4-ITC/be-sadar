const express = require('express');
const router = express.Router();
const {multer, streamUpload} = require('../middleware/upload_file');
const User = "/user";
const pickUp = "/pickUp";
const Chat = "/chat";
const Process = "/process"
const Achievement = "/achievement"


const { 
  postUser, loginHandler, editFotoProfile, editUserAccount, getUserDetail
} = require('../controller/User');

const {
  makeOrder, listDriverOrder, detailListDriverOrder, takeOrder, pencatatanOrder, konfirmasiOrder,
  takeSampahBarang,
  listSampah,
} = require('../controller/pickup');

const {
  listOrder, listOrderFilter, detailOrder
} = require('../controller/process');

const { 
  listChat, listChatFilter, sendChat, receiveChat,
} = require('../controller/chat');

const {
  association, asso
} = require('../util/dbAssoc')

//reset db
router.put("/reset-db", asso);

//Register user
router.post("/register", postUser);

//Login user
router.post("/login", loginHandler);

//edit user dari token
router.put(User + "/edit-fotoProfile", multer.single('image'), editFotoProfile);

router.put(User + "/edit-user", editUserAccount)

//dapat user dari token
router.get(User + "/fetch-user", getUserDetail);

//chat
//list room chat
router.get(Chat + "/list-chat", listChat);

//list room chat filtered
router.get(Chat + "/list-chat/:targetName", listChatFilter);

//mengirim pesan
router.post(Chat + "/send-chat/:kodeOrder", sendChat);

//menerima semua pesan
router.get(Chat + "/receive-chat/:kodeOrder", receiveChat);

//list process
router.get(Process + "/list-order", listOrder);

router.get(Process + "/list-order/jenisOrder=:jenisOrder", listOrderFilter);

//detail process
router.get(Process + "/detail-order/jenisOrder=:jenisOrder&kodeOrder=:kodeOrder", detailOrder)

//membuat orderan pickup dari customer
router.post(pickUp + "/make-order", multer.any('fotoBarang'), makeOrder);

router.get(pickUp + "/list-order", listDriverOrder);

router.get(pickUp + "/list-order/:kodeOrder", detailListDriverOrder)

router.put(pickUp + "/take-order/:kodeOrder", takeOrder);

router.put(pickUp + "/take-sampah-order/:kodeOrder", takeSampahBarang);

router.get(pickUp + "/pengecekan-order/:kodeOrder", listSampah);

router.put(pickUp + "/pengecekan-order/:kodeOrder", multer.array('bukti', 2), pencatatanOrder);

router.put(pickUp + "/konfirmasi-order/:kodeOrder", konfirmasiOrder);

module.exports = router;
const sequelize = require("./db_connect");
const User = require('../model/User');
const kategoriSampah = require('../model/kategoriSampah');
const pickUp = require('../model/PickUp');
const Role = require('../model/Role');
const Sampah = require('../model/Sampah');
const Status = require('../model/Status');
const Barang = require("../model/Barang");
const Chat = require("../model/Chat");

const role_user = [
  {namaRole: "Customer"},
  {namaRole: "Driver"}
]

const kategori_sampah = [
  {namaKategoriSampah: "Plastik", hargaKategoriSampah: "2300"},
  {namaKategoriSampah: "Kaca", hargaKategoriSampah: "4000"},
  {namaKategoriSampah: "Kertas", hargaKategoriSampah: "1700"},
  {namaKategoriSampah: "Logam", hargaKategoriSampah: "3400"},
  {namaKategoriSampah: "Kardus", hargaKategoriSampah: "1300"},
  {namaKategoriSampah: "Lain-lain", hargaKategoriSampah: "0"},
]

const nama_status = [
  {namaStatus: "Mencari"},
  {namaStatus: "OTW"},
  {namaStatus: "Pencatatan"},
  {namaStatus: "Konfirmasi"},
  {namaStatus: "Selesai"}
]

//RELASI DITARUH DISINI

//untuk table user
//user dan role
Role.hasMany(User, {foreignKey: 'idRole'});
User.belongsTo(Role, {foreignKey: 'idRole'});

//user dan alamat
// Alamat.belongsTo(User, {foreignKey: 'idUser'});
// User.hasMany(Alamat, {foreignKey: 'idUser'});

//untuk table pickup
//pickup dengan user customer
User.hasMany(pickUp, {as: 'Customer', foreignKey: 'idCustomer'});

pickUp.belongsTo(User, {as: 'Customer', foreignKey: 'idCustomer'});

//pickup dengan user driver
User.hasMany(pickUp, {as: 'Driver', foreignKey: 'idDriver'});
pickUp.belongsTo(User, {as: 'Driver', foreignKey: 'idDriver'});

//pickup dan status
Status.hasMany(pickUp, {foreignKey: 'idStatus'});
pickUp.belongsTo(Status, {foreignKey: 'idStatus'});

pickUp.hasMany(Sampah, {foreignKey: 'idPickUp'});
Sampah.belongsTo(pickUp, {foreignKey: 'idPickUp'});

kategoriSampah.hasMany(Sampah, {foreignKey: 'idKategoriSampah'});
Sampah.belongsTo(kategoriSampah, {foreignKey: 'idKategoriSampah'});

//pickup dan alamat
// Alamat.hasMany(pickUp, {foreignKey: 'idAlamat'});
// pickUp.belongsTo(Alamat, {foreignKey: 'idAlamat'});

pickUp.hasMany(Barang, {foreignKey: 'idPickUp'});
Barang.belongsTo(pickUp, {foreignKey: 'idPickUp'});

//chat
Chat.belongsTo(pickUp, {foreignKey: 'idPickUp'});
pickUp.hasMany(Chat, {foreignKey: 'idPickUp'});

Chat.belongsTo(User, {foreignKey: 'messageBy'});
User.hasMany(Chat, {foreignKey: 'messageBy'});


const association = async ()=>{
  try {
      // await sequelize.sync({force: true});
      // await Role.bulkCreate(role_user);
      // await kategoriSampah.bulkCreate(kategori_sampah);
      // await Status.bulkCreate(nama_status);
  } catch (error) {
      console.log(error.message);
  }
}

const asso = async ()=>{
  try {
      await sequelize.sync({force: true});
      await Role.bulkCreate(role_user);
      await kategoriSampah.bulkCreate(kategori_sampah);
      await Status.bulkCreate(nama_status);
  } catch (error) {
      console.log(error.message);
  }
}

module.exports = {association, asso}; 
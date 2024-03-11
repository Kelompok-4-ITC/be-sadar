const sequelize = require("./db_connect");
const User = require('../model/User');
const Alamat = require('../model/Alamat');
const kategoriSampah = require('../model/kategoriSampah');
const pickUp = require('../model/PickUp');
const Role = require('../model/Role');
const Sampah = require('../model/Sampah');
const Status = require('../model/Status')

const role_user = [
  {namaRole: "Customer"},
  {namaRole: "Driver"}
]

const kategori_sampah = [
  {namaKategoriSampah: "Plastik", hargaKategoriSampah: "2300"},
  {namaKategoriSampah: "Kaca", hargaKategoriSampah: "400"},
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
Role.hasMany(User);
User.belongsTo(Role);

//user dan alamat
Alamat.belongsTo(User);
User.hasMany(Alamat);

//untuk table pickup
//pickup dengan user customer
User.hasMany(pickUp, {
  foreignKey: 'idCustomer'
});

pickUp.belongsTo(User, {
  as: 'Customer',
  foreignKey: 'idCustomer'
});

//pickup dengan user driver
User.hasMany(pickUp, {
  foreignKey: 'idDriver'
});

pickUp.belongsTo(User, {
  as: 'Driver',
  foreignKey: 'idDriver'
});

//pickup dan status
pickUp.hasMany(Status);
Status.belongsTo(pickUp);

pickUp.hasMany(Sampah);
Sampah.belongsTo(pickUp);

kategoriSampah.hasMany(Sampah);
Sampah.belongsTo(kategoriSampah);

const association = async ()=>{
  try {
      await sequelize.sync({});
      await Role.bulkCreate(role_user);
      await kategoriSampah.bulkCreate(kategori_sampah);
      await Status.bulkCreate(nama_status);
  } catch (error) {
      console.log(error.message);
  }
}

module.exports = association; 
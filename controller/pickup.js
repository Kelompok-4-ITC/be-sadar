require("dotenv").config();
const jwt = require("jsonwebtoken");
const { Op, where } = require("sequelize");
const User = require("../model/User");
const Role = require("../model/Role");
const key = process.env.TOKEN_SECRET_KEY;
const cloudinary = require("../util/cloudinary_config");
const { multer, streamUpload } = require("../middleware/upload_file");
const fs = require("fs");
const pickUp = require("../model/PickUp");
const kategoriSampah = require("../model/kategoriSampah");
const Sampah = require("../model/Sampah");
const { customAlphabet } = require("nanoid");
const Barang = require("../model/Barang");

const makeOrder = async (req, res, next) => {
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
        attributes: ["namaRole"],
      },
    });

    if (!loggedUser) {
      const error = new Error("Akun anda tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    if (loggedUser.role.namaRole != "Customer") {
      const error = new Error("Akun anda tidak dapat membuat orderan");
      error.statusCode = 403;
      throw error;
    }

    if (!loggedUser.alamat) {
      const error = new Error(`Masukkan alamat terlebih dahulu`);
      error.statusCode = 400;
      throw error;
    }

    let sampahObject,
      sampahString,
      barangObject = [],
      barangString = [],
      i = 0;

    if (req.body.listSampah) {
      sampahString = req.body.listSampah;
      sampahObject = JSON.parse(sampahString);
      for (const sampah of sampahObject) {
        const kurangData = [];
        if (sampah.kategori && sampah.deskripsi) {
          const cekKategori = await kategoriSampah.findOne({
            where: { namaKategoriSampah: sampah.kategori },
          });
          if (!cekKategori) {
            const error = new Error(
              `Sampah ke-[${i}]: kategori tidak ditemukan atau tidak cocok`
            );
            error.statusCode = 404;
            throw error;
          }
        } else {
          if (!sampah.kategori) {
            kurangData.push("kategori");
          }

          if (!sampah.deskripsi) {
            kurangData.push("deskripsi");
          }

          if (kurangData.length > 0) {
            const error = new Error(
              `Data Sampah ke-[${i}] yang diperlukan belum lengkap: ${kurangData.join(
                ", "
              )}`
            );
            error.statusCode = 400;
            throw error;
          }
        }
        i++;
      }
    }

    i = 0;
    if (req.body.listBarang) {
      barangString = req.body.listBarang;
      barangObject = JSON.parse(barangString);
      if (barangObject.length != req.files.length) {
        const error = new Error(`Pastikan gambar dan barang dengan jumlah yang sesuai`);
        error.statusCode = 400;
        throw error;
      }
      if (
        (!barangObject && !sampahObject) ||
        (!barangObject[0] && !sampahObject[0])
      ) {
        const error = new Error(`list sampah dan list barang kosong.`);
        error.statusCode = 400;
        throw error;
      }
      for (const barang of barangObject) {
        const kurangData = [];
        if (
          req.files[i] &&
          barang.namaBarang &&
          barang.deskripsi &&
          barang.hargaBarang
        ) {
          i++;
        } else {
          if (!req.files[i]) {
            kurangData.push("image");
          }

          if (!barang.namaBarang) {
            kurangData.push("namaBarang");
          }

          if (!barang.deskripsi) {
            kurangData.push("deskripsi");
          }

          if (!barang.hargaBarang) {
            kurangData.push("hargaBarang");
          }

          if (kurangData.length > 0) {
            const error = new Error(`Data Barang ke-[${i}] yang diperlukan belum lengkap: ${kurangData.join(", ")}`);
            error.statusCode = 400;
            throw error;
          }
        }
      }
    }

    const buatId = async () => {
      const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 7);
      let cekId = true;
      let result;
      while (cekId) {
        result = nanoid();
        cekId = Boolean(await pickUp.findOne({ where: { idPickUp: result } }));
      }
      return result;
    };

    const currentOrder = await pickUp.create({
      idPickUp: await buatId(),
      idStatus: "1",
      idCustomer: loggedUser.idUser,
      alamat: loggedUser.alamat,
    });
    if (req.body.listSampah) {
      for (const sampah of sampahObject) {
        const kategori = sampah.kategori;
        const cekKategori = await kategoriSampah.findOne({
          where: { namaKategoriSampah: kategori },
        });

        if (!cekKategori) {
          const error = new Error(
            `Kategori sampah '${kategori}' tidak ditemukan`
          );
          error.statusCode = 404;
          throw error;
        }

        await Sampah.create({
          idPickUp: currentOrder.idPickUp,
          idKategoriSampah: cekKategori.idKategoriSampah,
          deskripsiSampah: sampah.deskripsi,
        });
      }
    }

    i = 0;
    if (req.body.listBarang) {
      for (const barang of barangObject) {
        let imageUrl, image;
        image = req.files[i];
        const uploadOption = {
          folder: "barang/",
          overwrite: true,
        };
        const result = await streamUpload(image, uploadOption);
        imageUrl = result.secure_url;

        await Barang.create({
          idPickUp: currentOrder.idPickUp,
          namaBarang: barang.namaBarang,
          deskripsiBarang: barang.deskripsi,
          hargaBarang: barang.hargaBarang,
          fotoBarang: imageUrl,
        });
        i++;
      }
    }

    res.status(200).json({
      status: "success",
      message: "Success make order!",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
};

// const makeOrder = async(req, res, next) => {
//     try {
//         const authorization = req.headers.authorization;
//         let token;
//         if (authorization!== null && authorization.startsWith("Bearer ")){
//             token = authorization.substring(7);
//         } else {
//             const error = new Error("Perlu Login");
//             error.statusCode = 403;
//             throw error;
//         }

//         const decoded = jwt.verify(token, key);

//         const loggedUser = await User.findOne({
//             where: {
//                 idUser: decoded.Id,
//             },
//             include: {
//                 model: Role,
//                 attributes: ['namaRole']
//             }
//         });

//         if(!loggedUser){
//             const error = new Error("Akun anda tidak ditemukan");
//             error.statusCode = 404;
//             throw error;
//         }

//         if(loggedUser.role.namaRole!= "Customer") {
//             const error = new Error("Akun anda tidak dapat membuat orderan");
//             error.statusCode = 403;
//             throw error;
//         }

//         if (!loggedUser.alamat) {
//             const error = new Error(`Masukkan alamat terlebih dahulu`);
//             error.statusCode = 400;
//             throw error;
//         }

//         let jumlahBarang, jumlahSampah;
//         const sampahString = req.body.listSampah;
//         const sampahObject = JSON.parse(sampahString);
//         const sampahString = req.body.listBarang;
//         const barangObject = JSON.parse(sampahString);
//         console.log(barangObject)
//         const cekSampah = async () => {
//             jumlahSampah = 0;
//             for (let i = 0; i < 10; i++) {
//                 const kurangData = [];
//                 if (req.body.listSampah[i].kategori && req.body.listSampah[i].deskripsi){
//                     const cekKategori = await kategoriSampah.findOne({
//                         where: {namaKategoriSampah: req.body.listSampah[i].kategori}
//                     });

//                     if (!cekKategori) {
//                         const error = new Error(`Sampah ke-[${i}]: kategori tidak ditemukan atau tidak cocok`);
//                         error.statusCode = 404;
//                         throw error;
//                     }
//                     jumlahSampah++;
//                 }else {
//                     if (!req.body.listSampah[i].kategori) {
//                         kurangData.push('kategori');
//                     }

//                     if (!req.body.listSampah[i].deskripsi) {
//                         kurangData.push('deskripsi');
//                     }

//                     if (kurangData.length < 2) {
//                         const error = new Error(`Data Sampah ke-[${i}] yang diperlukan belum lengkap: ${kurangData.join(', ')}`);
//                         error.statusCode = 400;
//                         throw error;
//                     }
//                 }
//             }
//             return jumlahSampah
//           };

//         jumlahSampah = await cekSampah();

//         const cekBarang = async () => {
//             jumlahBarang = 0;
//             for (i = 0; i < 10; i++) {
//               const kurangData = [];
//               if (req.files[i] && req.body.listBarang[i].namaBarang && req.body.listBarang[i].deskripsi && req.body.listBarang[i].hargaBarang) {
//                 jumlahBarang++;
//               } else {
//                 if (!req.files[i]) {
//                   kurangData.push('image');
//                 }

//                 if (!req.body.listBarang[i].namaBarang) {
//                   kurangData.push('namaBarang');
//                 }

//                 if (!req.body.listBarang[i].deskripsi) {
//                   kurangData.push('deskripsi');
//                 }

//                 if (!req.body.listBarang[i].hargaBarang) {
//                   kurangData.push('harga');
//                 }

//                 if (kurangData.length < 4) {
//                   const error = new Error(`Data Barang ke-[${i}] yang diperlukan belum lengkap: ${kurangData.join(', ')}`);
//                   error.statusCode = 400;
//                   throw error;
//                 }
//               }
//             }
//             return jumlahBarang
//         };

//         jumlahBarang = await cekBarang();

//         const buatId = async () => {
//             const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
//             let cekId = true;
//             let result;
//             while (cekId) {
//                 result = '';
//                 for (let i=0; i<7; i++) {
//                     const randomIndex = Math.floor(Math.random() * characters.length);
//                     result += characters.charAt(randomIndex);
//                 }
//                 cekId = Boolean(await pickUp.findOne({where:{idPickUp: result}}))
//             }
//             return result;
//         };

//         const currentOrder = await pickUp.create({
//             idPickUp: await buatId(),
//             idStatus: "1",
//             idCustomer: loggedUser.idUser,
//             alamat:loggedUser.alamat
//         });

//         for (let i = 0; i < jumlahSampah; i++) {
//             const cekKategori = await kategoriSampah.findOne({
//                 where: {namaKategoriSampah: req.body.listSampah[i].kategori}
//             });
//             await Sampah.create({
//                 idPickUp: currentOrder.idPickUp,
//                 idKategoriSampah: cekKategori.idKategoriSampah,
//                 deskripsiSampah: req.body.listSampah[i].deskripsi
//             })
//         }

//         let imageUrl;
//         for (let i = 0; i < jumlahBarang; i++) {
//             const uploadOption = {
//                 folder: 'barang/',
//                 overwrite: true
//             };
//             const file = req.files[i];
//             const result = await streamUpload(file, uploadOption);
//             imageUrl = result.secure_url;
//             await Barang.create({
//                 idPickUp: currentOrder.idPickUp,
//                 namaBarang: req.body.listBarang[i].namaBarang,
//                 deskripsiBarang: req.body.listBarang[i].deskripsi,
//                 hargaBarang: req.body.listBarang[i].hargaBarang,
//                 fotoBarang: imageUrl
//             })
//         }

//         res.status(200).json({
//             status: "success",
//             message: "Success make order!",
//         });
//     } catch (error) {
//         res.status(error.statusCode || 500).json({
//             status: "Error",
//             message: error.message
//         });
//     }
// };

const listDriverOrder = async (req, res, next) => {
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
        attributes: ["namaRole"],
      },
    });

    if (!loggedUser) {
      const error = new Error("Akun anda tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    if (loggedUser.role.namaRole !== "Driver") {
      const error = new Error("Akun anda tidak dapat mengambil orderan");
      error.statusCode = 403;
      throw error;
    }

    const listOrder = await pickUp.findAll({
      where: {
        idStatus: 1,
      },
      attributes: ["idPickUp", "alamat"],
      include: {
        model: User,
        as: "Customer",
        attributes: ["fullName", "noHP"],
      },
    });

    res.status(200).json({
      status: "success",
      message: "Success fetch list order!",
      listOrder,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
};

const detailListDriverOrder = async(req, res, next) => {
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
            attributes: ["namaRole"],
        },
      });

      if (!loggedUser) {
        const error = new Error("Akun anda tidak ditemukan");
        error.statusCode = 404;
        throw error;
      }

      if (loggedUser.role.namaRole !== "Driver") {
        const error = new Error("Akun anda tidak dapat mengambil orderan");
        error.statusCode = 403;
        throw error;
      }

        const { kodeOrder } = req.params;

      const currentOrder = await pickUp.findOne({
        where: {
            idPickUp: kodeOrder,
        },
        attributes:['idPickUp','alamat','createdAt'],
        include:{
            model: User,
            as: Customer,
            attributes: ['fullName', 'fotoProfile','noHP']
        }
      });

      if (!currentOrder) {
        const error = new Error("Orderan tidak ditemukan");
        error.statusCode = 400;
        throw error;
      }

      if (currentOrder.idStatus != 1) {
        const error = new Error("Orderan telah diambil oleh driver lain");
        error.statusCode = 400;
        throw error;
      }

      listSampah = await Sampah.findAll({
        attributes:['idSampah','deskripsiSampah'],
        where: {
            idPickUp: kodeOrder
        },include:{
            model: kategoriSampah,
            attributes: ['namaKategoriSampah']
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
        message: "Success fetch detail order!",
      });
    } catch (error) {
      res.status(error.statusCode || 500).json({
        status: "Error",
        message: error.message,
      });
    }
}

const takeOrder = async (req, res, next) => {
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
        attributes: ["namaRole"],
      },
    });

    if (!loggedUser) {
      const error = new Error("Akun anda tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    if (loggedUser.role.namaRole !== "Driver") {
      const error = new Error("Akun anda tidak dapat mengambil orderan");
      error.statusCode = 403;
      throw error;
    }

    const { kodeOrder } = req.params;

    const currentOrder = await pickUp.findOne({
      where: {
        idPickUp: kodeOrder,
      },
    });

    if (!currentOrder) {
      const error = new Error("Orderan tidak ditemukan");
      error.statusCode = 400;
      throw error;
    }

    if (currentOrder.idStatus != 1) {
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
      message: error.message,
    });
  }
};

const takeSampahBarang = async (req, res, next) => {
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
        attributes: ["namaRole"],
      },
    });

    if (!loggedUser) {
      const error = new Error("Akun anda tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    const { kodeOrder } = req.params;

    const currentOrder = await pickUp.findOne({
      where: {
        idPickUp: kodeOrder,
      },
    });

    if (!currentOrder) {
      const error = new Error("Orderan tidak ditemukan");
      error.statusCode = 400;
      throw error;
    }

    if (
      currentOrder.idDriver != loggedUser.idUser &&
      loggedUser.role.namaRole !== "Driver"
    ) {
      const error = new Error(
        "Mohon Cek Kembali. Akun anda tidak dapat mengakses orderan"
      );
      error.statusCode = 403;
      throw error;
    }

    if (currentOrder.idStatus != 2) {
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
      message: error.message,
    });
  }
};

const listSampah = async (req, res, next) => {
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
        attributes: ["namaRole"],
      },
    });

    if (!loggedUser) {
      const error = new Error("Akun anda tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    const { kodeOrder } = req.params;

    const currentOrder = await pickUp.findOne({
      where: {
        idPickUp: kodeOrder,
      },
    });

    if (!currentOrder) {
      const error = new Error("Orderan tidak ditemukan");
      error.statusCode = 400;
      throw error;
    }

    if (
      currentOrder.idDriver != loggedUser.idUser &&
      loggedUser.role.namaRole !== "Driver"
    ) {
      const error = new Error(
        "Mohon Cek Kembali. Akun anda tidak dapat mengakses orderan"
      );
      error.statusCode = 403;
      throw error;
    }

    const listSampah = await Sampah.findAll({
      attributes: ["idSampah", "deskripsiSampah", "hargaSampah", "beratSampah"],
      where: {
        idPickUp: currentOrder.idPickUp,
      },
      include: {
        model: kategoriSampah,
        attributes: ["namaKategoriSampah"],
      },
    });

    res.status(200).json({
      status: "success",
      message: "Success fetch list sampah!",
      listSampah,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
};

const pencatatanOrder = async (req, res, next) => {
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
        attributes: ["namaRole"],
      },
    });

    if (!loggedUser) {
      const error = new Error("Akun anda tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    const { kodeOrder } = req.params;

    const currentOrder = await pickUp.findOne({
      where: {
        idPickUp: kodeOrder,
      },
    });

    console.log(currentOrder)

    if (!currentOrder) {
      const error = new Error("Orderan tidak ditemukan");
      error.statusCode = 403;
      throw error;
    }

    if (currentOrder.idDriver != loggedUser.idUser &&loggedUser.role.namaRole !== "Driver") {
      const error = new Error("Mohon Cek Kembali. Akun anda tidak dapat mengakses orderan");
      error.statusCode = 403;
      throw error;
    }

    if (currentOrder.idStatus != 3) {
      const error = new Error("Status Orderan tidak sesuai.");
      error.statusCode = 400;
      throw error;
    }

    if (!req.files) {
      const error = new Error(`Kirim foto dan video`);
      error.statusCode = 400;
      throw error;
    }

    if (req.files.length != 2) {
      const error = new Error(`Kirim 2 file dengan benar dan tepat`);
      error.statusCode = 400;
      throw error;
    }

    if (!req.files[0].mimetype.startsWith("image/")) {
      const error = new Error(`Pastikan files[0] adalah foto`);
      error.statusCode = 400;
      throw error;
    }

    if (!req.files[1].mimetype.startsWith("video/")) {
      const error = new Error(`Pastikan files[1] adalah video`);
      error.statusCode = 400;
      throw error;
    }

    const orderSampah = await Sampah.findAll({
      where: {
        idPickUp: currentOrder.idPickUp,
      },
    });

    let totalHarga = 0, sampahObject, sampahString, kurangData = [], kurangBerat = [];
    if (orderSampah[0]) {
      if (!req.body.listSampah) {
        const error = new Error(`Kosong list sampah 1`);
        error.statusCode = 400;
        throw error;
      }
      sampahString = req.body.listSampah;
      sampahObject = JSON.parse(sampahString);

      if (orderSampah.length != sampahObject.length) {
        const error = new Error(
          "Banyak Sampah tidak sesuai dengan data di orderan"
        );
        error.statusCode = 400;
        throw error;
      }

      for (const order of orderSampah) {
        let cekSampah = false;
        for (const listSampah of sampahObject) {
          if (listSampah.idSampah == order.idSampah) {
            cekSampah = true;
            if (!listSampah.beratSampah) {
              kurangBerat.push(order.idSampah);
            }
          }
        }

        if (!cekSampah) {
          kurangData.push(order.idSampah);
        }
      }

      if (kurangData.length > 0) {
        const error = new Error(
          `Id Sampah yang diperlukan: ${kurangData.join(", ")}`
        );
        error.statusCode = 400;
        throw error;
      }

      if (kurangBerat.length > 0) {
        const error = new Error(
          `Id Berat Sampah yang diperlukan: ${kurangBerat.join(", ")}`
        );
        error.statusCode = 400;
        throw error;
      }

      for (const sampah of sampahObject) {
        const currentSampah = await Sampah.findOne({
          where: {
            idSampah: sampah.idSampah,
          },
          include: {
            model: kategoriSampah,
          },
        });

        const beratSampah = sampah.beratSampah;
        const hargaSampah = currentSampah.kategoriSampah.hargaKategoriSampah * beratSampah;
        currentSampah.beratSampah = beratSampah;
        currentSampah.hargaSampah = hargaSampah;
        if (sampah.hargaSampah) {
          currentSampah.hargaSampah = sampah.hargaSampah;
        }
        await currentSampah.save();
        totalHarga += hargaSampah;
      }
    }

    //     for (const sampah of sampahObject) {
    //         const cekSampah = orderSampahMap.get(sampah.idSampah);

    //         if (cekSampah) {
    //             const error = new Error("Sampah ini tidak sesuai di database");
    //             error.statusCode = 400;
    //             throw error;
    //         }

    //         if (currentSampah.idPickUp!=currentOrder.idPickUp) {
    //             const error = new Error("Error! sampah ini tidak sesuai dengan orderan");
    //             error.statusCode = 400;
    //             throw error;
    //         }
    //   }
    //     const beratSampah = sampah.beratSampah;
    //     const hargaSampah = currentSampah.kategoriSampah.hargaKategoriSampah * beratSampah;
    //     currentSampah.beratSampah = beratSampah;
    //     currentSampah.hargaSampah = hargaSampah;
    //     if (sampah.hargaSampah) {
    //         currentSampah.hargaSampah = sampah.hargaSampah;
    //     }
    //     await currentSampah.save();
    //     totalHarga += hargaSampah;
    //   }

    const listBarang = await Barang.findAll({
      where: {
        idPickUp: kodeOrder,
      },
    });

    for (const barang of listBarang) {
      totalHarga += barang.hargaBarang;
    }

    const imageOption = {
      folder: "fotoBukti/",
      public_id: `bukti_${currentOrder.idPickUp}`,
      overwrite: true,
    };
    const videoOption = {
      folder: "videoBukti/",
      public_id: `bukti_${currentOrder.idPickUp}`,
      overwrite: true,
    };
    const image = req.files[0];
    const video = req.files[1];
    const resultImage = await streamUpload(image, imageOption);
    const imageUrl = resultImage.secure_url;
    const resultVideo = await streamUpload(video, videoOption);
    const videoUrl = resultVideo.secure_url;

    currentOrder.fotoBukti = imageUrl;
    currentOrder.videoBukti = videoUrl;

    currentOrder.totalHarga = totalHarga;

    currentOrder.idStatus = 4;
    await currentOrder.save();

    res.status(200).json({
      status: "success",
      message: "Success update status order to Konfirmasi!",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
};

const konfirmasiOrder = async (req, res, next) => {
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
        attributes: ["namaRole"],
      },
    });

    if (!loggedUser) {
      const error = new Error("Akun anda tidak ditemukan");
      error.statusCode = 404;
      throw error;
    }

    const { kodeOrder } = req.params;

    const currentOrder = await pickUp.findOne({
      where: {
        idPickUp: kodeOrder,
      },
    });

    if (!currentOrder) {
      const error = new Error("Orderan tidak ditemukan");
      error.statusCode = 403;
      throw error;
    }

    if (currentOrder.idCustomer != loggedUser.idUser &&loggedUser.role.namaRole !== "Customer") {
      const error = new Error("Akun anda tidak dapat mengakses orderan");
      error.statusCode = 403;
      throw error;
    }

    if (currentOrder.idStatus != 4) {
      const error = new Error("Status Orderan tidak sesuai. Mohon Cek Kembali");
      error.statusCode = 400;
      throw error;
    }

    currentOrder.idStatus = 5;
    const poin = currentOrder.totalHarga/100
    loggedUser.poin+= poin

    await currentOrder.save();

    loggedUser.poin;

    res.status(200).json({
      status: "success",
      message: "Success update status order to selesai!",
      poin
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
};

module.exports = {
  makeOrder,
  listDriverOrder,
  detailListDriverOrder,
  takeOrder,
  takeSampahBarang,
  listSampah,
  pencatatanOrder,
  konfirmasiOrder,
};

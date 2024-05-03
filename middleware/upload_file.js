const Multer = require("multer");
const cloudinary = require("../util/cloudinary_config");
const streamifier = require("streamifier");

const multer = Multer({
  storage: Multer.memoryStorage(),
});

const streamUpload = async (file, uploadOption) => {
  uploadOption.resource_type = "auto";
  return new Promise((resolve, reject) => {
    let stream = cloudinary.uploader.upload_stream(
      uploadOption,
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

module.exports = { multer, streamUpload };

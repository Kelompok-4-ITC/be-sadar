const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload_file');

// const { 
//   postUser, loginHandler, editUserAccount, getUserByToken
// } = require('../controller/User');

// //Register new User
// router.post("/register", postUser);

// //Login user
// router.post("/login", loginHandler);

// //edit user
// router.put("/user-account", upload.single('image'), editUserAccount);

// //dapat data dari token
// router.get("/user-token", getUserByToken);

module.exports = router;
const express = require('express');
const Router = require('./routes/router');
const association = require('./util/dbAssoc');

const app = express();

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE, PATCH");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(Router);

app.use("/", (req,res,next)=>{
  res.status(404).json({
    message: "Resource not found!"
  })
})

association().then(()=>{
  app.listen(8080);
  console.log('connected to db')
}).catch(e=>{
  console.log(e);
})
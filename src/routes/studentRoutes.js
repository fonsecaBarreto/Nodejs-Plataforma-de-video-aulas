const Router = require("express").Router()
const admin = require("../api/admin")
const {index,create,remove,genToken,validateToken,updatestudents,
  updatePassword,indexTopPoints,updateSelf,subscription}= require("../api/student");



  const api_key ="5890ddece9c30463c2babfc8bb5b5e5ce36311f8abeafb76e04b7fa0b07517a2"
  var request = require('request');

Router.post("/pagamento",(req,res,next)=>{
    console.log("pagamentoad treswre")
    res.json({...req.body})
    
})
Router.get("/avaliar", async (req,res,next)=>{
  console.log("avaliando")
  var cus = "cus_000002854268"
  request({
    method: 'GET',
    url: 'https://sandbox.asaas.com/api/v3/customers',
    headers: { 'access_token': api_key }}, function (error, response, body) {
      if(error) res.status(500).send(err)
    console.log('Status:', response.statusCode);
    res.json(body)
  });
})




/* public */
Router.post("/signin",genToken);
Router.post("/subscribe",subscription)
/* users*/
Router.post("/auth",validateToken,(req,res)=>{res.json(req.user)}) 
Router.put("/update",validateToken,updateSelf)
Router.put("/updatepassword",validateToken,updatePassword)

Router.put("/autoupdate",admin.validateToken,updatestudents) 
Router.get("/ranking",validateToken,indexTopPoints) 



var nodemailer = require("nodemailer");

const AWS = require("aws-sdk");
AWS.config.update({
    accessKeyId:process.env.AWS_ACCESS_KEY,
    secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY,
    region:"us-east-1"
});




Router.post("/mail",(req,res)=>{
let transporter = nodemailer.createTransport({
  SES: new AWS.SES({
      apiVersion: '2010-12-01'
  })
});

let mailOptions = {
  from: '"naoresponda" <naoresponda@mathewslins.com>', 
  to: "suporte@mathewslins.com", 
  subject: "Hello ✔", 
  text: "Hello world?", 
  html: "<b>Hello world?</b>" 
};

transporter.sendMail(mailOptions)
  
})


/* private admins*/
Router.route("/")
  .get(admin.validateToken,index)
  .post(admin.validateToken,create)
Router.route("/:id")
  .put(admin.validateToken, create)
  .delete(admin.validateToken,remove)
/*  */
module.exports = Router;
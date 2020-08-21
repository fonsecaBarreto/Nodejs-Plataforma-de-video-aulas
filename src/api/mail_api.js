const request = require("request");
const {isNull,isString,BuildError, isEmail} = require("../api/validation");
var normalizeEmail = require('normalize-email')
const mailchimp_key = process.env.MAILCHIMP_KEY;
const audiences={
  experimental: "0fe9e93b2b",
  broadNewsletter:"f4d3d7c03e",
  captivatedstudents:"b4e6d2a878"
}
const MC_API_URL = `https://us18.api.mailchimp.com/3.0`;

/* newsletter */
function broadAssign({email,name,phone}){

  return new Promise((resolve,reject)=>{
    const errors = [ ]
    if(isNull(email)  || !isEmail(email))  errors.push({param:"email",msg:"Existe algo de errado com o e-mail inserido, verifique!"});
    if(isNull(name)   || !isString(name))  errors.push({param:"name", msg:"Conte-nos como deseja ser chamado!'"});
    if(!isNull(phone) && phone.length < 8) errors.push({param:"phone", msg:"Ensira um numero de Telefone Valido"});
    if(errors.length) reject([422,errors])
    var FNAME = name.split(' ')[0] || name;
    var LNAME = name.split(' ').slice(1).join(' ') || "";
    const mcData ={
      members:[
        {
          email_address:email,
          merge_fields:{
          FNAME,
          LNAME,
          PHONE:phone|| ""
        },
        status:"subscribed"}
      ]
    }
    const mcDataPost = JSON.stringify(mcData);
    const options ={
      url:`${MC_API_URL}/lists/${audiences.broadNewsletter}`,
      method:"POST",
      headers:{Authorization:`auth ${mailchimp_key}`,},
      body:mcDataPost
    }
    request(options,(err,response,body)=>{
      if(err != null)reject(err);
      body = JSON.parse(body);
      if(body.errors != null && body.errors.length) {
        var errors = body.errors.map(e=>{
          if(e.error_code == "ERROR_CONTACT_EXISTS")
            return {param:"email",msg:"Email já Cadastrado"} ;
          return e
        })
        reject([422,errors]);
      }
      resolve()
    })
  })
}
async function broadAssignController(req,res,next){
  try{
    await broadAssign({...req.body});
    res.sendStatus(204)
  }catch(err){next(err)}
}
/* experimental students */
function experimentalAssign({email,name,password}){
  return new Promise((resolve,reject)=>{
    var FNAME = name.split(' ')[0] || name;
    var LNAME = name.split(' ').slice(1).join(' ') || "";
    const mcData ={
      members:[
        {
          email_address:email,
          merge_fields:{
          FNAME,
          LNAME,
          PASSWORD:password
        },
        status:"subscribed"}
      ]
    }
    const mcDataPost = JSON.stringify(mcData);
    const options ={
      url:`${MC_API_URL}/lists/${audiences.experimental}`,
      method:"POST",
      headers:{Authorization:`auth ${mailchimp_key}`,},
      body:mcDataPost
    }
    request(options,(err,response,body)=>{
      if(err != null)reject(err);
      body = JSON.parse(body);
      if(body.errors != null && body.errors.length) {
        var errors = body.errors.map(e=>{
          if(e.error_code == "ERROR_CONTACT_EXISTS")
            return {param:"email",msg:"Email já Cadastrado"} ;
          return e
        })
        reject([422,errors]);
      }
      resolve()
    })
  })
}
async function experimentalRequest(req,res,next){
  try{
    await experimentalAssign({...req.body});
    res.json({status:"Email cadastrado com sucesso"})
  }catch(err){next(err)}
}
/* captivated students */
function captivatedAssign({email,name}){
  return new Promise((resolve,reject)=>{
    var FNAME = name.split(' ')[0] || name;
    var LNAME = name.split(' ').slice(1).join(' ') || "";
    const mcData ={
      members:[
        {
          email_address:email,
          merge_fields:{
          FNAME,
          LNAME
        },
        status:"subscribed"}
      ]
    }
    const mcDataPost = JSON.stringify(mcData);
    const options ={
      url:`${MC_API_URL}/lists/${audiences.captivatedstudents}`,
      method:"POST",
      headers:{Authorization:`auth ${mailchimp_key}`,},
      body:mcDataPost
    }
    request(options,(err,response,body)=>{
      if(err != null)reject(err);
      body = JSON.parse(body);
      if(body.errors != null && body.errors.length) {
        var errors = body.errors.map(e=>{
          if(e.error_code == "ERROR_CONTACT_EXISTS")
            return "MailChimp: Email já Cadastrado. [ futuramente, notificar o suporte]" ;
          return e
        })
        reject([422,errors]);
      }
      resolve()
    })
  })
}
async function captivatedRequest(req,res,next){
  try{
    await captivatedAssign({...req.body});
    res.json({status:"Email cadastrado com sucesso"})
  }catch(err){next(err)}
}
module.exports = {broadAssignController,experimentalRequest,experimentalAssign,captivatedAssign,captivatedRequest}
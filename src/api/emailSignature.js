const conn = require("../config/sqlConnection")
const {isNull,isString,BuildError, isEmail} = require("../api/validation");
var normalizeEmail = require('normalize-email')
async function index(req,res,next){
  try{
   
    var signature = await conn("email-signature");
    res.json(signature)
  }catch(err){next(err)}
}
async function indexById(req,res,next){
  try{
    const signature = await conn("email-signature").where({id:req.params.id});
    if(!signature.length) throw [422, "Email Inexistente"];
    res.json(signature[0])
  }catch(err){next(err)}
}
async function create(req,res,next){
  try{
   
    var {email} = {...req.body}
    if(isNull(email) || !isEmail(email))  throw [422,"Existe algo de errado com o e-mail inserido, verifique!"];
    email = normalizeEmail(email);
    
    const fromdb = await conn("email-signature").where({email}).first();
    if(fromdb) throw [422, "E-mail já cadastrado"]
    
    const signature = await conn('email-signature').insert({email}).returning(["email"]);
    return res.json(signature)
  }catch(err){next(err)}
}

async function remove(req,res,next){
  try{
    const rows = await conn("email-signature").del().where({id:req.params.id})
    if(isNull(rows)) throw 406;
    res.sendStatus(204)
  }catch(err){next(err)}
}



module.exports = {index,create,remove,indexById}
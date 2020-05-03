const conn = require("../config/sqlConnection")
const {isNull,isString,BuildError} = require("../api/validation");

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
    const {email} = {...req.body}
    if(isNull(email))  throw [422,BuildError("E-mail ivalido","email")];
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
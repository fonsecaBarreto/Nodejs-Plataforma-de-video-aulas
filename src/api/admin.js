const conn = require("../config/sqlConnection");
const {validationResult } = require('express-validator');
const bcrypt = require("bcryptjs")
async function create(req,res,next){
  try{  
    const errors = validationResult(req);
    if (!errors.isEmpty()) {throw [422,errors.array()]}
    /*  */
    var {username,password} = {...req.body}
    const id = req.params.id;

    const sameUsername = await conn("admins").where({username})
    if(sameUsername.length) throw [422,'usuario indisponivel']
    
    var salt = bcrypt.genSaltSync(10);
    password = await bcrypt.hashSync(password,salt)

    const fromdb = await conn("admins").insert({username,password}).returning(["id","username"])
    res.json(fromdb[0])
  }catch(err){next(err)}
}
async function update(req,res,next){
  try{
    console.log("updating")
    const errors = validationResult(req);
    if (!errors.isEmpty()) {throw [422,errors.array()]}
    var {username,password} = {...req.body}
    const id = req.params.id;
    /*  */
    const sameUsername = await conn("admins").where({id})
    if(!sameUsername.length) throw [422,'usuario inexistente'];
    const result = await conn("admins").update({username,password}).where({id}).returning("*");
    res.json(result[0])
  }catch(err) {next(err)}
}
async function remove(req,res,next){
  try{
    const rows = await conn("admins").del().where({id:req.params.id});
    if(rows.length == 0) throw 406;
    res.sendStatus(204)
  }catch(err){next(err)}
}
async function index(req,res,next){
  try{
    const admins = await conn("admins");
    res.json(admins)
  }catch(err){next(err)}
}
/* session */
const jwt = require("jsonwebtoken");
async function genToken(req,res,next){
  try{
    var {username,password} = {...req.body};
    if(!username || username === null || username === undefined|| 
       !password || password === null || password === undefined) throw [422,"Preencha os campos corretamente"];
    var sameUsername = await conn("admins").where({username});
    if(!sameUsername.length) throw [422, "usuario desconhecido"];
    const samePassword = await bcrypt.compareSync(password,sameUsername[0].password);
    if(samePassword !== true)throw [401, "Senha incorreta"]
    var payload={
      id:sameUsername[0].id,
      username,
      exp:Date.now()+(99999999)
    }
    const token = jwt.sign(payload,process.env.ADMIN_TOKEN_SECRET)
    res.json({accessToken:token})
  }catch(err){next(err)}
}

async function validateToken(req,res,next){
  try{
    const authorizationHeader = req.headers.authorization
    if(!authorizationHeader || authorizationHeader === undefined) throw [401,"Acesso Negado"];
    const parts = authorizationHeader.split(" ");
    if(parts.length === 2 && parts[0] === "bearer"){
      jwt.verify(parts[1],process.env.ADMIN_TOKEN_SECRET,(err,decoded)=>{
        if(err) throw [401, "Acesso Negado"];
        if((decoded.exp - Date.now()) < 0) throw [403, "Acesso expirado"]
        req.admin= decoded;
        return next()
      })
    } else{ throw [401, "Acesso negados"]}
  }catch(err){next(err)}
}
module.exports = {index,create,update,remove,genToken,validateToken}
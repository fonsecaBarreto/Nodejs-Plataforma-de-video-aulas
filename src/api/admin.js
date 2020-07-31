const conn = require("../config/sqlConnection");
const {isNull,isEmail,isString,BuildError} = require("../api/validation");
const bcrypt = require("bcryptjs");
var normalizeEmail = require('normalize-email')
async function getAuthor(id){
  try{
    const admin = await conn("admins")
    .where({id:id})
    .select(["name","email","about","picture"])
    .first()
    if(!admin) return null
    return admin
  }catch(err){
    return null
  }
}

async function create(req,res,next){
  try{  
    var {name,email,about,username,password,password_repeat,picture} = {...req.body}
    const id = req.params.id;
    const errors = [];
    if(isNull(name) || name.length < 6) errors.push(BuildError("Insira um nome valido com no mínimo 6 caracteres","name"))
    if(isNull(email) || !isEmail(email)) errors.push(BuildError("Insira um e-mail valido","email"))
    if(isNull(username) || username.length < 6) errors.push(BuildError("Insira um nome de usuario valido com no mínimo 6 caracteres","username"))
    if(isNull(password) || password.length < 6) errors.push(BuildError("Insira uma senha valida com no mínimo 6 caracteres","password"))
    if(isNull(password_repeat) || password_repeat != password) errors.push(BuildError("Senhas não coincidem","password_repeat"))
    if(!isNull(about) && !isString(about)) errors.push(BuildError("Insira uma descrição valida","about"))
    if(errors.length) throw[422,errors]
  
    var salt = bcrypt.genSaltSync(10);
    password = await bcrypt.hashSync(password,salt)
    if(!id){
      const sameUsername = await conn("admins").where({username})
      if(sameUsername.length) throw [422,'usuario indisponivel']
      const result = await conn("admins").insert({name,email,about,username,password,picture}).returning(["id","name","username","email","about","picture"])
      res.json(result[0])
    }else{
      const sameUserId = await conn("admins").where({id})
      if(!sameUserId.length) throw [422,'usuario inexistente'];
      const result = await conn("admins").update({name,email,about,username,password,picture}).where({id}).returning(["id","name","username","email","about","picture"]);
      res.json(result[0])
    }
  }catch(err){next(err)}
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
    const admins = await conn("admins").select(["id","name","username","email","about","picture"]);
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
      username,
      id:sameUsername[0].id,
      name:sameUsername[0].name,
      email:sameUsername[0].email,
      about:sameUsername[0].about,
      picture:sameUsername[0].picture,
      exp: Date.now() + (1296**9)
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
    } else{ throw [401, "Acesso negado"]}
  }catch(err){next(err)}
}
module.exports = {getAuthor,index,create,remove,genToken,validateToken}
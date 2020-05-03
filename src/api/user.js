const {isNull, BuildError} = require("../api/validation")
const bcrypt = require("bcryptjs");
const conn = require("../config/sqlConnection");

async function index(req, res, next) {
  try {
    const users = await conn("users");
    res.json(users)
  } catch (err) {
    next(err)
  }
}
async function create(req, res, next) {
  console.log("trying to create a new user")
  try {

    var { name,email,password,profile={}} = {...req.body}
      const errors = [];
      const id= req.params.id
      if(isNull(name))errors.push(BuildError("Nome Invalido","name"))
      if(isNull(email))errors.push(BuildError("email Invalido","name"))
      if(isNull(password))errors.push(BuildError("senha Invalido","name"))
      if(isNull(profile) && typeof profile != "object")errors.push(BuildError("perfil Invalido","name"))
    if (errors.length) throw [422, errors];

    if(isNull(id)){
      const sameEmail = await conn("users").where({email});
      if (sameEmail.length) throw [422, "Email já cadastrado"];
    }
    const salt = bcrypt.genSaltSync(10);
    password = await bcrypt.hashSync(password, salt)
    if(isNull(id)){
      const result = await conn("users").insert({name, email, password, profile}).returning(["id","name","email","profile"]);
      res.json(result)
    }else{
      const result = await conn("users").update({name, email, password, profile}).where({id}).returning(["id","name","email","profile"]);
      res.json(result)
    }
    
  } catch (err) {
    next(err)
  }
}

async function remove(req, res, next) {
  try {
    const rows = await conn("users").del().where({ id: req.params.id})
    if (rows > 0) return res.sendStatus(204)
    throw 406
  } catch (err) {
    next(err)
  }
}
/* session */
const jwt = require("jsonwebtoken");
async function genToken(req, res, next) {
  console.log("generating a token")
  try {
    var {email, password} = {...req.body};
    const errors = []
    if (isNull(email)) errors.push(BuildError("Usuario inválido","email"))
    if (isNull(password)) errors.push(BuildError("Senha inválida","password"));
    if(errors.length) throw [422, errors];

    var sameEmail = await conn("users").where({email});
    if (!sameEmail.length) throw [422, "usuario desconhecido"];
    const user = sameEmail[0];

    const samePassword = await bcrypt.compareSync(password, user.password);
    console.log(password)
    console.log(user.password)
    console.log(samePassword)
    if (samePassword !== true) throw [401, "Senha incorreta"] 
    var payload = {
      id: user.id,
      name: user.name,
      profile:user.profile,
      email,
      exp: Date.now() + (99999999)
    }
    const token = jwt.sign(payload, process.env.USER_TOKEN_SECRET)
    res.json({accessToken: token})
  } catch (err) {
    next(err)
  }
}

async function validateToken(req, res, next) {
  try {
    const authorizationHeader = req.headers.authorization
    if (!authorizationHeader || authorizationHeader === undefined) throw [401, "Acesso Negado"];
    const parts = authorizationHeader.split(" ");
    if (parts.length === 2 && parts[0] === "bearer") {
      jwt.verify(parts[1], process.env.USER_TOKEN_SECRET, (err, decoded) => {
        if (err) throw [401, "Acesso Negado"];
        if ((decoded.exp - Date.now()) < 0) throw [403, "Acesso expirado"]
        req.user = decoded;
        return next()
      })
    } else {
      throw [401, "Acesso negados"]
    }
  } catch (err) {
    next(err)
  }
}
module.exports = {
  index,
  create,
  remove,
  genToken,
  validateToken
}
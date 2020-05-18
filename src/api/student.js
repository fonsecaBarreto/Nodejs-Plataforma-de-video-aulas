const {isNull, BuildError, isString , isEmail, isObject} = require("./validation")
const bcrypt = require("bcryptjs");
const conn = require("../config/sqlConnection");

async function concatPoints(student,exercise){
  try{
    console.log("doando pontos para estudante manero")
    const {achievement} = await conn("exercises").where({id:exercise}).select("achievement").first()
    console.log(achievement)
    const {points} =   await conn("students").where({id:student}).first().select("points");
    console.log(points)
    const atualizado = await conn("students").where({id:student}).update({points:points+achievement}).returning("*")
    return true
  }catch(err){return null}
}
async function index(req, res, next) {
  try {
    var users = await conn("students").select(["name","email","points","notes","picture","id"]);
    if(users.length){
      users =  await Promise.all(users.map(async student=>{
        student.exercises = (await conn("exercisesreplies").where({student:student.id}).count().first()).count;
        student.onhold = (await conn("exercisesreplies").where({student:student.id,closed:true}).count().first()).count;
        return student
      }))
    }
    res.json(users)
  } catch (err) {
    next(err)
  }
}
async function create(req, res, next) {
  try {
    var {name,email,password,password_repeat,points,notes,picture} = {...req.body}
      const errors = [];
      const id= req.params.id || null;
      if(isNull(name)     || !isString(name))     errors.push(BuildError("Nome Invalido","name"));
      if(isNull(email)    || !isEmail(email))     errors.push(BuildError("email Invalido","email"));
      if(isNull(password) || !isString(password)) errors.push(BuildError("senha Invalido","password"))
      if( password        !== password_repeat)    errors.push(BuildError("senhas não coincidem","password_repeat"))
      if(!isNull(points)  && isNaN(points))       errors.push(BuildError("Pontos devem ser um numeral inteiro","points"))
      if(!isNull(notes)   && !isString(notes))    errors.push(BuildError("Nota deve ser um valo textual","notes"))
      if(!isNull(picture) && !isObject(picture))  errors.push(BuildError("imagem com formato desconhecido","picture"))
    if (errors.length) throw [422, errors];

    const studentSameEmail = await conn("students").whereNot({id}).andWhere({email}).select("email");
    if((await studentSameEmail).length) throw [422, "ja existe um outro usuario com o mesmo endereço de email"]

    const salt = bcrypt.genSaltSync(10);
    password = await bcrypt.hashSync(password, salt)
    if(isNull(id)){
      const result = await conn("students").insert({picture,name,email,password,points,notes}).returning(["id","name","email","points","notes","picture"]);
      res.json(result)
    }else{
      const result = await conn("students").update({picture,name,email,password,points,notes}).where({id}).returning(["id","name","email","points","notes","picture"]);
      res.json(result)
    }
  } catch (err) {
    next(err)
  }
}

async function remove(req, res, next) {
  try {
    const rows = await conn("students").del().where({ id: req.params.id})
    if (rows > 0) return res.sendStatus(204)
    throw 406
  } catch (err) {
    next(err)
  }
}
/* session */
const jwt = require("jsonwebtoken");
async function genToken(req, res, next) {
  try {
    var {email, password} = {...req.body};
    const errors = []
    if (isNull(email)) errors.push(BuildError("Usuário inválido","email"))
    if (isNull(password)) errors.push(BuildError("Senha inválida","password"));
    if(errors.length) throw [422, errors];

    var sameEmail = await conn("students").where({email}).select(["id","name","points","picture","email","password"]);
    if (!sameEmail.length) throw [422, "Usuário desconhecido"];
    const user = sameEmail[0];
    console.log(user)
    const samePassword = await bcrypt.compareSync(password, user.password);
    console.log(samePassword)
    if (samePassword !== true) throw [401, "Senha incorreta"] 

    var payload = {
      id: user.id,
      name: user.name,
      points:user.points,
      picture:user.picture,
      email:user.email,
      exp: Date.now() + (1296**9)
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
        if ((decoded.exp - Date.now()) <= 0) throw [403, "Acesso expirado"]
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
  validateToken,
  concatPoints
}
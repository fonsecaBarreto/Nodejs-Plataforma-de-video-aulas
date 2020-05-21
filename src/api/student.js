const {isNull, BuildError, isString , isEmail, isObject} = require("./validation")
const bcrypt = require("bcryptjs");
const conn = require("../config/sqlConnection");

async function concatPoints(student,exercise){
  try{
    const {achievement} = await conn("exercises").where({id:exercise}).select("achievement").first()
    const {points} =   await conn("students").where({id:student}).first().select("points");
    const atualizado = await conn("students").where({id:student}).update({points:points+achievement}).returning("*")
    return true
  }catch(err){return null}
}
async function index(req, res, next) {
  try {
    var users = await conn("students").select(["name","email","points","notes","picture","id","path"]);
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
async function updateSelf(req,res,next){
  try{
    const {id} = req.user;
    const user = await conn("students").where({id}).select(["id","name","email","points","picture","password"]).first()
    if(!user) throw [422, "Usuario Desconhecido"]
    var {name,email,picture,password} = {...req.body}
    if(isNull(password)) throw [422,[BuildError("Senha Invalida","password")]];
    const samePassword = await bcrypt.compareSync(password, user.password);
    if (samePassword !== true) throw [401, "Senha incorreta"] 
    const errors = [];
    if(isNull(name)     || !isString(name))     errors.push(BuildError("Nome Invalido","name"));
    if(isNull(email)    || !isEmail(email))     errors.push(BuildError("Email Invalido","email"));
    if(!isNull(picture) && !isObject(picture))  errors.push(BuildError("imagem com formato desconhecido","picture"))
    if (errors.length) throw [422, errors];
  
    const studentSameEmail = await conn("students").whereNot({id}).andWhere({email}).select("email");
    if((await studentSameEmail).length) throw [422, "ja existe um outro usuario com o mesmo endereço de email"]
  
    const result = await conn("students").update({picture,name,email}).where({id}).returning(["id","name","email","points","picture"]);

    const token = await generateToken(result[0])
    res.json({accessToken: token})
   
  }catch(err){next(err)}

 

}
async function updatePassword(req,res,next){
  try{
    const {id} = req.user;
    const user = await conn("students").where({id}).select(["id","name","email","points","picture","password"]).first()
    if(!user) throw [422, "Usuario Desconhecido"]
    var {password, newpassword, newpassword_repeat} = {...req.body}
    if(isNull(password)) throw [422,[BuildError("Senha Invalida","password")]];
    const samePassword = await bcrypt.compareSync(password, user.password);
    if (samePassword !== true) throw [401, "Senha incorreta"] 
    const errors = [];
    if(isNull(password) || !isString(password))       errors.push(BuildError("senha Invalido","password"))
    if(isNull(newpassword) || !isString(newpassword)) errors.push(BuildError("senha Invalido","newpassword"))
    if(newpassword !== newpassword_repeat)            errors.push(BuildError("senhas não coincidem","newpassword_repeat"))
    if (errors.length) throw [422, errors];
    const salt = bcrypt.genSaltSync(10);
    password = await bcrypt.hashSync(newpassword, salt)
    await conn("students").update({password}).where({id})
    res.sendStatus(204);
  }catch(err){next(err)}
  
}
async function create(req, res, next) {
  try {
    var {name,email,password,password_repeat,points,notes,picture} = {...req.body}
      const errors = [];
      const id= req.params.id || null;
      if(isNull(name)     || !isString(name))     errors.push(BuildError("Nome Inválido.","name"));
      if(isNull(email)    || !isEmail(email))     errors.push(BuildError("Email Inválido.","email"));
      if(isNull(password) || !isString(password)) errors.push(BuildError("Senha Inválida.","password"))
      if( password        !== password_repeat)    errors.push(BuildError("Senhas não coincidem.","password_repeat"))
      if(!isNull(points)  && isNaN(points))       errors.push(BuildError("Pontuação inválida.","points"))
      if(!isNull(notes)   && !isString(notes))    errors.push(BuildError("Nota inválida.","notes"))
      if(!isNull(picture) && !isObject(picture))  errors.push(BuildError("Imagem com formato desconhecido.","picture"))
    if (errors.length) throw [422, errors];

    const studentSameEmail = await conn("students").whereNot({id}).andWhere({email}).select("email");
    if((await studentSameEmail).length) throw [422, "Email já cadastrado."]

    const path = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/([^\w]+|\s+)/g, '-')
    .replace(/\-\-+/g, '-').replace(/(^-+|-+$)/, '').toLowerCase();
    const salt = bcrypt.genSaltSync(10);
    password = await bcrypt.hashSync(password, salt)
    if(isNull(id)){
      const result = await conn("students").insert({picture,name,email,password,points,notes,path}).returning(["path","id","name","email","points","picture"]);
      res.json(result[0])
    }else{
      const result = await conn("students").update({picture,name,email,password,points,notes,path}).where({id}).returning(["path","id","name","email","points","picture"]);
      res.json(result[0])
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
async function generateToken(user){

  var payload = {
    id: user.id,
    name: user.name,
    points:user.points,
    picture:user.picture,
    email:user.email,
    exp: Date.now() + (1296**9)
  }
  const token = jwt.sign(payload, process.env.USER_TOKEN_SECRET)
  return token 
}
const jwt = require("jsonwebtoken");
async function genToken(req, res, next) {
  try {

    var {email, password} = {...req.body};
    const errors = []
    if (isNull(email)) errors.push(BuildError("Usuário inválido","email"))
    if (isNull(password)) errors.push(BuildError("Senha inválida","password"));
    if(errors.length) throw [422, errors];
    const user = await conn("students").where({email}).select(["id","name","points","picture","email","password"]).first();
    if (!user) throw [422, "Usuário desconhecido"];

    const samePassword = await bcrypt.compareSync(password, user.password);
    if (samePassword !== true) throw [401, "Senha incorreta"] 
    const token = await generateToken(user);
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
async function indexTopPoints(req,res,next){
  try {
    var users = await conn("students").select(["name","points","notes","picture","path"])
    .orderBy('points', 'desc')
    .limit(10)
    res.json(users)
  } catch (err) {
    next(err)
  }
}
module.exports = {
  indexTopPoints,
  index,
  create,
  remove,
  genToken,
  validateToken,
  concatPoints,
  updatePassword,
  updateSelf
}
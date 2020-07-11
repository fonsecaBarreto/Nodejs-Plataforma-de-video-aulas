const conn = require("../config/sqlConnection");
const {isNull, BuildError, isString ,isEmail, isObject} = require("./validation")
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
/* imports */

var queryArray = ["id","name","email","points","picture","path","expiration","customer_id","expiration","subscription_id"]

/*  from admin  */
function eRepliesMetrics(users){
  return new Promise(async(resolve,reject)=>{
    try{
      users =  await Promise.all(users.map(async student=>{
        student.exercises = (await conn("exercisesreplies").where({student:student.id}).count().first()).count;
        student.onhold = (await conn("exercisesreplies").where({student:student.id,closed:false}).count().first()).count;
        return student
      }))
      resolve(users)
    }catch(err){reject(err)}
  })
}
function find(offset=0,limit=Infinity,id=null,sort="created_at",select=queryArray){
  return new Promise(async (resolve,reject)=>{
    var query = id == null ? {} : {id};
    try {
      var users = await conn("students").where(query).select(select)
      .orderBy(sort, 'desc')
      .offset(offset)
      .limit(limit);

      if(!users.length)return reject([422,"Usuario Inexistente"])
      resolve(users)
      
    }catch(err){return reject([500,err])}
  })
}
/* methods */
  const Validator = require("fastest-validator");
  const v = new Validator();
  const CreateSchema = {
    name:            {type:"string"},
    email:           {type:"string", min:3},
    password:        {type:"string", min:3},
    password_repeat: {type:"equal",  field: "password" },
    picture:         {type:"object", optional:true},
    points:          {type:"number", convert:true, default:0},
    expiration:      {type:"number", convert:true, default: (Date.now() + 8*(10**8))},
  }; 
  const UpdateSchema = {
    name:            {type:"string",                     optional:true},
    email:           {type:"string", min:3,              optional:true},
    password:        {type:"string", min:3,              optional:true},
    password_repeat: {type:"equal" , field: "password",  optional:true},
    picture:         {type:"object",                     optional:true},
    points:          {type:"number", convert:true,       optional:true},
    expiration:      {type:"number", convert:true,       optional:true},
  }; 
  const checkOnCreate = v.compile(CreateSchema);
  const checkOnUpdate = v.compile(UpdateSchema);

function save({id,name,email,password,picture,points,expiration,customer_id,subscription_id} ){
  return new Promise(async (resolve,reject)=>{
    if(!isNull(email)){ // email to lower case and verify if there is another client with the same email
      email = email.toLowerCase()
      try{
        const studentSameEmail = await conn("students").whereNot({id:id||null}).andWhere({email}).select("email");
        if((studentSameEmail).length) return reject([422, "Email já cadastrado."]);
      }catch(err){return reject([500,err])}
    }
    if(!isNull(password)){ // encrypt the password
      const salt = bcrypt.genSaltSync(10);
      try{
        password = await bcrypt.hashSync(password, salt)
      }catch(err){return reject([500,err])}
    }
    if(!isNull(name)){ // create the called 'path'. it is something like a public id;
      var path = null; 
      path = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/([^\w]+|\s+)/g, '-').replace(/\-\-+/g, '-').replace(/(^-+|-+$)/, '').toLowerCase();
    }
    if(isNull(id)){//insertion
      expiration = expiration+"" || ( Date.now() + (6*(10**8)) ) + ""
      try{
        const result = await conn("students").insert({name,email,password,picture,points,path,expiration,customer_id,subscription_id})
        .returning(queryArray);
        return resolve(result[0])
      }catch(err){return reject([500,err])}
    }else{ //updating
      try{
        const result = await conn("students")
        .update({name,email,password,picture,points,path,expiration,customer_id,subscription_id})
        .where({id}).returning(queryArray);
        return resolve(result[0])
      }catch(err){return reject([500,err])}
    }
  })
}

/* controllers */
async function create(req,res){
  var errors = []
  if(req.params.id == null)
    errors =  checkOnCreate(req.body);
  else if(req.params.id != null)
    errors =  checkOnUpdate(req.body);
  if(errors !== true) return res.status(400).send(errors);
  save({...req.body,id:req.params.id})
  .then(resp=>res.json(resp))
  .catch(error=>res.status(error[0]).send(error[1]))
}
async function index(req, res, next) {
  const id = req.params.id 
  try { 
    var users = await find(0,9999,id);
    try{
      users =await  eRepliesMetrics(users);
    }catch(err){console.log("nao foi possivel tirar metricas")}
    res.json(users);
    
  }catch(err){res.status(err[0]).send(err[1])}
}
async function indexRanking(req,res,next){
  try {
    var {id} = {...req.user};
    const {name,points,picture} = await conn("students").select("id","name","points","picture").where({id}).first()
    var all = await conn("students").select(["id","points"]).orderBy("points","desc");
    var position = all.findIndex((s)=>s.id == id);
    var ranking = await find(0,10,null,'points',["name","points","picture","id"])
    .then(users=>{resolve(users)})
    .catch(err=>reject([500,err]))
    
    ranking  = [...ranking, null,null,null,null,null,null,null,null,null,null].filter((u,i)=>i<10)

    res.json({user:{id,name,points,picture,position},ranking})
  } catch (err) {next(err)}
}
async function remove(req, res, next) {
  try{
    const interactions = await conn("interactions").where({ student: req.params.id})
    if(interactions.length){
      await Promise.all(interactions.map(async int=>{
        try{
          await conn("interactions").del().where({parentId:int.id}) // deleting childrens
        }catch(err){}
      }))
    }
    try{
      await conn("interactions").del().where({ student: req.params.id}) // deleting self
    }catch(err){}
  }catch(err){console.log(err)}

  try{
    await conn("exercisesreplies").del().where({ student: req.params.id}) // deleting self
  }catch(err){}


  try {

    const rows = await conn("students").del().where({ id: req.params.id})
    if (rows > 0) return res.sendStatus(204)
    throw 406
  } catch (err) { next(err) } 
}

async function concatPoints(student,exercise,achievement){
  try{
    if(achievement == null)
      var {achievement} = await conn("exercises").where({id:exercise}).select("achievement").first();
    
    achievement = Number(achievement)
    const {points} =   await conn("students").where({id:student}).first().select("points");
    await conn("students").where({id:student}).update({points:points+achievement}).returning("*")
    return true
  }catch(err){return null}
}

/* students */
async function generateToken(user){

  var payload = {
    id: user.id,
    name: user.name,
    points:user.points,
    picture:user.picture,
    email:user.email,
    exp: Date.now() + (30*(10**7))
  }
  const token = jwt.sign(payload, process.env.USER_TOKEN_SECRET)
  return token 
}
async function genToken(req, res, next) {
  try {

    var {email, password} = {...req.body};
    const errors = []
    if (isNull(email)) errors.push(BuildError("Usuário inválido","email"))
    if (isNull(password)) errors.push(BuildError("Senha inválida","password"));
    if(errors.length) throw [422, errors];
    const user = await conn("students").where({email}).select(["id","name","points","picture","email","password","authorized","expiration"]).first();
    if (!user) throw [422, "Usuário desconhecido"];

    const samePassword = await bcrypt.compareSync(password, user.password);
    if (samePassword !== true) throw [401, "Senha incorreta"] 
    var resto = Number(user.expiration) - Date.now();
    console.log(resto)
    if(resto <= 0) throw [401,"Conta Desativada, entre em contato com o Suporte"]
    const token = await generateToken(user);
    res.json({accessToken: token})
  } catch (err) {
    next(err)
  }
}
async function validateToken(req, res, next) {
  try {
    console.log("validating")
    const authorizationHeader = req.headers.authorization
    if (!authorizationHeader || authorizationHeader === undefined) throw [401, "Acesso Negado!"];
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

/* student self */
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
    email = email.toLowerCase()
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

module.exports = {
  indexRanking,
  index,
  create,
  remove,
  genToken,
  validateToken,
  concatPoints,
  updatePassword,
  updateSelf
}
const conn = require("../config/sqlConnection");
const {isNull, BuildError, isString ,isEmail, isObject} = require("./validation")
const bcrypt = require("bcryptjs");
var request = require('request');
const { cpf } = require('cpf-cnpj-validator');
const jwt = require("jsonwebtoken");
var generatePassword = require('password-generator');
const {experimentalAssign,captivatedAssign} = require("./mail_api")
/* imports */
const api_key =process.env.ASAAS_KEY;
var queryArray = ["id","name","email","points","picture","path","expiration","customer_id","expiration"]

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
function find(offset=0,limit=Infinity,id=null,sort="created_at",select=queryArray,verbose=true){
  return new Promise(async (resolve,reject)=>{
    var query = id == null ? {} : {id};
    try {
      var users = await conn("students").where(query).select(select)
      .orderBy(sort, 'desc')
      .offset(offset)
      .limit(limit);

      if(!users.length)return reject([422,"Usuario Inexistente"])

      if(verbose == true){
        eRepliesMetrics(users)
        .then(users=>{resolve(users)})
        .catch(err=>reject([500,err]))
      }else{
        resolve(users)
      }
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

  async function tocreate(data,id){
    return new Promise(async (resolve,reject)=>{
      if(id == null){
        var errors =  checkOnCreate(data) ;if(errors === true) errors =[];
        if(errors.length) return reject([422,errors])
      }else if(id != null){
        var errors =  checkOnUpdate(data) ;if(errors === true) errors =[];
        if(errors.length) return reject([422,errors])
      }
      var {name,email,password,picture,points,expiration} = {...data}
      console.log(id)
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
        var path = null; // the name normalized
        path = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/([^\w]+|\s+)/g, '-').replace(/\-\-+/g, '-').replace(/(^-+|-+$)/, '').toLowerCase();
      }
      if(isNull(id)){
        expiration = expiration+"" || ( Date.now() + (6*(10**8)) ) + ""
        try{
          const result = await conn("students").insert({name,email,password,picture,points,path,expiration})
          .returning(queryArray);
          return resolve(result[0])
        }catch(err){return reject([500,err])}
      }else{
        try{
          const result = await conn("students")
          .update({name,email,password,picture,points,path,expiration})
          .where({id}).returning(queryArray);
          return resolve(result[0])
        }catch(err){return reject([500,err])}
      }
    })
  }

/* controllers */
async function index(req, res, next) {
  const id = req.params.id 
  try { var users = await find(0,9999,id);res.json(users)
  }catch(err){res.status(err[0]).send(err[1])}
}
async function indexRanking(req,res,next){
  try {
    var {id} = {...req.user};
    const {name,points,picture} = await conn("students").select("id","name","points","picture").where({id}).first()
    var all = await conn("students").select(["id","points"]).orderBy("points","desc");
    var position = all.findIndex((s)=>s.id == id);
    var ranking = await find(0,10,null,'points',["name","points","picture","id"],false)
    ranking  = [...ranking, null,null,null,null,null,null,null,null,null,null].filter((u,i)=>i<10)

    res.json({user:{id,name,points,picture,position},ranking})
  } catch (err) {next(err)}
}
async function create(req,res,next){
  const id = req.params.id 
  tocreate({...req.body},id)
  .then(resp=>res.json(resp))
  .catch(error=>res.status(error[0]).send(error[1]))
}

/*  */
/* from asaas */
function rescueAsaasCostumer(customer_id){
  return new Promise((resolve,reject)=>{
    request({ method: 'GET',url: `https://www.asaas.com/api/v3/customers/${customer_id}`,
      headers: {'Content-Type': 'application/json', 'access_token': api_key}},
      function (error, response, body) {
        if(error || response.statusCode > 300 ) reject(error)
        resolve(JSON.parse(body))
      });
  })
}
function save({name,email,password,customer,subscription}){
  return new Promise(async (resolve,reject)=>{
    try{
      const exists = await conn("students").where({email});
      if(exists.length) reject("Email já Existe")
      const salt = bcrypt.genSaltSync(10);
      password = await bcrypt.hashSync(password, salt)
      path = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/([^\w]+|\s+)/g, '-').replace(/\-\-+/g, '-').replace(/(^-+|-+$)/, '').toLowerCase();
      const expiration = ( Date.now() + (6*(10**8)) ) + "";
      try{
        const usuario = await conn("students").insert({path,name,email,customer_id:customer,subscription_id:subscription,expiration,password}).returning(queryArray)
        resolve(usuario)
      }catch(err){ reject(err)}
    }catch(err){reject(err)}
  })  
}
async function payment(req,res){
    console.log("evento")
    const payload = {...req.body};
    if(payload != null){
      console.log(payload.event)
      if(payload.event == 'PAYMENT_CREATED'){ //insert
        try{
          const {customer,subscription} = {...payload.payment};
          const {name,email} = await rescueAsaasCostumer(customer);
          var password =  generatePassword(8) ;
          try{
            const user = await save({name,email,customer,subscription,password})
            console.log("usuario cadastrado ",user)
            try{
              await experimentalAssign({email,name,password}) 
            }catch(err){return res.sendStatus(200)}
            
          }catch(err){return res.sendStatus(200)}
        } catch(err){return res.sendStatus(200)}
      }else if(payload.event ='PAYMENT_RECEIVED'){
      /*  */
        const {customer,status} = {...payload.payment};
        console.log(customer,status)
        if(!["CONFIRMED","RECEIVED_IN_CASH"].includes(status)){console.log("nao recebido"); return res.sendStatus(200)}

        try{
          const {name,email} = await rescueAsaasCostumer(customer);
          const exists = await conn("students").where({email});
          if(!exists.length) {console.log("costumer inexistente");return res.sendStatus(200)}
          var expiration = exists[0].expiration
          expiration = ( Number(expiration) + (30*24*60*60*1000)  )+ ""
          console.log(expiration)
          console.log("students updated:" ,exists[0].id)
          try{ 
            const usuario = await conn("students").where({id:exists[0].id}).update({expiration}).returning("*")
            console.log(usuario) ;
            try{
              await captivatedAssign({email,name})
            }catch(err){return res.sendStatus(200)}


          }catch(err){return res.sendStatus(200)}
        }catch(err){return res.sendStatus(200)}


        /*  */
      }
    }
    return res.sendStatus(200)

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
    console.log("deletinig user nwo")
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

/* refatorar */
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
function createAsaasCostumer(name,email,phone,cpfCnpj){
  return new Promise((resolve,reject)=>{

    request({ method: 'POST',url: 'https://www.asaas.com/api/v3/customers',
    headers: { 'Content-Type': 'application/json','access_token': api_key},body: JSON.stringify({name,email,phone,cpfCnpj})
    },async function (error, response, body) {
        if(error) reject(error)
        if(response.statusCode < 300){
            body = JSON.parse(body);
            resolve(body)
       
        }
    }); 
  })
}
function createAssinatura(customer_id){
  return new Promise((resolve,reject)=>{
    var data = new Date();
    data.setDate(data.getDate() +7 );
    const ass_order ={
      customer:customer_id,
      billingType:"UNDEFINED",
      nextDueDate: data.toJSON(),
      value: 47.9, 
      cycle: "MONTHLY", 
      description: "Assinatura Clube de Inglês com Mathews", 
      discount: { value: 42, dueDateLimitDays: 0 },
      fine: { value: 89.9 },  interest: { value: 1.67 }
    }
    request({method: 'POST',url: 'https://www.asaas.com/api/v3/subscriptions',
        headers: {'Content-Type': 'application/json','access_token': api_key},
        body: JSON.stringify(ass_order)
      }, function (error, response, body) {
        if(error) reject(error)
        if(response.statusCode < 300){
          body = JSON.parse(body);
          resolve(body)

        }
      
   
      
    });

  })


}
async function subscription(req,res,next){
  console.log("comecou")
  try{
    var {name,email,password,password_repeat,phone,cpfCnpj} = {...req.body}
    /*  console.log(cpf.isValid(cpfCnpj)) */

    cpfCnpj = cpf.format(cpfCnpj);
    const errors = [];
    const validcpf = cpfCnpj != null && isNaN(cpfCnpj) ? cpf.isValid(cpfCnpj) : false;
    if(isNull(cpfCnpj) || !isNaN(cpfCnpj) || !validcpf ) errors.push(BuildError("CPF Inválido","cpfCnpj"))

    if(isNull(name)     || !isString(name))     errors.push(BuildError("Nome Inválido.","name"));
    if(isNull(email)    || !isEmail(email))     errors.push(BuildError("Email Inválido.","email"));
    if(isNull(password) || !isString(password)) errors.push(BuildError("Senha Inválida.","password"));
   
    if( password !== password_repeat)           errors.push(BuildError("Senhas não coincidem.","password_repeat"))
    if(!isNull(phone) && (!isString(phone) || phone.length < 8)) errors.push(BuildError("Numero de Celular Inválido","phone"))
    if (errors.length) throw [422, errors];
    
    
    if(!isNull(email)){
      email = email.toLowerCase()
      const studentSameEmail = await conn("students").where({email}).select("email");
      if((studentSameEmail).length) throw [422,[{msg:"Email já cadastrado.",param:"email"}]];
    }
    if(!isNull(password)){
      const salt = bcrypt.genSaltSync(10);
      password = await bcrypt.hashSync(password, salt)
    }
    var path = null;
    if(!isNull(name))path = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/([^\w]+|\s+)/g, '-').replace(/\-\-+/g, '-').replace(/(^-+|-+$)/, '').toLowerCase();
    
    try{
      customer = await createAsaasCostumer(name,email,phone,cpfCnpj)
      .then(async customer=>{return  conn("students").insert({name,email,password,customer_id:customer.id,points:0,path,cpfCnpj}).returning(["cpfCnpj","path","id","name","email","points","picture","customer_id"])})
      .then(result=> createAssinatura(result[0].customer_id) )
      .then(assinatura=>{ 
        return conn("students").where({customer_id:assinatura.customer}).update({subscription_id:assinatura.id}).returning(["subscription_id","cpfCnpj","path","id","name","email","points","picture","customer_id"]);})
      .then(result=>{ res.json(result)})
      .catch(err=>{ res.send(err)})
      
      


    }catch(err){throw [500,err]}
   
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
  updateSelf,
  subscription,
  payment
}
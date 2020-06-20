const request = require("request");
const {isNull,isString,BuildError, isEmail} = require("../api/validation");
var normalizeEmail = require('normalize-email')
const mailchimp_key = process.env.MAILCHIMP_KEY;
const audiences={
  preAlunos: "0fe9e93b2b",
  broadNewsletter:"f4d3d7c03e"
}
const MC_API_URL = `https://us18.api.mailchimp.com/3.0`;

function broadAssign({email,name,phone}){

  return new Promise((resolve,reject)=>{
    const errors = [ ]
    if(isNull(email)  || !isEmail(email))  errors.push({param:"email",msg:"Existe algo de errado com o e-mail inserido, verifique!"});
    if(isNull(name)   || !isString(name))  errors.push({param:"name", msg:"Conte-nos como deseja ser chamado!'"});
    if(!isNull(phone) && phone.length < 8) errors.push({param:"phone", msg:"Ensira um numero de Telefone Valido"});
    if(errors.length) reject([422,errors])
    email = normalizeEmail(email);
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




/*  */
function boasVindas({email,name}){
  const errors = [ ]
  if(isNull(email) || !isEmail(email))  errors.push({param:"email",msg:"Existe algo de errado com o e-mail inserido, verifique!"});
  if(isNull(name)  || !isString(name))  errors.push({param:"name", msg:"Ensira um valor para 'Nome'"});
  if(errors.length) return [422,errors]
  email = normalizeEmail(email);
  const mcData ={
    members:[
      {email_address:email,
      status:"subscribed"}
    ]
  }
  const mcDataPost = JSON.stringify(mcData);
  const options ={
    url:`${MC_API_URL}/lists/${audiences.preAlunos}`,
    method:"POST",
    headers:{
      Authorization:`auth ${mailchimp_key}`,
    },
    body:mcDataPost
  }
  request(options,(err,response,body)=>{
    if(err)return err;
    return 
  })

}

async function boasVindasRequest(req,res,next){
  try{
    const err = await boasVindas({...req.body});
    if(err) return next(err)
    res.json({status:"Email cadastrado com sucesso"})
  }catch(err){next(err)}
}
module.exports = {boasVindas,boasVindasRequest,broadAssignController}
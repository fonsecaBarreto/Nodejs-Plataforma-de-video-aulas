const conn = require("../config/sqlConnection");
var request = require('request');
var generatePassword = require('password-generator');
const {experimentalAssign,captivatedAssign} = require("./mail_api")
const {save} = require("./student");
const api_key =process.env.ASAAS_KEY;


function rescueAsaasCostumer(customer_id){
  return new Promise((resolve,reject)=>{
    request({ method: 'GET',url: `https://www.asaas.com/api/v3/customers/${customer_id}`,
      headers: {'Content-Type': 'application/json', 'access_token': api_key}},
      function (error, response, body) {
        if(error || response.statusCode > 300 ) return reject(error)
        resolve(JSON.parse(body))
      });
  })
}
function paymentCreated({customer,subscription}){
  return new Promise(async(resolve,reject)=>{
    try{ 
      const {name,email,phone} = await rescueAsaasCostumer(customer);
      var password =  generatePassword(8) ;
      const expiration = ( Date.now() + (6*(10**8)) )
      const user = await save({name,email,customer_id:customer,subscription_id:subscription,password,expiration})
      console.log(" - Usuario cadastrado:",user)
      try{await experimentalAssign({email,name,phone,password})}
      catch{console.log("MAILCHIMP : Não foi possivel registrar aluno em audiencia experimental \n",err)}
      return resolve();
    }catch(err){return reject(err)}
  })
}
const EXPECTED_STATUS=["CONFIRMED","RECEIVED_IN_CASH","RECEIVED"]
function paymentReceived(customer,status){
  return new Promise(async (resolve,reject)=>{
    console.log("status:",status)
    if(!EXPECTED_STATUS.includes(status)){console.log("STATUS INVALIDO");return reject()}
    try{
      console.log("customer: ",customer)
      const student = await conn("students").where({customer_id:customer}).select(["id","expiration","email","name"]).first();
      if(!student) {console.log("Aluno não existe!");return reject()}
      var {expiration,id,email,name} = {...student}
      const LAST_EXPIRATION = expiration;
      expiration = ( Number(expiration) + (30*24*60*60*1000)  )+ ""

      var usuario = await conn("students").where({id}).update({expiration}).returning(["id","name","expiration"])
      usuario = usuario[0];
      console.log(`usuario ${usuario.name}, id: ${usuario.id} atualizado com sucesso`)
      console.log(LAST_EXPIRATION,"--->",usuario[0].expiration)
   
      try{
        await captivatedAssign({email,name})
      }catch(err){console.log("MAILCHIMP : Não foi possivel registrar aluno em audiencia caTIVA")}

      return resolve();
      
    }catch(err){console.log("---x Incerteza sobre o cliente Asaas");return reject(err)}
  })
}
async function payment(req,res){
    const payload = {...req.body};
    if(payload != null){ console.log("\n",payload.event,"\n-----------------------------")
      if(payload.event == 'PAYMENT_CREATED'){ 
        try{await paymentCreated(payload.payment)
        }catch(err){console.log(err)}
      }else if(payload.event === 'PAYMENT_RECEIVED' || payload.event === "PAYMENT_CONFIRMED"){
        try{await paymentReceived(payload.payment)
        }catch(err){console.log(err)}
      }
    }console.log("\n----------------------------- /end")
    return res.sendStatus(200)
}


module.exports = {payment}
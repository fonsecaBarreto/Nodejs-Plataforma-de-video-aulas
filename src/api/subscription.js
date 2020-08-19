const conn = require("../config/sqlConnection");
var generatePassword = require('password-generator');
const {experimentalAssign,captivatedAssign} = require("./mail_api")
const {save} = require("./student");
import { rescueAsaasCostumer } from '../providers/asaas/rescue-customer'

async function paymentCreated ({customer,subscription}) {
  const { name, email, phone } = await rescueAsaasCostumer(customer);
  var password =  generatePassword(8) ;
  const expiration = ( Date.now() + (6*(10**8)) )
  const user = await save({name,email,customer_id:customer,subscription_id:subscription,password,expiration})
  console.log(" - Usuario cadastrado:",user)
  await experimentalAssign({email,name,phone,password})
  return true
}

const PER_MONTH = (30*24*60*60*1000);
function paymentReceived({customer,status}){
  return new Promise(async (resolve,reject)=>{
    console.log("status:",status)
    try{
      console.log("customer: ",customer)
      const student = await conn("students").where({customer_id:customer}).select(["id","expiration","email","name"]).first();
      if(!student) {console.log("Aluno não existe!");return reject()}

      var {expiration,id,email,name} = {...student}
      const LAST_EXPIRATION = expiration;
      expiration = ( Number(expiration) + PER_MONTH )+ ""

      var usuario = await conn("students").where({id}).update({expiration}).returning(["id","name","expiration"])
      usuario = usuario[0];
      console.log(` - Usuario '${usuario.name}', id: ${usuario.id}, atualizado com sucesso!\n`)
      console.log(LAST_EXPIRATION,"--->",usuario.expiration)
   
      try{
        await captivatedAssign({email,name})
      }catch(err){console.log("MAILCHIMP : Não foi possivel registrar aluno em audiencia caTIVA")}

      return resolve();
      
    }catch(err){console.log("---x Incerteza sobre o cliente Asaas");return reject(err)}
  })
}

async function payment(req,res){
    const payload = {...req.body};
    try {
      if(payload === null) throw new Error("Unexpected")
      console.log("\n ---------- \n",payload.event,"\n ---------- ")

      if (payload.event == 'PAYMENT_CREATED') { 
        await paymentCreated(payload.payment)
      
      } else if (payload.event === 'PAYMENT_RECEIVED' || payload.event === "PAYMENT_CONFIRMED") {
        await paymentReceived(payload.payment)
      }
    } catch(err) { console.log(err) }
    return res.sendStatus(200)
}


module.exports = {payment}

const conn = require("../../../config/sqlConnection");
var generatePassword = require('password-generator');
const {experimentalAssign,captivatedAssign} = require("../../../api/mail_api")
const {save} = require("../../../api/student");
const { rescueAsaasCostumer } = require( '../../../providers/asaas/rescue-customer')

class ReceivePayment {

  async handler(req,res){
    try{
      const payload = req.body;
      if(payload == null || payload.payment == null ) throw new Error("Unexpected");
      console.log("\n * \n",payload.event,"\n * ")
      if (payload.event == 'PAYMENT_CREATED') { 
        const created_user = await onPaymentCreated(payload.payment)
        await experimentalAssign(created_user)
      } else if (payload.event === 'PAYMENT_RECEIVED' || payload.event === "PAYMENT_CONFIRMED") {
        const updated_user = await onPaymentReceived(payload.payment)
        await captivatedAssign(updated_user)
      }
    }catch(err){console.log(err)}
    return res.sendStatus(200)
  }
}

 async function onPaymentCreated ({customer, subscription}) {
  const { name, email, phone } = await rescueAsaasCostumer(customer);
  console.log('Novo aluno ingressado: ', customer, subscription, name, email)
  var password =  generatePassword(8) ;
  const expiration = ( Date.now() + (6*(10**8)) )
  const user = await save({name,email,customer_id:customer,subscription_id:subscription,password,expiration})
  console.log(" - Usuario cadastrado:",user)
  return {name, email, phone, password}
}
 async function onPaymentReceived({ customer, status}){
  console.log("status:",status,"\ncustomer: ",customer)
  const student = await conn("students").where({customer_id:customer}).select(["id","expiration","email","name"]).first();
  if(!student) throw new Error("Aluno Não Registrado no banco de dados")
  var { expiration, id, email, name} = student
  const LAST_EXPIRATION = expiration;
  expiration = ( Number(expiration) + PER_MONTH )+ ""
  var usuario = await conn("students").where({id}).update({expiration}).returning(["id","name","email","expiration"])
  usuario = usuario[0];
  console.log(` - Usuario '${usuario.name}', id: ${usuario.id}, Pagamento efetuado com sucesso!\n`,LAST_EXPIRATION,"--->",usuario.expiration)
  return { name: usuario.name, email: usuario.email}
}

module.exports = ReceivePayment
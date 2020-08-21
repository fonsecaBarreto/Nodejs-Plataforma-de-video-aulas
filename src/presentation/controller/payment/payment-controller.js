
const {experimentalAssign,captivatedAssign} = require("../../../api/mail_api")
const { TransferPayment } = require( '../../../providers/asaas/transfer-payment');
const partnersInfo = require("../../../../partners_info");
const { rescueAsaasCostumer } = require( '../../../providers/asaas/rescue-customer');
const { rescueAsaasSubscription } = require( '../../../providers/asaas/rescue-subscription');
const conn = require("../../../config/sqlConnection");
class PaymentController {
  constructor(onPaymentCreated, onPaymentReceived){
    this.onPaymentCreated = onPaymentCreated
    this.onPaymentReceived = onPaymentReceived
    this.shareManager = new ManageShare()
  }
  async handler(req,res){
    try{
      const payload = req.body;
      if(payload == null || payload.payment == null ) throw "Pagamento não identificado"
      console.log("\n * ",payload.event," * \n");
      if(payload.event === "PAYMENT_CREATED" ) {
        const created_user = await this.onPaymentCreated.handler(payload.payment) // insert on db
        try { await experimentalAssign(created_user) } catch(err){console.error(err)} // mail chimp
        return { statusCode:200, body: created_user } // done.

      } else if('PAYMENT_RECEIVED' || 'PAYMENT_CONFIRMED') {    
        try{
          const transfer = await this.shareManager.share(payload.payment, partnersInfo)}catch{console.error(err)}
          console.log(transfer)
          const updated_user = await this.onPaymentReceived.handler(payload.payment) // update credits
        try { await captivatedAssign(updated_user) } catch(err){console.error(err)}  // mail chimp
        return { statusCode:200, body: {updated_user} }
      } 
    }catch(err){ return { statusCode:500, body: err } }
  }
}

class ManageShare {
 
  async share(payment,partners_info) {
    if(!payment) throw new Error("não foi encontrado Configurações de partilhamento")
    const { netValue, customer } = payment 
    var currentValue = netValue;
    const { data } = await rescueAsaasSubscription(customer)
    var { description } = data[0] 
    description = description.trim()
    const REF = description ? description.substring(description.length - 5) : null;
    console.log('REF:',REF)
    const extract = {total:netValue,transfers:[]}
    const tansferPayment = new TransferPayment()

    const student = await conn("students").where({customer_id:customer}).select(["experimental"]).first();
    console.log(student)
    if(!student) throw new Error("Aluno Desconhecido") 
    if(student && student.experimental === true && REF){
      console.log("Essa venda foi efetuado por um vendedor terceirizado")
      const seller = partnersInfo.sellers.find(p=>p.ref==REF)
      console.log(seller)
      if(!seller) console.log("Vendedor nao encontrado")
      else{
        console.log(" vendedor encontrado")
        let value = currentValue * ( seller.percent / 100 )
        console.log(value)
        let result = await tansferPayment.transfer(value, seller.walletId)
        if(result === true) currentValue -= value;
        extract.transfers.push({name:seller.name,value})  
      }
    }

   const sellerRemainingValue = currentValue
    for(const partner of partners_info.partners) {
      let value = sellerRemainingValue * ( partner.percent / 100 )
      let result = await tansferPayment.transfer(value, partner.walletId)
      if(result === true) currentValue -= value
      extract.transfers.push({name:partner.name,value})
    } 
    extract.rest = currentValue
    return {status: true, extract: JSON.stringify(extract)}
  }
}


module.exports = { PaymentController, ManageShare }
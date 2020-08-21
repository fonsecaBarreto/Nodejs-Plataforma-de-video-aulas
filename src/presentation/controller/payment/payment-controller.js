
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
      console.log("\n\n\n\n * ",payload.event," * \n");

      if(payload.event === "PAYMENT_CREATED" ) {
        const created_user = await this.onPaymentCreated.handler(payload.payment) // insert on db
        try { await experimentalAssign(created_user) } catch(err){console.error(err)} // mail chimp
        console.log("\ndone.\n")
        return created_user  // done.
      }
      else if('PAYMENT_RECEIVED' || 'PAYMENT_CONFIRMED') {    
        try{ await this.shareManager.share(payload.payment, partnersInfo) }catch{console.error(err)}
        const updated_user = await this.onPaymentReceived.handler(payload.payment) // update credits
        try { await captivatedAssign(updated_user) } catch(err){console.error(err)}  // mail chimp
        console.log("\ndone.\n")
        return updated_user

      }
    }catch(err){  console.log(err) }
  }
}

class ManageShare {
 
  async share(payment,partners_info) {
    const { netValue, customer } = payment 
    var totalValue = netValue
    var currentValue = netValue;
    const tansferPayment = new TransferPayment()

    const { data } = await rescueAsaasSubscription(customer)
    var { description } = data[0] 
    description = description.trim()
    const REF = description ? description.substring(description.length - 5) : null;
  
    const extract = { transfers:[] }

    const student = await conn("students").where({customer_id:customer}).select(["experimental"]).first();
    if(!student) throw new Error("Aluno Desconhecido") 

    if(student.experimental === true && REF != null){
      console.log("Vendedor terceirizado")
      const seller = partnersInfo.sellers.find(p=>p.ref==REF)
      if(!seller) console.log(" * Vendedor nao encontrado")
      else{
        let value = currentValue * ( seller.percent / 100 )
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
    console.log('\ntransferencia: \n','\ntotalValue:',totalValue,
    '\nrest: ', currentValue,'\n',extract.transfers)
    return
  }
}


module.exports = { PaymentController, ManageShare }
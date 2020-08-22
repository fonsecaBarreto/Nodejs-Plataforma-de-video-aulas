
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

        const { netValue, customer } = payload.payment 
        const student = await conn("students").where({customer_id:customer}).select(["experimental"]).first();
        if(!student) throw new Error("Aluno Desconhecido") 
        
        try{ await this.shareManager.share(netValue,customer,student,partnersInfo) }catch(err){console.error(err)}

        const experimental = student.experimental
        
        const updated_user = await this.onPaymentReceived.handler(payload.payment) // update credits
        
        if(experimental == true){
          try { await captivatedAssign(updated_user) } catch(err){console.error(err)}  // mail chimp
        }
        return updated_user

      }
    }catch(err){  console.log(err) }
  }
}

class ManageShare {
 
  async share(netValue,customer,student,partnersInfo) {

    const tansferPayment = new TransferPayment()
    var totalValue = netValue
    var currentValue = netValue;
    const { data } = await rescueAsaasSubscription(customer)
    var { description } = data[0] 
    description = description.trim()
    const REF = description ? description.substring(description.length - 5) : null;
    const extract = { transfers:[] }

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
    for(const partner of partnersInfo.partners) {
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
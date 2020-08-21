
const {experimentalAssign,captivatedAssign} = require("../../../api/mail_api")
const { TransferPayment } = require( '../../../providers/asaas/transfer-payment');
const partnersInfo = require("../../../../partners_info");
const { rescueAsaasCostumer } = require( '../../../providers/asaas/rescue-customer');
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
        const updated_user = await this.onPaymentReceived.handler(payload.payment) // update credits
        try { await captivatedAssign(updated_user) } catch(err){console.error(err)}  // mail chimp
        const trasnfer = await this.shareManager.share(payload.payment, partnersInfo)
        return { statusCode:200, body: {updated_user, trasnfer} }
      } 
    }catch(err){ return { statusCode:500, body: err } }
  }
}

class ManageShare {
  async share(payment,partners_info) {
    if(!payment) throw new Error("não foi encontrado Configurações de partilhamento")
    const { description, netValue, customer } = payment 
    var currentValue = netValue;

    const REF = description ? description.substring(description.length - 5) : null;
    const extract = {total:netValue,transfers:[]}
    const tansferPayment = new TransferPayment()

    const student = await conn("students").where({customer_id:customer}).select(["experimental"]).first();

    if(student.experimental === true && REF){
      const seller = partnersInfo.sellers.find(p=>p.ref===REF)
      if(!seller) console.log("Vendedor nao encontrado")
      else{
        console.log("enctrado vendedor")
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
    return {status: true, extract: JSON.stringify(extract)}
  }
}


module.exports = { PaymentController, ManageShare }
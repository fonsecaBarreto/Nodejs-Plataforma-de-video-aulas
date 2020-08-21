const { rescueAsaasCostumer } = require( '../../../providers/asaas/rescue-customer');
var generatePassword = require('password-generator');
const {save} = require("../../../api/student");

class OnPaymentCreated{
  async handler({customer, subscription}){
    const { name, email, phone } = await rescueAsaasCostumer(customer);
    var password =  generatePassword(8) ;
    const expiration = ( Date.now() + (6*(10**8)) )
    await save({ name, email, customer_id:customer, subscription_id:subscription, password, expiration})
    return { name, email, phone, password }
  }
}
module.exports = { OnPaymentCreated }
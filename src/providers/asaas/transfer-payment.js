const API_KEY = '3865188ef6ef2a36c7012dad6f376206160d440b7caa0e461b55312d72855bb7'
const API_URL = 'https://www.asaas.com/api/v3'
var request = require('request');

class TransferPayment {
  transfer (value,walletId) {
    return new Promise ( (resolve) => {
      request({
        method: 'POST', url: `${API_URL}/transfers`,
        headers: { 'Content-Type': 'application/json', 'access_token': API_KEY },
        body: JSON.stringify({  value,  walletId })
      }, function (error, response) {
        if(error || response.statusCode > 300 ) { console.log(error); return resolve(false); }
        return resolve(true)
      });  
     
    })
  }
}
module.exports = { TransferPayment }
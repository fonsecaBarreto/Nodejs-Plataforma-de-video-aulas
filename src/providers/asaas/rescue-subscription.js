const api_key = process.env.ASAAS_KEY;
const API_URL = process.env.ASAAS_API_URL;
var request = require('request');
 function rescueAsaasSubscription(customer_id){
  return new Promise((resolve,reject)=>{
    request({ method: 'GET',url: `${API_URL}/subscriptions?customer=${customer_id}`,
      headers: {'Content-Type': 'application/json', 'access_token': api_key}},
      function (error, response, body) {
        if(error || response.statusCode > 300 ) return reject(error) 
        resolve(JSON.parse(body))
      });
  })
}

module.exports = { rescueAsaasSubscription }